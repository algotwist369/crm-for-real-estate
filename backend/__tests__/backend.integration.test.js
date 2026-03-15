const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { createApp } = require('../app');
const FollowUpReminder = require('../model/followUpReminder.model');
const Lead = require('../model/lead.model');
const Agent = require('../model/agent.model');
const Properties = require('../model/properties.model');
const TokenBlacklist = require('../model/tokenBlacklist.model');
const { tick } = require('../jobs/followUpReminderWorker');

let mongo;
let app;

async function createAdmin() {
    const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `admin${uniq}@example.com`;
    const phone = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`.slice(0, 10);
    const password = 'Admin1234';
    const res = await request(app)
        .post('/api/auth/admin/register')
        .send({
            user_name: 'Admin User',
            email,
            phone_number: phone,
            password
        })
        .expect(201);

    return { token: res.body.token, email, phone, password };
}

describe('Backend Integration', () => {
    beforeAll(async () => {
        process.env.TOKEN_SECRET = '1234567890abcdef';
        process.env.MAIL_DISABLED = 'true';
        process.env.APP_URL = 'http://localhost:5173';
        process.env.FOLLOWUP_OVERDUE_NOTIFY_MINUTES = '10';
        process.env.FOLLOWUP_MISSED_GRACE_MINUTES = '10';

        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());
        app = createApp();
    }, 60_000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongo) await mongo.stop();
    });

    test('Health works', async () => {
        await request(app).get('/health').expect(200);
    });

    test('Admin register + login + protected route', async () => {
        const admin = await createAdmin();

        await request(app)
            .get('/api/admin/agents')
            .set('Authorization', `Bearer ${admin.token}`)
            .expect(200);

        const loginRes = await request(app)
            .post('/api/auth/admin/login')
            .send({ phone_or_email: admin.email, password: admin.password })
            .expect(200);

        expect(loginRes.body.token).toBeTruthy();
    });

    test('Admin can create agent, agent can login, agent token works', async () => {
        const admin = await createAdmin();

        const created = await request(app)
            .post('/api/admin/agents')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                name: 'Agent One',
                role: 'Sales',
                email: 'agent1@example.com',
                phone: '9000000001',
                pin: '1234'
            })
            .expect(201);

        expect(created.body.credentials).toBeTruthy();
        expect(created.body.credentials.password).toBeTruthy();

        const agentLogin = await request(app)
            .post('/api/auth/agent/login')
            .send({
                phone_or_email: 'agent1@example.com',
                password: created.body.credentials.password
            })
            .expect(200);

        const agentToken = agentLogin.body.token;
        expect(agentToken).toBeTruthy();

        await request(app)
            .get('/api/agent/properties')
            .set('Authorization', `Bearer ${agentToken}`)
            .expect(200);
    });

    test('Property create + lead create + followup schedules reminders', async () => {
        const admin = await createAdmin();

        const agentRes = await request(app)
            .post('/api/admin/agents')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                name: 'Agent Two',
                role: 'Sales',
                email: 'agent2@example.com',
                phone: '9000000002',
                pin: '5678'
            })
            .expect(201);

        const agentUser = await mongoose.model('User').findOne({ email: 'agent2@example.com' }).lean();
        const agentDoc = await Agent.findOne({ agent_details: agentUser._id }).lean();

        const propertyRes = await request(app)
            .post('/api/properties')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                title: 'Test Property',
                listing_type: 'rent',
                assign_agent: [String(agentDoc._id)]
            });

        if (propertyRes.status !== 201) {
            throw new Error(`Property create failed: ${propertyRes.status} ${JSON.stringify(propertyRes.body)}`);
        }

        const propertyId = propertyRes.body.data._id;
        expect(propertyId).toBeTruthy();

        const agentLogin = await request(app)
            .post('/api/auth/agent/login')
            .send({ phone_or_email: 'agent2@example.com', password: agentRes.body.credentials.password })
            .expect(200);
        const agentToken = agentLogin.body.token;

        const leadRes = await request(app)
            .post('/api/leads')
            .set('Authorization', `Bearer ${agentToken}`)
            .send({
                name: 'Lead Person',
                email: 'lead@example.com',
                phone: '8887776665',
                requirement: '2BHK',
                budget: '50L',
                inquiry_for: 'rent',
                properties: [propertyId]
            })
            .expect(201);

        const leadId = leadRes.body.data._id;
        const createdLead = await Lead.findById(leadId).lean();
        expect(Array.isArray(createdLead.assigned_to)).toBe(true);
        expect(createdLead.assigned_to.map(x => String(x))).toContain(String(agentUser._id));

        const followUpAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        await request(app)
            .post(`/api/leads/${leadId}/followup`)
            .set('Authorization', `Bearer ${agentToken}`)
            .send({ next_follow_up_date: followUpAt, follow_up_status: 'pending', remarks: 'Call later' })
            .expect(200);

        const reminders = await FollowUpReminder.find({ lead: leadId }).lean();
        const types = reminders.map(r => r.type).sort();
        expect(types).toEqual(['before_1h', 'before_5m', 'overdue_grace'].sort());
    });

    test('Logout blacklists token and blocks access', async () => {
        const admin = await createAdmin();

        const agentRes = await request(app)
            .post('/api/admin/agents')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                name: 'Agent Three',
                role: 'Sales',
                email: 'agent3@example.com',
                phone: '9000000003',
                pin: '9999'
            })
            .expect(201);

        const agentLogin = await request(app)
            .post('/api/auth/agent/login')
            .send({ phone_or_email: 'agent3@example.com', password: agentRes.body.credentials.password })
            .expect(200);

        const token = agentLogin.body.token;

        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const tokenHashCount = await TokenBlacklist.countDocuments();
        expect(tokenHashCount).toBeGreaterThan(0);

        await request(app)
            .get('/api/leads')
            .set('Authorization', `Bearer ${token}`)
            .then(res => {
                if (res.status !== 401) {
                    throw new Error(`Expected 401 after logout, got ${res.status}: ${JSON.stringify(res.body)}`);
                }
            });
    });

    test('Worker marks missed followups after grace', async () => {
        const admin = await createAdmin();

        const agentRes = await request(app)
            .post('/api/admin/agents')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                name: 'Agent Four',
                role: 'Sales',
                email: 'agent4@example.com',
                phone: '9000000004',
                pin: '2222'
            })
            .expect(201);

        const agentLogin = await request(app)
            .post('/api/auth/agent/login')
            .send({ phone_or_email: 'agent4@example.com', password: agentRes.body.credentials.password })
            .expect(200);

        const agentToken = agentLogin.body.token;

        const leadRes = await request(app)
            .post('/api/leads')
            .set('Authorization', `Bearer ${agentToken}`)
            .send({
                name: 'Old Followup',
                email: 'old@example.com',
                phone: '8887771111',
                requirement: '1BHK',
                budget: '20L',
                inquiry_for: 'buying'
            })
            .expect(201);

        const leadId = leadRes.body.data._id;

        await Lead.updateOne(
            { _id: leadId },
            {
                $set: {
                    next_follow_up_date: new Date(Date.now() - 20 * 60 * 1000),
                    follow_up_status: 'pending',
                    status: 'follow_up'
                }
            }
        );

        await tick({ maxPerTick: 5 });

        const updated = await Lead.findById(leadId).lean();
        expect(updated.follow_up_status).toBe('missed');
    });
});
