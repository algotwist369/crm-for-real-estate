const crypto = require('crypto');
const mongoose = require('mongoose');
const SocialAccount = require('../model/socialAccount.model');
const SocialPost = require('../model/socialPost.model');
const SocialAuditLog = require('../model/socialAuditLog.model');
const { uploadImage, deleteImage } = require('../utils/uploadImage');
const { encryptToken, decryptToken } = require('../utils/socialCrypto');
const { httpError } = require('../utils/common');
const logger = require('../utils/logger');
const metaService = require('./meta.service');
const {
    getSocialPublishQueue,
    getSocialScheduleQueue,
    getSocialCaptionQueue,
    getSocialCleanupQueue,
    getRedisConnection
} = require('./queue.service');

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const MAX_IMAGE_BYTES = Number(process.env.SOCIAL_MAX_IMAGE_MB || 10) * 1024 * 1024;
const MAX_VIDEO_BYTES = Number(process.env.SOCIAL_MAX_VIDEO_MB || 100) * 1024 * 1024;
const MAX_CAPTION_LENGTH = Number(process.env.SOCIAL_MAX_CAPTION_LENGTH || 2200);

function cleanId(id) {
    if (!mongoose.Types.ObjectId.isValid(String(id))) throw httpError(400, 'Invalid id');
    return id;
}

function audit(auth, action, entityType, entityId, message, metadata = {}) {
    return SocialAuditLog.create({
        crm_user_id: auth.user._id,
        crm_org_id: auth.tenant_id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        platform: metadata.platform || null,
        message,
        metadata
    }).catch(err => logger.warn(`Social audit failed: ${err.message}`));
}

function assertCaption(caption) {
    const str = String(caption || '').trim();
    if (!str) throw httpError(400, 'Caption is required');
    if (str.length > MAX_CAPTION_LENGTH) throw httpError(400, `Caption must be ${MAX_CAPTION_LENGTH} characters or less`);
    return str;
}

function assertSchedule(publishMode, scheduleTime, timezone) {
    const mode = publishMode || 'now';
    if (!['now', 'schedule'].includes(mode)) throw httpError(400, 'Publish mode must be now or schedule');
    if (mode === 'now') return { publish_mode: mode, schedule_time: null, timezone: timezone || 'UTC' };

    const zone = String(timezone || '').trim();
    if (!zone) throw httpError(400, 'Timezone is required for scheduled posts');
    try {
        Intl.DateTimeFormat(undefined, { timeZone: zone });
    } catch {
        throw httpError(400, 'Timezone is invalid');
    }

    const date = new Date(scheduleTime);
    if (!Number.isFinite(date.getTime())) throw httpError(400, 'Schedule time is invalid');
    if (date.getTime() < Date.now() + 60_000) throw httpError(400, 'Schedule time must be at least 1 minute in the future');
    return { publish_mode: mode, schedule_time: date, timezone: zone };
}

function fileFingerprint(files = []) {
    return files.map(file => ({
        name: file.originalname,
        mime: file.mimetype,
        size: file.size,
        hash: crypto.createHash('sha256').update(file.buffer || Buffer.alloc(0)).digest('hex')
    }));
}

function buildIdempotencyKey(auth, payload, mediaFingerprint) {
    if (payload.idempotency_key) return String(payload.idempotency_key).trim();
    const hash = crypto.createHash('sha256');
    hash.update(String(auth.tenant_id));
    hash.update(String(payload.caption || ''));
    hash.update(JSON.stringify(payload.social_account_ids || []));
    hash.update(String(payload.schedule_time || 'now'));
    hash.update(JSON.stringify(mediaFingerprint || []));
    return hash.digest('hex');
}

async function validateAccounts(auth, accountIds) {
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        throw httpError(400, 'Select at least one Facebook Page or Instagram account');
    }
    const ids = accountIds.map(cleanId);
    const accounts = await SocialAccount.find({
        _id: { $in: ids },
        crm_org_id: auth.tenant_id,
        status: 'active'
    });
    if (accounts.length !== ids.length) throw httpError(403, 'One or more selected social accounts are unavailable');
    return accounts;
}

async function uploadPostMedia(files = []) {
    const normalized = [];
    for (const file of files) {
        const mime = String(file.mimetype || '').toLowerCase();
        const isImage = IMAGE_MIME_TYPES.has(mime);
        const isVideo = VIDEO_MIME_TYPES.has(mime);
        if (!isImage && !isVideo) throw httpError(400, 'Unsupported media type. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM');
        if (isImage && file.size > MAX_IMAGE_BYTES) throw httpError(400, 'Image exceeds the maximum allowed size');
        if (isVideo && file.size > MAX_VIDEO_BYTES) throw httpError(400, 'Video exceeds the maximum allowed size');

        const result = await uploadImage({ buffer: file.buffer, mimeType: mime }, {
            folder: 'social_media_posts',
            resourceType: 'auto'
        });
        normalized.push({
            url: result.secureUrl || result.url,
            public_id: result.publicId,
            resource_type: result.resourceType === 'video' ? 'video' : 'image',
            mime_type: mime,
            bytes: result.bytes || file.size,
            width: result.width,
            height: result.height
        });
    }
    return normalized;
}

async function connectAccount(auth, code) {
    if (!code) throw httpError(400, 'Authorization code is required');
    const shortToken = await metaService.exchangeCodeForToken(code);
    const longToken = await metaService.exchangeLongLivedToken(shortToken.access_token || shortToken.token);
    const userToken = longToken.access_token || shortToken.access_token;
    const expiresIn = Number(longToken.expires_in || shortToken.expires_in || 0);
    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const pages = await metaService.listPages(userToken);
    const saved = [];

    for (const page of pages) {
        if (!page.access_token) continue;
        const pageToken = encryptToken(page.access_token);
        const fb = await SocialAccount.findOneAndUpdate(
            { crm_org_id: auth.tenant_id, provider_account_id: page.id, platform: 'facebook' },
            {
                crm_user_id: auth.user._id,
                crm_org_id: auth.tenant_id,
                platform: 'facebook',
                account_type: 'facebook_page',
                provider_account_id: page.id,
                name: page.name,
                picture_url: page.picture?.data?.url || '',
                access_token: pageToken,
                token_expires_at: tokenExpiresAt,
                permissions: page.perms || [],
                status: 'active',
                last_error: null,
                disconnected_at: null
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        saved.push(fb);

        const ig = page.instagram_business_account;
        if (ig?.id) {
            const igAccount = await SocialAccount.findOneAndUpdate(
                { crm_org_id: auth.tenant_id, provider_account_id: ig.id, platform: 'instagram' },
                {
                    crm_user_id: auth.user._id,
                    crm_org_id: auth.tenant_id,
                    platform: 'instagram',
                    account_type: 'instagram_business',
                    provider_account_id: ig.id,
                    provider_parent_id: page.id,
                    name: ig.name || ig.username || page.name,
                    username: ig.username || '',
                    picture_url: ig.profile_picture_url || '',
                    access_token: pageToken,
                    token_expires_at: tokenExpiresAt,
                    permissions: page.perms || [],
                    status: 'active',
                    last_error: null,
                    disconnected_at: null
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
            saved.push(igAccount);
        }
    }

    await audit(auth, 'connect', 'account', saved[0]?._id, `Connected ${saved.length} Meta profiles`, { count: saved.length });
    return saved;
}

function safeAccount(account) {
    const obj = account.toObject ? account.toObject() : account;
    delete obj.access_token;
    return obj;
}

async function getConnectedAccounts(auth) {
    const accounts = await SocialAccount.find({
        crm_org_id: auth.tenant_id,
        status: { $ne: 'deleted' }
    }).sort({ platform: 1, name: 1 });
    return accounts.map(safeAccount);
}

async function disconnectAccount(auth, id) {
    const account = await SocialAccount.findOneAndUpdate(
        { _id: cleanId(id), crm_org_id: auth.tenant_id, status: { $ne: 'deleted' } },
        { status: 'deleted', disconnected_at: new Date() },
        { returnDocument: 'after' }
    );
    if (!account) throw httpError(404, 'Social account not found');
    await audit(auth, 'disconnect', 'account', account._id, 'Disconnected social account', { platform: account.platform });
    return { success: true, message: 'Account disconnected' };
}

async function enqueuePost(post) {
    const jobId = `social-post-${post._id}`;
    try {
        if (post.publish_mode === 'schedule') {
            const delay = Math.max(0, new Date(post.schedule_time).getTime() - Date.now());
            await getSocialScheduleQueue().add('schedule-post', { postId: post._id }, { delay, jobId });
        } else {
            await getSocialPublishQueue().add('publish-post', { postId: post._id }, { jobId });
        }
        post.scheduler_fallback_required = false;
    } catch (error) {
        post.scheduler_fallback_required = true;
        post.last_error = `Queue unavailable: ${error.message}`;
        logger.error(`Social enqueue failed for post ${post._id}: ${error.message}`);
    }
    post.queued_at = new Date();
    await post.save();
}

async function createPost(auth, payload, files = []) {
    const accounts = await validateAccounts(auth, payload.social_account_ids);
    const caption = assertCaption(payload.caption);
    const schedule = assertSchedule(payload.publish_mode, payload.schedule_time, payload.timezone);
    const idempotencyKey = buildIdempotencyKey(auth, payload, fileFingerprint(files));
    const existing = await SocialPost.findOne({ crm_org_id: auth.tenant_id, idempotency_key: idempotencyKey });
    if (existing) return existing;

    const media = await uploadPostMedia(files);

    const selectedPlatforms = [...new Set(accounts.map(account => account.platform))];
    if (selectedPlatforms.includes('instagram') && media.length === 0) {
        throw httpError(400, 'Instagram publishing requires image or video media');
    }

    const platformStatus = {};
    for (const account of accounts) {
        platformStatus[account.platform] = {
            status: schedule.publish_mode === 'schedule' ? 'queued' : 'queued',
            account_id: account._id
        };
    }

    let post;
    try {
        post = await SocialPost.create({
            crm_user_id: auth.user._id,
            crm_org_id: auth.tenant_id,
            caption,
            media,
            social_account_ids: accounts.map(account => account._id),
            platforms: selectedPlatforms,
            publish_mode: schedule.publish_mode,
            schedule_time: schedule.schedule_time,
            timezone: schedule.timezone,
            status: schedule.publish_mode === 'schedule' ? 'scheduled' : 'queued',
            platform_status: platformStatus,
            idempotency_key: idempotencyKey,
            status_history: [{
                status: schedule.publish_mode === 'schedule' ? 'scheduled' : 'queued',
                reason: schedule.publish_mode === 'schedule' ? 'Post scheduled' : 'Post queued'
            }]
        });
    } catch (error) {
        if (error.code === 11000) {
            const existing = await SocialPost.findOne({ crm_org_id: auth.tenant_id, idempotency_key: idempotencyKey });
            return existing;
        }
        throw error;
    }

    await audit(auth, schedule.publish_mode === 'schedule' ? 'schedule' : 'create', 'post', post._id, 'Social post created', {
        platforms: selectedPlatforms
    });
    await enqueuePost(post);
    return post;
}

async function listPosts(auth, query = {}) {
    const filter = { crm_org_id: auth.tenant_id, status: { $ne: 'deleted' } };
    if (query.status) filter.status = query.status;
    const posts = await SocialPost.find(filter).sort({ createdAt: -1 }).limit(Math.min(Number(query.limit || 50), 100));
    return posts;
}

async function getPost(auth, id) {
    const post = await SocialPost.findOne({ _id: cleanId(id), crm_org_id: auth.tenant_id });
    if (!post) throw httpError(404, 'Post not found');
    return post;
}

async function deletePost(auth, id) {
    const post = await getPost(auth, id);
    if (['publishing'].includes(post.status)) throw httpError(409, 'Publishing posts cannot be deleted');
    post.status = 'deleted';
    post.deleted_at = new Date();
    post.status_history.push({ status: 'deleted', reason: 'Deleted by user' });
    await post.save();
    await audit(auth, 'delete', 'post', post._id, 'Social post deleted');
    return { success: true };
}

async function retryPost(auth, id) {
    const post = await getPost(auth, id);
    if (!['failed', 'partial_success'].includes(post.status)) throw httpError(409, 'Only failed or partially published posts can be retried');
    post.status = 'queued';
    post.retry_count += 1;
    post.status_history.push({ status: 'queued', reason: 'Manual retry requested' });
    await post.save();
    await audit(auth, 'retry', 'post', post._id, 'Social post retry requested');
    await getSocialPublishQueue().add('publish-post', { postId: post._id }, { jobId: `social-post-retry-${post._id}-${post.retry_count}` });
    return post;
}

function resolvePostStatus(post) {
    const statuses = post.platforms.map(platform => post.platform_status?.[platform]?.status);
    if (statuses.every(status => status === 'published')) return 'published';
    if (statuses.some(status => status === 'published') && statuses.some(status => ['failed', 'token_expired', 'rate_limited'].includes(status))) return 'partial_success';
    if (statuses.some(status => ['queued', 'publishing', 'retrying', 'rate_limited'].includes(status))) return 'publishing';
    return 'failed';
}

async function markPlatformFailure(post, platform, error) {
    post.platform_status[platform].status = error.isRateLimited ? 'rate_limited' : (error.isTokenExpired ? 'token_expired' : 'failed');
    post.platform_status[platform].attempts += 1;
    post.platform_status[platform].last_error = error.message;
    post.platform_status[platform].last_error_code = error.metaCode || String(error.statusCode || '');
    post.platform_status[platform].next_retry_at = error.isRateLimited
        ? new Date(Date.now() + Number(process.env.SOCIAL_RATE_LIMIT_RETRY_MS || 15 * 60 * 1000))
        : null;
    post.status_history.push({ status: post.platform_status[platform].status, reason: error.message, platform });
}

async function loadAccountWithToken(accountId, orgId) {
    return SocialAccount.findOne({ _id: accountId, crm_org_id: orgId, status: 'active' })
        .select('+access_token.encrypted +access_token.iv +access_token.tag');
}

async function enforcePublishThrottle(orgId, userId, platform) {
    const redis = getRedisConnection();
    const durationMs = Number(process.env.SOCIAL_PLATFORM_RATE_DURATION_MS || 60_000);
    const max = Number(process.env.SOCIAL_PLATFORM_RATE_MAX || 30);
    const key = `social-rate:${orgId}:${userId}:${platform}:${Math.floor(Date.now() / durationMs)}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, durationMs);
    if (count > max) {
        const err = new Error(`Rate limit reached for ${platform}. The post will retry automatically.`);
        err.statusCode = 429;
        err.isRateLimited = true;
        err.metaCode = 'LOCAL_RATE_LIMIT';
        throw err;
    }
}

async function publishPost(postId, jobId) {
    const lockUntil = new Date(Date.now() - Number(process.env.SOCIAL_PUBLISH_LOCK_TTL_MS || 10 * 60 * 1000));
    const post = await SocialPost.findOneAndUpdate(
        {
            _id: postId,
            status: { $in: ['queued', 'scheduled', 'publishing', 'partial_success', 'failed'] },
            $or: [
                { 'publish_lock.locked_at': { $exists: false } },
                { 'publish_lock.locked_at': { $lt: lockUntil } }
            ]
        },
        {
            status: 'publishing',
            publish_started_at: new Date(),
            publish_lock: { locked_by: jobId || `worker-${process.pid}`, locked_at: new Date() }
        },
        { returnDocument: 'after' }
    );
    if (!post) return null;

    for (const platform of post.platforms) {
        if (post.platform_status[platform]?.status === 'published') continue;
        const account = await loadAccountWithToken(post.platform_status[platform].account_id, post.crm_org_id);
        if (!account) {
            await markPlatformFailure(post, platform, httpError(404, `${platform} account is no longer connected`));
            continue;
        }
        if (account.token_expires_at && account.token_expires_at < new Date()) {
            account.status = 'expired';
            account.last_error = { message: 'Token expired', code: 'TOKEN_EXPIRED', at: new Date() };
            await account.save();
            await markPlatformFailure(post, platform, httpError(401, `${platform} token expired`));
            continue;
        }

        try {
            post.platform_status[platform].status = 'publishing';
            post.platform_status[platform].attempts += 1;
            await post.save();
            await enforcePublishThrottle(post.crm_org_id, post.crm_user_id, platform);
            const token = decryptToken(account.access_token);
            const result = platform === 'facebook'
                ? await metaService.publishFacebook(account, token, post)
                : await metaService.publishInstagram(account, token, post);
            post.platform_status[platform].status = 'published';
            post.platform_status[platform].external_post_id = result.post_id || result.id;
            post.platform_status[platform].published_at = new Date();
            post.platform_status[platform].last_error = null;
            post.status_history.push({ status: 'published', reason: 'Published successfully', platform, job_id: jobId });
        } catch (error) {
            if (error.isTokenExpired || error.isPermissionDenied) {
                account.status = error.isPermissionDenied ? 'permission_denied' : 'expired';
                account.last_error = { message: error.message, code: error.metaCode, at: new Date() };
                await account.save();
            }
            await markPlatformFailure(post, platform, error);
        }
    }

    post.status = resolvePostStatus(post);
    post.publish_lock = undefined;
    if (post.status === 'published') post.published_at = new Date();
    if (['failed', 'partial_success'].includes(post.status)) {
        post.failed_at = post.status === 'failed' ? new Date() : undefined;
        post.last_error = 'One or more platforms failed to publish';
    }
    await post.save();

    await SocialAuditLog.create({
        crm_user_id: post.crm_user_id,
        crm_org_id: post.crm_org_id,
        action: post.status === 'failed' ? 'fail' : 'publish',
        entity_type: 'post',
        entity_id: post._id,
        platform: 'system',
        message: `Post ${post.status}`
    });

    if (post.status === 'published') {
        await getSocialCleanupQueue().add('cleanup-media', { postId: post._id }, {
            jobId: `social-cleanup-${post._id}`
        });
        post.status = 'cleanup_pending';
        post.cleanup_queued_at = new Date();
        await post.save();
    }
    return post;
}

async function cleanupPostMedia(postId) {
    const post = await SocialPost.findById(postId);
    if (!post) return null;
    let failed = false;
    for (const item of post.media) {
        if (item.cleanup_status === 'deleted' || item.cleanup_status === 'skipped') continue;
        try {
            item.cleanup_status = 'queued';
            item.cleanup_attempts += 1;
            const result = await deleteImage(item.public_id || item.url);
            if (result?.result === 'error') throw new Error(result.message || 'Storage cleanup failed');
            item.cleanup_status = 'deleted';
            item.cleanup_error = null;
        } catch (error) {
            failed = true;
            item.cleanup_status = 'failed';
            item.cleanup_error = error.message;
        }
    }
    post.status = failed ? 'cleanup_pending' : 'published';
    post.status_history.push({ status: failed ? 'cleanup_pending' : 'published', reason: failed ? 'Media cleanup failed' : 'Media cleanup completed' });
    await post.save();
    if (failed) throw new Error('One or more media cleanup operations failed');
    return post;
}

async function enqueueDueScheduledPosts(limit = 100) {
    const due = await SocialPost.find({
        status: 'scheduled',
        schedule_time: { $lte: new Date() }
    }).sort({ schedule_time: 1 }).limit(limit);

    for (const post of due) {
        post.status = 'queued';
        post.scheduler_fallback_required = false;
        post.status_history.push({ status: 'queued', reason: 'DB scheduler fallback queued due post' });
        await post.save();
        await getSocialPublishQueue().add('publish-post', { postId: post._id }, { jobId: `social-post-${post._id}` });
    }
    return due.length;
}

async function schedulePostNow(postId) {
    const post = await SocialPost.findById(postId);
    if (!post || post.status !== 'scheduled') return null;
    if (new Date(post.schedule_time).getTime() > Date.now()) return post;
    post.status = 'queued';
    post.status_history.push({ status: 'queued', reason: 'Scheduled job became due' });
    await post.save();
    await getSocialPublishQueue().add('publish-post', { postId: post._id }, { jobId: `social-post-${post._id}` });
    return post;
}

async function queueCaptionGeneration(auth, payload) {
    await getSocialCaptionQueue().add('generate-caption', { auth: { userId: auth.user._id, tenantId: auth.tenant_id }, payload }, {
        jobId: `social-caption-${auth.user._id}-${Date.now()}`
    });
}

module.exports = {
    connectAccount,
    getConnectedAccounts,
    disconnectAccount,
    createPost,
    listPosts,
    getPost,
    deletePost,
    retryPost,
    publishPost,
    cleanupPostMedia,
    enqueueDueScheduledPosts,
    schedulePostNow,
    queueCaptionGeneration,
    audit,
    uploadPostMedia
};
