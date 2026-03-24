const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const cluster = require('cluster');
const os = require('os');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { connectToDatabase } = require('./config/db');
const { startFollowUpReminderWorker } = require('./jobs/followUpReminderWorker');
const { startArchiveWorker } = require('./jobs/archiveCleanupWorker');
const { createApp } = require('./app');

const NUM_WORKERS = Number(os.cpus().length);

// ─── PRIMARY PROCESS ────────────────────────────────────────────────────────
if (cluster.isPrimary) {
    process.stdout.write(`Primary ${process.pid} started — spawning ${NUM_WORKERS} workers\n`);

    for (let i = 0; i < NUM_WORKERS; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        const reason = signal || code;
        process.stderr.write(`Worker ${worker.process.pid} died (${reason}) — restarting...\n`);
        cluster.fork();
    });

<<<<<<< HEAD
    const archiveWorker = startArchiveWorker({
        pollIntervalMs: Number(process.env.ARCHIVE_WORKER_POLL_MS || 60 * 60 * 1000) // 1 Hour by default
    });

    if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') {
        worker.start();
        archiveWorker.start();
=======
    cluster.on('online', (worker) => {
        process.stdout.write(`Worker ${worker.process.pid} is online\n`);
    });

    // ─── WORKER PROCESS ─────────────────────────────────────────────────────────
} else {
    async function start() {
        if (!process.env.TOKEN_SECRET && !process.env.JWT_SECRET) {
            process.stderr.write(`Worker ${process.pid} — WARNING: TOKEN_SECRET not found in environment!\n`);
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

        // ─── Follow-up Reminder Worker (only on worker id 1) ────────────
        let worker = null;
        if (cluster.worker.id === 1) {
            worker = startFollowUpReminderWorker({
                pollIntervalMs: Number(process.env.FOLLOWUP_WORKER_POLL_MS || 60_000),
                maxPerTick: Number(process.env.FOLLOWUP_WORKER_MAX_PER_TICK || 25)
            });

            if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') {
                worker.start();
            }
        }

        const port = Number(process.env.PORT || 3000);
        const server = app.listen(port, () => {
            process.stdout.write(`Worker ${process.pid} — API running on http://localhost:${port}\n`);
        });

        const shutdown = async () => {
            process.stdout.write(`Worker ${process.pid} shutting down...\n`);

            if (worker) worker.stop();

            await new Promise((resolve) => server.close(resolve));
            await mongoose.disconnect();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
        process.on('SIGTERM', () => shutdown().catch(err => process.stderr.write(`${err?.stack || err}\n`)));
>>>>>>> 4789c8c695ddb4fadbc0b233832436b63de1f532
    }

    start().catch(err => {
        process.stderr.write(`${err?.stack || err}\n`);
        process.exit(1);
    });
<<<<<<< HEAD

    const shutdown = async () => {
        worker.stop();
        archiveWorker.stop();
        server.close(() => {});
        await mongoose.disconnect();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start().catch(err => {
    process.stderr.write(`${err?.stack || err}\n`);
    process.exit(1);
});
=======
}
>>>>>>> 4789c8c695ddb4fadbc0b233832436b63de1f532
