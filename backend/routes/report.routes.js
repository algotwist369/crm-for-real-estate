const express = require('express');
const { requireRoles } = require('../middleware/auth');
const {
    report_stats,
    report_overview,
    report_agent_performance,
    report_lead_insights,
    report_export
} = require('../controller/report.controller');

const router = express.Router();

router.get('/stats', requireRoles(['admin', 'super_admin', 'agent']), report_stats);
router.get('/overview', requireRoles(['admin', 'super_admin', 'agent']), report_overview);
router.get('/agent-performance', requireRoles(['admin', 'super_admin', 'agent']), report_agent_performance);
router.get('/lead-insights', requireRoles(['admin', 'super_admin']), report_lead_insights);
router.get('/export', requireRoles(['admin', 'super_admin']), report_export);

module.exports = router;
