const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const {
    report_stats,
    report_overview,
    report_agent_performance,
    report_lead_insights,
    report_export
} = require('../controller/report.controller');

const router = express.Router();

router.get('/stats', requireAdmin, report_stats);
router.get('/overview', requireAdmin, report_overview);
router.get('/agent-performance', requireAdmin, report_agent_performance);
router.get('/lead-insights', requireAdmin, report_lead_insights);
router.get('/export', requireAdmin, report_export);

module.exports = router;
