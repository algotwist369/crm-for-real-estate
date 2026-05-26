const socialMediaService = require('../services/socialMedia.service');
const aiService = require('../services/ai.service');
const metaService = require('../services/meta.service');
const logger = require('../utils/logger');
const SocialWorkerHealth = require('../model/socialWorkerHealth.model');

function frontendRedirect(status, reason) {
    const base = process.env.SOCIAL_CONNECT_REDIRECT_URL || process.env.FRONTEND_URL || 'http://localhost:5173/social-media';
    const url = new URL(base);
    url.searchParams.set('social_connect', status);
    if (reason) url.searchParams.set('reason', reason);
    return url.toString();
}

function parseState(state) {
    const decoded = Buffer.from(String(state || ''), 'base64').toString('utf8');
    return JSON.parse(decoded);
}

function parsePayload(req) {
    if (req.body?.payload) {
        return JSON.parse(req.body.payload);
    }
    return req.body || {};
}

const get_oauth_url = async (req, res, next) => {
    try {
        const state = Buffer.from(JSON.stringify({
            tenant_id: req.auth.tenant_id,
            user_id: req.auth.user._id
        })).toString('base64');
        const url = metaService.getOAuthUrl(state);
        res.status(200).json({ success: true, data: { url } });
    } catch (error) {
        next(error);
    }
};

const handle_oauth_callback = async (req, res) => {
    try {
        const { code, state, error, error_reason } = req.query || {};
        if (error) return res.redirect(frontendRedirect('failed', error_reason || error));
        if (!code || !state) return res.redirect(frontendRedirect('failed', 'missing_oauth_state'));

        const parsed = parseState(state);
        if (!parsed?.tenant_id || !parsed?.user_id) {
            return res.redirect(frontendRedirect('failed', 'invalid_oauth_state'));
        }

        const connected = await socialMediaService.connectAccount({
            user: { _id: parsed.user_id },
            tenant_id: parsed.tenant_id
        }, code);

        if (!Array.isArray(connected) || connected.length === 0) {
            return res.redirect(frontendRedirect('failed', 'no_pages_or_instagram_accounts_found'));
        }

        return res.redirect(frontendRedirect('success'));
    } catch (error) {
        logger.warn(`Social OAuth callback failed: ${error.message}`);
        return res.redirect(frontendRedirect('failed', 'connect_failed'));
    }
};

const get_connected_accounts = async (req, res, next) => {
    try {
        const accounts = await socialMediaService.getConnectedAccounts(req.auth);
        res.status(200).json({ success: true, data: accounts });
    } catch (error) {
        next(error);
    }
};

const disconnect_account = async (req, res, next) => {
    try {
        const result = await socialMediaService.disconnectAccount(req.auth, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const get_facebook_posts = async (req, res, next) => {
    try {
        const data = await socialMediaService.getFacebookAccountPosts(req.auth, req.params.id, req.query);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const create_post = async (req, res, next) => {
    try {
        const payload = parsePayload(req);
        const files = req.files?.media || req.files || [];
        const post = await socialMediaService.createPost(req.auth, payload, Array.isArray(files) ? files : []);
        res.status(201).json({
            success: true,
            message: 'Post created and queued successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

const list_posts = async (req, res, next) => {
    try {
        const posts = await socialMediaService.listPosts(req.auth, req.query);
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        next(error);
    }
};

const get_post = async (req, res, next) => {
    try {
        const post = await socialMediaService.getPost(req.auth, req.params.id);
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        next(error);
    }
};

const retry_post = async (req, res, next) => {
    try {
        const post = await socialMediaService.retryPost(req.auth, req.params.id);
        res.status(200).json({ success: true, message: 'Post retry queued', data: post });
    } catch (error) {
        next(error);
    }
};

const delete_post = async (req, res, next) => {
    try {
        const result = await socialMediaService.deletePost(req.auth, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const generate_ai_caption = async (req, res, next) => {
    try {
        const caption = await aiService.generateSocialCaption({
            prompt: req.body.prompt,
            tone: req.body.tone,
            style: req.body.style,
            includeHashtags: req.body.includeHashtags !== false,
            includeCta: req.body.includeCta !== false
        });
        await socialMediaService.audit(req.auth, 'caption', 'caption', undefined, 'Generated AI caption');
        res.status(200).json({ success: true, data: { caption } });
    } catch (error) {
        next(error);
    }
};

const worker_health = async (req, res, next) => {
    try {
        const workers = await SocialWorkerHealth.find({}).sort({ updatedAt: -1 }).lean();
        const staleMs = Number(process.env.SOCIAL_WORKER_STALE_MS || 2 * 60 * 1000);
        const now = Date.now();
        const healthy = workers.some(worker => (
            worker.status === 'healthy' &&
            worker.last_heartbeat_at &&
            now - new Date(worker.last_heartbeat_at).getTime() <= staleMs
        ));
        res.status(healthy ? 200 : 503).json({ success: healthy, data: { healthy, workers } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    get_oauth_url,
    handle_oauth_callback,
    get_connected_accounts,
    disconnect_account,
    get_facebook_posts,
    create_post,
    list_posts,
    get_post,
    retry_post,
    delete_post,
    generate_ai_caption,
    worker_health
};
