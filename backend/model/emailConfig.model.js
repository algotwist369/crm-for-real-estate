const mongoose = require('mongoose');

const emailConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    smtp: {
        host: { type: String, required: true },
        port: { type: Number, required: true },
        secure: { type: Boolean, default: true },
        auth: {
            user: { type: String, required: true },
            pass: { type: String, required: true } // should be encrypted at rest
        }
    },
    sender: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        replyTo: { type: String }
    },
    dailyLimit: {
        type: Number,
        default: 500
    },
    sentToday: {
        type: Number,
        default: 0
    },
    lastSentAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

emailConfigSchema.index({ userId: 1, isActive: 1 });
emailConfigSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('EmailConfig', emailConfigSchema);
