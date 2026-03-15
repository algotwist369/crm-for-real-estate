const User = require('../model/user.model');
const Agent = require('../model/agent.model');
const Properties = require('../model/properties.model');
const { verifyToken, createAuthTokenFromUser } = require('../utils/generateToken');
const { uploadImage } = require('../utils/uploadImage');
const { wrapAsync } = require('../middleware/errorHandler');
const {
    httpError,
    normalizeEmail,
    normalizePhone,
    isEmail,
    extractBearerToken,
    pickProfilePicFile,
    isProbablyUrl,
    isDataUri,
    ensureNotBlacklisted
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

async function requireAgent(req) {
    const token = extractBearerToken(req);
    if (!token) throw httpError(401, 'Authorization token required');
    await ensureNotBlacklisted(token);

    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    if (!payload?.sub || payload?.role !== 'agent') throw httpError(403, 'Forbidden');

    const user = await User.findOne({
        _id: payload.sub,
        role: 'agent',
        is_active: true,
        is_deleted: false
    });
    if (!user) throw httpError(401, 'Invalid or expired token');

    const agent = await Agent.findOne({ agent_details: user._id, is_active: true });
    if (!agent) throw httpError(403, 'Agent profile not found or inactive');

    return { user, agent, payload, token };
}

async function resolveProfilePicForUser(req, userId) {
    const nextProfilePic = req.body?.profile_pic;
    const nextProfilePicBase64 = req.body?.profile_pic_base64;
    const nextProfilePicMimeType = req.body?.profile_pic_mimeType;
    const profilePicFile = pickProfilePicFile(req);

    if (profilePicFile || nextProfilePicBase64 !== undefined || (nextProfilePic !== undefined && isDataUri(nextProfilePic))) {
        const filePath = profilePicFile?.path;
        const buffer = profilePicFile?.buffer;

        const uploaded = await uploadImage(
            buffer ? { buffer } : filePath ? { filePath } : isDataUri(nextProfilePic) ? { dataUri: nextProfilePic } : { base64: nextProfilePicBase64, mimeType: nextProfilePicMimeType },
            { folder: process.env.CLOUDINARY_PROFILE_FOLDER || 'lead_real/profile_pics', tags: ['profile_pic', String(userId)], resourceType: 'image' }
        );

        return uploaded.secureUrl || uploaded.url || '';
    }

    if (nextProfilePic !== undefined) {
        const pic = String(nextProfilePic || '').trim();
        if (pic === '' || isProbablyUrl(pic)) return pic;
        throw httpError(400, 'Validation error', [{ path: 'profile_pic', message: 'profile_pic must be a valid URL, data URI, base64 via profile_pic_base64, or a file upload' }]);
    }

    return undefined;
}

const update_agent_own_profile = wrapAsync(async (req, res) => {
    const { user } = await requireAgent(req);

    const nextName = req.body?.user_name ?? req.body?.name;
    const nextEmailRaw = req.body?.email;
    const nextPhoneRaw = req.body?.phone_number ?? req.body?.phone;

    const details = [];
    const updates = {};

    if (nextName !== undefined) {
        const name = String(nextName || '').trim();
        if (!name || name.length < 2) details.push({ path: 'user_name', message: 'Name must be at least 2 characters' });
        else updates.user_name = name;
    }

    if (nextEmailRaw !== undefined) {
        if (!nextEmailRaw || !isEmail(nextEmailRaw)) details.push({ path: 'email', message: 'Valid email is required' });
        else updates.email = normalizeEmail(nextEmailRaw);
    }

    if (nextPhoneRaw !== undefined) {
        const phone = normalizePhone(nextPhoneRaw);
        if (!phone || phone.length < 10 || phone.length > 15) details.push({ path: 'phone_number', message: 'Valid phone number is required (10-15 digits)' });
        else updates.phone_number = phone;
    }

    const profilePicUrl = await resolveProfilePicForUser(req, user._id);
    if (profilePicUrl !== undefined) updates.profile_pic = profilePicUrl;

    if (details.length) throw httpError(400, 'Validation error', details);
    if (!Object.keys(updates).length) throw httpError(400, 'No valid fields to update');

    if (updates.email || updates.phone_number) {
        const or = [];
        if (updates.email) or.push({ email: updates.email });
        if (updates.phone_number) or.push({ phone_number: updates.phone_number });
        const existing = await User.findOne({ _id: { $ne: user._id }, $or: or }).lean();
        if (existing) throw httpError(409, 'Email or phone number already in use');
    }

    Object.assign(user, updates);
    await user.save();

    const token = createAuthTokenFromUser(user);
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        token,
        user: safeUser
    });
});

const get_all_assigned_properties = wrapAsync(async (req, res) => {
    const { user, agent } = await requireAgent(req);
    const { page, limit, skip } = parsePagination(req);

    const match = { assign_agent: agent._id };

    const search = String(req.query?.search ?? '').trim();
    const propertyType = String(req.query?.property_type ?? '').trim();
    const listingType = String(req.query?.listing_type ?? '').trim();
    const propertyStatus = String(req.query?.property_status ?? '').trim();
    const isActiveRaw = req.query?.is_active;

    if (propertyType) match.property_type = propertyType;
    if (listingType) match.listing_type = listingType;
    if (propertyStatus) match.property_status = propertyStatus;
    if (isActiveRaw !== undefined) match.is_active = String(isActiveRaw).toLowerCase() === 'true';

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        match.$or = [
            { property_title: regex },
            { property_type: regex },
            { property_address: regex },
            { 'property_location.city': regex },
            { 'property_location.state': regex }
        ];
    }

    const [items, total] = await Promise.all([
        Properties.find(match)
            .populate({
                path: 'assign_agent',
                populate: { path: 'agent_details', select: 'user_name email phone_number profile_pic role is_active' }
            })
            .populate('created_by', 'user_name email phone_number profile_pic role')
            .populate('updated_by', 'user_name email phone_number profile_pic role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Properties.countDocuments(match)
    ]);

    res.status(200).json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

const assign_other_agent_to_property = wrapAsync(async (req, res) => {
    const { user, agent } = await requireAgent(req);

    const propertyId = req.params?.propertyId ?? req.body?.property_id ?? req.body?.propertyId;
    const otherAgentId = req.body?.agent_id ?? req.body?.agentId;
    if (!propertyId) throw httpError(400, 'propertyId is required');
    if (!otherAgentId) throw httpError(400, 'agent_id is required');

    const property = await Properties.findById(propertyId);
    if (!property) throw httpError(404, 'Property not found');

    const assignedToMe = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a) === String(agent._id));
    if (!assignedToMe) throw httpError(403, 'Forbidden');

    const otherAgent = await Agent.findOne({ _id: otherAgentId, is_active: true });
    if (!otherAgent) throw httpError(404, 'Agent not found or inactive');

    const exists = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a) === String(otherAgent._id));
    if (!exists) {
        property.assign_agent = Array.isArray(property.assign_agent) ? property.assign_agent : [];
        property.assign_agent.push(otherAgent._id);
        property.updated_by = user._id;
        await property.save();
    }

    const populated = await Properties.findById(property._id)
        .populate({
            path: 'assign_agent',
            populate: { path: 'agent_details', select: 'user_name email phone_number profile_pic role is_active' }
        })
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role');

    res.status(200).json({
        success: true,
        message: 'Agent assigned to property successfully',
        data: populated
    });
});

module.exports = {
    update_agent_own_profile,
    get_all_assigned_properties,
    assign_other_agent_to_property
};

