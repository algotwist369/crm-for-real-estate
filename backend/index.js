const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const cluster = require('cluster');
const os = require('os');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { connectToDatabase } = require('./config/db');
const { startFollowUpReminderWorker } = require('./jobs/followUpReminderWorker');
const { createApp } = require('./app');
const socketService = require('./services/socket.service');
const { getRedisConnection, closeAllConnections } = require('./services/queue.service');

const NUM_WORKERS = process.env.NODE_ENV === 'production' 
    ? Number(process.env.WEB_CONCURRENCY || os.cpus().length) 
    : 1;

// ─── PRIMARY PROCESS (unless disabled) ──────────────────────────────────────
if (cluster.isPrimary && process.env.DISABLE_CLUSTER !== 'true') {
    process.stdout.write(`Primary ${process.pid} started - spawning ${NUM_WORKERS} workers\n`);

    cluster.on('message', (worker, message) => {
        if (message.type === 'WHATSAPP_INIT' || message.type === 'WHATSAPP_LOGOUT' || message.type === 'WHATSAPP_REGENERATE') {
            // Forward WhatsApp init/logout/regenerate request to the worker with the Outreach role
            const outreachWorker = Object.values(cluster.workers).find(w => w.outreachWorker === true);
            if (outreachWorker) {
                outreachWorker.send(message);
            }
        } else if (message.type === 'OUTREACH_WORKER_READY') {
            worker.outreachWorker = true;
        }
    });

    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = cluster.fork({
            OUTREACH_WORKER: i === 0 ? 'true' : 'false'
        });
        if (i === 0) worker.outreachWorker = true;
    }

    cluster.on('exit', (worker, code, signal) => {
        const reason = signal || code;
        process.stderr.write(`Worker ${worker.process.pid} died (${reason}) - restarting...\n`);
        
        // If the outreach worker died, reassign the role to the next spawned worker
        const wasOutreach = worker.outreachWorker;
        const newWorker = cluster.fork({
            OUTREACH_WORKER: wasOutreach ? 'true' : 'false'
        });
        if (wasOutreach) newWorker.outreachWorker = true;
    });

    cluster.on('online', (worker) => {
        process.stdout.write(`Worker ${worker.process.pid} is online\n`);
    });

    // ─── WORKER PROCESS ─────────────────────────────────────────────────────────
} else {
    async function start() {
        if (!process.env.TOKEN_SECRET && !process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
            process.stderr.write(`CRITICAL ERROR: TOKEN_SECRET or JWT_SECRET not found in environment! Boot aborted.\n`);
            process.exit(1);
        }
        await connectToDatabase();
        const app = createApp();

        // Tag each log line with the worker PID for easy tracing in cluster mode
        morgan.token('pid', () => String(process.pid));

        app.use(morgan(
            process.env.NODE_ENV === 'production'
                ? ':pid :remote-addr :method :url :status :res[content-length] - :response-time ms'
                : ':pid :method :url :status :response-time ms',
            {
                // Skip logging health-check endpoints to reduce noise
                skip: (req) => req.url === '/health' || req.url === '/ping',

                // In production, only log errors to stderr; info to stdout
                stream: process.env.NODE_ENV === 'production'
                    ? {
                        write: (msg) => {
                            const status = Number(msg.split(' ')[3]);
                            if (status >= 400) {
                                process.stderr.write(msg);
                            } else {
                                process.stdout.write(msg);
                            }
                        }
                    }
                    : process.stdout
            }
        ));

        // ─── Outreach Workers (only on the designated worker for WhatsApp stability) ────────────
        let worker = null;
        if (process.env.OUTREACH_WORKER === 'true') {
            const whatsappService = require('./services/whatsapp.service');
            require('./jobs/campaignWorker');
            
            // Re-initialize connected sessions on startup
            whatsappService.reconnectSessions().catch(err => {
                process.stderr.write(`Error reconnecting sessions: ${err.message}\n`);
            });

            // Listen for WhatsApp init messages from other workers via Primary
            process.on('message', (message) => {
                if (message.type === 'WHATSAPP_INIT' || message.type === 'WHATSAPP_REGENERATE') {
                    const { userId, tenantId } = message.data;
                    whatsappService.initWhatsAppSession(userId, tenantId).catch(err => {
                        process.stderr.write(`Failed to process ${message.type} message: ${err.message}\n`);
                    });
                } else if (message.type === 'WHATSAPP_LOGOUT') {
                    const { userId } = message.data;
                    whatsappService.logout(userId).catch(err => {
                        process.stderr.write(`Failed to process WHATSAPP_LOGOUT message: ${err.message}\n`);
                    });
                }
            });

            worker = startFollowUpReminderWorker({
                pollIntervalMs: Number(process.env.FOLLOWUP_WORKER_POLL_MS || 60_000),
                maxPerTick: Number(process.env.FOLLOWUP_WORKER_MAX_PER_TICK || 25)
            });

            if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') {
                worker.start();
            }
        }

        let port = Number(process.env.PORT || 5001);
        if (port === 6000) port = 5001; // Force migrate from unsafe port
        const server = app.listen(port, () => {
            process.stdout.write(`Worker ${process.pid} - API running on http://localhost:${port}\n`);
        });
        
        socketService.init(server);

        // Periodically log memory and CPU usage for monitoring
        const logMetrics = () => {
            const mem = process.memoryUsage();
            const mb = 1024 * 1024;
            const isOutreach = process.env.OUTREACH_WORKER === 'true' ? '[OUTREACH]' : '[API]';
            const load = os.loadavg().map(n => n.toFixed(2)).join(', ');
            process.stdout.write(`Worker ${process.pid} ${isOutreach} Metrics - RSS: ${(mem.rss/mb).toFixed(2)}MB | HeapUsed: ${(mem.heapUsed/mb).toFixed(2)}MB | LoadAvg: ${load}\n`);
        };
        // Log immediately on startup, then every 30 mins
        logMetrics();
        const metricsInterval = setInterval(logMetrics, 30 * 60 * 1000);

        const shutdown = async () => {
            process.stdout.write(`Worker ${process.pid} shutting down...\n`);
            clearInterval(metricsInterval);

            if (worker) worker.stop();

            // Close Redis and BullMQ connections
            try {
                await closeAllConnections();
                process.stdout.write(`Worker ${process.pid} - Redis and Queues closed\n`);
            } catch (err) {
                process.stderr.write(`Worker ${process.pid} - Error closing Redis: ${err.message}\n`);
            }

            // Close BullMQ worker if it exists
            if (process.env.OUTREACH_WORKER === 'true') {
                try {
                    const campaignWorker = require('./jobs/campaignWorker');
                    await campaignWorker.close();
                    process.stdout.write(`Worker ${process.pid} - Campaign worker closed\n`);
                } catch (err) {
                    process.stderr.write(`Worker ${process.pid} - Error closing campaign worker: ${err.message}\n`);
                }
            }

            await new Promise((resolve) => server.close(resolve));
            await mongoose.disconnect();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
        process.on('SIGTERM', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
    }

    start().catch(err => {
        process.stderr.write(`${err?.stack || err}\n`);
        process.exit(1);
    });
}