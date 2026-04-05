const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
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
    sessionId: {
        type: String,
        required: false, // 🛡️ [Senior Fix] May not exist during QR phase
        index: true
    },
    status: {
        type: String,
        enum: ['disconnected', 'qr_pending', 'connecting', 'connected', 'expired', 'reconnecting'],
        default: 'disconnected',
        index: true
    },
    qrCode: {
        type: String // base64 or string
    },
    sessionData: {
        type: mongoose.Schema.Types.Mixed // store session object or credentials
    },
    lastConnectedAt: {
        type: Date
    },
    lastDisconnectedAt: {
        type: Date
    },
    error: {
        type: String
    }
}, { timestamps: true });

whatsappSessionSchema.index({ userId: 1, status: 1 });
whatsappSessionSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
