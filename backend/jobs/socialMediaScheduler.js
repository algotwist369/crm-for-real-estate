const socialMediaService = require('../services/socialMedia.service');
const SocialPost = require('../model/socialPost.model');
const logger = require('../utils/logger');

function startSocialMediaScheduler(options = {}) {
    const pollIntervalMs = options.pollIntervalMs || Number(process.env.SOCIAL_SCHEDULER_POLL_MS || 60_000);
    const stuckMs = options.stuckMs || Number(process.env.SOCIAL_STUCK_JOB_MS || 15 * 60 * 1000);
    let timer = null;
    let running = false;

    async function tick() {
        if (running) return;
        running = true;
        try {
            const queued = await socialMediaService.enqueueDueScheduledPosts(Number(process.env.SOCIAL_SCHEDULER_MAX_PER_TICK || 100));
            if (queued > 0) logger.info(`Social scheduler queued ${queued} due posts`);

            const cutoff = new Date(Date.now() - stuckMs);
            const recovered = await SocialPost.updateMany(
                {
                    status: 'publishing',
                    'publish_lock.locked_at': { $lt: cutoff }
                },
                {
                    $set: { status: 'queued', publish_lock: undefined, scheduler_fallback_required: true },
                    $push: { status_history: { status: 'queued', reason: 'Recovered stuck publish lock' } }
                }
            );
            if (recovered.modifiedCount > 0) {
                logger.warn(`Social scheduler recovered ${recovered.modifiedCount} stuck posts`);
            }
        } catch (error) {
            logger.error(`Social scheduler tick failed: ${error.message}`);
        } finally {
            running = false;
        }
    }

    return {
        start() {
            if (timer) return;
            tick();
            timer = setInterval(tick, pollIntervalMs);
        },
        stop() {
            if (timer) clearInterval(timer);
            timer = null;
        }
    };
}

module.exports = { startSocialMediaScheduler };
