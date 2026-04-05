const { Worker } = require('bullmq');
const { redisConfig } = require('../services/queue.service');
const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

/**
 * 🛡️ Senior Developer: Distributed WhatsApp Command Worker
 * This worker processes global commands (INIT, REGENERATE, LOGOUT) 
 * triggered by any API node in the cluster.
 */
const whatsappWorker = new Worker('whatsapp-commands', async (job) => {
    const { type, userId, tenantId } = job.data;
    
    logger.info(`[WhatsAppWorker] Processing command ${type} for user ${userId}`);

    try {
        switch (type) {
            case 'INIT': {
                const result = await whatsappService.initWhatsAppSession(userId, tenantId, false, false);
                if (result?.status === 'initializing') {
                    logger.info(`[WhatsAppWorker] Session for ${userId} is already initializing. Skipping redundant job.`);
                }
                break;
            }
            case 'REGENERATE': {
                // For regenerate, we EXPLICITLY pass forceNew: true to allow killing an old session
                const result = await whatsappService.initWhatsAppSession(userId, tenantId, false, true);
                if (result?.status === 'initializing') {
                    logger.info(`[WhatsAppWorker] Session for ${userId} is already initializing. Skipping redundant job.`);
                }
                break;
            }
            
            case 'LOGOUT':
                await whatsappService.logout(userId);
                break;

            default:
                logger.warn(`[WhatsAppWorker] Unknown command type: ${type}`);
        }
    } catch (err) {
        logger.error(`[WhatsAppWorker] Failed to process ${type} for ${userId}: ${err.message}`);
        // Only throw if it's a real failure, not just a lock hit
        throw err; 
    }
}, { 
    connection: redisConfig,
    concurrency: 1 
});

whatsappWorker.on('completed', (job) => {
    logger.debug(`[WhatsAppWorker] Job ${job.id} (${job.data.type}) completed`);
});

whatsappWorker.on('failed', (job, err) => {
    logger.error(`[WhatsAppWorker] Job ${job.id} (${job.data.type}) FAILED: ${err.message}`);
});

// 🛡️ Prevent uncaught exceptions if Worker's underlying connection fails
whatsappWorker.on('error', (err) => {
    if (!err.message.includes('max number of clients reached')) {
        logger.error(`[WhatsAppWorker] BullMQ Worker Error: ${err.message}`);
    }
});

module.exports = whatsappWorker;
