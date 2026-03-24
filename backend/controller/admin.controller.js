const User = require('../model/user.model');
const Agent = require('../model/agent.model');
const { verifyToken } = require('../utils/generateToken');
const { uploadImage } = require('../utils/uploadImage');
const { wrapAsync } = require('../middleware/errorHandler');
const {
    httpError,
    normalizeEmail,
    normalizePhone,
    isEmail,
    validatePassword,
    hashPassword,
    extractBearerToken,
    pickProfilePicFile,
    isProbablyUrl,
    isDataUri,
    ensureNotBlacklisted
} = require('../utils/common');

async function requireAdmin(req) {
    const token = extractBearerToken(req);
    if (!token) throw httpError(401, 'Authorization token required');
    await ensureNotBlacklisted(token);

    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    if (!payload?.sub) throw httpError(401, 'Invalid token');
    if (!['admin', 'super_admin'].includes(payload.role)) throw httpError(403, 'Forbidden');

    const admin = await User.findOne({
        _id: payload.sub,
        role: { $in: ['admin', 'super_admin'] },
        is_active: true,
        is_deleted: false
    });
    if (!admin) throw httpError(401, 'Invalid or expired token');

    return { admin, payload };
}

function parsePagination(req) {
    const pageRaw = Number(req.query?.page ?? 1);
    const limitRaw = Number(req.query?.limit ?? 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

async function resolveProfilePicUrl(req, { folder, tags } = {}) {
    const file = pickProfilePicFile(req);
    const profilePic = req.body?.profile_pic;
    const base64 = req.body?.profile_pic_base64 ?? req.body?.base64;
    const mimeType = req.body?.profile_pic_mimeType ?? req.body?.mimeType;

    if (file?.buffer || file?.path) {
        const uploaded = await uploadImage(
            file.buffer ? { buffer: file.buffer } : { filePath: file.path },
            { folder: folder || process.env.CLOUDINARY_PROFILE_FOLDER || 'lead_real/profile_pics', tags, resourceType: 'image' }
        );
        return uploaded.secureUrl || uploaded.url || '';
    }

    if (profilePic && isDataUri(profilePic)) {
        const uploaded = await uploadImage(
            { dataUri: profilePic },
            { folder: folder || process.env.CLOUDINARY_PROFILE_FOLDER || 'lead_real/profile_pics', tags, resourceType: 'image' }
        );
        return uploaded.secureUrl || uploaded.url || '';
    }

    if (base64) {
        const uploaded = await uploadImage(
            { base64, mimeType },
            { folder: folder || process.env.CLOUDINARY_PROFILE_FOLDER || 'lead_real/profile_pics', tags, resourceType: 'image' }
        );
        return uploaded.secureUrl || uploaded.url || '';
    }

    if (profilePic !== undefined) {
        const pic = String(profilePic || '').trim();
        if (pic === '' || isProbablyUrl(pic)) return pic;
        throw httpError(400, 'Validation error', [{ path: 'profile_pic', message: 'profile_pic must be a URL, data URI, base64, or file upload' }]);
    }

    return undefined;
}

function validateAgentPin(pin) {
    const str = String(pin ?? '').trim();
    if (!str) return 'Pin is required';
    if (!/^\d+$/.test(str)) return 'Pin must contain only digits';
    if (str.length < 4 || str.length > 8) return 'Pin must be 4 to 8 digits';
    return null;
}

function sanitizeAgent(agentDoc) {
    const obj = agentDoc?.toObject ? agentDoc.toObject() : agentDoc;
    return obj;
}

const get_all_agents = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const { page, limit, skip } = parsePagination(req);
    const search = String(req.query?.search ?? '').trim();
    const status = String(req.query?.status ?? '').trim().toLowerCase();

    const match = {};
    if (status === 'active') match.is_active = true;
    if (status === 'inactive') match.is_active = false;

    if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({
            role: 'agent',
            is_deleted: false,
            $or: [{ user_name: regex }, { email: regex }, { phone_number: regex }]
        }).select('_id').lean();
        const userIds = users.map(u => u._id);
        match.$or = [
            { agent_role: regex },
            ...(userIds.length ? [{ agent_details: { $in: userIds } }] : [])
        ];
    }

    const [items, total] = await Promise.all([
        Agent.find(match)
            .populate('agent_details', 'user_name email phone_number profile_pic role is_active')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Agent.countDocuments(match)
    ]);

    res.status(200).json({
        success: true,
        data: items.map(sanitizeAgent),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const get_agent_by_id = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Agent id is required');

    const agent = await Agent.findById(id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');
    if (!agent) throw httpError(404, 'Agent not found');

    res.status(200).json({ success: true, data: sanitizeAgent(agent) });
});

const create_agent = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const name = String(req.body?.user_name ?? req.body?.name ?? '').trim();
    const agentRole = String(req.body?.agent_role ?? req.body?.role ?? '').trim();
    const emailRaw = req.body?.email;
    const phoneRaw = req.body?.phone_number ?? req.body?.phone;
    const pinRaw = req.body?.agent_pin ?? req.body?.pin;

    const details = [];
    if (!name || name.length < 2) details.push({ path: 'user_name', message: 'Name is required (min 2 characters)' });
    if (!agentRole) details.push({ path: 'agent_role', message: 'Agent role is required' });
    if (!emailRaw || !isEmail(emailRaw)) details.push({ path: 'email', message: 'Valid email is required' });

    const phone = normalizePhone(phoneRaw);
    if (!phone || phone.length < 10 || phone.length > 15) details.push({ path: 'phone_number', message: 'Valid phone number is required (10-15 digits)' });

    const pinError = validateAgentPin(pinRaw);
    if (pinError) details.push({ path: 'pin', message: pinError });

    if (details.length) throw httpError(400, 'Validation error', details);

    const email = normalizeEmail(emailRaw);
    const pin = Number(String(pinRaw));

    const existingUser = await User.findOne({ $or: [{ email }, { phone_number: phone }] }).lean();
    if (existingUser) throw httpError(409, 'User already exists with this email or phone');

    const existingPin = await Agent.findOne({ agent_pin: pin }).select('_id').lean();
    if (existingPin) throw httpError(409, 'Agent pin already in use');

    const generatedPassword = `Ag${String(pinRaw)}${phone.slice(-6)}`;
    const pwdError = validatePassword(generatedPassword);
    if (pwdError) throw httpError(500, 'Failed to generate agent password');

    const profilePicUrl = await resolveProfilePicUrl(req, { tags: ['agent_profile'] });

    const user = await User.create({
        profile_pic: profilePicUrl ?? '',
        user_name: name,
        email,
        phone_number: phone,
        hash_password: hashPassword(generatedPassword),
        role: 'agent',
        is_active: true
    });

    const agent = await Agent.create({
        agent_details: user._id,
        agent_role: agentRole,
        agent_pin: pin,
        is_active: true
    });

    const populated = await Agent.findById(agent._id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');

    res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: sanitizeAgent(populated),
        credentials: { phone_number: phone, email, password: generatedPassword }
    });
});

const update_agent = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Agent id is required');

    const agent = await Agent.findById(id);
    if (!agent) throw httpError(404, 'Agent not found');

    const user = await User.findById(agent.agent_details);
    if (!user) throw httpError(404, 'Agent user not found');

    const nextName = req.body?.user_name ?? req.body?.name;
    const nextRole = req.body?.agent_role ?? req.body?.role;
    const nextEmailRaw = req.body?.email;
    const nextPhoneRaw = req.body?.phone_number ?? req.body?.phone;
    const nextPinRaw = req.body?.agent_pin ?? req.body?.pin;

    const details = [];
    const userUpdates = {};
    const agentUpdates = {};

    if (nextName !== undefined) {
        const name = String(nextName || '').trim();
        if (!name || name.length < 2) details.push({ path: 'user_name', message: 'Name must be at least 2 characters' });
        else userUpdates.user_name = name;
    }

    if (nextRole !== undefined) {
        const role = String(nextRole || '').trim();
        if (!role) details.push({ path: 'agent_role', message: 'Agent role is required' });
        else agentUpdates.agent_role = role;
    }

    if (nextEmailRaw !== undefined) {
        if (!nextEmailRaw || !isEmail(nextEmailRaw)) details.push({ path: 'email', message: 'Valid email is required' });
        else userUpdates.email = normalizeEmail(nextEmailRaw);
    }

    if (nextPhoneRaw !== undefined) {
        const phone = normalizePhone(nextPhoneRaw);
        if (!phone || phone.length < 10 || phone.length > 15) details.push({ path: 'phone_number', message: 'Valid phone number is required (10-15 digits)' });
        else userUpdates.phone_number = phone;
    }

    if (nextPinRaw !== undefined) {
        const pinError = validateAgentPin(nextPinRaw);
        if (pinError) details.push({ path: 'pin', message: pinError });
        else agentUpdates.agent_pin = Number(String(nextPinRaw));
    }

    const profilePicUrl = await resolveProfilePicUrl(req, { tags: ['agent_profile', String(user._id)] });
    if (profilePicUrl !== undefined) userUpdates.profile_pic = profilePicUrl;

    if (details.length) throw httpError(400, 'Validation error', details);
    if (!Object.keys(userUpdates).length && !Object.keys(agentUpdates).length) throw httpError(400, 'No valid fields to update');

    if (userUpdates.email || userUpdates.phone_number) {
        const or = [];
        if (userUpdates.email) or.push({ email: userUpdates.email });
        if (userUpdates.phone_number) or.push({ phone_number: userUpdates.phone_number });
        const existing = await User.findOne({ _id: { $ne: user._id }, $or: or }).lean();
        if (existing) throw httpError(409, 'Email or phone number already in use');
    }

    if (agentUpdates.agent_pin !== undefined) {
        const existingPin = await Agent.findOne({ _id: { $ne: agent._id }, agent_pin: agentUpdates.agent_pin }).select('_id').lean();
        if (existingPin) throw httpError(409, 'Agent pin already in use');
    }

    Object.assign(user, userUpdates);
    await user.save();

    Object.assign(agent, agentUpdates);
    await agent.save();

    const populated = await Agent.findById(agent._id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');
    res.status(200).json({ success: true, message: 'Agent updated successfully', data: sanitizeAgent(populated) });
});

const update_agent_status = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Agent id is required');

    const enabled = req.body?.is_active ?? req.body?.status ?? req.body?.enabled;
    if (enabled === undefined) throw httpError(400, 'is_active is required');

    const isActive = String(enabled).toLowerCase() === 'true' || enabled === true || enabled === 1 || String(enabled) === '1';
    console.log(`Debug - update_agent_status - ID: ${id}, enabled: ${enabled}, typeof: ${typeof enabled}, isActive: ${isActive}`);

    const agent = await Agent.findById(id);
    if (!agent) throw httpError(404, 'Agent not found');

    agent.is_active = isActive;
    await agent.save();

    await User.updateOne({ _id: agent.agent_details }, { $set: { is_active: isActive } });

    const populated = await Agent.findById(agent._id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');
    res.status(200).json({ success: true, message: 'Agent status updated successfully', data: sanitizeAgent(populated) });
});

const assign_project_to_agent = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    const projectId = req.body?.project_id ?? req.body?.projectId;
    if (!id) throw httpError(400, 'Agent id is required');
    if (!projectId) throw httpError(400, 'project_id is required');

    const agent = await Agent.findById(id);
    if (!agent) throw httpError(404, 'Agent not found');

    const exists = agent.assigned_projects?.some(p => String(p) === String(projectId));
    if (!exists) agent.assigned_projects.push(projectId);
    agent.last_assigned_at = new Date();
    await agent.save();

    const populated = await Agent.findById(agent._id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');
    res.status(200).json({ success: true, message: 'Project assigned successfully', data: sanitizeAgent(populated) });
});

const remark_agent = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    const remark = String(req.body?.remark ?? '').trim();
    if (!id) throw httpError(400, 'Agent id is required');

    const agent = await Agent.findById(id);
    if (!agent) throw httpError(404, 'Agent not found');

    agent.remark = remark;
    await agent.save();

    const populated = await Agent.findById(agent._id).populate('agent_details', 'user_name email phone_number profile_pic role is_active');
    res.status(200).json({ success: true, message: 'Remark updated successfully', data: sanitizeAgent(populated) });
});

const delete_agent = wrapAsync(async (req, res) => {
    await requireAdmin(req);

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Agent id is required');

    const agent = await Agent.findById(id);
    if (!agent) throw httpError(404, 'Agent not found');

    agent.is_active = false;
    await agent.save();

    await User.updateOne(
        { _id: agent.agent_details },
        { $set: { is_deleted: true, deleted_at: new Date(), is_active: false } }
    );

    res.status(200).json({ success: true, message: 'Agent deleted successfully' });
});

module.exports = {
    get_all_agents,
    get_agent_by_id,
    create_agent,
    update_agent,
    update_agent_status,
    assign_project_to_agent,
    remark_agent,
    delete_agent
};
