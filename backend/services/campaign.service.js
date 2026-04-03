const Campaign = require('../model/campaign.model');
const CampaignMessage = require('../model/campaignMessage.model');
const Lead = require('../model/lead.model');
const User = require('../model/user.model');
const { getCampaignQueue } = require('./queue.service');
const logger = require('../utils/logger');

const renderTemplate = (template, lead) => {
    const variables = {
        name: lead.name || 'Lead',
        phone: lead.phone || '',
        address: lead.address || '',
        city: lead.address || '', // Alias for address
        inquiry_for: lead.inquiry_for || '',
        project_name: lead.inquiry_for || '', // Alias for inquiry_for
        agent_name: lead.agent_name || (lead.assigned_to && lead.assigned_to.length > 0 ? lead.assigned_to[0].user_name : 'Unassigned')
    };

    let body = template;
    Object.keys(variables).forEach(key => {
        // More robust regex to handle spaces like {{ name }} or {{name}}
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi'); // Case-insensitive and global
        body = body.replace(regex, variables[key]);
    });

    return body;
};

const createCampaign = async (campaignData, userId, tenantId) => {
    const { name, channel, template, leadIds, delayConfig, aiRewriteEnabled } = campaignData;
    const campaignQueue = getCampaignQueue();

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

    // Fetch minimal lead data for rendering
    const leadsMinimal = await Lead.find({ _id: { $in: leadIds } })
        .select('name phone address inquiry_for assigned_to')
        .populate('assigned_to', 'user_name')
        .lean();

    const leadMap = leadsMinimal.reduce((acc, lead) => {
        acc[lead._id.toString()] = {
            ...lead,
            agent_name: lead.assigned_to && lead.assigned_to.length > 0 ? lead.assigned_to[0].user_name : 'Unassigned'
        };
        return acc;
    }, {});

    // Generate individual messages
    const messages = [];
    for (const leadId of leadIds) {
        const lead = leadMap[leadId.toString()];
        if (!lead) continue;

        const recipient = channel === 'whatsapp' ? lead.phone : lead.email;
        if (!recipient) continue;

        const renderedMessage = renderTemplate(template.body, lead);

        const message = new CampaignMessage({
            campaignId: campaign._id,
            leadId,
            recipient,
            originalTemplate: template.body,
            renderedMessage,
            status: 'queued',
            tenantId,
            mediaUrl: template.mediaUrl || null,
            mediaType: template.mediaType || null
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
