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

let connection = null;
let campaignQueue = null;
let campaignEvents = null;

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
    }
    return campaignQueue;
};

const getCampaignEvents = () => {
    if (!campaignEvents) {
        // QueueEvents requires a dedicated subscriber connection
        campaignEvents = new QueueEvents('campaign-outreach', { connection: redisConfig });
    }
    return campaignEvents;
};

const closeAllConnections = async () => {
    const promises = [];
    if (campaignQueue) promises.push(campaignQueue.close());
    if (campaignEvents) promises.push(campaignEvents.close());
    if (connection) promises.push(connection.quit());
    
    await Promise.allSettled(promises);
    
    connection = null;
    campaignQueue = null;
    campaignEvents = null;
};

module.exports = {
    getRedisConnection,
    createWorkerConnection,
    getCampaignQueue,
    getCampaignEvents,
    closeAllConnections,
    redisConfig
};
