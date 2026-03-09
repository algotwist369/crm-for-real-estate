const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    agent_details: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    agent_role: {
        type: String,
    },
    agent_pin: {
        type: Number,
        minLength: 4,
        maxLength: 8,
        required: true,
        unique: true
    },
    assigned_projects: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Projects',
    }],
    total_leads: {
        type: Number,
        default: 0
    },
    total_converted_leads: {
        type: Number,
        default: 0
    },
    total_lost_leads: {
        type: Number,
        default: 0
    },
    total_qualified_leads: {
        type: Number,
        default: 0
    },
    total_follow_ups: {
        type: Number,
        default: 0
    },
    total_wasted_leads: {
        type: Number,
        default: 0
    },
    total_pending_leads: {
        type: Number,
        default: 0
    },
    remark: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);