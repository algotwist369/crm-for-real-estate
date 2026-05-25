const mongoose = require('mongoose');
const { getTaskConnection } = require('../config/moduleDb');

const taskNotificationLogSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskItem', required: true, index: true },
    type: { type: String, enum: ['deadline_reminder', 'completion_notice'], required: true, index: true },
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientEmail: { type: String, trim: true },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
    attempts: { type: Number, default: 0 },
    error: { type: String, trim: true, default: '' },
    sentAt: { type: Date }
}, { timestamps: true });

taskNotificationLogSchema.index(
    { taskId: 1, type: 1, recipientUserId: 1 },
    { unique: true, partialFilterExpression: { recipientUserId: { $exists: true } } }
);

module.exports = getTaskConnection().model('TaskNotificationLog', taskNotificationLogSchema);
