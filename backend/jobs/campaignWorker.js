const { Worker } = require('bullmq');
const { connection } = require('../services/queue.service');
const Campaign = require('../model/campaign.model');
const CampaignMessage = require('../model/campaignMessage.model');
const Lead = require('../model/lead.model');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const aiService = require('../services/ai.service');

const campaignWorker = new Worker('campaign-outreach', async (job) => {
    const { campaignId, messageId } = job.data;
    const message = await CampaignMessage.findById(messageId).populate('campaignId');
    if (!message) throw new Error('Message not found');

    const campaign = message.campaignId;
    logger.info(`Worker processing message ${messageId} for campaign ${campaignId} (${campaign.channel})`);

    if (campaign.status === 'cancelled') {
        message.status = 'cancelled';
        await message.save();
        return;
    }

    try {
        message.status = 'processing';
        await message.save();

        // 1. Generate AI Variation if enabled
        let finalContent = message.renderedMessage;
        if (campaign.aiRewriteEnabled && !message.aiGeneratedMessage) {
            try {
                const variant = await aiService.generateVariation(message.originalTemplate);
                message.aiGeneratedMessage = variant;
                finalContent = variant;
            } catch (err) {
                logger.error(`AI generation failed for message ${messageId}: ${err.message}`);
                // fallback to original template
            }
        } else if (message.aiGeneratedMessage) {
            finalContent = message.aiGeneratedMessage;
        }

        // 2. Handle Sending based on channel
        if (campaign.channel === 'whatsapp') {
            await whatsappService.sendMessage(message.recipient, finalContent, campaign.createdBy);
        } else if (campaign.channel === 'email') {
            await emailService.sendCampaignEmail(message.recipient, campaign.template.subject, finalContent, campaign.createdBy);
        }

        // 3. Update Message Status
        message.status = 'sent';
        message.sentAt = new Date();
        await message.save();

        // 4. Update Campaign Stats
        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { processedLeads: 1, sentLeads: 1 }
        });

    } catch (error) {
        logger.error(`Failed to process message ${messageId}: ${error.message}`);
        message.status = 'failed';
        message.failedReason = error.message;
        await message.save();

        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { processedLeads: 1, failedLeads: 1 }
        });

        throw error; // Rethrow to let BullMQ handle retries
    }
}, { 
    connection,
    concurrency: 1 // Start with 1 to ensure sequential sending with delays
});

campaignWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
});

campaignWorker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = campaignWorker;
