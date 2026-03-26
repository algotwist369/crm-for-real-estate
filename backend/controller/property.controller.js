const Properties = require('../model/properties.model');
const User = require('../model/user.model');
const Agent = require('../model/agent.model');
const { verifyToken } = require('../utils/generateToken');
const { uploadImage } = require('../utils/uploadImage');
const { sendMail } = require('../utils/sendMail');
const { wrapAsync } = require('../middleware/errorHandler');
const {
    httpError,
    extractBearerToken,
    ensureNotBlacklisted
} = require('../utils/common');

function uniqueStrings(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean));
    return Array.from(set);
}

async function notifyAllAgentsNewProperty(property) {
    const agents = await User.find({
        role: 'agent',
        is_active: true,
        is_deleted: false,
        email: { $exists: true, $ne: '' }
    }).select('email').lean();

    const emails = uniqueStrings(agents.map(a => a.email));
    if (!emails.length) return;

    const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
    const propertyUrl = appUrl ? `${appUrl}/properties/${property._id}` : '';

    const to = emails[0];
    const bcc = emails.length > 1 ? emails.slice(1) : undefined;

    await sendMail({
        to,
        bcc,
        template: 'genericNotification',
        templateData: {
            title: 'New Property Added',
            preheader: 'A new property has been added to the inventory.',
            message: `${property.property_title}${property.listing_type ? ` (${property.listing_type})` : ''}`,
            actionUrl: propertyUrl,
            actionText: 'Open Property'
        }
    });
}

async function requireUser(req, allowedRoles) {
    const token = extractBearerToken(req);
    if (!token) throw httpError(401, 'Authorization token required');
    await ensureNotBlacklisted(token);

    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    const userId = payload?.sub;
    const role = payload?.role;
    if (!userId || !role) throw httpError(401, 'Invalid token');
    if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(role)) {
        throw httpError(403, 'Forbidden');
    }

    const user = await User.findOne({ _id: userId, is_active: true, is_deleted: false });
    if (!user) throw httpError(401, 'Invalid or expired token');

    return { user, payload, token };
}

async function requireAgentForUser(userId) {
    const agent = await Agent.findOne({ agent_details: userId, is_active: true });
    if (!agent) throw httpError(403, 'Agent profile not found or inactive');
    return agent;
}

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

function normalizeFurnishedStatus(value) {
    const str = String(value || '').trim().toLowerCase();
    if (!str) return undefined;
    if (str === 'na' || str === 'n/a') return 'NA';
    if (str.includes('semi')) return 'furnished';
    if (str.includes('fully')) return 'fully furnished';
    if (str.includes('unfurnished')) return 'unfurnished';
    if (str.includes('furnished')) return 'furnished';
    return undefined;
}

function toNumberOrUndefined(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function normalizeAgentIds(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean);
    if (typeof input === 'string') {
        const s = input.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
            return s.split(',').map(x => x.trim()).filter(Boolean);
        }
    }
    return [];
}

function pickFiles(req, field) {
    const files = req?.files;
    if (!files) return [];
    const candidate = files[field];
    if (!candidate) return [];
    return Array.isArray(candidate) ? candidate : [candidate];
}

function isDataUri(value) {
    return String(value || '').trim().toLowerCase().startsWith('data:');
}

function isProbablyUrl(value) {
    const str = String(value || '').trim().toLowerCase();
    return str.startsWith('http://') || str.startsWith('https://');
}

async function resolvePhotoUrls(req, { folder, tags } = {}) {
    const uploadedUrls = [];

    const photoFiles = pickFiles(req, 'photos').concat(pickFiles(req, 'photo'));
    for (const file of photoFiles) {
        if (!file) continue;
        const uploaded = await uploadImage(
            file.buffer ? { buffer: file.buffer } : { filePath: file.path },
            { folder: folder || process.env.CLOUDINARY_PROPERTY_FOLDER || 'lead_real/properties', tags, resourceType: 'image' }
        );
        const url = uploaded.secureUrl || uploaded.url;
        if (url) uploadedUrls.push(url);
    }

    const photosBody = req.body?.photos;
    if (Array.isArray(photosBody)) {
        for (const p of photosBody) {
            if (isProbablyUrl(p)) uploadedUrls.push(String(p).trim());
            else if (isDataUri(p)) {
                const uploaded = await uploadImage(
                    { dataUri: p },
                    { folder: folder || process.env.CLOUDINARY_PROPERTY_FOLDER || 'lead_real/properties', tags, resourceType: 'image' }
                );
                const url = uploaded.secureUrl || uploaded.url;
                if (url) uploadedUrls.push(url);
            }
        }
    } else if (typeof photosBody === 'string') {
        const s = photosBody.trim();
        if (s) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) {
                    req.body.photos = parsed;
                    return resolvePhotoUrls(req, { folder, tags });
                }
            } catch {
                const parts = s.split(',').map(x => x.trim()).filter(Boolean);
                for (const p of parts) if (isProbablyUrl(p)) uploadedUrls.push(p);
            }
        }
    }

    const base64List = req.body?.photos_base64;
    if (Array.isArray(base64List)) {
        const mimeType = req.body?.photos_mimeType || req.body?.mimeType;
        for (const b64 of base64List) {
            if (!b64) continue;
            const uploaded = await uploadImage(
                { base64: String(b64).trim(), mimeType },
                { folder: folder || process.env.CLOUDINARY_PROPERTY_FOLDER || 'lead_real/properties', tags, resourceType: 'image' }
            );
            const url = uploaded.secureUrl || uploaded.url;
            if (url) uploadedUrls.push(url);
        }
    }

    return uploadedUrls;
}

async function resolveDocumentUrls(req, { folder, tags } = {}) {
    const uploadedDocs = [];

    const documentsBody = req.body?.documents;
    if (Array.isArray(documentsBody)) {
        for (const doc of documentsBody) {
            if (doc && doc.value) {
                uploadedDocs.push({ name: String(doc.name || '').trim(), value: String(doc.value).trim() });
            }
        }
    } else if (typeof documentsBody === 'string') {
        const s = documentsBody.trim();
        if (s) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) {
                    for (const doc of parsed) {
                        if (doc && doc.value) {
                            uploadedDocs.push({ name: String(doc.name || '').trim(), value: String(doc.value).trim() });
                        }
                    }
                }
            } catch {}
        }
    }

    const base64List = req.body?.documents_base64;
    // base64List should be an array of { name, base64, mimeType }
    if (Array.isArray(base64List)) {
        for (const docObj of base64List) {
            if (!docObj || !docObj.base64) continue;
            
            const rawB64 = String(docObj.base64).trim();
            const uploadPayload = rawB64.startsWith('data:') 
                ? { dataUri: rawB64 } 
                : { base64: rawB64, mimeType: docObj.mimeType };

            const uploaded = await uploadImage(
                uploadPayload,
                { folder: folder || process.env.CLOUDINARY_PROPERTY_FOLDER || 'lead_real/properties_docs', tags, resourceType: 'auto' }
            );
            const url = uploaded.secureUrl || uploaded.url;
            if (url) uploadedDocs.push({ name: String(docObj.name || '').trim(), value: url });
        }
    }

    return uploadedDocs.filter(d => d.value);
}

function buildPropertyDocFromBody(body = {}) {
    const property_title = String(body.property_title ?? body.title ?? '').trim();
    const property_type = String(body.property_type ?? '').trim() || undefined;
    const listing_type = String(body.listing_type ?? '').trim();
    const asking_price = toNumberOrUndefined(body.asking_price ?? body.price);
    const currency = String(body.currency ?? '').trim();
    const price_sqft = toNumberOrUndefined(body.price_sqft ?? body.price_per_sqft);
    const price_negotiable = body.price_negotiable !== undefined ? Boolean(body.price_negotiable) : undefined;

    const location = body.property_location ?? body.location ?? {};
    const address = String(body.property_address ?? location.address ?? body.address ?? '').trim();

    const furnished_status = normalizeFurnishedStatus(body.furnished_status ?? body.details?.furnished_status);

    const total_area = toNumberOrUndefined(body.total_area ?? body.details?.area_sqft);
    const total_bedrooms = toNumberOrUndefined(body.total_bedrooms ?? body.details?.bedrooms);
    const total_bathrooms = toNumberOrUndefined(body.total_bathrooms ?? body.details?.bathrooms);
    const property_description = String(body.property_description ?? body.description ?? '').trim();

    const amenities = Array.isArray(body.amenities) ? body.amenities.map(a => String(a).trim()).filter(Boolean) : undefined;

    const statusRaw = String(body.property_status ?? body.status ?? '').trim().toLowerCase();
    let mappedPropertyStatus = body.property_status;
    let mappedIsActive = body.is_active !== undefined ? Boolean(body.is_active) : undefined;
    if (!mappedPropertyStatus && statusRaw) {
        if (statusRaw === 'active') mappedPropertyStatus = 'available';
        else if (statusRaw === 'inactive') mappedPropertyStatus = 'inactive';
        else if (['available', 'under_offer', 'sold', 'rented'].includes(statusRaw)) mappedPropertyStatus = statusRaw;
    }
    if (mappedIsActive === undefined && statusRaw) {
        if (statusRaw === 'inactive') mappedIsActive = false;
        if (statusRaw === 'active') mappedIsActive = true;
    }

    const doc = {
        property_title,
        property_type,
        listing_type,
        asking_price,
        currency: currency || undefined,
        price_sqft,
        price_negotiable,
        property_address: address || undefined,
        property_location: {
            line1: String(location.line1 ?? '').trim() || undefined,
            line2: String(location.line2 ?? location.locality ?? '').trim() || undefined,
            city: String(location.city ?? '').trim() || undefined,
            state: String(location.state ?? '').trim() || undefined,
            country: String(location.country ?? '').trim() || undefined,
            postal_code: String(location.postal_code ?? location.postalCode ?? '').trim() || undefined,
            landmark: String(location.landmark ?? '').trim() || undefined
        },
        total_area,
        area_unit: body.area_unit || undefined,
        carpet_area: toNumberOrUndefined(body.carpet_area),
        built_up_area: toNumberOrUndefined(body.built_up_area),
        total_bedrooms,
        total_bathrooms,
        property_description: property_description || undefined,
        furnished_status,
        amenities,
        property_status: mappedPropertyStatus || undefined,
        is_active: mappedIsActive,
        documents: undefined // To be populated directly if needed, or stripped out until populated
    };

    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    if (doc.property_location) {
        Object.keys(doc.property_location).forEach(k => doc.property_location[k] === undefined && delete doc.property_location[k]);
        if (!Object.keys(doc.property_location).length) delete doc.property_location;
    }

    return doc;
}

function populatePropertyQuery(query) {
    return query
        .populate({
            path: 'assign_agent',
            populate: { path: 'agent_details', select: 'user_name email phone_number profile_pic role is_active' }
        })
        .populate('created_by', 'user_name email phone_number profile_pic role')
        .populate('updated_by', 'user_name email phone_number profile_pic role');
}

const get_all_properties = wrapAsync(async (req, res) => {
    const { payload, tenant_id } = req.auth;
    const { page, limit, skip } = parsePagination(req);

    const match = { tenant_id };

    const search = String(req.query?.search ?? '').trim();
    const propertyType = String(req.query?.property_type ?? '').trim();
    const listingType = String(req.query?.listing_type ?? '').trim();
    const propertyStatus = String(req.query?.property_status ?? '').trim();
    const isActiveRaw = req.query?.is_active;
    const minPrice = toNumberOrUndefined(req.query?.min_price);
    const maxPrice = toNumberOrUndefined(req.query?.max_price);

    if (propertyType) match.property_type = propertyType;
    if (listingType) match.listing_type = listingType;
    if (propertyStatus) match.property_status = propertyStatus;
    if (isActiveRaw !== undefined) match.is_active = String(isActiveRaw).toLowerCase() === 'true';
    if (minPrice !== undefined || maxPrice !== undefined) {
        match.asking_price = {};
        if (minPrice !== undefined) match.asking_price.$gte = minPrice;
        if (maxPrice !== undefined) match.asking_price.$lte = maxPrice;
    }

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        match.$or = [
            { property_title: regex },
            { property_type: regex },
            { property_address: regex },
            { 'property_location.city': regex },
            { 'property_location.state': regex },
            { 'property_location.country': regex }
        ];
    }

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        match.assign_agent = agent._id;
    } else if (req.query?.agent_id) {
        match.assign_agent = req.query.agent_id;
    }

    const [items, total] = await Promise.all([
        populatePropertyQuery(
            Properties.find(match)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ),
        Properties.countDocuments(match)
    ]);

    res.status(200).json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

const get_property_by_id = wrapAsync(async (req, res) => {
    const { payload, tenant_id } = req.auth;

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Property id is required');

    const property = await populatePropertyQuery(Properties.findOne({ _id: id, tenant_id }));
    if (!property) throw httpError(404, 'Property not found');

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        const assigned = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a._id || a) === String(agent._id));
        if (!assigned) throw httpError(403, 'Forbidden');
    }

    res.status(200).json({ success: true, data: property });
});

const create_property = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const doc = buildPropertyDocFromBody(req.body);
    const details = [];

    if (!doc.property_title) details.push({ path: 'property_title', message: 'Property title is required' });
    if (!doc.listing_type) details.push({ path: 'listing_type', message: 'Listing type is required' });

    let assignAgentIds = normalizeAgentIds(req.body?.assign_agent ?? req.body?.assign_agent_ids ?? req.body?.agent_ids);

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        assignAgentIds = [agent._id];
    }

    if (details.length) throw httpError(400, 'Validation error', details);

    const photoUrls = await resolvePhotoUrls(req, { tags: ['property', String(user._id)] });
    if (photoUrls.length || req.body.photos || req.body.photos_base64) doc.photos = photoUrls;

    const documentUrls = await resolveDocumentUrls(req, { tags: ['property_doc', String(user._id)] });
    if (documentUrls.length || req.body.documents || req.body.documents_base64) doc.documents = documentUrls;

    if (assignAgentIds.length) doc.assign_agent = assignAgentIds;
    doc.created_by = user._id;
    doc.updated_by = user._id;
    doc.tenant_id = tenant_id;
    if (doc.is_active === undefined) doc.is_active = true;

    const created = await Properties.create(doc);
    const populated = await populatePropertyQuery(Properties.findById(created._id));

    // Bidirectional assignment update
    if (assignAgentIds && assignAgentIds.length) {
        await Agent.updateMany(
            { _id: { $in: assignAgentIds } },
            { $addToSet: { assigned_properties: created._id } }
        );
    }

    res.status(201).json({ success: true, message: 'Property created successfully', data: populated });


    Promise.resolve()
        .then(() => notifyAllAgentsNewProperty(populated))
        .catch(() => {});
});

const update_property = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Property id is required');

    const property = await Properties.findOne({ _id: id, tenant_id });
    if (!property) throw httpError(404, 'Property not found');

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        const assigned = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a) === String(agent._id));
        if (!assigned) throw httpError(403, 'Forbidden');
    }

    const updates = buildPropertyDocFromBody(req.body);

    if (payload.role !== 'agent') {
        const assignAgentIds = normalizeAgentIds(req.body?.assign_agent ?? req.body?.assign_agent_ids ?? req.body?.agent_ids);
        if (assignAgentIds.length) updates.assign_agent = assignAgentIds;
    }

    const photoUrls = await resolvePhotoUrls(req, { tags: ['property', String(user._id), String(property._id)] });
    // In updates, we usually append photos if uploaded, or rewrite if specifically passed.
    // If they explicitly send empty photos array, we should respect it
    if (photoUrls.length) {
        const existing = Array.isArray(property.photos) ? property.photos : [];
        updates.photos = Array.from(new Set(existing.concat(photoUrls)));
    } else if (req.body.photos && Array.isArray(req.body.photos) && req.body.photos.length === 0) {
        updates.photos = [];
    }

    const documentUrls = await resolveDocumentUrls(req, { tags: ['property_doc', String(user._id), String(property._id)] });
    // For documents, we are rewriting the entire array based on what's in req.body.documents and new base64s
    if (req.body.documents !== undefined || req.body.documents_base64 !== undefined) {
        updates.documents = documentUrls;
    }

    if (!Object.keys(updates).length) throw httpError(400, 'No valid fields to update');

    const oldAgents = (property.assign_agent || []).map(a => String(a._id || a));
    const newAgents = updates.assign_agent ? updates.assign_agent.map(a => String(a)) : oldAgents;

    Object.assign(property, updates);
    property.updated_by = user._id;
    await property.save();

    // Bidirectional assignment update
    if (updates.assign_agent) {
        const added = newAgents.filter(id => !oldAgents.includes(id));
        const removed = oldAgents.filter(id => !newAgents.includes(id));

        if (added.length) {
            await Agent.updateMany({ _id: { $in: added } }, { $addToSet: { assigned_properties: property._id } });
        }
        if (removed.length) {
            await Agent.updateMany({ _id: { $in: removed } }, { $pull: { assigned_properties: property._id } });
        }
    }

    const populated = await populatePropertyQuery(Properties.findById(property._id));
    res.status(200).json({ success: true, message: 'Property updated successfully', data: populated, debug_documentUrls: documentUrls, debug_updates: updates });
});

const update_property_status = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Property id is required');

    const statusInput = req.body?.property_status ?? req.body?.status;
    const enabledInput = req.body?.is_active ?? req.body?.enabled;
    if (statusInput === undefined && enabledInput === undefined) {
        throw httpError(400, 'status or is_active is required');
    }

    const property = await Properties.findOne({ _id: id, tenant_id });
    if (!property) throw httpError(404, 'Property not found');

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        const assigned = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a) === String(agent._id));
        if (!assigned) throw httpError(403, 'Forbidden');
    }

    const rawStatus = String(statusInput ?? '').trim().toLowerCase();
    const isBooleanLike = v => ['true', 'false', '1', '0', 'yes', 'no', 'active', 'inactive'].includes(String(v).trim().toLowerCase());

    if (enabledInput !== undefined || isBooleanLike(statusInput)) {
        const source = enabledInput !== undefined ? enabledInput : statusInput;
        const s = String(source).trim().toLowerCase();
        const isActive = s === 'true' || s === '1' || s === 'yes' || s === 'active';
        property.is_active = isActive;
        if (!isActive) {
            property.property_status = 'inactive';
        } else if (property.property_status === 'inactive') {
            property.property_status = 'available';
        }
    }

    if (rawStatus && ['available', 'under_offer', 'sold', 'rented', 'inactive'].includes(rawStatus)) {
        property.property_status = rawStatus;
        if (rawStatus === 'inactive') property.is_active = false;
        else property.is_active = true;
    }
    property.updated_by = user._id;
    await property.save();

    const populated = await populatePropertyQuery(Properties.findById(property._id));
    res.status(200).json({ success: true, message: 'Property status updated successfully', data: populated });
});

const delete_property = wrapAsync(async (req, res) => {
    const { user, payload, tenant_id } = req.auth;

    const id = req.params?.id;
    if (!id) throw httpError(400, 'Property id is required');

    const property = await Properties.findOne({ _id: id, tenant_id });
    if (!property) throw httpError(404, 'Property not found');

    if (payload.role === 'agent') {
        const agent = await requireAgentForUser(user._id);
        const assigned = Array.isArray(property.assign_agent) && property.assign_agent.some(a => String(a) === String(agent._id));
        if (!assigned) throw httpError(403, 'Forbidden');
    }

    property.is_active = false;
    property.property_status = 'inactive';
    property.updated_by = user._id;
    await property.save();

    // Bidirectional assignment update
    if (property.assign_agent && property.assign_agent.length) {
        await Agent.updateMany(
            { _id: { $in: property.assign_agent } },
            { $pull: { assigned_properties: property._id } }
        );
    }

    res.status(200).json({ success: true, message: 'Property deleted successfully' });
});

module.exports = {
    get_all_properties,
    get_property_by_id,
    create_property,
    update_property,
    update_property_status,
    delete_property
};
