const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend', '.env') });

const Lead = require('./backend/model/lead.model');
const User = require('./backend/model/user.model');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================
const MONGO_URI = process.env.MONGO_URI;
const AGENT_PHONE = '7388480128'; // Agent from add.data.js
const DATA_FILE = path.join(__dirname, 'add.data.js');

async function importData() {
    if (!MONGO_URI) {
        console.error('Error: MONGO_URI not found in backend/.env');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        // 1. Find the agent
        const agent = await User.findOne({ phone_number: AGENT_PHONE });
        if (!agent) {
            console.error(`Error: Agent with phone ${AGENT_PHONE} not found.`);
            process.exit(1);
        }
        console.log(`Found user: ${agent.user_name} (Role: ${agent.role}, ID: ${agent._id})`);

        // 2. Read and parse data
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        const jsonMatch = fileContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('Error: Could not find data array in add.data.js');
            process.exit(1);
        }
        
        const leadsData = JSON.parse(jsonMatch[0]);
        console.log(`Parsed ${leadsData.length} leads from file.`);

        // 3. Transform and Save
        let successCount = 0;
        let errorCount = 0;

        for (const item of leadsData) {
            try {
                // Map add.data.js fields to lead.model.js schema
                const leadPayload = {
                    name: item.owner_name || 'Unnamed Lead',
                    phone: item.phone || '0000000000',
                    email: item.email || '',
                    alternate_phone: '',
                    whatsapp_number: '',
                    
                    lead_type: item.lead_type || 'buyer',
                    client_type: 'buying', 
                    inquiry_for: item.address || '',
                    requirement: item.comments || '',
                    
                    budget: item.asking_price ? `${item.currency} ${item.price_label}` : '',
                    currency: item.currency || 'AED',
                    asking_price: item.asking_price || 0,
                    price_label: item.price_label || '',
                    price_negotiable: false,
                    
                    property_type: item.property_type || 'villa',
                    unit_count: item.unit_count || 1,
                    bedrooms: item.bedrooms || '',
                    bathrooms: 0,
                    maid_room: (item.bedrooms || '').toLowerCase().includes('maid'),
                    
                    plot_size: item.plot_size || { value: 0, unit: 'sq.ft' },
                    built_up_area: item.built_up_area || { value: 0, unit: 'sq.ft' },
                    
                    owner_name: item.owner_name || '',
                    broker_name: item.broker_name || '',
                    broker_phone: '',
                    shared_details: item.shared_details || '',
                    address: item.address || '',
                    
                    source: item.source || 'manual_entry',
                    priority: 'medium',
                    status: 'new',
                    assigned_to: [agent._id],
                    tenant_id: agent.tenant_id || agent._id, 
                    
                    remarks: item.remarks || '',
                    tags: item.features || []
                };

                const newLead = new Lead(leadPayload);
                await newLead.save();
                successCount++;
                console.log(`[${successCount}] Saved: ${leadPayload.name}`);
            } catch (err) {
                errorCount++;
                console.error(`Error saving lead ${item.owner_name}:`, err.message);
            }
        }

        console.log('\n=========================================');
        console.log(`Import completed!`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('=========================================');

    } catch (error) {
        console.error('Fatal error during import:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

importData();
