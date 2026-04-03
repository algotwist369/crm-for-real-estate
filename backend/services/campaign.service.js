const Campaign = require('../model/campaign.model');
const CampaignMessage = require('../model/campaignMessage.model');
const Lead = require('../model/lead.model');
const User = require('../model/user.model');
const { campaignQueue } = require('./queue.service');
const logger = require('../utils/logger');

const renderTemplate = (template, lead, user) => {
    const variables = {
        name: lead.name || 'Lead',
        phone: lead.phone || '',
        email: lead.email || '',
        project_name: lead.inquiry_for || '',
        city: lead.address || '',
        agent_name: user.user_name || '',
        company_name: 'Our Company' // You can get this from user settings
    };

    let body = template;
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        body = body.replace(regex, variables[key]);
    });

    return body;
};

const createCampaign = async (campaignData, userId, tenantId) => {
    const { name, channel, template, leadIds, delayConfig, aiRewriteEnabled } = campaignData;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const campaign = new Campaign({
        name,
        channel,
        template,
        leads: leadIds,
        totalLeads: leadIds.length,
        createdBy: userId,
        tenantId,
        delayConfig,
        aiRewriteEnabled,
        status: 'draft'
    });

    await campaign.save();

    // Generate individual messages
    const messages = [];
    for (const leadId of leadIds) {
        const lead = await Lead.findById(leadId);
        if (!lead) continue;

        const recipient = channel === 'whatsapp' ? lead.phone : lead.email;
        if (!recipient) continue;

        const renderedMessage = renderTemplate(template.body, lead, user);

        const message = new CampaignMessage({
            campaignId: campaign._id,
            leadId,
            recipient,
            originalTemplate: template.body,
            renderedMessage,
            status: 'queued',
            tenantId
        });

        await message.save();
        messages.push(message);
    }

    // Update campaign status
    campaign.status = 'queued';
    campaign.startedAt = new Date();
    await campaign.save();

    // Queue messages with delays
    let totalDelayMs = 0;
    const { minDelay = 1, maxDelay = 2, batchSize = 20, batchPause = 300 } = delayConfig;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // 1. Calculate individual message delay (random between min and max)
        const randomDelaySec = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        // 2. Add batch pause if applicable (after every batchSize messages, starting after the first batch)
        let currentBatchPauseMs = 0;
        if (i > 0 && i % batchSize === 0) {
            currentBatchPauseMs = batchPause * 1000;
        }

        totalDelayMs += (randomDelaySec * 1000) + currentBatchPauseMs;
        
        await campaignQueue.add('send-message', {
            campaignId: campaign._id,
            messageId: msg._id
        }, { 
            delay: totalDelayMs,
            jobId: `msg_${msg._id}`
        });
    }

    return campaign;
};

const getCampaignStats = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const stats = await CampaignMessage.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const formattedStats = {
        total: campaign.totalLeads,
        processed: campaign.processedLeads,
        sent: campaign.sentLeads,
        failed: campaign.failedLeads,
        statusBreakdown: stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {})
    };

    return formattedStats;
};

module.exports = {
    createCampaign,
    getCampaignStats,
    renderTemplate
};
