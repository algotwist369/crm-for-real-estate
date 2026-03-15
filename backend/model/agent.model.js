const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    agent_details: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    agent_role: {
        type: String,
        trim: true
    },
    agent_pin: {
        type: Number,
        min: 1000,
        max: 99999999,
        required: true,
        unique: true,
        index: true
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
        default: '',
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    last_assigned_at: {
        type: Date
    }
}, { timestamps: true });

agentSchema.index({ agent_details: 1 }, { unique: true });

module.exports = mongoose.model('Agent', agentSchema);
