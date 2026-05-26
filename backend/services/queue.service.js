const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Silencing BullMQ's hardcoded console.warn about Redis eviction policy
const originalWarn = console.warn;
console.warn = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('IMPORTANT! Eviction policy')) {
        return;
    }
    originalWarn.apply(console, args);
};

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // mandatory for BullMQ
    retryStrategy(times) {
        // 🛡️ Senior Developer: Exponential backoff to prevent "max clients" log floods during PM2 reloads 
        const delay = Math.min(times * 100, 3000);
        return delay;
    }
};

let connection = null;
let campaignQueue = null;
let campaignEvents = null;
let whatsappQueue = null;
let taskEmailQueue = null;
let socialPublishQueue = null;
let socialScheduleQueue = null;
let socialCaptionQueue = null;
let socialCleanupQueue = null;
let socialSharedQueue = null;

const getRedisConnection = () => {
    if (!connection) {
        connection = new Redis(redisConfig);
        
        // Check and attempt to set Redis eviction policy (only on the shared connection)
        connection.config('GET', 'maxmemory-policy').then(async (res) => {
            let policy = 'unknown';
            if (Array.isArray(res)) {
                const valIndex = res.indexOf('maxmemory-policy');
                policy = valIndex !== -1 ? res[valIndex + 1] : res[1] || res[0];
            } else if (typeof res === 'string') {
                policy = res;
            }

            if (policy && policy !== 'noeviction' && policy !== 'unknown') {
                logger.warn(`Redis policy is "${policy}". Recommended: "noeviction" to prevent data loss.`);
                try {
                    await connection.config('SET', 'maxmemory-policy', 'noeviction');
                    logger.info('Successfully set Redis policy to "noeviction".');
                } catch (setErr) {
                    logger.debug(`Automatic policy change not allowed: ${setErr.message}`);
                }
            } else if (policy === 'noeviction') {
                logger.info('Redis policy verified: noeviction');
            }
        }).catch(err => {
            logger.debug(`Redis CONFIG command not supported: ${err.message}`);
        });

        connection.on('error', (err) => {
            if (err.message.includes('max number of clients reached')) {
                logger.error('CRITICAL: Redis max number of clients reached. Check connections.');
            } else {
                logger.error(`Redis connection error: ${err.message}`);
            }
        });
    }
    return connection;
};

// BullMQ Workers need their own connection because they use blocking commands
const createWorkerConnection = () => {
    const workerConn = new Redis(redisConfig);
    workerConn.on('error', (err) => {
        logger.error(`Redis worker connection error: ${err.message}`);
    });
    return workerConn;
};

const getCampaignQueue = () => {
    if (!campaignQueue) {
        campaignQueue = new Queue('campaign-outreach', { 
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        });

        // 🛡️ Prevent uncaught exceptions if Queue's underlying connection fails
        campaignQueue.on('error', (err) => {
            if (!err.message.includes('max number of clients reached')) {
                logger.error(`BullMQ Queue Error: ${err.message}`);
            }
        });
    }
    return campaignQueue;
};

const getCampaignEvents = () => {
    if (!campaignEvents) {
        // QueueEvents requires a dedicated subscriber connection
        campaignEvents = new QueueEvents('campaign-outreach', { connection: redisConfig });
        
        // 🛡️ Prevent uncaught exceptions from crashing Node if Redis connection drops
        campaignEvents.on('error', (err) => {
            if (!err.message.includes('max number of clients reached')) {
                logger.error(`BullMQ QueueEvents Error: ${err.message}`);
            }
        });
    }
    return campaignEvents;
};

const getWhatsAppQueue = () => {
    if (!whatsappQueue) {
        whatsappQueue = new Queue('whatsapp-commands', { 
            connection: redisConfig,
            defaultJobOptions: {
                attempts: 1, // Commands should generally not be retried automatically
                removeOnComplete: true,
                removeOnFail: true,
            }
        });

        whatsappQueue.on('error', (err) => {
            if (!err.message.includes('max number of clients reached')) {
                logger.error(`BullMQ WhatsApp Queue Error: ${err.message}`);
            }
        });
    }
    return whatsappQueue;
};

const getTaskEmailQueue = () => {
    if (!taskEmailQueue) {
        taskEmailQueue = new Queue('task-email-notifications', {
            connection: redisConfig,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: true,
                removeOnFail: false
            }
        });

        taskEmailQueue.on('error', (err) => {
            if (!err.message.includes('max number of clients reached')) {
                logger.error(`BullMQ Task Email Queue Error: ${err.message}`);
            }
        });
    }
    return taskEmailQueue;
};

function createSocialQueue(name) {
    return new Queue(name, {
        connection: redisConfig,
        defaultJobOptions: {
            attempts: Number(process.env.SOCIAL_QUEUE_ATTEMPTS || 5),
            backoff: {
                type: 'exponential',
                delay: Number(process.env.SOCIAL_QUEUE_BACKOFF_MS || 60_000)
            },
            removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
            removeOnFail: false
        }
    });
}

function attachQueueError(queue, label) {
    queue.on('error', (err) => {
        if (!err.message.includes('max number of clients reached')) {
            logger.error(`BullMQ ${label} Queue Error: ${err.message}`);
        }
    });
}

const getSocialPublishQueue = () => {
    if (process.env.SOCIAL_COMPACT_REDIS !== 'false') {
        if (!socialSharedQueue) {
            socialSharedQueue = createSocialQueue('social-media');
            attachQueueError(socialSharedQueue, 'Social Media');
        }
        return socialSharedQueue;
    }
    if (!socialPublishQueue) {
        socialPublishQueue = createSocialQueue('social-publish');
        attachQueueError(socialPublishQueue, 'Social Publish');
    }
    return socialPublishQueue;
};

const getSocialScheduleQueue = () => {
    if (process.env.SOCIAL_COMPACT_REDIS !== 'false') return getSocialPublishQueue();
    if (!socialScheduleQueue) {
        socialScheduleQueue = createSocialQueue('social-schedule');
        attachQueueError(socialScheduleQueue, 'Social Schedule');
    }
    return socialScheduleQueue;
};

const getSocialCaptionQueue = () => {
    if (process.env.SOCIAL_COMPACT_REDIS !== 'false') return getSocialPublishQueue();
    if (!socialCaptionQueue) {
        socialCaptionQueue = createSocialQueue('social-caption');
        attachQueueError(socialCaptionQueue, 'Social Caption');
    }
    return socialCaptionQueue;
};

const getSocialCleanupQueue = () => {
    if (process.env.SOCIAL_COMPACT_REDIS !== 'false') return getSocialPublishQueue();
    if (!socialCleanupQueue) {
        socialCleanupQueue = createSocialQueue('social-cleanup');
        attachQueueError(socialCleanupQueue, 'Social Cleanup');
    }
    return socialCleanupQueue;
};

const closeAllConnections = async () => {
    const promises = [];
    if (campaignQueue) promises.push(campaignQueue.close());
    if (campaignEvents) promises.push(campaignEvents.close());
    if (whatsappQueue) promises.push(whatsappQueue.close());
    if (taskEmailQueue) promises.push(taskEmailQueue.close());
    if (socialPublishQueue) promises.push(socialPublishQueue.close());
    if (socialScheduleQueue) promises.push(socialScheduleQueue.close());
    if (socialCaptionQueue) promises.push(socialCaptionQueue.close());
    if (socialCleanupQueue) promises.push(socialCleanupQueue.close());
    if (socialSharedQueue) promises.push(socialSharedQueue.close());
    if (connection) promises.push(connection.quit());
    
    await Promise.allSettled(promises);
    
    connection = null;
    campaignQueue = null;
    campaignEvents = null;
    whatsappQueue = null;
    taskEmailQueue = null;
    socialPublishQueue = null;
    socialScheduleQueue = null;
    socialCaptionQueue = null;
    socialCleanupQueue = null;
    socialSharedQueue = null;
};

module.exports = {
    getRedisConnection,
    createWorkerConnection,
    getCampaignQueue,
    getCampaignEvents,
    getWhatsAppQueue,
    getTaskEmailQueue,
    getSocialPublishQueue,
    getSocialScheduleQueue,
    getSocialCaptionQueue,
    getSocialCleanupQueue,
    closeAllConnections,
    redisConfig
};
