const mongoose = require('mongoose');

const WhatsAppAuthSchema = new mongoose.Schema({
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
        required: true,
        index: true
    },
    creds: {
        type: Object,
        default: {}
    },
    keys: {
        type: Object,
        default: {}
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure we only store essential keys to keep DB performance high
WhatsAppAuthSchema.pre('save', async function() {
    this.lastUpdate = new Date();
});

module.exports = mongoose.model('WhatsAppAuth', WhatsAppAuthSchema);
