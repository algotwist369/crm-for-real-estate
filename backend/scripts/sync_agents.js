const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lead_real';

// Minimal models for migration
const Agent = mongoose.model('Agent', new mongoose.Schema({
    assigned_properties: [{ type: mongoose.Schema.ObjectId, ref: 'Properties' }]
}));

const Properties = mongoose.model('Properties', new mongoose.Schema({
    assign_agent: [{ type: mongoose.Schema.ObjectId, ref: 'Agent' }],
    is_active: Boolean
}));

async function sync() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const properties = await Properties.find({ assign_agent: { $exists: true, $ne: [] } });
        console.log(`Found ${properties.length} properties with agents assigned.`);

        for (const prop of properties) {
            if (prop.assign_agent && prop.assign_agent.length) {
                const result = await Agent.updateMany(
                    { _id: { $in: prop.assign_agent } },
                    { $addToSet: { assigned_properties: prop._id } }
                );
                console.log(`Synced property ${prop._id} to agents. Modified ${result.modifiedCount} agents.`);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

sync();
