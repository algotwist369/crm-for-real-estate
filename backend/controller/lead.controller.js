const mongoose = require('mongoose');
const Lead = require('../model/lead.model');
const User = require('../model/user.model');
const Properties = require('../model/properties.model');
const Agent = require('../model/agent.model');
const FollowUpReminder = require('../model/followUpReminder.model');
const { parseBudget } = require('../utils/budgetParser');
const { convertCurrency } = require('../utils/currencyConverter');
const { sendMail } = require('../utils/sendMail');
const { notifyPropertyAgentsOnNewLead, getFollowUpRecipientsForLead, notifyFollowUpCreated, notifyLeadStatusChanged } = require('../services/notification.service');
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

function getStrId(val) {
    if (!val) return '';
    return String(val._id || val);
}

async function ensureLeadAccess({ lead, payload, user }) {
    if (!lead) throw httpError(404, 'Lead not found');
    if (payload.role === 'super_admin') return;

    // Admin can see all leads in their tenant
    const userTenantId = String(user.tenant_id || user._id);
    if (payload.role === 'admin' && getStrId(lead.tenant_id) === userTenantId) return;

    // Check if directly assigned or creator
    const userId = String(user._id);
    const isAssignedDirectly = Array.isArray(lead.assigned_to) && lead.assigned_to.some(id => getStrId(id) === userId);
    if (isAssignedDirectly) return;

    if (lead.created_by && getStrId(lead.created_by) === userId) return;
    if (lead.followed_by && getStrId(lead.followed_by) === userId) return;

    // Check if assigned via properties
    const agentId = await getAgentIdFromUserId(user._id);
    if (agentId && Array.isArray(lead.properties) && lead.properties.length > 0) {
        const propertyIds = lead.properties.map(p => getStrId(p));
        const assignedProperties = await Properties.find({
            _id: { $in: propertyIds },
            assign_agent: agentId
        }).select('_id').limit(1).lean();

        if (assignedProperties.length > 0) return;
    }

    throw httpError(403, 'Forbidden');
}

function getLeadMatch(req) {
    const { tenant_id, payload } = req.auth;
    const match = { _id: req.params.id };
    if (payload.role !== 'super_admin') match.tenant_id = tenant_id;
    return match;
}

function buildAreaObject(val) {
    if (!val || typeof val !== 'object') return undefined;
    const value = toNumberOrUndefined(val.value);
    const unit = val.unit !== undefined ? String(val.unit || '').trim() : undefined;
    if (value === undefined && unit === undefined) return undefined;
    const obj = {};
    if (value !== undefined) obj.value = value;
    if (unit) obj.unit = unit;
    return obj;
}

function buildUtmObject(val) {
    if (!val || typeof val !== 'object') return undefined;
    const fields = ['source', 'medium', 'campaign', 'term', 'content'];
    const obj = {};
    let hasAny = false;
    for (const f of fields) {
        if (val[f] !== undefined) { obj[f] = String(val[f] || '').trim(); hasAny = true; }
    }
    return hasAny ? obj : undefined;
}

function buildLeadDocFromBody(body = {}) {
    // ── Basic contact ────────────────────────────────────────────────
    const name = body.name !== undefined ? String(body.name || '').trim() : undefined;
    const emailRaw = body.email !== undefined ? String(body.email || '').trim() : undefined;
    const phoneRaw = body.phone !== undefined ? String(body.phone || '').trim() : undefined;
    const alternate_phone = body.alternate_phone !== undefined ? String(body.alternate_phone || '').trim() : undefined;
    const whatsapp_number = body.whatsapp_number !== undefined ? String(body.whatsapp_number || '').trim() : undefined;

    // ── Lead category ────────────────────────────────────────────────
    const lead_type = body.lead_type !== undefined ? String(body.lead_type || '').trim().toLowerCase() : undefined;
    const client_type = body.client_type !== undefined ? String(body.client_type || '').trim().toLowerCase() : undefined;
    const inquiry_for = body.inquiry_for !== undefined ? String(body.inquiry_for || '').trim() : undefined;
    const requirement = body.requirement !== undefined ? String(body.requirement || '').trim() : undefined;

    // ── Budget / Pricing ─────────────────────────────────────────────
    const budget = body.budget !== undefined ? String(body.budget || '').trim() : undefined;
    const currency = body.currency !== undefined ? String(body.currency || '').trim() : undefined;
    const budget_min = toNumberOrUndefined(body.budget_min);
    const budget_max = toNumberOrUndefined(body.budget_max);
    const asking_price = toNumberOrUndefined(body.asking_price);
    const price_label = body.price_label !== undefined ? String(body.price_label || '').trim() : undefined;
    const price_negotiable = body.price_negotiable !== undefined ? Boolean(body.price_negotiable) : undefined;

    // ── Property details ─────────────────────────────────────────────
    const property_type = body.property_type !== undefined ? String(body.property_type || '').trim().toLowerCase() : undefined;
    const unit_count = toNumberOrUndefined(body.unit_count);
    const bedrooms = body.bedrooms !== undefined ? String(body.bedrooms || '').trim() : undefined;
    const bathrooms = toNumberOrUndefined(body.bathrooms);
    const maid_room = body.maid_room !== undefined ? Boolean(body.maid_room) : undefined;
    const furnished_status = body.furnished_status !== undefined ? String(body.furnished_status || '').trim().toLowerCase() : undefined;

    // ── Area details ─────────────────────────────────────────────────
    const plot_size = buildAreaObject(body.plot_size);
    const built_up_area = buildAreaObject(body.built_up_area);

    // ── Broker / Owner ──────────────────────────────────────────────
    const owner_name = body.owner_name !== undefined ? String(body.owner_name || '').trim() : undefined;
    const broker_name = body.broker_name !== undefined ? String(body.broker_name || '').trim() : undefined;
    const broker_phone = body.broker_phone !== undefined ? String(body.broker_phone || '').trim() : undefined;
    const shared_details = body.shared_details !== undefined ? String(body.shared_details || '').trim() : undefined;
    const address = body.address !== undefined ? String(body.address || '').trim() : undefined;

    // ── Source / UTM ─────────────────────────────────────────────────
    const source = body.source !== undefined ? String(body.source || '').trim().toLowerCase() : undefined;
    const utm = buildUtmObject(body.utm);

    // ── CRM status ───────────────────────────────────────────────────
    const priority = body.priority !== undefined ? String(body.priority || '').trim().toLowerCase() : undefined;
    const status = body.status !== undefined ? String(body.status || '').trim().toLowerCase() : undefined;
    const next_follow_up_date = toDateOrUndefined(body.next_follow_up_date ?? body.followUpDate);
    const follow_up_status = body.follow_up_status !== undefined ? String(body.follow_up_status || '').trim().toLowerCase() : undefined;
    const followed_by = body.followed_by && mongoose.Types.ObjectId.isValid(body.followed_by) ? body.followed_by : undefined;
    const lost_reason = body.lost_reason !== undefined ? String(body.lost_reason || '').trim() : undefined;

    // ── Notes ────────────────────────────────────────────────────────
    const remarks = body.remarks !== undefined ? String(body.remarks || '').trim() : undefined;
    const notes = body.notes !== undefined ? String(body.notes || '').trim() : undefined;
    const comments = body.comments !== undefined ? String(body.comments || '').trim() : undefined;
    const tags = body.tags !== undefined ? normalizeStringArray(body.tags) : undefined;

    // ── Relations ────────────────────────────────────────────────────
    const properties = body.properties !== undefined ? normalizeObjectIdArray(body.properties) : undefined;
    const assigned_to = body.assigned_to !== undefined ? normalizeObjectIdArray(body.assigned_to) : undefined;

    const doc = {
        // Basic contact
        name,
        email: emailRaw ? (isEmail(emailRaw) ? normalizeEmail(emailRaw) : emailRaw) : emailRaw,
        phone: phoneRaw ? normalizePhone(phoneRaw) : phoneRaw,
        alternate_phone,
        whatsapp_number,
        // Lead category
        lead_type,
        client_type,
        inquiry_for,
        requirement,
        // Budget / Pricing
        budget,
        currency,
        budget_min,
        budget_max,
        asking_price,
        price_label,
        price_negotiable,
        // Property
        property_type,
        unit_count,
        bedrooms,
        bathrooms,
        maid_room,
        furnished_status,
        // Area
        plot_size,
        built_up_area,
        // Broker / Owner
        owner_name,
        broker_name,
        broker_phone,
        shared_details,
        address,
        // Relations
        properties,
        // Source
        source,
        utm,
        // CRM
        priority,
        status,
        assigned_to,
        next_follow_up_date,
        follow_up_status,
        followed_by,
        lost_reason,
        // Notes
        remarks,
        notes,
        comments,
        tags
    };

    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    return doc;
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
    if (!recipients || !recipients.length) return;
    const recipientIds = recipients.map(u => String(u._id));

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
                    recipients: recipientIds,
                    status: 'pending',
                    error_message: '',
                    cleanup_at: computeCleanupAt(r.due_at)
                }
            },
            { upsert: true }
        );
    }
}


const get_my_leads = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const { page, limit, skip } = parsePagination(req);

    const match = { is_active: true, tenant_id };

    const status = String(req.query?.status ?? '').trim().toLowerCase();
    const priority = String(req.query?.priority ?? '').trim().toLowerCase();
    const lead_type = String(req.query?.lead_type ?? '').trim().toLowerCase();
    const property_type = String(req.query?.property_type ?? '').trim().toLowerCase();
    const search = String(req.query?.search ?? '').trim();
    const followUpDue = String(req.query?.follow_up_due ?? req.query?.followUpDue ?? '').trim().toLowerCase();

    if (status) match.status = status;
    if (priority) match.priority = priority;
    if (lead_type) match.lead_type = lead_type;
    if (property_type) match.property_type = property_type;

    if (payload.role === 'agent') {
        const agentId = await getAgentIdFromUserId(user._id);
        const assignedPropIds = agentId ? await getAgentAssignedPropertyIds(agentId) : [];

        match.$or = [
            { assigned_to: user._id },
            { created_by: user._id },
            { followed_by: user._id },
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
            { alternate_phone: regex },
            { whatsapp_number: regex },
            { requirement: regex },
            { budget: regex },
            { notes: regex },
            { owner_name: regex },
            { broker_name: regex },
            { broker_phone: regex },
            { inquiry_for: regex },
            { address: regex }
        ];
    }

    const statsMatch = { ...match };
    delete statsMatch.status;

    const [items, total, statusGroups] = await Promise.all([
        Lead.find(match)
            .populate('assigned_to', 'user_name profile_pic')
            .populate('followed_by', 'user_name profile_pic')
            .populate('created_by', 'user_name email phone_number profile_pic role')
            .populate('updated_by', 'user_name email phone_number profile_pic role')
            .populate('properties', 'property_title property_type asking_price currency property_status property_address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Lead.countDocuments(match),
        Lead.aggregate([
            { $match: statsMatch },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
    ]);

    const stats = {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        follow_up: 0,
        site_visit: 0,
        negotiation: 0,
        booked: 0,
        converted: 0,
        lost: 0,
        wasted: 0,
        closed: 0,
        archived: 0
    };

    statusGroups.forEach(g => {
        const s = g._id || 'new';
        if (stats[s] !== undefined) stats[s] = g.count;
        stats.total += g.count;
    });

    res.status(200).json({
        success: true,
        data: items,
        stats,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

const get_lead_by_id = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch)
        .populate('assigned_to', 'user_name profile_pic')
        .populate('followed_by', 'user_name profile_pic')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties', 'property_title property_type asking_price currency property_status property_address');

    await ensureLeadAccess({ lead, payload, user });
    res.status(200).json({ success: true, data: lead });
});

const create_lead = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const doc = buildLeadDocFromBody(req.body);
    const details = [];

    // Only name, phone, source are required - matching the Mongoose schema
    if (!doc.name) details.push({ path: 'name', message: 'Name is required' });
    if (!doc.phone) details.push({ path: 'phone', message: 'Phone is required' });
    if (!doc.source) details.push({ path: 'source', message: 'Source is required' });
    if (details.length) {
        const message = details[0].message || 'Validation error';
        throw httpError(400, message, details);
    }

    // Normalize contact fields
    if (doc.email && isEmail(doc.email)) doc.email = normalizeEmail(doc.email);
    doc.phone = normalizePhone(doc.phone);
    doc.currency = doc.currency || 'AED';

    if (payload.role === 'agent') {
        const agentId = await getAgentIdFromUserId(user._id);
        const props = await Properties.find({ _id: { $in: doc.properties || [] } }).select('assign_agent').lean();
        const propertyAgentIds = props.flatMap(p => p.assign_agent || []).map(id => String(id));
        const propAgents = await Agent.find({ _id: { $in: uniqueObjectIds(propertyAgentIds) }, is_active: true }).select('agent_details').lean();
        const propAgentUserIds = propAgents.map(a => String(a.agent_details)).filter(Boolean);

        doc.assigned_to = uniqueObjectIds([String(user._id), ...propAgentUserIds]).map(id => new mongoose.Types.ObjectId(id));
        doc.followed_by = user._id;
    } else if (!Array.isArray(doc.assigned_to) || !doc.assigned_to.length) {
        doc.assigned_to = [];
    }

    // Auto-parse budget strings if min/max are missing
    if (doc.budget && (doc.budget_min === undefined || doc.budget_max === undefined)) {
        const { min, max } = parseBudget(doc.budget);
        if (doc.budget_min === undefined) doc.budget_min = min;
        if (doc.budget_max === undefined) doc.budget_max = max;
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
        .populate('assigned_to', 'user_name profile_pic')
        .populate('followed_by', 'user_name profile_pic')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties', 'property_title property_type asking_price currency property_status property_address');

    res.status(201).json({ success: true, message: 'Lead created successfully', data: populated });

    Promise.resolve()
        .then(() => notifyPropertyAgentsOnNewLead(populated, user._id))
        .catch(() => { });
});

const update_lead = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
    await ensureLeadAccess({ lead, payload, user });

    const updates = buildLeadDocFromBody(req.body);

    if (payload.role === 'agent') {
        delete updates.assigned_to;
        delete updates.followed_by;
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

    const oldStatus = lead.status;
    Object.assign(lead, updates);
    lead.updated_by = user._id;
    await lead.save();

    const populated = await Lead.findById(lead._id)
        .populate('assigned_to', 'user_name profile_pic')
        .populate('followed_by', 'user_name profile_pic')
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role')
        .populate('properties', 'property_title property_type asking_price currency property_status property_address');

    if (updates.status && updates.status !== oldStatus) {
        Promise.resolve()
            .then(() => notifyLeadStatusChanged(populated, oldStatus, updates.status, user._id))
            .catch(() => { });
    }

    res.status(200).json({ success: true, message: 'Lead updated successfully', data: populated });
});

const add_lead_note = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const note = String(req.body?.note ?? req.body?.notes ?? '').trim();
    if (!note) throw httpError(400, 'note is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
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
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
    await ensureLeadAccess({ lead, payload, user });

    const followUpDate = toDateOrUndefined(req.body?.next_follow_up_date ?? req.body?.followUpDate);
    const status = String(req.body?.follow_up_status ?? req.body?.followUpStatus ?? '').trim().toLowerCase();
    const remarks = req.body?.remarks ?? req.body?.remark;

    const details = [];
    if (!followUpDate) details.push({ path: 'next_follow_up_date', message: 'Valid follow up date is required' });
    if (followUpDate && followUpDate.getTime() < Date.now() - 1000 * 60 * 60 * 24) {
        details.push({ path: 'next_follow_up_date', message: 'Follow up date cannot be more than 24 hours in the past' });
    }
    if (status && !['pending', 'done', 'missed', 'rescheduled'].includes(status)) {
        details.push({ path: 'follow_up_status', message: 'Invalid follow_up_status' });
    }
    if (details.length) throw httpError(400, 'Validation error', details);

    const oldStatus = lead.status;
    lead.next_follow_up_date = followUpDate;
    lead.follow_up_status = status || 'pending';
    lead.followed_by = user._id;
    if (remarks !== undefined) lead.remarks = String(remarks || '').trim();
    if (payload.role === 'agent') lead.status = 'follow_up';
    lead.updated_by = user._id;
    await lead.save();

    await scheduleFollowUpReminders({ lead, actionUserId: user._id });

    if (lead.status !== oldStatus) {
        Promise.resolve()
            .then(() => notifyLeadStatusChanged(lead, oldStatus, lead.status, user._id))
            .catch(() => { });
    }

    Promise.resolve()
        .then(() => notifyFollowUpCreated(lead, user._id))
        .catch(() => {});

    res.status(200).json({ success: true, message: 'Follow-up updated successfully', data: lead });
});

const mark_lead_converted = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
    await ensureLeadAccess({ lead, payload, user });

    const oldStatus = lead.status;
    lead.status = 'converted';
    lead.converted_at = new Date();
    lead.follow_up_status = 'done';
    lead.updated_by = user._id;
    await lead.save();

    await cancelPendingReminders(lead._id);

    Promise.resolve()
        .then(() => notifyLeadStatusChanged(lead, oldStatus, 'converted', user._id))
        .catch(() => { });

    res.status(200).json({ success: true, message: 'Lead marked as converted', data: lead });
});

const mark_lead_lost = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
    await ensureLeadAccess({ lead, payload, user });

    const reason = String(req.body?.lost_reason ?? req.body?.reason ?? '').trim();
    const oldStatus = lead.status;
    lead.status = 'lost';
    lead.lost_reason = reason || lead.lost_reason || '';
    lead.follow_up_status = 'done';
    lead.updated_by = user._id;
    await lead.save();

    await cancelPendingReminders(lead._id);

    Promise.resolve()
        .then(() => notifyLeadStatusChanged(lead, oldStatus, 'lost', user._id))
        .catch(() => { });

    res.status(200).json({ success: true, message: 'Lead marked as lost', data: lead });
});

const get_my_followups = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const { page, limit, skip } = parsePagination(req);

    const bucket = String(req.query?.bucket ?? req.query?.type ?? 'today').trim().toLowerCase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const match = {
        next_follow_up_date: { $exists: true, $ne: null },
        follow_up_status: { $in: ['pending', 'rescheduled'] },
        is_active: true
    };

    if (payload.role !== 'super_admin') match.tenant_id = tenant_id;

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
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
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
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Lead Match Configuration
    const leadMatch = { is_active: true };
    if (payload.role !== 'super_admin') leadMatch.tenant_id = tenant_id;

    if (!isAdmin) {
        const agentId = await getAgentIdFromUserId(user._id);
        const assignedPropIds = agentId ? await getAgentAssignedPropertyIds(agentId) : [];
        leadMatch.$or = [
            { assigned_to: user._id },
            { created_by: user._id },
            { followed_by: user._id },
            { properties: { $in: assignedPropIds } }
        ];
    }

    // Property Match Configuration
    const propMatch = { is_active: true };
    if (payload.role !== 'super_admin') propMatch.tenant_id = tenant_id;

    if (!isAdmin) {
        const agentId = await getAgentIdFromUserId(user._id);
        if (agentId) propMatch.assign_agent = agentId;
        else propMatch._id = null; // No access if no agent profile
    }

    const [
        totalLeads,
        totalConverted,
        totalLost,
        totalWasted,
        activeDeals,
        followupsToday,
        followupsOverdue,
        totalProperties,
        propertyStatusGroups,
        totalAgents,
        agentPerformance,
        convertedLeadsData,
        totalPendingFollowups,
        totalMissedFollowups,
        totalCompletedFollowups
    ] = await Promise.all([
        Lead.countDocuments(leadMatch),
        Lead.countDocuments({ ...leadMatch, status: 'converted' }),
        Lead.countDocuments({ ...leadMatch, status: 'lost' }),
        Lead.countDocuments({ ...leadMatch, status: 'wasted' }),
        Lead.countDocuments({ ...leadMatch, status: { $in: ['new', 'contacted', 'qualified', 'follow_up', 'site_visit', 'negotiation', 'booked'] } }),
        Lead.countDocuments({
            ...leadMatch,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $gte: startOfToday, $lt: startOfTomorrow }
        }),
        Lead.countDocuments({
            ...leadMatch,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $lt: startOfToday }
        }),
        Properties.countDocuments(propMatch),
        Properties.aggregate([
            { $match: propMatch },
            { $group: { _id: '$property_status', count: { $sum: 1 } } }
        ]),
        isAdmin ? User.countDocuments({ tenant_id, role: 'agent', is_active: true, is_deleted: false }) : Promise.resolve(0),
        isAdmin ? Agent.find({ is_active: true, tenant_id })
            .populate('agent_details', 'user_name')
            .lean()
            .then(async agents => {
                const results = [];
                for (const a of agents) {
                    if (!a.agent_details) continue;
                    const [deals, leads] = await Promise.all([
                        Lead.countDocuments({ tenant_id, assigned_to: a.agent_details._id, status: 'converted' }),
                        Lead.countDocuments({ tenant_id, assigned_to: a.agent_details._id })
                    ]);
                    results.push({
                        name: a.agent_details.user_name,
                        deals,
                        leads
                    });
                }
                return results.sort((a, b) => b.deals - a.deals);
            }) : Promise.resolve([]),
        Lead.find({ ...leadMatch, status: 'converted' }).select('budget currency budget_min').lean(),
        Lead.countDocuments({
            ...leadMatch,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $gte: startOfToday }
        }),
        Lead.countDocuments({
            ...leadMatch,
            $or: [
                { follow_up_status: 'missed' },
                { 
                    follow_up_status: { $in: ['pending', 'rescheduled'] }, 
                    next_follow_up_date: { $lt: startOfToday } 
                }
            ]
        }),
        Lead.countDocuments({ ...leadMatch, follow_up_status: 'done' })
    ]);

    // Calculate Revenue
    let totalRevenue = 0;
    for (const lead of convertedLeadsData) {
        let amount = lead.budget_min;
        if (amount === undefined || amount === null) {
            const parsed = parseBudget(lead.budget);
            amount = parsed.min;
        }
        totalRevenue += convertCurrency(amount, lead.currency || '₹', 'INR');
    }

    // Format Property Stats
    const propStats = {
        available: 0,
        sold: 0,
        under_offer: 0,
        rented: 0,
        inactive: 0
    };
    propertyStatusGroups.forEach(g => {
        if (g._id && propStats[g._id] !== undefined) propStats[g._id] = g.count;
    });

    res.status(200).json({
        success: true,
        data: {
            total_leads: totalLeads,
            total_converted: totalConverted,
            total_lost: totalLost,
            total_wasted: totalWasted,
            active_deals: activeDeals,
            pending_followups: totalPendingFollowups,
            missed_followups: totalMissedFollowups,
            completed_followups: totalCompletedFollowups,
            followups_today: followupsToday,
            followups_overdue: followupsOverdue,
            total_properties: totalProperties,
            property_stats: propStats,
            total_agents: isAdmin ? totalAgents : undefined,
            agent_performance: isAdmin ? agentPerformance : undefined,
            total_revenue: totalRevenue,
            currency: 'INR'
        }
    });
});

const agent_activity_timeline = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    const limitRaw = Number(req.query?.limit ?? 20);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 20;

    const days = Number(req.query?.days ?? 0);
    const match = { is_active: true, tenant_id };
    
    if (days > 0) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        match.updatedAt = { $gte: dateLimit };
    }

    if (payload.role === 'agent') {
        match.assigned_to = user._id;
    }
    const items = await Lead.find(match)
        .select('name status priority updatedAt createdAt next_follow_up_date follow_up_status properties assigned_to')
        .populate('properties', 'property_title')
        .populate('assigned_to', 'user_name')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

    res.status(200).json({ success: true, data: items });
});

const delete_lead = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;
    const id = req.params?.id;
    if (!id) throw httpError(400, 'Lead id is required');

    // Only admin and super_admin can delete
    if (!['admin', 'super_admin'].includes(payload.role)) {
        throw httpError(403, 'Only administrators can delete leads');
    }

    const leadMatch = getLeadMatch(req);
    const lead = await Lead.findOne(leadMatch);
    if (!lead) throw httpError(404, 'Lead not found');

    // We can do a soft delete or hard delete. Given the 'is_active' field, a soft delete is safer.
    lead.is_active = false;
    lead.updated_by = user._id;
    await lead.save();

    // Also cancel reminders
    await cancelPendingReminders(lead._id);

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
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
    agent_activity_timeline,
    delete_lead
};
