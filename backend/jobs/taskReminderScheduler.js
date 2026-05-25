const TaskItem = require('../model/taskItem.model');
const { getTaskEmailQueue } = require('../services/queue.service');

const taskEmailJobId = (type, taskId) => `${type}-${String(taskId).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

async function tick({ maxPerTick = 100 } = {}) {
    const now = new Date();
    const tasks = await TaskItem.find({
        isArchived: false,
        status: { $ne: 'completed' },
        reminderDueAt: { $lte: now },
        reminderSentAt: { $exists: false },
        deadline: { $gt: now }
    }).select('_id').limit(maxPerTick).lean();

    const queue = getTaskEmailQueue();
    for (const task of tasks) {
        await queue.add('task-deadline-reminder', { taskId: String(task._id) }, { jobId: taskEmailJobId('task-deadline-reminder', task._id) });
    }
}

function startTaskReminderScheduler(options = {}) {
    const pollIntervalMs = Number(options.pollIntervalMs || process.env.TASK_REMINDER_POLL_MS || 5 * 60 * 1000);
    let timer = null;

    const start = () => {
        if (timer) return;
        const run = () => tick().catch(() => {});
        run();
        timer = setInterval(run, pollIntervalMs);
    };

    const stop = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    };

    return { start, stop };
}

module.exports = {
    tick,
    startTaskReminderScheduler
};
