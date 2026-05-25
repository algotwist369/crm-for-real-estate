const mongoose = require('mongoose');
const { getTaskConnection } = require('../config/moduleDb');

const taskItemSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskWorkspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    color: { type: String, enum: ['default', 'slate', 'blue', 'emerald', 'amber', 'rose', 'violet'], default: 'default' },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo', index: true },
    position: { type: Number, default: 0, index: true },
    deadline: { type: Date, index: true },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    labels: [{ type: String, trim: true }],
    subtasks: [{
        title: { type: String, trim: true },
        done: { type: Boolean, default: false },
        doneAt: { type: Date }
    }],
    attachments: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'document', 'file'], default: 'file' },
        name: { type: String, trim: true, default: 'attachment' },
        mimeType: { type: String, trim: true, default: '' },
        size: { type: Number, default: 0 }
    }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, trim: true, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    activity: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, trim: true },
        metadata: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now }
    }],
    reminderDueAt: { type: Date, index: true },
    reminderSentAt: { type: Date },
    completionNotificationSentAt: { type: Date },
    isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

taskItemSchema.index({ tenantId: 1, workspaceId: 1, status: 1, position: 1 });
taskItemSchema.index({ tenantId: 1, assignedTo: 1, deadline: 1 });
taskItemSchema.index({ title: 'text', description: 'text', labels: 'text' });

module.exports = getTaskConnection().model('TaskItem', taskItemSchema);
