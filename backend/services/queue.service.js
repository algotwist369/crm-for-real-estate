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
};

const connection = new Redis(redisConfig);

// Check and attempt to set Redis eviction policy
// Note: Some managed Redis services (like Redis Cloud) don't support CONFIG commands.
// We'll try it once but keep it silent to avoid log noise.
connection.config('GET', 'maxmemory-policy').then(async (res) => {
    // ioredis might return ['maxmemory-policy', 'value'] or just ['value'] depending on version/environment
    let policy = 'unknown';
    if (Array.isArray(res)) {
        // Find the index of maxmemory-policy or just take the second element
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
            // Silently fail as it's likely a restricted environment
            logger.debug(`Automatic policy change not allowed: ${setErr.message}`);
        }
    } else if (policy === 'noeviction') {
        logger.info('Redis policy verified: noeviction');
    }
}).catch(err => {
    // If CONFIG command is not supported at all, we log it once at debug level
    logger.debug(`Redis CONFIG command not supported: ${err.message}`);
});

const campaignQueue = new Queue('campaign-outreach', { 
    connection,
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

const campaignEvents = new QueueEvents('campaign-outreach', { connection });

module.exports = {
    campaignQueue,
    campaignEvents,
    connection
};
