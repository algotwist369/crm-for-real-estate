const mongoose = require('mongoose');

const campaignMessageSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
        index: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    recipient: {
        type: String, // phone or email
        required: true,
        trim: true
    },
    originalTemplate: {
        type: String,
        required: true
    },
    renderedMessage: {
        type: String,
        required: true
    },
    aiGeneratedMessage: {
        type: String
    },
    status: {
        type: String,
        enum: [
            'queued', 'pending', 'processing', 'sent', 'failed', 'retrying', 
            'cancelled', 'invalid_number', 'session_disconnected', 
            'rate_limited', 'blocked', 'ai_generation_failed'
        ],
        default: 'queued',
        index: true
    },
    retryCount: {
        type: Number,
        default: 0
    },
    sentAt: {
        type: Date
    },
    failedReason: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
}, { timestamps: true });

campaignMessageSchema.index({ campaignId: 1, status: 1 });
campaignMessageSchema.index({ leadId: 1, campaignId: 1 });
campaignMessageSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('CampaignMessage', campaignMessageSchema);
