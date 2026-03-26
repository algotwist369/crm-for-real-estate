const Archive = require('../model/archive.model');
const { sendMail } = require('../utils/sendMail');
const User = require('../model/user.model');

async function processArchives(now) {
    try {
        // 1. Notify users about data approaching the 5-day deletion mark
        // Finds documents deleted at least 4 days ago, but less than 5 days ago.
        const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

        const archivesToNotify = await Archive.find({
            deletedAt: { $lte: fourDaysAgo },
            notificationSent: false
        }).populate('deletedBy', 'email user_name');

        for (const archive of archivesToNotify) {
            if (archive.deletedBy && archive.deletedBy.email) {
                await sendMail({
                    to: archive.deletedBy.email,
                    template: 'genericNotification',
                    templateData: {
                        title: 'Archived Data Deletion Warning',
                        preheader: 'Your archived data will be permanently deleted tomorrow.',
                        message: `A ${archive.documentType} document you deleted 4 days ago is about to be permanently cleared from the archives in 24 hours.`,
                        actionText: 'Review System',
                        actionUrl: process.env.APP_URL || ''
                    }
                });
            }
            // Update the archive record so we don't spam the user
            archive.notificationSent = true;
            await archive.save();
        }

        // 2. Permanently delete data deleted 5 days ago or more
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

        await Archive.deleteMany({
            deletedAt: { $lte: fiveDaysAgo }
        });

    } catch (e) {
        console.error('Error in archive cleanup worker:', e);
    }
}

function startArchiveWorker(options = {}) {
    // Run every hour instead of every minute, since it's a daily lifecycle
    const pollIntervalMs = Number(options.pollIntervalMs ?? 60 * 60 * 1000);

    let timer = null;

    const start = () => {
        if (timer) return;
        const run = async () => {
            await processArchives(new Date());
        };
        run(); // run immediately
        timer = setInterval(run, pollIntervalMs);
    };

    const stop = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    };

    return { start, stop };
}

module.exports = { startArchiveWorker, processArchives };
