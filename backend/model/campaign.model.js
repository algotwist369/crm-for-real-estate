const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    channel: {
        type: String,
        enum: ['whatsapp', 'email'],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['draft', 'queued', 'processing', 'completed', 'cancelled', 'failed'],
        default: 'draft',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    template: {
        subject: { type: String, trim: true },
        body: { type: String, required: true },
        mediaUrl: { type: String }, // URL for image or video
        mediaType: { type: String, enum: ['image', 'video', null] }
    },
    leads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    }],
    totalLeads: {
        type: Number,
        default: 0
    },
    processedLeads: {
        type: Number,
        default: 0
    },
    sentLeads: {
        type: Number,
        default: 0
    },
    failedLeads: {
        type: Number,
        default: 0
    },
    delayConfig: {
        minDelay: { type: Number, default: 30 }, // in seconds
        maxDelay: { type: Number, default: 60 }, // in seconds
        batchSize: { type: Number, default: 20 },
        batchPause: { type: Number, default: 300 } // in seconds
    },
    aiRewriteEnabled: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    error: {
        type: String
    }
}, { timestamps: true });

campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ tenantId: 1, channel: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
