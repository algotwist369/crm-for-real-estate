const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lead_real';

const Agent = mongoose.model('Agent', new mongoose.Schema({
    assigned_properties: [{ type: mongoose.Schema.ObjectId, ref: 'Properties' }]
}));

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        const agents = await Agent.find({ assigned_properties: { $exists: true, $ne: [] } }).lean();
        console.log('--- Agents with Assigned Properties ---');
        console.log(JSON.stringify(agents, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
