const { Worker } = require('bullmq');
const TaskItem = require('../model/taskItem.model');
const TaskWorkspace = require('../model/taskWorkspace.model');
const TaskNotificationLog = require('../model/taskNotificationLog.model');
const User = require('../model/user.model');
const { redisConfig } = require('../services/queue.service');
const { sendMail } = require('../utils/sendMail');
const logger = require('../utils/logger');

async function sendDeadlineReminder(task) {
    const workspace = await TaskWorkspace.findById(task.workspaceId).lean();
    const manager = await User.findById(task.createdBy).select('user_name email').lean();
    const agents = await User.find({
        _id: { $in: task.assignedTo || [] },
        email: { $exists: true, $ne: '' },
        is_active: true,
        is_deleted: false
    }).select('email user_name').lean();

    const taskUrl = `${String(process.env.APP_URL || '').replace(/\/$/, '')}/tasks?workspace=${task.workspaceId}&task=${task._id}`;

    for (const agent of agents) {
        const logFilter = { taskId: task._id, type: 'deadline_reminder', recipientUserId: agent._id };
        const log = await TaskNotificationLog.findOneAndUpdate(
            logFilter,
            { $setOnInsert: { tenantId: task.tenantId, recipientEmail: agent.email, status: 'queued' } },
            { upsert: true, new: true }
        );
        if (log.status === 'sent') continue;

        await sendMail({
            to: agent.email,
            template: 'genericNotification',
            templateData: {
                title: 'Task Deadline Reminder',
                preheader: 'A task assigned to you is due tomorrow.',
                message: `${task.title}\nPriority: ${task.priority}\nDeadline: ${task.deadline?.toISOString?.() || task.deadline}\nWorkspace: ${workspace?.name || 'Workspace'}\nStatus: ${task.status}\nManager: ${manager?.user_name || 'Admin'}`,
                actionUrl: taskUrl,
                actionText: 'Open Task'
            }
        });

        await TaskNotificationLog.updateOne(logFilter, { $set: { status: 'sent', sentAt: new Date() }, $inc: { attempts: 1 } });
    }

    task.reminderSentAt = new Date();
    await task.save();
}

async function sendCompletionNotice(task) {
    const workspace = await TaskWorkspace.findById(task.workspaceId).lean();
    const manager = await User.findById(task.createdBy).select('user_name email').lean();
    const agent = await User.findById(task.completedBy).select('user_name email').lean();
    if (!manager?.email) return;

    const logFilter = { taskId: task._id, type: 'completion_notice', recipientUserId: manager._id };
    const log = await TaskNotificationLog.findOneAndUpdate(
        logFilter,
        { $setOnInsert: { tenantId: task.tenantId, recipientEmail: manager.email, status: 'queued' } },
        { upsert: true, new: true }
    );
    if (log.status === 'sent') return;

    const taskUrl = `${String(process.env.APP_URL || '').replace(/\/$/, '')}/tasks?workspace=${task.workspaceId}&task=${task._id}`;
    await sendMail({
        to: manager.email,
        template: 'genericNotification',
        templateData: {
            title: 'Task Completed',
            preheader: 'An assigned task was marked completed.',
            message: `${task.title}\nCompleted by: ${agent?.user_name || 'Agent'}\nCompleted at: ${(task.completedAt || new Date()).toISOString()}\nWorkspace: ${workspace?.name || 'Workspace'}\nSummary: ${task.description || 'No summary'}\nFinal status: ${task.status}`,
            actionUrl: taskUrl,
            actionText: 'Open Task'
        }
    });

    task.completionNotificationSentAt = new Date();
    await Promise.all([
        task.save(),
        TaskNotificationLog.updateOne(logFilter, { $set: { status: 'sent', sentAt: new Date() }, $inc: { attempts: 1 } })
    ]);
}

const taskEmailWorker = new Worker('task-email-notifications', async (job) => {
    const task = await TaskItem.findById(job.data.taskId);
    if (!task || task.isArchived) return;

    if (job.name === 'task-deadline-reminder') {
        if (task.status === 'completed' || task.reminderSentAt) return;
        await sendDeadlineReminder(task);
    }

    if (job.name === 'task-completed') {
        if (task.completionNotificationSentAt) return;
        await sendCompletionNotice(task);
    }
}, { connection: redisConfig, concurrency: Number(process.env.TASK_EMAIL_WORKER_CONCURRENCY || 5) });

taskEmailWorker.on('failed', (job, err) => {
    logger.error(`[TaskEmailWorker] ${job?.id || 'unknown'} failed: ${err.message}`);
});

module.exports = taskEmailWorker;
