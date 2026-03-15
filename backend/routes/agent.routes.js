const express = require('express');
const agentController = require('../controller/agent.controller');
const { uploadProfilePic } = require('./upload');
const { requireAgent } = require('../middleware/auth');

const router = express.Router();

router.patch('/profile', requireAgent, uploadProfilePic, agentController.update_agent_own_profile);
router.get('/properties', requireAgent, agentController.get_all_assigned_properties);
router.post('/properties/:propertyId/assign-agent', requireAgent, agentController.assign_other_agent_to_property);

module.exports = router;
