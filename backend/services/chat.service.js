const ChatConversation = require('../model/chatConversation.model');
const ChatMessage = require('../model/chatMessage.model');
const { uploadImage } = require('../utils/uploadImage');
const { httpError } = require('../utils/common');
const path = require('path');
const {
    getTenantId,
    assertUsersInTenant,
    canManageTenant,
    asObjectId
} = require('./collaborationAccess.service');

const CHAT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
const allowedChatAttachments = {
    'image/jpeg': { type: 'image', resourceType: 'image', extensions: ['.jpg', '.jpeg'], signatures: ['ffd8ff'] },
    'image/png': { type: 'image', resourceType: 'image', extensions: ['.png'], signatures: ['89504e47'] },
    'image/webp': { type: 'image', resourceType: 'image', extensions: ['.webp'], signatures: ['52494646'] },
    'image/gif': { type: 'image', resourceType: 'image', extensions: ['.gif'], signatures: ['47494638'] },
    'video/mp4': { type: 'video', resourceType: 'video', extensions: ['.mp4', '.m4v'], signatures: ['000000'] },
    'video/webm': { type: 'video', resourceType: 'video', extensions: ['.webm'], signatures: ['1a45dfa3'] },
    'video/quicktime': { type: 'video', resourceType: 'video', extensions: ['.mov'], signatures: ['000000'] },
    'application/pdf': { type: 'document', resourceType: 'raw', extensions: ['.pdf'], signatures: ['25504446'] },
    'text/plain': { type: 'document', resourceType: 'raw', extensions: ['.txt'] },
    'text/csv': { type: 'document', resourceType: 'raw', extensions: ['.csv'] },
    'application/msword': { type: 'document', resourceType: 'raw', extensions: ['.doc'], signatures: ['d0cf11e0'] },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'document', resourceType: 'raw', extensions: ['.docx'], signatures: ['504b0304'] },
    'application/vnd.ms-excel': { type: 'document', resourceType: 'raw', extensions: ['.xls'], signatures: ['d0cf11e0'] },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { type: 'document', resourceType: 'raw', extensions: ['.xlsx'], signatures: ['504b0304'] }
};

function memberIds(conversation) {
    return (conversation.members || []).map(member => String(member.userId || member));
}

function assertConversationMember(conversation, userId) {
    if (!conversation) throw httpError(404, 'Conversation not found');
    if (!memberIds(conversation).includes(String(userId))) throw httpError(403, 'Forbidden');
}

function getAttachmentType(mimeType = '') {
    return allowedChatAttachments[String(mimeType || '').toLowerCase()]?.type || 'file';
}

function hasAllowedSignature(buffer, signatures = []) {
    if (!signatures.length) return true;
    const header = buffer.subarray(0, 12).toString('hex').toLowerCase();
    return signatures.some(signature => header.startsWith(signature));
}

function getRawPublicId(originalName = '') {
    const ext = path.extname(String(originalName || '')).toLowerCase();
    const base = path.basename(String(originalName || 'attachment'), ext)
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'attachment';
    return `${base}-${Date.now()}${ext}`;
}

function assertSafeChatAttachment(file) {
    if (!file) return null;
    const mimeType = String(file.mimetype || '').toLowerCase();
    const rules = allowedChatAttachments[mimeType];
    if (!rules) throw httpError(400, 'Unsupported chat attachment type');
    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) throw httpError(400, 'Attachment file is empty');
    if (file.size > CHAT_ATTACHMENT_MAX_BYTES || file.buffer.length > CHAT_ATTACHMENT_MAX_BYTES) {
        throw httpError(400, 'Chat attachment must be 20MB or smaller');
    }

    const ext = path.extname(String(file.originalname || '')).toLowerCase();
    if (!rules.extensions.includes(ext)) throw httpError(400, `Invalid file extension for ${mimeType}`);
    if (!hasAllowedSignature(file.buffer, rules.signatures)) throw httpError(400, 'Attachment content does not match its file type');
    return rules;
}

async function uploadAttachment(file, folder, tags) {
    if (!file) return null;
    const rules = assertSafeChatAttachment(file);
    const uploaded = await uploadImage({
        buffer: file.buffer,
        mimeType: file.mimetype
    }, {
        folder,
        resourceType: rules.resourceType,
        publicId: rules.resourceType === 'raw' ? getRawPublicId(file.originalname) : undefined,
        tags
    });

    return {
        url: uploaded.secureUrl || uploaded.url,
        type: getAttachmentType(file.mimetype),
        name: file.originalname || 'attachment',
        mimeType: file.mimetype || '',
        size: file.size || uploaded.bytes || 0
    };
}

async function getOrCreateDirectConversation(auth, participantId) {
    const tenantId = getTenantId(auth);
    const currentUserId = String(auth.user._id);
    const otherUserId = String(participantId);
    if (currentUserId === otherUserId) throw httpError(400, 'Select another user to chat');

    await assertUsersInTenant(auth, [otherUserId]);

    const existing = await ChatConversation.findOne({
        tenantId,
        type: 'direct',
        'members.userId': { $all: [auth.user._id, asObjectId(otherUserId, 'participantId')] }
    });
    if (existing) return existing;

    return ChatConversation.create({
        tenantId,
        type: 'direct',
        members: [
            { userId: auth.user._id, role: 'member' },
            { userId: otherUserId, role: 'member' }
        ],
        createdBy: auth.user._id
    });
}

async function createGroupConversation(auth, { name, memberIds: requestedMembers = [] }) {
    if (!canManageTenant(auth)) throw httpError(403, 'Only admins can create chat groups');
    const cleanName = String(name || '').trim();
    if (!cleanName) throw httpError(400, 'Group name is required');

    const uniqueMembers = [...new Set([String(auth.user._id), ...requestedMembers.map(String)])];
    await assertUsersInTenant(auth, uniqueMembers);

    return ChatConversation.create({
        tenantId: getTenantId(auth),
        type: 'group',
        name: cleanName,
        members: uniqueMembers.map(userId => ({
            userId,
            role: String(userId) === String(auth.user._id) ? 'owner' : 'member'
        })),
        createdBy: auth.user._id
    });
}

async function sendConversationMessage(auth, conversationId, payload = {}, file = null) {
    const conversation = await ChatConversation.findOne({
        _id: asObjectId(conversationId, 'conversationId'),
        tenantId: getTenantId(auth),
        isArchived: false
    });
    assertConversationMember(conversation, auth.user._id);

    const text = String(payload.text || '').trim();
    const attachment = await uploadAttachment(file, 'chat_attachments', ['chat', String(conversation._id), String(auth.user._id)]);
    if (!text && !attachment) throw httpError(400, 'Message or attachment is required');

    let rawMentions = payload.mentions || [];
    if (typeof rawMentions === 'string') {
        try {
            rawMentions = JSON.parse(rawMentions);
        } catch {
            rawMentions = rawMentions.split(',');
        }
    }
    const mentions = Array.isArray(rawMentions)
        ? rawMentions.map(String).filter(id => memberIds(conversation).includes(id))
        : [];

    const message = await ChatMessage.create({
        tenantId: getTenantId(auth),
        conversationId: conversation._id,
        senderId: auth.user._id,
        text,
        replyTo: payload.replyTo && payload.replyTo !== 'null' ? asObjectId(payload.replyTo, 'replyTo') : undefined,
        mentions,
        attachments: attachment ? [attachment] : [],
        deliveredTo: memberIds(conversation)
            .filter(id => id !== String(auth.user._id))
            .map(userId => ({ userId, at: new Date() }))
    });

    conversation.lastMessage = { text: text || attachment?.name || 'Attachment', senderId: auth.user._id, sentAt: message.createdAt };
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await ChatMessage.findById(message._id)
        .populate('replyTo', 'text attachments senderId createdAt')
        .lean();

    return { conversation, message: populatedMessage || message };
}

module.exports = {
    memberIds,
    assertConversationMember,
    getOrCreateDirectConversation,
    createGroupConversation,
    sendConversationMessage,
    uploadAttachment
};
