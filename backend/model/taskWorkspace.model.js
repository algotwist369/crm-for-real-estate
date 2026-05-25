const mongoose = require('mongoose');
const { getTaskConnection } = require('../config/moduleDb');

const taskWorkspaceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

taskWorkspaceSchema.index({ tenantId: 1, isArchived: 1, updatedAt: -1 });
taskWorkspaceSchema.index({ tenantId: 1, name: 1 });

module.exports = getTaskConnection().model('TaskWorkspace', taskWorkspaceSchema);
