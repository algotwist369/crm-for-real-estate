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
        if (message.type === 'OUTREACH_WORKER_READY') {
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

        // ─── Outreach Workers ───────────────────────────────────────────────────
        let reminderWorker = null;
        if (process.env.OUTREACH_WORKER === 'true') {
            const whatsappService = require('./services/whatsapp.service');
            require('./jobs/campaignWorker'); // Initialize BullMQ Worker for campaigns
            
            // 🚀 Senior Dev Strategy: Distributed Command Worker
            require('./jobs/whatsappWorker');

            // Staggered boot: workers are ready, but we wait for manual user trigger to connect WhatsApp
            // whatsappService.reconnectSessions() removed for 100% manual control
            
            reminderWorker = startFollowUpReminderWorker({
                pollIntervalMs: Number(process.env.FOLLOWUP_WORKER_POLL_MS || 60_000),
                maxPerTick: Number(process.env.FOLLOWUP_WORKER_MAX_PER_TICK || 25)
            });

            if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') {
                reminderWorker.start();
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

            if (reminderWorker) reminderWorker.stop();

            // Close Redis and BullMQ connections
            try {
                await socketService.close();
                await closeAllConnections();
                process.stdout.write(`Worker ${process.pid} - Redis and Queues closed\n`);
            } catch (err) {
                process.stderr.write(`Worker ${process.pid} - Error closing Redis: ${err.message}\n`);
            }

            // Close BullMQ workers if they exist
            if (process.env.OUTREACH_WORKER === 'true') {
                try {
                    const campaignWorker = require('./jobs/campaignWorker');
                    const whatsappWorker = require('./jobs/whatsappWorker');
                    await campaignWorker.close();
                    await whatsappWorker.close();
                    process.stdout.write(`Worker ${process.pid} - Outreach workers closed\n`);
                } catch (err) {
                    process.stderr.write(`Worker ${process.pid} - Error closing workers: ${err.message}\n`);
                }
            }

            await new Promise((resolve) => server.close(resolve));
            await mongoose.disconnect();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
        process.on('SIGTERM', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
    }

    // 🛡️ [Production Safety Net] Catch any unhandled exceptions/rejections
    // at the process level. PM2 will auto-restart the worker.
    // Without this, a single bad Promise can silently kill the process.
    process.on('uncaughtException', (err) => {
        process.stderr.write(`[CRITICAL] Uncaught Exception in Worker ${process.pid}:\n${err.stack}\n`);
        process.exit(1); // PM2 ecosystem will restart automatically
    });

    process.on('unhandledRejection', (reason, promise) => {
        process.stderr.write(`[CRITICAL] Unhandled Rejection in Worker ${process.pid}:\n${reason?.stack || reason}\n`);
        // Do NOT exit — unhandled rejections are often non-fatal in Express apps
        // but we log them so we know about them
    });

    start().catch(err => {
        process.stderr.write(`${err?.stack || err}\n`);
        process.exit(1);
    });
}