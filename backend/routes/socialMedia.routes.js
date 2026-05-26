const express = require('express');
const Joi = require('joi');
const socialMediaController = require('../controller/socialMedia.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { uploadSocialMedia } = require('./upload');

const router = express.Router();

const captionSchema = Joi.object({
    body: Joi.object({
        prompt: Joi.string().trim().min(5).max(2000).required(),
        tone: Joi.string().trim().max(80).optional(),
        style: Joi.string().trim().max(120).optional(),
        includeHashtags: Joi.boolean().default(true),
        includeCta: Joi.boolean().default(true)
    })
});

const postQuerySchema = Joi.object({
    query: Joi.object({
        status: Joi.string().valid('draft', 'queued', 'scheduled', 'publishing', 'published', 'partial_success', 'failed', 'cancelled', 'cleanup_pending', 'deleted').optional(),
        limit: Joi.number().integer().min(1).max(100).optional()
    })
});

router.get('/oauth/callback', socialMediaController.handle_oauth_callback);

router.use(authenticate);
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

router.get('/oauth/url', socialMediaController.get_oauth_url);
router.get('/health', socialMediaController.worker_health);
router.get('/accounts', socialMediaController.get_connected_accounts);
router.get('/accounts/:id/facebook-posts', socialMediaController.get_facebook_posts);
router.delete('/accounts/:id', socialMediaController.disconnect_account);

router.get('/posts', validateRequest(postQuerySchema), socialMediaController.list_posts);
router.post('/posts', uploadSocialMedia, socialMediaController.create_post);
router.get('/posts/:id', socialMediaController.get_post);
router.post('/posts/:id/retry', socialMediaController.retry_post);
router.delete('/posts/:id', socialMediaController.delete_post);

router.post('/caption/generate', validateRequest(captionSchema), socialMediaController.generate_ai_caption);

module.exports = router;
