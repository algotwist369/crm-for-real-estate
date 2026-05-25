const mongoose = require('mongoose');
const { getChatConnection } = require('../config/moduleDb');

const chatConversationSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['direct', 'group'], required: true, index: true },
    name: { type: String, trim: true, default: '' },
    avatar: { type: String, trim: true, default: '' },
    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        mutedUntil: { type: Date }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastMessage: {
        text: { type: String, trim: true, default: '' },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentAt: { type: Date }
    },
    pinnedMessageIds: [{ type: mongoose.Schema.Types.ObjectId }],
    isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

chatConversationSchema.index({ tenantId: 1, type: 1, updatedAt: -1 });
chatConversationSchema.index({ 'members.userId': 1, updatedAt: -1 });
chatConversationSchema.index(
    { tenantId: 1, type: 1, 'members.userId': 1 },
    { partialFilterExpression: { type: 'direct' } }
);

module.exports = getChatConnection().model('ChatConversation', chatConversationSchema);
