const campaignService = require('../services/campaign.service');
const whatsappService = require('../services/whatsapp.service');
const EmailConfig = require('../model/emailConfig.model');
const Campaign = require('../model/campaign.model');
const WhatsAppSession = require('../model/whatsappSession.model');
const logger = require('../utils/logger');

const { uploadImage } = require('../utils/uploadImage');

const createCampaign = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const campaign = await campaignService.createCampaign(req.body, userId, tenantId);
        res.status(201).json({ success: true, campaign });
    } catch (error) {
        logger.error(`Error in createCampaign: ${error.message}`);
        next(error);
    }
};

const getCampaigns = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const campaigns = await Campaign.find({ createdBy: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, campaigns });
    } catch (error) {
        next(error);
    }
};

const getCampaignStats = async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        const stats = await campaignService.getCampaignStats(campaignId);
        res.status(200).json({ success: true, stats });
    } catch (error) {
        next(error);
    }
};

const initWhatsApp = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        
        // Return immediately to the client, initialization happens in background
        if (process.env.OUTREACH_WORKER !== 'true') {
            // Send message to primary to forward to the Outreach Worker
            process.send({ 
                type: 'WHATSAPP_INIT', 
                data: { userId, tenantId } 
            });
        } else {
            // We are already on the Outreach Worker
            whatsappService.initWhatsAppSession(userId, tenantId).catch(err => {
                logger.error(`Background WhatsApp init failed for ${userId}: ${err.message}`);
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'WhatsApp initialization started. Please wait for the QR code.' 
        });
    } catch (error) {
        next(error);
    }
};

const regenerateWhatsAppQR = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        
        // Return immediately to the client, initialization happens in background
        if (process.env.OUTREACH_WORKER !== 'true') {
            // Send message to primary to forward to the Outreach Worker
            process.send({ 
                type: 'WHATSAPP_REGENERATE', 
                data: { userId, tenantId } 
            });
        } else {
            // We are already on the Outreach Worker
            whatsappService.initWhatsAppSession(userId, tenantId).catch(err => {
                logger.error(`Background WhatsApp regenerate failed for ${userId}: ${err.message}`);
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'WhatsApp QR regeneration started. Please wait for the new QR code.' 
        });
    } catch (error) {
        next(error);
    }
};

const logoutWhatsApp = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;

        if (process.env.OUTREACH_WORKER !== 'true') {
            process.send({ type: 'WHATSAPP_LOGOUT', data: { userId } });
        } else {
            await whatsappService.logout(userId);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

const getWhatsAppStatus = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const session = await WhatsAppSession.findOne({ userId });
        res.status(200).json({ 
            success: true, 
            status: session?.status || 'disconnected',
            qrCode: session?.qrCode || null
        });
    } catch (error) {
        next(error);
    }
};

const updateEmailConfig = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const { smtp, sender, dailyLimit } = req.body;

        const config = await EmailConfig.findOneAndUpdate(
            { userId },
            { 
                userId, 
                tenantId, 
                smtp, 
                sender, 
                dailyLimit,
                isActive: true 
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json({ success: true, config });
    } catch (error) {
        next(error);
    }
};

const getEmailConfig = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const config = await EmailConfig.findOne({ userId });
        res.status(200).json({ success: true, config });
    } catch (error) {
        next(error);
    }
};

const uploadMedia = async (req, res, next) => {
    try {
        if (!req.files || !req.files.media || !req.files.media[0]) {
            return res.status(400).json({ success: false, message: 'No media file uploaded' });
        }

        const file = req.files.media[0];
        const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        
        const result = await uploadImage({
            buffer: file.buffer,
            mimeType: file.mimetype
        }, {
            folder: 'campaign_media',
            resourceType: 'auto' // Use 'auto' for both image and video
        });

        res.status(200).json({ 
            success: true, 
            url: result.secure_url || result.url,
            mediaType: result.resource_type || resourceType
        });
    } catch (error) {
        logger.error(`Media upload failed: ${error.message}`);
        next(error);
    }
};

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignStats,
    initWhatsApp,
    regenerateWhatsAppQR,
    logoutWhatsApp,
    getWhatsAppStatus,
    updateEmailConfig,
    getEmailConfig,
    uploadMedia
};
