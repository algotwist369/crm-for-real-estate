const mongoose = require('mongoose');
const { getChatConnection } = require('../config/moduleDb');

const chatMessageSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, trim: true, default: '' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'document', 'file'], default: 'file' },
        name: { type: String, trim: true, default: 'attachment' },
        mimeType: { type: String, trim: true, default: '' },
        size: { type: Number, default: 0 }
    }],
    editedAt: { type: Date },
    deletedAt: { type: Date },
    deliveredTo: [{ userId: mongoose.Schema.Types.ObjectId, at: Date }],
    seenBy: [{ userId: mongoose.Schema.Types.ObjectId, at: Date }],
    pinned: { type: Boolean, default: false, index: true },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
}, { timestamps: true });

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ tenantId: 1, createdAt: -1 });
chatMessageSchema.index({ conversationId: 1, text: 'text' });

module.exports = getChatConnection().model('ChatMessage', chatMessageSchema);
