
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./model/user.model');
const Agent = require('./model/agent.model');
const Lead = require('./model/lead.model');
const { connectToDatabase } = require('./config/db');
const { normalizePhone } = require('./utils/common');

const AGENT_PHONE = '971506875543';
const AGENT_PIN = 2026;
const LEADS_DATA_PATH = path.join(__dirname, 'leads.data.js');

async function uploadLeads() {
    try {
        await connectToDatabase();

        // 1. Find the agent
        const phone = normalizePhone(AGENT_PHONE);
        const user = await User.findOne({ phone_number: phone, role: 'agent' });
        if (!user) {
            console.error('Agent user not found with phone:', phone);
            process.exit(1);
        }

        const agent = await Agent.findOne({ agent_details: user._id, agent_pin: AGENT_PIN });
        if (!agent) {
            console.error('Agent record not found with user ID and pin:', user._id, AGENT_PIN);
            process.exit(1);
        }

        console.log(`Found agent: ${user.user_name} (Tenant ID: ${user.tenant_id})`);

        // 2. Read leads data
        let leadsData;
        const content = fs.readFileSync(LEADS_DATA_PATH, 'utf8').trim();
        console.log(`Read ${content.length} characters from file.`);

        try {
            leadsData = JSON.parse(content);
        } catch (e) {
            try {
                leadsData = eval(`(${content})`);
            } catch (e2) {
                console.error('Failed to parse leads data as JSON or JS array.');
                process.exit(1);
            }
        }

        console.log(`Read ${leadsData.length} leads from file.`);

        // 3. Map leads to model and check for existing leads
        const leadsToInsert = [];
        const skippedLeads = [];
        const existingPhones = new Set(
            (await Lead.find({ tenant_id: user.tenant_id }).select('phone').lean()).map(l => l.phone)
        );

        for (const lead of leadsData) {
            const phoneStr = lead.phone || lead.cleaned_phone?.[0] || lead.raw_phone?.[0];
            
            if (!phoneStr) {
                skippedLeads.push({ name: lead.name || lead.owner_name, reason: 'No phone number' });
                continue;
            }

            const normalized = normalizePhone(phoneStr);
            if (!normalized) {
                skippedLeads.push({ name: lead.name || lead.owner_name, phone: phoneStr, reason: 'Invalid phone format' });
                continue;
            }

            if (existingPhones.has(normalized)) {
                skippedLeads.push({ name: lead.name || lead.owner_name, phone: normalized, reason: 'Duplicate phone' });
                continue;
            }

            const address = lead.address || [lead.area, lead.unit_number].filter(Boolean).join(', ');

            leadsToInsert.push({
                name: lead.name || lead.owner_name || 'Unknown',
                phone: normalized,
                source: lead.source || 'manual_entry',
                address: address,
                notes: lead.notes || '',
                tenant_id: user.tenant_id,
                created_by: user._id,
                followed_by: user._id,
                assigned_to: [user._id],
                status: lead.status || 'new',
                priority: lead.priority || 'low',
                is_active: true
            });
            // Add to set to prevent duplicates within the same file
            existingPhones.add(normalized);
        }

        console.log(`Mapping complete. ${leadsToInsert.length} leads ready for insertion. ${skippedLeads.length} skipped.`);

        // 4. Bulk insert
        if (leadsToInsert.length > 0) {
            const result = await Lead.insertMany(leadsToInsert, { ordered: false }).catch(err => {
                if (err.writeErrors) {
                    console.log(`Some leads were skipped due to duplicates or errors: ${err.writeErrors.length}`);
                    return err.insertedDocs;
                }
                throw err;
            });
            console.log(`Successfully uploaded ${result.length || leadsToInsert.length} leads.`);
        } else {
            console.log('No new leads to upload. All leads were either invalid or already exist in the database.');
        }

        console.log('Upload process finished.');
        process.exit(0);

    } catch (error) {
        console.error('Error during lead upload:', error);
        process.exit(1);
    }
}

uploadLeads();
