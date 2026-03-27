const mongoose = require('mongoose');
const Lead = require('../model/lead.model');
const User = require('../model/user.model');
const Properties = require('../model/properties.model');
const Agent = require('../model/agent.model');
const FollowUpReminder = require('../model/followUpReminder.model');
const { sendMail } = require('../utils/sendMail');
const { wrapAsync } = require('../middleware/errorHandler');
const {
    normalizePhone,
    normalizeEmail,
    httpError,
    isEmail
} = require('../utils/common');

function parsePagination(req) {
    const pageRaw = Number(req.query?.page ?? 1);
    const limitRaw = Number(req.query?.limit ?? 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDateOrUndefined(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
}

function toNumberOrUndefined(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function normalizeStringArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
        } catch {
            return s.split(',').map(v => v.trim()).filter(Boolean);
        }
    }
    return [];
}

function normalizeObjectIdArray(value) {
    const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    const ids = items.map(v => String(v).trim()).filter(Boolean);
    return ids.filter(id => mongoose.Types.ObjectId.isValid(id));
}

function uniqueObjectIds(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v)));
    return Array.from(set);
}

function computeCleanupAt(dueAt) {
    const d = dueAt instanceof Date ? dueAt : new Date(dueAt);
    return new Date(d.getTime() + 1000 * 60 * 60 * 24 * 30);
}

function uniqueStrings(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean));
    return Array.from(set);
}

async function getAgentAssignedPropertyIds(agentId) {
    const props = await Properties.find({ assign_agent: agentId }).select('_id').lean();
    return props.map(p => p._id);
}

async function getAgentIdFromUserId(userId) {
    const agent = await Agent.findOne({ agent_details: userId, is_active: true }).select('_id').lean();
    return agent ? agent._id : null;
}

async function ensureLeadAccess({ lead, payload, user }) {
    if (!lead) throw httpError(404, 'Lead not found');
    if (['admin', 'super_admin'].includes(payload.role)) return;

    // Check if directly assigned or creator
    const isAssignedDirectly = Array.isArray(lead.assigned_to) && lead.assigned_to.some(id => String(id) === String(user._id));
    if (isAssignedDirectly) return;

    if (lead.created_by && String(lead.created_by) === String(user._id)) return;

    // Check if assigned via properties
    const agentId = await getAgentIdFromUserId(user._id);
    if (agentId && Array.isArray(lead.properties) && lead.properties.length > 0) {
        const propertyIds = lead.properties.map(p => String(p._id || p));
        const assignedProperties = await Properties.find({
            _id: { $in: propertyIds },
            assign_agent: agentId
        }).select('_id').limit(1).lean();
        
        if (assignedProperties.length > 0) return;
    }

    throw httpError(403, 'Forbidden');
}

function buildLeadDocFromBody(body = {}) {
    const name = body.name !== undefined ? String(body.name || '').trim() : undefined;
    const emailRaw = body.email !== undefined ? String(body.email || '').trim() : undefined;
    const phoneRaw = body.phone !== undefined ? String(body.phone || '').trim() : undefined;
    const requirement = body.requirement !== undefined ? String(body.requirement || '').trim() : undefined;
    const budget = body.budget !== undefined ? String(body.budget || '').trim() : undefined;
    const currency = body.currency !== undefined ? String(body.currency || '').trim() : undefined;
    const inquiry_for = body.inquiry_for !== undefined ? String(body.inquiry_for || '').trim() : undefined;
    const source = body.source !== undefined ? String(body.source || '').trim().toLowerCase() : undefined;
    const priority = body.priority !== undefined ? String(body.priority || '').trim().toLowerCase() : undefined;
    const status = body.status !== undefined ? String(body.status || '').trim().toLowerCase() : undefined;
    const client_type = body.client_type !== undefined ? String(body.client_type || '').trim().toLowerCase() : undefined;

    const budget_min = toNumberOrUndefined(body.budget_min);
    const budget_max = toNumberOrUndefined(body.budget_max);

    const next_follow_up_date = toDateOrUndefined(body.next_follow_up_date ?? body.followUpDate);
    const follow_up_status = body.follow_up_status !== undefined ? String(body.follow_up_status || '').trim().toLowerCase() : undefined;
    const followed_by = body.followed_by && mongoose.Types.ObjectId.isValid(body.followed_by) ? body.followed_by : undefined;

    const lost_reason = body.lost_reason !== undefined ? String(body.lost_reason || '').trim() : undefined;
    const remarks = body.remarks !== undefined ? String(body.remarks || '').trim() : undefined;
    const notes = body.notes !== undefined ? String(body.notes || '').trim() : undefined;
    const tags = body.tags !== undefined ? normalizeStringArray(body.tags) : undefined;

    const properties = body.properties !== undefined ? normalizeObjectIdArray(body.properties) : undefined;
    const assigned_to = body.assigned_to !== undefined ? normalizeObjectIdArray(body.assigned_to) : undefined;

    const doc = {
        name,
        email: emailRaw ? (isEmail(emailRaw) ? normalizeEmail(emailRaw) : emailRaw) : emailRaw,
        phone: phoneRaw ? normalizePhone(phoneRaw) : phoneRaw,
        requirement,
        budget,
        currency,
        budget_min,
        budget_max,
        inquiry_for,
        client_type,
        source,
        priority,
        status,
        properties,
        assigned_to,
        next_follow_up_date,
        follow_up_status,
        followed_by,
        lost_reason,
        remarks,
        notes,
        tags
    };

    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    return doc;
}

async function getFollowUpRecipientsForLead(lead, actionUserId) {
    const leadPropertyIds = Array.isArray(lead.properties) ? lead.properties.map(p => String(p)) : [];
    const propertyIds = leadPropertyIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    let agentIds = [];
    if (propertyIds.length) {
        const props = await Properties.find({ _id: { $in: propertyIds } }).select('assign_agent').lean();
        agentIds = props
            .flatMap(p => Array.isArray(p.assign_agent) ? p.assign_agent : [])
            .map(a => String(a))
            .filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    let propertyAgentUserIds = [];
    if (agentIds.length) {
        const agents = await Agent.find({ _id: { $in: uniqueObjectIds(agentIds) }, is_active: true })
            .select('agent_details')
            .lean();
        propertyAgentUserIds = agents
            .map(a => a.agent_details ? String(a.agent_details) : '')
            .filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    const adminUsers = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        is_active: true,
        is_deleted: false
    }).select('_id').lean();
    const adminIds = adminUsers.map(u => String(u._id));

    const assignedToIds = Array.isArray(lead.assigned_to) ? lead.assigned_to.map(x => String(x)) : [];

    const base = uniqueObjectIds([
        ...adminIds,
        ...propertyAgentUserIds,
        ...assignedToIds,
        lead.created_by ? String(lead.created_by) : '',
        lead.followed_by ? String(lead.followed_by) : '',
        actionUserId ? String(actionUserId) : ''
    ]).filter(id => mongoose.Types.ObjectId.isValid(id));

    return base;
}

async function cancelPendingReminders(leadId) {
    await FollowUpReminder.updateMany(
        { lead: leadId, status: { $in: ['pending', 'processing', 'error'] } },
        { $set: { status: 'cancelled', cleanup_at: computeCleanupAt(new Date()) } }
    );
}

async function scheduleFollowUpReminders({ lead, actionUserId }) {
    if (!lead?.next_follow_up_date) return;

    const followUpDate = new Date(lead.next_follow_up_date);
    if (Number.isNaN(followUpDate.getTime())) return;

    if (String(lead.follow_up_status || '').toLowerCase() === 'done') return;

    const now = new Date();
    if (followUpDate.getTime() <= now.getTime()) return;

    const recipients = await getFollowUpRecipientsForLead(lead, actionUserId);
    if (!recipients.length) return;

    await cancelPendingReminders(lead._id);

    const oneHourBefore = new Date(followUpDate.getTime() - 1000 * 60 * 60);
    const fiveMinBefore = new Date(followUpDate.getTime() - 1000 * 60 * 5);
    const overdueNotifyMinutes = Number(process.env.FOLLOWUP_OVERDUE_NOTIFY_MINUTES || 10);
    const overdueAt = new Date(followUpDate.getTime() + Math.max(1, overdueNotifyMinutes) * 60 * 1000);

    const reminders = [
        { type: 'before_1h', due_at: oneHourBefore },
        { type: 'before_5m', due_at: fiveMinBefore },
        { type: 'overdue_grace', due_at: overdueAt }
    ].filter(r => r.due_at.getTime() > now.getTime());

    for (const r of reminders) {
        await FollowUpReminder.updateOne(
            { lead: lead._id, type: r.type },
            {
                $set: {
                    due_at: r.due_at,
                    recipients,
                    status: 'pending',
                    error_message: '',
                    cleanup_at: computeCleanupAt(r.due_at)
                }
            },
            { upsert: true }
        );
    }
}

async function notifyAdminsAndAssignedAgentsNewLead({ lead, createdByUser }) {
    const adminUsers = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        is_active: true,
        is_deleted: false,
        email: { $exists: true, $ne: '' }
    }).select('email').lean();
    const adminEmails = adminUsers.map(u => u.email);

    const assignedIds = Array.isArray(lead.assigned_to) ? lead.assigned_to.map(x => String(x)) : [];
    const assignedUsers = assignedIds.length
        ? await User.find({
            _id: { $in: assignedIds },
            is_active: true,
            is_deleted: false,
            email: { $exists: true, $ne: '' }
        }).select('email').lean()
        : [];
    const assignedEmails = assignedUsers.map(u => u.email);

    const all = uniqueStrings(adminEmails.concat(assignedEmails));
    if (!all.length) return;

    const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
    const leadUrl = appUrl ? `${appUrl}/leads/${lead._id}` : '';

    const to = all[0];
    const bcc = all.length > 1 ? all.slice(1) : undefined;

    await sendMail({
        to,
        bcc,
        template: 'leadAssigned',
        templateData: {
            leadName: lead.name,
            leadPhone: lead.phone,
            leadEmail: lead.email,
            requirement: lead.requirement,
            budget: lead.budget,
            source: lead.source,
            assignedBy: createdByUser?.user_name || '',
            leadUrl
        }
    });
}

const get_my_leads = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const { page, limit, skip } = parsePagination(req);

    const match = { is_active: true, tenant_id };

    const status = String(req.query?.status ?? '').trim().toLowerCase();
    const priority = String(req.query?.priority ?? '').trim().toLowerCase();
    const search = String(req.query?.search ?? '').trim();
    const followUpDue = String(req.query?.follow_up_due ?? req.query?.followUpDue ?? '').trim().toLowerCase();

    if (status) match.status = status;
    if (priority) match.priority = priority;

    if (payload.role === 'agent') {
        const agentId = await getAgentIdFromUserId(user._id);
        const assignedPropIds = agentId ? await getAgentAssignedPropertyIds(agentId) : [];
        
        match.$or = [
            { assigned_to: user._id },
            { created_by: user._id },
            { properties: { $in: assignedPropIds } }
        ];
    } else if (req.query?.assigned_to) {
        const ids = normalizeObjectIdArray(req.query.assigned_to);
        if (ids.length === 1) match.assigned_to = ids[0];
        if (ids.length > 1) match.assigned_to = { $in: ids };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (followUpDue === 'today') {
        match.next_follow_up_date = { $gte: startOfToday, $lt: startOfTomorrow };
        match.follow_up_status = { $in: ['pending', 'rescheduled'] };
    } else if (followUpDue === 'overdue') {
        match.next_follow_up_date = { $lt: startOfToday };
        match.follow_up_status = { $in: ['pending', 'rescheduled'] };
    } else if (followUpDue === 'upcoming') {
        match.next_follow_up_date = { $gte: startOfTomorrow };
        match.follow_up_status = { $in: ['pending', 'rescheduled'] };
    } else if (followUpDue === 'true' || followUpDue === '1') {
        match.next_follow_up_date = { $lte: now };
        match.follow_up_status = { $in: ['pending', 'rescheduled'] };
    }

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        match.$or = [
            { name: regex },
            { email: regex },
            { phone: regex },
            { requirement: regex },
            { budget: regex },
            { notes: regex }
        ];
    }

    const [items, total] = await Promise.all([
        Lead.find(match)
            .populate('assigned_to', 'user_name email phone_number profile_pic role is_active')
            .populate('followed_by', 'user_name email phone_number profile_pic role is_active')
            .populate('created_by', 'user_name email phone_number profile_pic role')
            .populate('updated_by', 'user_name email phone_number profile_pic role')
            .populate('properties')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Lead.countDocuments(match)
    ]);

    res.status(200).json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

const get_lead_by_id = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id })
        .populate('assigned_to', 'user_name email phone_number profile_pic role is_active')
        .populate('followed_by', 'user_name email phone_number profile_pic role is_active')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties');

    await ensureLeadAccess({ lead, payload, user });
    res.status(200).json({ success: true, data: lead });
});

const create_lead = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const doc = buildLeadDocFromBody(req.body);
    const details = [];

    if (!doc.name) details.push({ path: 'name', message: 'Name is required' });
    if (!doc.phone) details.push({ path: 'phone', message: 'Phone is required' });
    if (!doc.requirement) details.push({ path: 'requirement', message: 'Requirement is required' });
    if (!doc.budget) details.push({ path: 'budget', message: 'Budget is required' });
    if (!doc.inquiry_for) details.push({ path: 'inquiry_for', message: 'Inquiry for is required' });
    if (!doc.email || !isEmail(doc.email)) details.push({ path: 'email', message: 'Valid email is required' });
    if (details.length) throw httpError(400, 'Validation error', details);

    doc.email = normalizeEmail(doc.email);
    doc.phone = normalizePhone(doc.phone);
    doc.currency = doc.currency || '₹';

    if (payload.role === 'agent') {
        // Find all agents assigned to the linked properties
        const props = await Properties.find({ _id: { $in: doc.properties || [] } }).select('assign_agent').lean();
        const propertyAgentIds = props.flatMap(p => p.assign_agent || []).map(id => String(id));
        
        // Find property agent user IDs
        const propAgents = await Agent.find({ _id: { $in: uniqueObjectIds(propertyAgentIds) }, is_active: true }).select('agent_details').lean();
        const propAgentUserIds = propAgents.map(a => String(a.agent_details)).filter(Boolean);

        doc.assigned_to = uniqueObjectIds([String(user._id), ...propAgentUserIds]).map(id => new mongoose.Types.ObjectId(id));
        doc.followed_by = user._id;
    } else if (!Array.isArray(doc.assigned_to) || !doc.assigned_to.length) {
        doc.assigned_to = [];
    }

    doc.created_by = user._id;
    doc.updated_by = user._id;
    doc.tenant_id = tenant_id;
    if (doc.follow_up_status === undefined) doc.follow_up_status = 'pending';
    if (doc.status === undefined) doc.status = 'new';
    if (doc.priority === undefined) doc.priority = 'low';
    if (doc.is_active === undefined) doc.is_active = true;

    const created = await Lead.create(doc);
    const populated = await Lead.findById(created._id)
        .populate('assigned_to', 'user_name email phone_number profile_pic role is_active')
        .populate('followed_by', 'user_name email phone_number profile_pic role is_active')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties');

    res.status(201).json({ success: true, message: 'Lead created successfully', data: populated });

    if (payload.role === 'agent') {
        Promise.resolve()
            .then(() => notifyAdminsAndAssignedAgentsNewLead({ lead: created, createdByUser: user }))
            .catch(() => {});
    }
});

const update_lead = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    const updates = buildLeadDocFromBody(req.body);

    if (payload.role === 'agent') {
        delete updates.assigned_to;
        delete updates.followed_by;
        delete updates.status;
        delete updates.priority;
    }

    if (!Object.keys(updates).length) throw httpError(400, 'No valid fields to update');

    if (updates.email !== undefined) {
        if (!updates.email || !isEmail(updates.email)) throw httpError(400, 'Validation error', [{ path: 'email', message: 'Valid email is required' }]);
        updates.email = normalizeEmail(updates.email);
    }
    if (updates.phone !== undefined) {
        const normalized = normalizePhone(updates.phone);
        if (!normalized || normalized.length < 10 || normalized.length > 15) {
            throw httpError(400, 'Validation error', [{ path: 'phone', message: 'Valid phone is required (10-15 digits)' }]);
        }
        updates.phone = normalized;
    }

    Object.assign(lead, updates);
    lead.updated_by = user._id;
    await lead.save();

    const populated = await Lead.findById(lead._id)
        .populate('assigned_to', 'user_name email phone_number profile_pic role is_active')
        .populate('followed_by', 'user_name email phone_number profile_pic role is_active')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties');

    res.status(200).json({ success: true, message: 'Lead updated successfully', data: populated });
});

const add_lead_note = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const note = String(req.body?.note ?? req.body?.notes ?? '').trim();
    if (!note) throw httpError(400, 'note is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    const now = new Date();
    const stamp = `${now.toISOString()}`;
    const prefix = lead.notes ? `${lead.notes}\n` : '';
    lead.notes = `${prefix}[${stamp}] ${note}`.trim();
    lead.updated_by = user._id;
    await lead.save();

    res.status(200).json({ success: true, message: 'Note added successfully', data: lead });
});

const set_follow_up = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    const followUpDate = toDateOrUndefined(req.body?.next_follow_up_date ?? req.body?.followUpDate);
    const status = String(req.body?.follow_up_status ?? req.body?.followUpStatus ?? '').trim().toLowerCase();
    const remarks = req.body?.remarks ?? req.body?.remark;

    const details = [];
    if (!followUpDate) details.push({ path: 'next_follow_up_date', message: 'Valid follow up date is required' });
    if (followUpDate && followUpDate.getTime() <= Date.now()) {
        details.push({ path: 'next_follow_up_date', message: 'Follow up date must be in the future' });
    }
    if (status && !['pending', 'done', 'missed', 'rescheduled'].includes(status)) {
        details.push({ path: 'follow_up_status', message: 'Invalid follow_up_status' });
    }
    if (details.length) throw httpError(400, 'Validation error', details);

    lead.next_follow_up_date = followUpDate;
    lead.follow_up_status = status || 'pending';
    lead.followed_by = user._id;
    if (remarks !== undefined) lead.remarks = String(remarks || '').trim();
    if (payload.role === 'agent') lead.status = 'follow_up';
    lead.updated_by = user._id;
    await lead.save();

    await scheduleFollowUpReminders({ lead, actionUserId: user._id });

    res.status(200).json({ success: true, message: 'Follow-up updated successfully', data: lead });
});

const mark_lead_converted = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    lead.status = 'converted';
    lead.converted_at = new Date();
    lead.follow_up_status = 'done';
    lead.updated_by = user._id;
    await lead.save();

    await cancelPendingReminders(lead._id);

    res.status(200).json({ success: true, message: 'Lead marked as converted', data: lead });
});

const mark_lead_lost = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    const reason = String(req.body?.lost_reason ?? req.body?.reason ?? '').trim();
    lead.status = 'lost';
    lead.lost_reason = reason || lead.lost_reason || '';
    lead.follow_up_status = 'done';
    lead.updated_by = user._id;
    await lead.save();

    await cancelPendingReminders(lead._id);

    res.status(200).json({ success: true, message: 'Lead marked as lost', data: lead });
});

const get_my_followups = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const { page, limit, skip } = parsePagination(req);

    const bucket = String(req.query?.bucket ?? req.query?.type ?? 'today').trim().toLowerCase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const match = {
        next_follow_up_date: { $exists: true, $ne: null },
        follow_up_status: { $in: ['pending', 'rescheduled'] },
        is_active: true,
        tenant_id
    };

    if (payload.role === 'agent') match.assigned_to = user._id;

    if (bucket === 'today') match.next_follow_up_date = { $gte: startOfToday, $lt: startOfTomorrow };
    else if (bucket === 'overdue') match.next_follow_up_date = { $lt: startOfToday };
    else if (bucket === 'upcoming') match.next_follow_up_date = { $gte: startOfTomorrow };

    const [items, total] = await Promise.all([
        Lead.find(match)
            .populate('assigned_to', 'user_name email phone_number profile_pic role is_active')
            .sort({ next_follow_up_date: 1 })
            .skip(skip)
            .limit(limit),
        Lead.countDocuments(match)
    ]);

    res.status(200).json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

const complete_followup = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const lead = await Lead.findOne({ _id: id, tenant_id });
    await ensureLeadAccess({ lead, payload, user });

    const remarks = req.body?.remarks ?? req.body?.remark;
    lead.follow_up_status = 'done';
    lead.last_contacted_at = new Date();
    lead.followed_by = user._id;
    if (remarks !== undefined) lead.remarks = String(remarks || '').trim();
    lead.updated_by = user._id;
    await lead.save();

    await cancelPendingReminders(lead._id);

    res.status(200).json({ success: true, message: 'Follow-up completed', data: lead });
});

const reschedule_followup = wrapAsync(async (req, res) => {
    req.body = {
        ...req.body,
        follow_up_status: 'rescheduled'
    };
    return set_follow_up(req, res);
});

const agent_dashboard_summary = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const base = { is_active: true, tenant_id };
    if (payload.role === 'agent') base.assigned_to = user._id;

    const [
        totalLeads,
        totalConverted,
        totalLost,
        followupsToday,
        followupsOverdue
    ] = await Promise.all([
        Lead.countDocuments(base),
        Lead.countDocuments({ ...base, status: 'converted' }),
        Lead.countDocuments({ ...base, status: 'lost' }),
        Lead.countDocuments({
            ...base,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $gte: startOfToday, $lt: startOfTomorrow }
        }),
        Lead.countDocuments({
            ...base,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $lt: startOfToday }
        })
    ]);

    res.status(200).json({
        success: true,
        data: {
            total_leads: totalLeads,
            total_converted_leads: totalConverted,
            total_lost_leads: totalLost,
            followups_today: followupsToday,
            followups_overdue: followupsOverdue
        }
    });
});

const agent_activity_timeline = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const limitRaw = Number(req.query?.limit ?? 20);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 20;

    const match = { is_active: true, tenant_id };
    if (payload.role === 'agent') match.assigned_to = user._id;

    const items = await Lead.find(match)
        .select('name status priority updatedAt createdAt next_follow_up_date follow_up_status')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

    res.status(200).json({ success: true, data: items });
});

module.exports = {
    get_my_leads,
    get_lead_by_id,
    create_lead,
    update_lead,
    add_lead_note,
    set_follow_up,
    mark_lead_converted,
    mark_lead_lost,
    get_my_followups,
    complete_followup,
    reschedule_followup,
    agent_dashboard_summary,
    agent_activity_timeline
};
