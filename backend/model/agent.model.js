const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    agent_details: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
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
    assigned_properties: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Properties',
        index: true
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
    },
    tenant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    }
}, { timestamps: true });

agentSchema.index({ agent_details: 1, tenant_id: 1 }, { unique: true });
agentSchema.index({ tenant_id: 1, is_active: 1 });

module.exports = mongoose.model('Agent', agentSchema);
