const express = require('express');
const adminController = require('../controller/admin.controller');
const { uploadProfilePic } = require('./upload');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/agents', requireAdmin, adminController.get_all_agents); // tested
router.get('/agents/:id', requireAdmin, adminController.get_agent_by_id); // tested
router.post('/agents', requireAdmin, uploadProfilePic, adminController.create_agent); // tested
router.patch('/agents/:id', requireAdmin, uploadProfilePic, adminController.update_agent);
router.patch('/agents/:id/status', requireAdmin, adminController.update_agent_status); // tested
router.post('/agents/:id/assign-project', requireAdmin, adminController.assign_project_to_agent);
router.post('/agents/:id/remark', requireAdmin, adminController.remark_agent);
router.delete('/agents/:id', requireAdmin, adminController.delete_agent);

module.exports = router;
