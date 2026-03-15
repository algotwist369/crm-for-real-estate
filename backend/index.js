require('dotenv').config();

const mongoose = require('mongoose');

const { startFollowUpReminderWorker } = require('./jobs/followUpReminderWorker');
const { startArchiveWorker } = require('./jobs/archiveCleanupWorker');
const { createApp } = require('./app');

async function start() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(mongoUri);

    const app = createApp();

    const worker = startFollowUpReminderWorker({
        pollIntervalMs: Number(process.env.FOLLOWUP_WORKER_POLL_MS || 60_000),
        maxPerTick: Number(process.env.FOLLOWUP_WORKER_MAX_PER_TICK || 25)
    });

    const archiveWorker = startArchiveWorker({
        pollIntervalMs: Number(process.env.ARCHIVE_WORKER_POLL_MS || 60 * 60 * 1000) // 1 Hour by default
    });

    if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') {
        worker.start();
        archiveWorker.start();
    }

    const port = Number(process.env.PORT || 3000);
    const server = app.listen(port, () => {
        process.stdout.write(`API running on http://localhost:${port}\n`);
    });

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
