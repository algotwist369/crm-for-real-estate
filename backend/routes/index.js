const express = require('express');

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const agentRoutes = require('./agent.routes');
const propertyRoutes = require('./property.routes');
const leadRoutes = require('./lead.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');
const campaignRoutes = require('./campaign.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/report', reportRoutes);
router.use('/agent', agentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/campaigns', campaignRoutes);
router.use(propertyRoutes);
router.use(leadRoutes);

module.exports = router;
