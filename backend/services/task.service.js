const TaskWorkspace = require('../model/taskWorkspace.model');
const TaskItem = require('../model/taskItem.model');
const User = require('../model/user.model');
const { uploadAttachment } = require('./chat.service');
const { getTenantId, assertUsersInTenant, canManageTenant, asObjectId } = require('./collaborationAccess.service');
const { httpError } = require('../utils/common');
const socketService = require('./socket.service');

const STATUSES = ['todo', 'in_progress', 'review', 'completed'];
const TASK_COLORS = ['default', 'slate', 'blue', 'emerald', 'amber', 'rose', 'violet'];

function taskRoom(workspaceId) {
    return `task-workspace:${workspaceId}`;
}

function computeReminderDueAt(deadline) {
    if (!deadline) return undefined;
    const date = deadline instanceof Date ? deadline : new Date(deadline);
    if (Number.isNaN(date.getTime())) return undefined;
    return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}

async function assertWorkspaceAccess(auth, workspaceId) {
    const tenantId = getTenantId(auth);
    const workspace = await TaskWorkspace.findOne({
        _id: asObjectId(workspaceId, 'workspaceId'),
        tenantId,
        isArchived: false
    });
    if (!workspace) throw httpError(404, 'Workspace not found');

    const isMember = (workspace.members || []).some(id => String(id) === String(auth.user._id));
    if (!canManageTenant(auth) && !isMember) {
        const assignedTask = await TaskItem.exists({
            tenantId,
            workspaceId: workspace._id,
            assignedTo: auth.user._id,
            isArchived: false
        });
        if (!assignedTask) throw httpError(403, 'Forbidden');
    }
    return workspace;
}

async function assertTaskAccess(auth, taskId) {
    const task = await TaskItem.findOne({
        _id: asObjectId(taskId, 'taskId'),
        tenantId: getTenantId(auth),
        isArchived: false
    });
    if (!task) throw httpError(404, 'Task not found');
    if (!canManageTenant(auth)) {
        const isAssigned = (task.assignedTo || []).some(id => String(id) === String(auth.user._id));
        if (!isAssigned) await assertWorkspaceAccess(auth, task.workspaceId);
    } else {
        await assertWorkspaceAccess(auth, task.workspaceId);
    }
    return task;
}

function emitWorkspaceUpdate(workspaceId, event, data) {
    socketService.emitToRoom(taskRoom(workspaceId), event, data);
}

async function buildTaskPayload(body = {}, auth, workspace) {
    const title = String(body.title || '').trim();
    if (!title) throw httpError(400, 'Task title is required');

    const assignedTo = Array.isArray(body.assignedTo) ? body.assignedTo.map(String) : [];
    if (assignedTo.length) await assertUsersInTenant(auth, assignedTo);

    const deadline = body.deadline ? new Date(body.deadline) : undefined;
    if (deadline && Number.isNaN(deadline.getTime())) throw httpError(400, 'Invalid deadline');

    const status = STATUSES.includes(String(body.status || '')) ? body.status : 'todo';
    const count = await TaskItem.countDocuments({ workspaceId: workspace._id, status, isArchived: false });

    return {
        tenantId: getTenantId(auth),
        workspaceId: workspace._id,
        title,
        description: String(body.description || '').trim(),
        priority: ['low', 'medium', 'high', 'urgent'].includes(String(body.priority || '')) ? body.priority : 'medium',
        color: TASK_COLORS.includes(String(body.color || '')) ? body.color : 'default',
        status,
        position: Number.isFinite(Number(body.position)) ? Number(body.position) : count + 1,
        deadline,
        reminderDueAt: computeReminderDueAt(deadline),
        assignedTo,
        labels: Array.isArray(body.labels) ? body.labels.map(label => String(label).trim()).filter(Boolean) : [],
        subtasks: Array.isArray(body.subtasks)
            ? body.subtasks.map(item => ({ title: String(item.title || '').trim(), done: Boolean(item.done) })).filter(item => item.title)
            : [],
        createdBy: auth.user._id,
        activity: [{ userId: auth.user._id, action: 'created_task', createdAt: new Date() }]
    };
}

async function addTaskAttachment(auth, task, file) {
    const attachment = await uploadAttachment(file, 'task_attachments', ['task', String(task._id), String(auth.user._id)]);
    if (!attachment) return task;

    task.attachments.push(attachment);
    task.activity.push({ userId: auth.user._id, action: 'added_attachment', metadata: { name: attachment.name }, createdAt: new Date() });
    await task.save();
    emitWorkspaceUpdate(task.workspaceId, 'task:update', task);
    return task;
}

async function getManagerForTask(task) {
    const creator = await User.findById(task.createdBy).select('email user_name').lean();
    if (creator?.email) return creator;
    return User.findOne({ _id: task.tenantId }).select('email user_name').lean();
}

module.exports = {
    STATUSES,
    TASK_COLORS,
    taskRoom,
    computeReminderDueAt,
    assertWorkspaceAccess,
    assertTaskAccess,
    emitWorkspaceUpdate,
    buildTaskPayload,
    addTaskAttachment,
    getManagerForTask
};
