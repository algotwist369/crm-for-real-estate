const express = require('express');
const router = express.Router();
const campaignController = require('../controller/campaign.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const Joi = require('joi');

const campaignSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().required(),
        channel: Joi.string().valid('whatsapp', 'email').required(),
        template: Joi.object({
            subject: Joi.string().allow('').optional().when('channel', { is: 'email', then: Joi.required() }),
            body: Joi.string().required()
        }).required(),
        leadIds: Joi.array().items(Joi.string()).min(1).required(),
        delayConfig: Joi.object({
            minDelay: Joi.number().min(0).default(30),
            maxDelay: Joi.number().min(1).default(60),
            batchSize: Joi.number().min(1).default(20),
            batchPause: Joi.number().min(1).default(300)
        }),
        aiRewriteEnabled: Joi.boolean().default(false)
    })
});

const emailConfigSchema = Joi.object({
    body: Joi.object({
        smtp: Joi.object({
            host: Joi.string().required(),
            port: Joi.number().required(),
            secure: Joi.boolean().default(true),
            auth: Joi.object({
                user: Joi.string().required(),
                pass: Joi.string().required()
            }).required()
        }).required(),
        sender: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            replyTo: Joi.string().email().optional()
        }).required(),
        dailyLimit: Joi.number().min(1).default(500)
    })
});

router.use(authenticate);

router.post('/', validateRequest(campaignSchema), campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.get('/:campaignId/stats', campaignController.getCampaignStats);

router.get('/whatsapp/status', campaignController.getWhatsAppStatus);
router.post('/whatsapp/init', campaignController.initWhatsApp);
router.post('/whatsapp/regenerate', campaignController.regenerateWhatsAppQR);
router.post('/whatsapp/logout', campaignController.logoutWhatsApp);

router.get('/email/config', campaignController.getEmailConfig);
router.post('/email/config', validateRequest(emailConfigSchema), campaignController.updateEmailConfig);

module.exports = router;
