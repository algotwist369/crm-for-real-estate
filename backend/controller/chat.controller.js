const ChatConversation = require('../model/chatConversation.model');
const ChatMessage = require('../model/chatMessage.model');
const { wrapAsync } = require('../middleware/errorHandler');
const { httpError } = require('../utils/common');
const socketService = require('../services/socket.service');
const {
    getTenantUsers,
    getTenantId,
    asObjectId,
    canManageTenant,
    assertUsersInTenant
} = require('../services/collaborationAccess.service');
const {
    memberIds,
    assertConversationMember,
    getOrCreateDirectConversation,
    createGroupConversation,
    sendConversationMessage
} = require('../services/chat.service');

const get_chat_users = wrapAsync(async (req, res) => {
    const users = await getTenantUsers(req.auth);
    const onlineUserIds = socketService.getOnlineUserIds();
    res.status(200).json({
        success: true,
        data: users
            .filter(user => String(user._id) !== String(req.auth.user._id))
            .map(user => ({ ...user, online: onlineUserIds.includes(String(user._id)) }))
    });
});

const get_conversations = wrapAsync(async (req, res) => {
    const conversations = await ChatConversation.find({
        tenantId: getTenantId(req.auth),
        isArchived: false,
        'members.userId': req.auth.user._id
    }).sort({ updatedAt: -1 }).lean();

    const ids = conversations.map(c => c._id);
    const unread = await ChatMessage.aggregate([
        {
            $match: {
                conversationId: { $in: ids },
                senderId: { $ne: req.auth.user._id },
                deletedAt: { $exists: false },
                seenBy: { $not: { $elemMatch: { userId: req.auth.user._id } } }
            }
        },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ]);
    const unreadMap = new Map(unread.map(item => [String(item._id), item.count]));

    res.status(200).json({
        success: true,
        data: conversations.map(c => ({ ...c, unreadCount: unreadMap.get(String(c._id)) || 0 }))
    });
});

const start_direct_conversation = wrapAsync(async (req, res) => {
    const conversation = await getOrCreateDirectConversation(req.auth, req.body?.participantId);
    res.status(200).json({ success: true, data: conversation });
});

const create_group = wrapAsync(async (req, res) => {
    const conversation = await createGroupConversation(req.auth, {
        name: req.body?.name,
        memberIds: Array.isArray(req.body?.memberIds) ? req.body.memberIds : []
    });

    memberIds(conversation).forEach(userId => socketService.emitToUser(userId, 'chat:conversation:new', conversation));
    res.status(201).json({ success: true, message: 'Group created', data: conversation });
});

const update_group_members = wrapAsync(async (req, res) => {
    if (!canManageTenant(req.auth)) throw httpError(403, 'Only admins can manage chat groups');
    const conversation = await ChatConversation.findOne({
        _id: asObjectId(req.params.id, 'conversationId'),
        tenantId: getTenantId(req.auth),
        type: 'group',
        isArchived: false
    });
    if (!conversation) throw httpError(404, 'Group not found');

    const previousMembers = memberIds(conversation);
    const requestedMembers = Array.isArray(req.body?.memberIds) ? req.body.memberIds.map(String) : [];
    const uniqueMembers = [...new Set([String(conversation.createdBy), ...requestedMembers])];
    await assertUsersInTenant(req.auth, uniqueMembers);
    conversation.members = uniqueMembers.map(userId => ({
        userId,
        role: String(userId) === String(conversation.createdBy) ? 'owner' : 'member'
    }));
    await conversation.save();

    const nextMembers = memberIds(conversation);
    const previousMemberSet = new Set(previousMembers);
    const nextMemberSet = new Set(nextMembers);
    nextMembers.forEach(userId => {
        socketService.emitToUser(userId, previousMemberSet.has(userId) ? 'chat:conversation:update' : 'chat:conversation:new', conversation);
    });
    previousMembers
        .filter(userId => !nextMemberSet.has(userId))
        .forEach(userId => socketService.emitToUser(userId, 'chat:conversation:delete', { _id: conversation._id }));
    res.status(200).json({ success: true, message: 'Group members updated', data: conversation });
});

const delete_group = wrapAsync(async (req, res) => {
    if (!canManageTenant(req.auth)) throw httpError(403, 'Only admins can delete chat groups');
    const conversation = await ChatConversation.findOne({
        _id: asObjectId(req.params.id, 'conversationId'),
        tenantId: getTenantId(req.auth),
        type: 'group',
        isArchived: false
    });
    if (!conversation) throw httpError(404, 'Group not found');

    const previousMembers = memberIds(conversation);
    conversation.isArchived = true;
    await conversation.save();

    previousMembers.forEach(userId => socketService.emitToUser(userId, 'chat:conversation:delete', { _id: conversation._id }));
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
});

const get_messages = wrapAsync(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit || 30)));
    const before = req.query?.before ? new Date(req.query.before) : null;
    const search = String(req.query?.search || '').trim();
    const conversation = await ChatConversation.findOne({
        _id: asObjectId(req.params.id, 'conversationId'),
        tenantId: getTenantId(req.auth),
        isArchived: false
    });
    assertConversationMember(conversation, req.auth.user._id);

    const match = { conversationId: conversation._id, deletedAt: { $exists: false } };
    if (before && !Number.isNaN(before.getTime())) match.createdAt = { $lt: before };
    if (search) match.$text = { $search: search };

    const messages = await ChatMessage.find(match)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('replyTo', 'text attachments senderId createdAt')
        .lean();
    res.status(200).json({ success: true, data: messages.reverse() });
});

const send_message = wrapAsync(async (req, res) => {
    const { conversation, message } = await sendConversationMessage(req.auth, req.params.id, req.body, req.file);
    memberIds(conversation).forEach(userId => socketService.emitToUser(userId, 'chat:message:new', { conversationId: conversation._id, message }));
    res.status(201).json({ success: true, message: 'Message sent', data: message });
});

const mark_seen = wrapAsync(async (req, res) => {
    const conversation = await ChatConversation.findOne({
        _id: asObjectId(req.params.id, 'conversationId'),
        tenantId: getTenantId(req.auth),
        isArchived: false
    });
    assertConversationMember(conversation, req.auth.user._id);

    await ChatMessage.updateMany(
        {
            conversationId: conversation._id,
            senderId: { $ne: req.auth.user._id },
            seenBy: { $not: { $elemMatch: { userId: req.auth.user._id } } }
        },
        { $push: { seenBy: { userId: req.auth.user._id, at: new Date() } } }
    );
    memberIds(conversation).forEach(userId => socketService.emitToUser(userId, 'chat:message:seen', {
        conversationId: conversation._id,
        userId: req.auth.user._id
    }));
    res.status(200).json({ success: true });
});

const edit_message = wrapAsync(async (req, res) => {
    const text = String(req.body?.text || '').trim();
    if (!text) throw httpError(400, 'Message text is required');

    const message = await ChatMessage.findOne({
        _id: asObjectId(req.params.messageId, 'messageId'),
        tenantId: getTenantId(req.auth),
        senderId: req.auth.user._id,
        deletedAt: { $exists: false }
    });
    if (!message) throw httpError(404, 'Message not found');

    const conversation = await ChatConversation.findById(message.conversationId);
    assertConversationMember(conversation, req.auth.user._id);
    message.text = text;
    message.editedAt = new Date();
    await message.save();

    memberIds(conversation).forEach(userId => socketService.emitToUser(userId, 'chat:message:update', message));
    res.status(200).json({ success: true, message: 'Message updated', data: message });
});

const pin_message = wrapAsync(async (req, res) => {
    const message = await ChatMessage.findOne({
        _id: asObjectId(req.params.messageId, 'messageId'),
        tenantId: getTenantId(req.auth),
        deletedAt: { $exists: false }
    });
    if (!message) throw httpError(404, 'Message not found');

    const conversation = await ChatConversation.findById(message.conversationId);
    assertConversationMember(conversation, req.auth.user._id);
    message.pinned = !message.pinned;
    await message.save();

    await ChatConversation.updateOne(
        { _id: conversation._id },
        message.pinned
            ? { $addToSet: { pinnedMessageIds: message._id } }
            : { $pull: { pinnedMessageIds: message._id } }
    );

    memberIds(conversation).forEach(userId => socketService.emitToUser(userId, 'chat:message:update', message));
    res.status(200).json({ success: true, data: message });
});

module.exports = {
    get_chat_users,
    get_conversations,
    start_direct_conversation,
    create_group,
    update_group_members,
    delete_group,
    get_messages,
    send_message,
    mark_seen,
    edit_message,
    pin_message
};
