const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    sessionId: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['disconnected', 'qr_pending', 'connecting', 'connected', 'expired', 'reconnecting'],
        default: 'disconnected',
        index: true
    },
    qrCode: {
        type: String
    },
    qrExpiresAt: {
        type: Date,
        index: true
    },
    sessionData: {
        type: mongoose.Schema.Types.Mixed
    },
    lastConnectedAt: {
        type: Date
    },
    lastDisconnectedAt: {
        type: Date
    },
    error: {
        type: String
    },
    reconnectAttempts: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

whatsappSessionSchema.index({ userId: 1, status: 1 });
whatsappSessionSchema.index({ tenantId: 1, status: 1 });
whatsappSessionSchema.index(
    { sessionId: 1 },
    {
        partialFilterExpression: { sessionId: { $type: 'string' } }
    }
);

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
