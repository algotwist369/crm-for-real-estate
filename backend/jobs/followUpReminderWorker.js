const FollowUpReminder = require('../model/followUpReminder.model');
const Lead = require('../model/lead.model');
const User = require('../model/user.model');
const { sendMail } = require('../utils/sendMail');

function uniqueStrings(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean));
    return Array.from(set);
}

function computeCleanupAt(dueAt) {
    const d = dueAt instanceof Date ? dueAt : new Date(dueAt);
    return new Date(d.getTime() + 1000 * 60 * 60 * 24 * 30);
}

async function markMissedFollowups(now) {
    const graceMinutes = Number(process.env.FOLLOWUP_MISSED_GRACE_MINUTES || process.env.FOLLOWUP_OVERDUE_NOTIFY_MINUTES || 10);
    const threshold = new Date(now.getTime() - Math.max(1, graceMinutes) * 60 * 1000);
    await Lead.updateMany(
        {
            is_active: true,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $lt: threshold }
        },
        {
            $set: { follow_up_status: 'missed', status: 'follow_up' },
            $currentDate: { updatedAt: true }
        }
    );
}

async function processOneDueReminder(now) {
    const reminder = await FollowUpReminder.findOneAndUpdate(
        { status: 'pending', due_at: { $lte: now } },
        { $set: { status: 'processing', processing_at: now, error_message: '' } },
        { sort: { due_at: 1 }, returnDocument: 'after' }
    );
    if (!reminder) return false;

    try {
        const lead = await Lead.findById(reminder.lead).lean();
        if (!lead || !lead.is_active || lead.follow_up_status === 'done') {
            await FollowUpReminder.updateOne(
                { _id: reminder._id },
                { $set: { status: 'cancelled', cleanup_at: computeCleanupAt(reminder.due_at) } }
            );
            return true;
        }

        const users = await User.find({
            _id: { $in: reminder.recipients },
            is_active: true,
            is_deleted: false,
            email: { $exists: true, $ne: '' }
        }).select('email user_name').lean();

        const emails = uniqueStrings(users.map(u => u.email));
        if (!emails.length) {
            await FollowUpReminder.updateOne(
                { _id: reminder._id },
                { $set: { status: 'sent', sent_at: now, cleanup_at: computeCleanupAt(reminder.due_at) } }
            );
            return true;
        }

        const appUrl = process.env.APP_URL || '';
        const leadUrl = appUrl ? `${String(appUrl).replace(/\/$/, '')}/leads/${lead._id}` : '';
        const followUpDate = lead.next_follow_up_date ? new Date(lead.next_follow_up_date) : null;

        const to = emails[0];
        const bcc = emails.length > 1 ? emails.slice(1) : undefined;

        if (reminder.type === 'overdue_grace') {
            await sendMail({
                to,
                bcc,
                template: 'genericNotification',
                templateData: {
                    title: 'Follow-up Overdue',
                    preheader: 'A lead follow-up is overdue. Please take action now.',
                    message: `${lead.name}${followUpDate ? ` (Due: ${followUpDate.toISOString().split('T')[0]})` : ''}`,
                    actionUrl: leadUrl,
                    actionText: 'Open Lead'
                }
            });
        } else {
            await sendMail({
                to,
                bcc,
                template: 'followUpReminder',
                templateData: {
                    leadName: lead.name,
                    followUpDate: followUpDate ? followUpDate.toISOString().split('T')[0] : '',
                    notes: lead.remarks || lead.notes || '',
                    leadUrl
                }
            });
        }

        await FollowUpReminder.updateOne(
            { _id: reminder._id },
            { $set: { status: 'sent', sent_at: now, cleanup_at: computeCleanupAt(reminder.due_at) } }
        );
        return true;
    } catch (e) {
        await FollowUpReminder.updateOne(
            { _id: reminder._id },
            { $set: { status: 'error', error_message: String(e?.message || e), cleanup_at: computeCleanupAt(reminder.due_at) } }
        );
        return true;
    }
}

async function tick({ maxPerTick = 25 } = {}) {
    const now = new Date();
    await markMissedFollowups(now);
    for (let i = 0; i < maxPerTick; i += 1) {
        const processed = await processOneDueReminder(now);
        if (!processed) break;
    }
}

function startFollowUpReminderWorker(options = {}) {
    const pollIntervalMs = Number(options.pollIntervalMs ?? 60_000);
    const maxPerTick = Number(options.maxPerTick ?? 25);

    let timer = null;

    const start = () => {
        if (timer) return;
        const run = async () => {
            try {
                await tick({ maxPerTick });
            } catch {
            }
        };
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
    startFollowUpReminderWorker,
    tick
};
