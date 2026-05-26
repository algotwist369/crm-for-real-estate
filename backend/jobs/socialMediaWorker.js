const { Worker } = require('bullmq');
const { redisConfig } = require('../services/queue.service');
const socialMediaService = require('../services/socialMedia.service');
const aiService = require('../services/ai.service');
const SocialWorkerHealth = require('../model/socialWorkerHealth.model');
const logger = require('../utils/logger');

const workerName = `social-media-${process.pid}`;
let heartbeat = null;

async function setHealth(status, extra = {}) {
    try {
        await SocialWorkerHealth.findOneAndUpdate(
            { worker_name: workerName },
            {
                worker_name: workerName,
                status,
                pid: process.pid,
                last_heartbeat_at: new Date(),
                ...extra
            },
            { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
        logger.warn(`Social worker health update failed: ${error.message}`);
    }
}

async function processSocialJob(job) {
    if (job.name === 'publish-post') return socialMediaService.publishPost(job.data.postId, job.id);
    if (job.name === 'schedule-post') return socialMediaService.schedulePostNow(job.data.postId);
    if (job.name === 'cleanup-media') return socialMediaService.cleanupPostMedia(job.data.postId);
    if (job.name === 'generate-caption') return aiService.generateSocialCaption(job.data.payload || {});
    logger.warn(`Unknown social job type: ${job.name}`);
    return null;
}

const compactMode = process.env.SOCIAL_COMPACT_REDIS !== 'false';

const compactWorker = compactMode ? new Worker('social-media', processSocialJob, {
    connection: redisConfig,
    concurrency: Number(process.env.SOCIAL_PUBLISH_CONCURRENCY || 3),
    limiter: {
        max: Number(process.env.SOCIAL_PUBLISH_RATE_MAX || 60),
        duration: Number(process.env.SOCIAL_PUBLISH_RATE_DURATION_MS || 60_000)
    }
}) : null;

const publishWorker = compactMode ? null : new Worker('social-publish', async (job) => {
    return socialMediaService.publishPost(job.data.postId, job.id);
}, {
    connection: redisConfig,
    concurrency: Number(process.env.SOCIAL_PUBLISH_CONCURRENCY || 3),
    limiter: {
        max: Number(process.env.SOCIAL_PUBLISH_RATE_MAX || 60),
        duration: Number(process.env.SOCIAL_PUBLISH_RATE_DURATION_MS || 60_000)
    }
});

const scheduleWorker = compactMode ? null : new Worker('social-schedule', async (job) => {
    return socialMediaService.schedulePostNow(job.data.postId);
}, {
    connection: redisConfig,
    concurrency: Number(process.env.SOCIAL_SCHEDULE_CONCURRENCY || 5)
});

const cleanupWorker = compactMode ? null : new Worker('social-cleanup', async (job) => {
    return socialMediaService.cleanupPostMedia(job.data.postId);
}, {
    connection: redisConfig,
    concurrency: Number(process.env.SOCIAL_CLEANUP_CONCURRENCY || 2)
});

const captionWorker = compactMode ? null : new Worker('social-caption', async (job) => {
    return aiService.generateSocialCaption(job.data.payload || {});
}, {
    connection: redisConfig,
    concurrency: Number(process.env.SOCIAL_CAPTION_CONCURRENCY || 2),
    limiter: {
        max: Number(process.env.SOCIAL_CAPTION_RATE_MAX || 30),
        duration: Number(process.env.SOCIAL_CAPTION_RATE_DURATION_MS || 60_000)
    }
});

const workers = [compactWorker, publishWorker, scheduleWorker, cleanupWorker, captionWorker].filter(Boolean);

for (const worker of workers) {
    worker.on('completed', (job) => logger.info(`Social job ${job.queueName}:${job.id} completed`));
    worker.on('failed', async (job, err) => {
        logger.error(`Social job ${job?.queueName}:${job?.id} failed: ${err.message}`);
        await setHealth('degraded', { last_error: err.message });
    });
    worker.on('error', async (err) => {
        if (!err.message.includes('max number of clients reached')) {
            logger.error(`Social worker error: ${err.message}`);
            await setHealth('degraded', { last_error: err.message });
        }
    });
}

function startHealthHeartbeat() {
    if (heartbeat) return;
    setHealth('healthy');
    heartbeat = setInterval(() => setHealth('healthy'), Number(process.env.SOCIAL_WORKER_HEARTBEAT_MS || 30_000));
}

async function close() {
    if (heartbeat) clearInterval(heartbeat);
    await setHealth('stopped');
    await Promise.allSettled(workers.map(worker => worker.close()));
}

startHealthHeartbeat();

module.exports = {
    close,
    compactWorker,
    publishWorker,
    scheduleWorker,
    cleanupWorker,
    captionWorker
};
