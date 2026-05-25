const TaskWorkspace = require('../model/taskWorkspace.model');
const TaskItem = require('../model/taskItem.model');
const User = require('../model/user.model');
const { wrapAsync } = require('../middleware/errorHandler');
const { httpError } = require('../utils/common');
const { getTaskEmailQueue } = require('../services/queue.service');
const logger = require('../utils/logger');
const {
    getTenantId,
    assertUsersInTenant,
    canManageTenant,
    asObjectId
} = require('../services/collaborationAccess.service');
const {
    STATUSES,
    TASK_COLORS,
    computeReminderDueAt,
    assertWorkspaceAccess,
    assertTaskAccess,
    buildTaskPayload,
    addTaskAttachment,
    emitWorkspaceUpdate
} = require('../services/task.service');

const taskEmailJobId = (type, taskId) => `${type}-${String(taskId).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
const isTaskAssignedToUser = (task, userId) => (task.assignedTo || []).some(id => String(id) === String(userId));
const assertTaskEditor = (auth, task) => {
    const isAdmin = canManageTenant(auth);
    const isAssigned = isTaskAssignedToUser(task, auth.user._id);
    if (!isAdmin && !isAssigned) throw httpError(403, 'Only admins and assigned agents can update this task');
    return { isAdmin, isAssigned };
};

const get_workspaces = wrapAsync(async (req, res) => {
    const match = { tenantId: getTenantId(req.auth), isArchived: false };
    if (!canManageTenant(req.auth)) {
        const assignedWorkspaceIds = await TaskItem.distinct('workspaceId', {
            tenantId: getTenantId(req.auth),
            assignedTo: req.auth.user._id,
            isArchived: false
        });
        match.$or = [
            { members: req.auth.user._id },
            { _id: { $in: assignedWorkspaceIds } }
        ];
    }

    const workspaces = await TaskWorkspace.find(match).sort({ updatedAt: -1 }).lean();
    res.status(200).json({ success: true, data: workspaces });
});

const create_workspace = wrapAsync(async (req, res) => {
    if (!canManageTenant(req.auth)) throw httpError(403, 'Only admins can create workspaces');
    const name = String(req.body?.name || '').trim();
    if (!name) throw httpError(400, 'Workspace name is required');

    const memberIds = Array.isArray(req.body?.members) ? req.body.members.map(String) : [];
    const uniqueMembers = [...new Set([String(req.auth.user._id), ...memberIds])];
    await assertUsersInTenant(req.auth, uniqueMembers);

    const workspace = await TaskWorkspace.create({
        tenantId: getTenantId(req.auth),
        name,
        description: String(req.body?.description || '').trim(),
        members: uniqueMembers,
        createdBy: req.auth.user._id
    });
    res.status(201).json({ success: true, message: 'Workspace created', data: workspace });
});

const update_workspace = wrapAsync(async (req, res) => {
    if (!canManageTenant(req.auth)) throw httpError(403, 'Only admins can update workspaces');
    const workspace = await assertWorkspaceAccess(req.auth, req.params.id);
    if (req.body?.name !== undefined) workspace.name = String(req.body.name || '').trim();
    if (req.body?.description !== undefined) workspace.description = String(req.body.description || '').trim();
    if (Array.isArray(req.body?.members)) {
        const members = [...new Set([String(workspace.createdBy), ...req.body.members.map(String)])];
        await assertUsersInTenant(req.auth, members);
        workspace.members = members;
    }
    await workspace.save();
    emitWorkspaceUpdate(workspace._id, 'task:workspace:update', workspace);
    res.status(200).json({ success: true, message: 'Workspace updated', data: workspace });
});

const get_board = wrapAsync(async (req, res) => {
    const workspace = await assertWorkspaceAccess(req.auth, req.params.workspaceId);
    const search = String(req.query?.search || '').trim();
    const status = String(req.query?.status || '').trim();
    const priority = String(req.query?.priority || '').trim();
    const assignedTo = String(req.query?.assignedTo || '').trim();

    const match = { tenantId: getTenantId(req.auth), workspaceId: workspace._id, isArchived: false };
    if (!canManageTenant(req.auth)) match.assignedTo = req.auth.user._id;
    if (STATUSES.includes(status)) match.status = status;
    if (['low', 'medium', 'high', 'urgent'].includes(priority)) match.priority = priority;
    if (assignedTo && canManageTenant(req.auth)) match.assignedTo = asObjectId(assignedTo, 'assignedTo');
    if (search) match.$text = { $search: search };

    const tasks = await TaskItem.find(match).sort({ status: 1, position: 1, updatedAt: -1 }).lean();
    const columns = STATUSES.reduce((acc, key) => ({ ...acc, [key]: [] }), {});
    tasks.forEach(task => columns[task.status || 'todo'].push(task));

    res.status(200).json({ success: true, data: { workspace, columns, tasks } });
});

const create_task = wrapAsync(async (req, res) => {
    const workspace = await assertWorkspaceAccess(req.auth, req.params.workspaceId);
    if (!canManageTenant(req.auth)) throw httpError(403, 'Only admins can create tasks');

    const payload = await buildTaskPayload(req.body, req.auth, workspace);
    const task = await TaskItem.create(payload);
    const assignedMembers = (task.assignedTo || []).map(String);
    const missingMembers = assignedMembers.filter(id => !(workspace.members || []).some(memberId => String(memberId) === id));
    if (missingMembers.length) {
        workspace.members = [...(workspace.members || []), ...missingMembers];
        await workspace.save();
        emitWorkspaceUpdate(workspace._id, 'task:workspace:update', workspace);
    }
    emitWorkspaceUpdate(workspace._id, 'task:new', task);
    res.status(201).json({ success: true, message: 'Task created', data: task });
});

const update_task = wrapAsync(async (req, res) => {
    const task = await assertTaskAccess(req.auth, req.params.id);
    const { isAdmin, isAssigned } = assertTaskEditor(req.auth, task);

    const updates = req.body || {};
    if (updates.title !== undefined && (isAdmin || isAssigned)) task.title = String(updates.title || '').trim();
    if (updates.description !== undefined && (isAdmin || isAssigned)) task.description = String(updates.description || '').trim();
    if (updates.priority !== undefined && (isAdmin || isAssigned) && ['low', 'medium', 'high', 'urgent'].includes(updates.priority)) task.priority = updates.priority;
    if (updates.color !== undefined && (isAdmin || isAssigned) && TASK_COLORS.includes(String(updates.color))) task.color = updates.color;
    if (updates.deadline !== undefined && (isAdmin || isAssigned)) {
        const deadline = updates.deadline ? new Date(updates.deadline) : undefined;
        if (deadline && Number.isNaN(deadline.getTime())) throw httpError(400, 'Invalid deadline');
        task.deadline = deadline;
        task.reminderDueAt = computeReminderDueAt(deadline);
        task.reminderSentAt = undefined;
    }
    if (Array.isArray(updates.assignedTo) && (isAdmin || isAssigned)) {
        await assertUsersInTenant(req.auth, updates.assignedTo);
        task.assignedTo = updates.assignedTo;
        const workspace = await TaskWorkspace.findById(task.workspaceId);
        if (workspace) {
            const missingMembers = updates.assignedTo.map(String).filter(id => !(workspace.members || []).some(memberId => String(memberId) === id));
            if (missingMembers.length) {
                workspace.members = [...(workspace.members || []), ...missingMembers];
                await workspace.save();
                emitWorkspaceUpdate(workspace._id, 'task:workspace:update', workspace);
            }
        }
    }
    if (Array.isArray(updates.labels) && (isAdmin || isAssigned)) task.labels = updates.labels.map(label => String(label).trim()).filter(Boolean);
    if (Array.isArray(updates.subtasks)) task.subtasks = updates.subtasks.map(item => ({
        title: String(item.title || '').trim(),
        done: Boolean(item.done),
        doneAt: item.done ? (item.doneAt || new Date()) : undefined
    })).filter(item => item.title);

    task.activity.push({ userId: req.auth.user._id, action: 'updated_task', createdAt: new Date() });
    await task.save();
    emitWorkspaceUpdate(task.workspaceId, 'task:update', task);
    res.status(200).json({ success: true, message: 'Task updated', data: task });
});

const move_task = wrapAsync(async (req, res) => {
    const task = await assertTaskAccess(req.auth, req.params.id);
    assertTaskEditor(req.auth, task);

    const nextStatus = String(req.body?.status || '').trim();
    if (!STATUSES.includes(nextStatus)) throw httpError(400, 'Invalid task status');

    const previousStatus = task.status;
    task.status = nextStatus;
    task.position = Number.isFinite(Number(req.body?.position)) ? Number(req.body.position) : task.position;
    task.activity.push({ userId: req.auth.user._id, action: 'moved_task', metadata: { from: previousStatus, to: nextStatus }, createdAt: new Date() });

    if (nextStatus === 'completed' && previousStatus !== 'completed') {
        task.completedAt = new Date();
        task.completedBy = req.auth.user._id;
    }

    await task.save();

    if (nextStatus === 'completed' && previousStatus !== 'completed') {
        getTaskEmailQueue()
            .add('task-completed', { taskId: String(task._id) }, { jobId: taskEmailJobId('task-completed', task._id) })
            .catch(error => logger.error(`[TaskEmailQueue] Failed to queue completion email for task ${task._id}: ${error.message}`));
    }

    emitWorkspaceUpdate(task.workspaceId, 'task:update', task);
    res.status(200).json({ success: true, message: 'Task moved', data: task });
});

const add_comment = wrapAsync(async (req, res) => {
    const task = await assertTaskAccess(req.auth, req.params.id);
    assertTaskEditor(req.auth, task);
    const text = String(req.body?.text || '').trim();
    if (!text) throw httpError(400, 'Comment is required');
    task.comments.push({ userId: req.auth.user._id, text, createdAt: new Date() });
    task.activity.push({ userId: req.auth.user._id, action: 'commented', createdAt: new Date() });
    await task.save();
    emitWorkspaceUpdate(task.workspaceId, 'task:update', task);
    res.status(201).json({ success: true, message: 'Comment added', data: task });
});

const upload_attachment = wrapAsync(async (req, res) => {
    const task = await assertTaskAccess(req.auth, req.params.id);
    assertTaskEditor(req.auth, task);
    if (!req.file) throw httpError(400, 'Attachment is required');
    const updated = await addTaskAttachment(req.auth, task, req.file);
    res.status(200).json({ success: true, message: 'Attachment uploaded', data: updated });
});

const get_analytics = wrapAsync(async (req, res) => {
    const tenantId = getTenantId(req.auth);
    const match = { tenantId, isArchived: false };
    if (!canManageTenant(req.auth)) match.assignedTo = req.auth.user._id;

    const now = new Date();
    const [statusGroups, priorityGroups, overdue, workloadUsers] = await Promise.all([
        TaskItem.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        TaskItem.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
        TaskItem.countDocuments({ ...match, status: { $ne: 'completed' }, deadline: { $lt: now } }),
        User.find({ $or: [{ _id: tenantId }, { tenant_id: tenantId }], is_active: true, is_deleted: false }).select('user_name role profile_pic').lean()
    ]);

    const workloadIds = workloadUsers.map(user => user._id);
    const workloadCounts = await TaskItem.aggregate([
        { $match: { tenantId, isArchived: false, status: { $ne: 'completed' }, assignedTo: { $in: workloadIds } } },
        { $unwind: '$assignedTo' },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);
    const workloadMap = new Map(workloadCounts.map(item => [String(item._id), item.count]));

    res.status(200).json({
        success: true,
        data: {
            byStatus: statusGroups,
            byPriority: priorityGroups,
            overdue,
            workload: workloadUsers.map(user => ({ ...user, openTasks: workloadMap.get(String(user._id)) || 0 }))
        }
    });
});

module.exports = {
    get_workspaces,
    create_workspace,
    update_workspace,
    get_board,
    create_task,
    update_task,
    move_task,
    add_comment,
    upload_attachment,
    get_analytics
};
