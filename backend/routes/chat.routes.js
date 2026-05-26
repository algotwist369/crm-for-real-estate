const express = require('express');
const { requireRoles } = require('../middleware/auth');
const { uploadChatAttachment } = require('./upload');
const chatController = require('../controller/chat.controller');

const router = express.Router();

router.use(requireRoles(['admin', 'super_admin', 'agent']));

router.get('/users', chatController.get_chat_users);
router.get('/conversations', chatController.get_conversations);
router.post('/conversations/direct', chatController.start_direct_conversation);
router.post('/conversations/group', chatController.create_group);
router.patch('/conversations/:id/members', chatController.update_group_members);
router.delete('/conversations/:id', chatController.delete_group);
router.get('/conversations/:id/messages', chatController.get_messages);
router.post('/conversations/:id/messages', uploadChatAttachment.single('attachment'), chatController.send_message);
router.post('/conversations/:id/seen', chatController.mark_seen);
router.patch('/messages/:messageId', chatController.edit_message);
router.post('/messages/:messageId/pin', chatController.pin_message);

module.exports = router;
