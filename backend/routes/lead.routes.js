const express = require('express');
const leadController = require('../controller/lead.controller');
const { requireRoles } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { leadSchemas } = require('../utils/validation');

const router = express.Router();

router.get('/leads/minimal', requireRoles(['admin', 'super_admin', 'agent']), leadController.get_leads_minimal);
router.get('/leads', requireRoles(['admin', 'super_admin', 'agent']), validateRequest(leadSchemas.query), leadController.get_my_leads);
router.get('/leads/:id', requireRoles(['admin', 'super_admin', 'agent']), leadController.get_lead_by_id);
router.post('/leads', requireRoles(['admin', 'super_admin', 'agent']), validateRequest(leadSchemas.create), leadController.create_lead);
router.patch('/leads/:id', requireRoles(['admin', 'super_admin', 'agent']), validateRequest(leadSchemas.update), leadController.update_lead);
router.post('/leads/:id/notes', requireRoles(['admin', 'super_admin', 'agent']), leadController.add_lead_note);
router.post('/leads/:id/followup', requireRoles(['admin', 'super_admin', 'agent']), leadController.set_follow_up);
router.post('/leads/:id/followup/complete', requireRoles(['admin', 'super_admin', 'agent']), leadController.complete_followup);
router.post('/leads/:id/followup/reschedule', requireRoles(['admin', 'super_admin', 'agent']), leadController.reschedule_followup);
router.post('/leads/:id/convert', requireRoles(['admin', 'super_admin', 'agent']), leadController.mark_lead_converted);
router.post('/leads/:id/lost', requireRoles(['admin', 'super_admin', 'agent']), leadController.mark_lead_lost);
router.delete('/leads/:id', requireRoles(['admin', 'super_admin']), leadController.delete_lead);

router.get('/followups', requireRoles(['admin', 'super_admin', 'agent']), leadController.get_my_followups);
router.get('/dashboard/agent-summary', requireRoles(['admin', 'super_admin', 'agent']), leadController.agent_dashboard_summary);
router.get('/dashboard/activity', requireRoles(['admin', 'super_admin', 'agent']), leadController.agent_activity_timeline);

module.exports = router;
