const express = require('express');
const { requireRoles } = require('../middleware/auth');
const { upload } = require('./upload');
const taskController = require('../controller/task.controller');

const router = express.Router();

router.use(requireRoles(['admin', 'super_admin', 'agent']));

router.get('/workspaces', taskController.get_workspaces);
router.post('/workspaces', taskController.create_workspace);
router.patch('/workspaces/:id', taskController.update_workspace);
router.delete('/workspaces/:id', taskController.delete_workspace);
router.get('/workspaces/:workspaceId/board', taskController.get_board);
router.post('/workspaces/:workspaceId/tasks', taskController.create_task);
router.get('/analytics', taskController.get_analytics);
router.patch('/tasks/:id', taskController.update_task);
router.patch('/tasks/:id/move', taskController.move_task);
router.post('/tasks/:id/comments', taskController.add_comment);
router.post('/tasks/:id/attachments', upload.single('attachment'), taskController.upload_attachment);
router.delete('/tasks/:id', taskController.delete_task);

module.exports = router;
