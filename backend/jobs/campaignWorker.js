const { Worker } = require('bullmq');
const { redisConfig } = require('../services/queue.service');
const Campaign = require('../model/campaign.model');
const CampaignMessage = require('../model/campaignMessage.model');
const Lead = require('../model/lead.model');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const aiService = require('../services/ai.service');

const { renderTemplate } = require('../services/campaign.service');

const campaignWorker = new Worker('campaign-outreach', async (job) => {
    const { campaignId, messageId } = job.data;
    const message = await CampaignMessage.findById(messageId).populate('campaignId');
    if (!message) throw new Error('Message not found');

    const lead = await Lead.findById(message.leadId).populate('assigned_to', 'user_name');
    if (!lead) throw new Error('Lead not found');

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
        let templateToUse = message.originalTemplate;
        let aiGenerated = false;

        if (campaign.aiRewriteEnabled && !message.aiGeneratedMessage) {
            try {
                const variant = await aiService.generateVariation(message.originalTemplate);
                message.aiGeneratedMessage = variant;
                templateToUse = variant;
                aiGenerated = true;
            } catch (err) {
                logger.error(`AI generation failed for message ${messageId}: ${err.message}`);
                // fallback to original template
            }
        } else if (message.aiGeneratedMessage) {
            templateToUse = message.aiGeneratedMessage;
        }

        // 2. Render Template (Important: Re-render even if it's AI generated)
        const finalContent = renderTemplate(templateToUse, lead);
        logger.debug(`Final rendered message for lead ${lead.name}: "${finalContent}"`);

        // 3. Handle Sending based on channel
        if (campaign.channel === 'whatsapp') {
            const media = message.mediaUrl ? {
                url: message.mediaUrl,
                type: message.mediaType
            } : null;
            await whatsappService.sendMessage(message.recipient, finalContent, campaign.createdBy, media);
        } else if (campaign.channel === 'email') {
            await emailService.sendCampaignEmail(message.recipient, campaign.template.subject, finalContent, campaign.createdBy);
        }

        // 4. Update Message Status
        message.status = 'sent';
        message.sentAt = new Date();
        if (aiGenerated) await message.save(); // Save the AI variation if generated
        await message.save();

        // 5. Update Campaign Stats
        const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { processedLeads: 1, sentLeads: 1 }
        }, { returnDocument: 'after' });

        // 6. Check if campaign is completed
        if (updatedCampaign.processedLeads >= updatedCampaign.totalLeads) {
            updatedCampaign.status = 'completed';
            updatedCampaign.completedAt = new Date();
            await updatedCampaign.save();
            logger.info(`Campaign ${campaignId} marked as COMPLETED`);
        }

    } catch (error) {
        logger.error(`Failed to process message ${messageId}: ${error.message}`);
        message.status = 'failed';
        message.failedReason = error.message;
        await message.save();

        const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { processedLeads: 1, failedLeads: 1 }
        }, { returnDocument: 'after' });

        // Check if campaign is completed even on failure
        if (updatedCampaign.processedLeads >= updatedCampaign.totalLeads) {
            updatedCampaign.status = 'completed';
            updatedCampaign.completedAt = new Date();
            await updatedCampaign.save();
            logger.info(`Campaign ${campaignId} marked as COMPLETED (with some failures)`);
        }

        throw error; // Rethrow to let BullMQ handle retries
    }
}, { 
    // Passing the config object instead of a connection instance 
    // allows BullMQ to manage its own connection lifecycle
    connection: redisConfig,
    concurrency: 5 // Process multiple messages in parallel for better performance
});

campaignWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
});

campaignWorker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = campaignWorker;
