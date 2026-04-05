
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./model/user.model');
const Agent = require('./model/agent.model');
const Lead = require('./model/lead.model');
const { connectToDatabase } = require('./config/db');
const { normalizePhone } = require('./utils/common');

const AGENT_PHONE = '7388480128';
const AGENT_PIN = 3366;
const LEADS_DATA_PATH = path.join(__dirname, '..', 'leads.data.js');

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
        // leads.data.js is a module.exports or just an array?
        // Based on the 'Read' tool output, it looks like a JSON array [ { ... }, ... ]
        // but it has a .js extension. Let's try to require it first.
        let leadsData;
        const content = fs.readFileSync(LEADS_DATA_PATH, 'utf8').trim();
        console.log(`Read ${content.length} characters from file.`);

        try {
            // Try to parse it as JSON
            leadsData = JSON.parse(content);
        } catch (e) {
            // If it's not strictly JSON, try to wrap it in module.exports and use eval or a temporary file
            // But let's try a simpler approach first: check if it's just a JS array
            try {
                // Warning: eval is dangerous, but in this controlled script it might be acceptable
                // Better: try to strip comments and common JS syntax that JSON doesn't support
                // Actually, if it's a JS file, it might be meant to be imported.
                // Let's try to wrap it:
                leadsData = eval(`(${content})`);
            } catch (e2) {
                console.error('Failed to parse leads data as JSON or JS array.');
                console.error('JSON Error:', e.message);
                console.error('JS Error:', e2.message);
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
            const phoneStr = (lead.cleaned_phone && lead.cleaned_phone[0]) || (lead.raw_phone && lead.raw_phone[0]);
            
            if (!phoneStr) {
                skippedLeads.push({ name: lead.owner_name, reason: 'No phone number' });
                continue;
            }

            const normalized = normalizePhone(phoneStr);
            if (!normalized) {
                skippedLeads.push({ name: lead.owner_name, phone: phoneStr, reason: 'Invalid phone format' });
                continue;
            }

            if (existingPhones.has(normalized)) {
                skippedLeads.push({ name: lead.owner_name, phone: normalized, reason: 'Duplicate phone' });
                continue;
            }

            const address = [lead.area, lead.unit_number].filter(Boolean).join(', ');

            leadsToInsert.push({
                name: lead.owner_name || 'Unknown',
                phone: normalized,
                source: 'manual_entry',
                address: address,
                notes: lead.notes || '',
                tenant_id: user.tenant_id,
                created_by: user._id,
                followed_by: user._id,
                assigned_to: [user._id],
                status: 'new',
                priority: 'low',
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
