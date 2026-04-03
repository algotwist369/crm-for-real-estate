
const User = require('../model/user.model');
const Agent = require('../model/agent.model');
const TokenBlacklist = require('../model/tokenBlacklist.model');
const { createAuthTokenFromUser, verifyToken } = require('../utils/generateToken');
const { uploadImage, deleteImage } = require('../utils/uploadImage');
const { wrapAsync } = require('../middleware/errorHandler');
const {
    httpError,
    normalizeEmail,
    normalizePhone,
    isEmail,
    validatePassword,
    hashPassword,
    verifyPassword,
    extractBearerToken,
    getTokenHash,
    pickProfilePicFile,
    isProbablyUrl,
    isDataUri,
    ensureNotBlacklisted
} = require('../utils/common');

const setTokenCookie = (res, token, remember = false) => {
    const maxAge = remember
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 24 * 60 * 60 * 1000;    // 1 day

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        maxAge
    });
};

// Register a new admin
const register_admin = wrapAsync(async (req, res) => {
    const details = [];
    const name = String(req.body?.user_name ?? req.body?.name ?? '').trim();
    const emailRaw = req.body?.email;
    const phoneRaw = req.body?.phone_number ?? req.body?.phone;
    const password = req.body?.password ?? req.body?.hash_password;
    const nextProfilePic = req.body?.profile_pic;
    const nextProfilePicBase64 = req.body?.profile_pic_base64;
    const nextProfilePicMimeType = req.body?.profile_pic_mimeType;
    const profilePicFile = pickProfilePicFile(req);

    if (!name || name.length < 2) details.push({ path: 'user_name', message: 'Name must be at least 2 characters' });
    if (!emailRaw || !isEmail(emailRaw)) details.push({ path: 'email', message: 'Valid email is required' });

    const phone = normalizePhone(phoneRaw);
    if (!phone || phone.length < 10 || phone.length > 15) {
        details.push({ path: 'phone_number', message: 'Valid phone number is required (10-15 digits)' });
    }

    const pwdError = validatePassword(password);
    if (pwdError) details.push({ path: 'password', message: pwdError });

    let finalProfilePic = '';
    if (profilePicFile || nextProfilePicBase64 !== undefined || (nextProfilePic !== undefined && isDataUri(nextProfilePic))) {
        const filePath = profilePicFile?.path;
        const buffer = profilePicFile?.buffer;

        try {
            const uploaded = await uploadImage(
                buffer ? { buffer } : filePath ? { filePath } : isDataUri(nextProfilePic) ? { dataUri: nextProfilePic } : { base64: nextProfilePicBase64, mimeType: nextProfilePicMimeType },
                { folder: process.env.CLOUDINARY_PROFILE_FOLDER || 'profile_pics', tags: ['profile_pic', 'register'], resourceType: 'image' }
            );
            finalProfilePic = uploaded.secureUrl || uploaded.url || '';
        } catch (uploadErr) {
            console.error('Registration profile pic upload error:', uploadErr);
        }
    } else if (nextProfilePic !== undefined) {
        const pic = String(nextProfilePic || '').trim();
        if (pic === '' || isProbablyUrl(pic)) finalProfilePic = pic;
        else details.push({ path: 'profile_pic', message: 'profile_pic must be a valid URL or data URI' });
    }

    if (details.length) {
        const message = details[0].message || 'Validation error';
        throw httpError(400, message, details);
    }

    const email = normalizeEmail(emailRaw);

    const existing = await User.findOne({
        $or: [{ email }, { phone_number: phone }]
    }).lean();
    if (existing) throw httpError(409, 'Admin already exists with this email or phone');

    const user = new User({
        profile_pic: finalProfilePic,
        user_name: name,
        email,
        phone_number: phone,
        hash_password: hashPassword(password),
        role: 'admin',
        is_active: true
    });

    const remember = Boolean(req.body?.remember);
    const tokenOptions = remember ? { expiresInSeconds: 30 * 24 * 60 * 60 } : {};
    
    // Generate token before saving to database to prevent partial registration
    // if token generation fails (e.g., due to missing or invalid TOKEN_SECRET)
    const token = createAuthTokenFromUser(user, tokenOptions);
    
    // Now save the user
    await user.save();

    setTokenCookie(res, token, remember);
    
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        user: safeUser,
        token: token
    });
});

// Login admin
const login_admin = wrapAsync(async (req, res) => {
    const identifier =
        req.body?.phone_or_email ??
        req.body?.identifier ??
        req.body?.email ??
        req.body?.phone_number ??
        req.body?.phone ??
        '';

    const password = req.body?.password;
    const details = [];
    if (!identifier) details.push({ path: 'phone_or_email', message: 'Phone or email is required' });
    if (!password) details.push({ path: 'password', message: 'Password is required' });
    if (details.length) throw httpError(400, 'Validation error', details);

    const query = {
        role: { $in: ['admin', 'super_admin'] },
        is_active: true,
        is_deleted: false
    };

    if (isEmail(identifier)) {
        query.email = normalizeEmail(identifier);
    } else {
        const phone = normalizePhone(identifier);
        if (!phone || phone.length < 10 || phone.length > 15) {
            throw httpError(400, 'Validation error', [{ path: 'phone_or_email', message: 'Invalid phone or email' }]);
        }
        query.phone_number = phone;
    }

    const user = await User.findOne(query).select('+hash_password');
    if (!user || !verifyPassword(password, user.hash_password)) {
        throw httpError(401, 'Invalid credentials');
    }

    user.last_login_at = new Date();
    await user.save();

    const remember = Boolean(req.body?.remember);
    const tokenOptions = remember ? { expiresInSeconds: 30 * 24 * 60 * 60 } : {};
    const token = createAuthTokenFromUser(user, tokenOptions);
    setTokenCookie(res, token, remember);
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: safeUser,
        token: token // Also return token in body for mobile/socket fallbacks
    });
});

// Login agent
const login_agent = wrapAsync(async (req, res) => {
    const identifier =
        req.body?.phone_or_email ??
        req.body?.identifier ??
        req.body?.email ??
        req.body?.phone_number ??
        req.body?.phone ??
        '';

    const password = req.body?.password ?? req.body?.agent_pin;
    const details = [];
    if (!identifier) details.push({ path: 'phone_or_email', message: 'Phone or email is required' });
    if (!password) details.push({ path: 'password', message: 'Password or PIN is required' });
    if (details.length) throw httpError(400, 'Validation error', details);

    const query = {
        role: 'agent',
        is_active: true,
        is_deleted: false
    };

    if (isEmail(identifier)) {
        query.email = normalizeEmail(identifier);
    } else {
        const phone = normalizePhone(identifier);
        if (!phone || phone.length < 10 || phone.length > 15) {
            throw httpError(400, 'Validation error', [{ path: 'phone_or_email', message: 'Invalid phone or email' }]);
        }
        query.phone_number = phone;
    }

    const user = await User.findOne(query).select('+hash_password');
    if (!user) {
        throw httpError(401, 'Invalid credentials');
    }

    let isValid = verifyPassword(password, user.hash_password);

    if (!isValid) {
        const agent = await Agent.findOne({ agent_details: user._id });
        if (agent && agent.agent_pin === Number(password)) {
            isValid = true;
        }
    }

    if (!isValid) {
        throw httpError(401, 'Invalid credentials');
    }

    user.last_login_at = new Date();
    await user.save();

    const token = createAuthTokenFromUser(user);
    setTokenCookie(res, token);
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: safeUser,
        token: token
    });
});

// update admin profile
const update_admin_profile = wrapAsync(async (req, res) => {
    const rawToken = extractBearerToken(req);
    if (!rawToken) throw httpError(401, 'Authorization token required');
    await ensureNotBlacklisted(rawToken);

    let payload;
    try {
        payload = verifyToken(rawToken);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    const userId = payload?.sub;
    if (!userId) throw httpError(401, 'Invalid token');
    if (!['admin', 'super_admin', 'agent'].includes(payload?.role)) throw httpError(403, 'Forbidden');

    const user = await User.findOne({
        _id: userId,
        role: { $in: ['admin', 'super_admin', 'agent'] },
        is_active: true,
        is_deleted: false
    });
    if (!user) throw httpError(404, 'User not found');

    const nextName = req.body?.user_name ?? req.body?.name;
    const nextEmailRaw = req.body?.email;
    const nextPhoneRaw = req.body?.phone_number ?? req.body?.phone;
    const nextProfilePic = req.body?.profile_pic;
    const nextProfilePicBase64 = req.body?.profile_pic_base64;
    const nextProfilePicMimeType = req.body?.profile_pic_mimeType;
    const profilePicFile = pickProfilePicFile(req);

    const details = [];
    const updates = {};

    if (nextName !== undefined) {
        const name = String(nextName || '').trim();
        if (!name || name.length < 2) details.push({ path: 'user_name', message: 'Name must be at least 2 characters' });
        else updates.user_name = name;
    }

    if (profilePicFile || nextProfilePicBase64 !== undefined || (nextProfilePic !== undefined && isDataUri(nextProfilePic))) {
        const filePath = profilePicFile?.path;
        const buffer = profilePicFile?.buffer;

        const uploaded = await uploadImage(
            buffer ? { buffer } : filePath ? { filePath } : isDataUri(nextProfilePic) ? { dataUri: nextProfilePic } : { base64: nextProfilePicBase64, mimeType: nextProfilePicMimeType },
            { folder: process.env.CLOUDINARY_PROFILE_FOLDER || 'profile_pics', tags: ['profile_pic', String(userId)], resourceType: 'image' }
        );

        if (user.profile_pic) {
            deleteImage(user.profile_pic).catch(err => console.error('❌ Old profile pic cleanup failed:', err.message));
        }

        updates.profile_pic = uploaded.secureUrl || uploaded.url || '';
    } else if (nextProfilePic !== undefined) {
        const pic = String(nextProfilePic || '').trim();
        if (pic === '' || isProbablyUrl(pic)) {
            if (user.profile_pic && user.profile_pic !== pic) {
                 deleteImage(user.profile_pic).catch(err => console.error('❌ Old profile pic cleanup failed:', err.message));
            }
            updates.profile_pic = pic;
        } else details.push({ path: 'profile_pic', message: 'profile_pic must be a valid URL, data URI, base64 via profile_pic_base64, or a file upload' });
    }

    if (nextEmailRaw !== undefined) {
        if (!nextEmailRaw || !isEmail(nextEmailRaw)) details.push({ path: 'email', message: 'Valid email is required' });
        else updates.email = normalizeEmail(nextEmailRaw);
    }

    if (nextPhoneRaw !== undefined) {
        const phone = normalizePhone(nextPhoneRaw);
        if (!phone || phone.length < 10 || phone.length > 15) {
            details.push({ path: 'phone_number', message: 'Valid phone number is required (10-15 digits)' });
        } else {
            updates.phone_number = phone;
        }
    }

    if (details.length) throw httpError(400, 'Validation error', details);
    if (!Object.keys(updates).length) throw httpError(400, 'No valid fields to update');

    if (updates.email || updates.phone_number) {
        const or = [];
        if (updates.email) or.push({ email: updates.email });
        if (updates.phone_number) or.push({ phone_number: updates.phone_number });
        const existing = await User.findOne({
            _id: { $ne: user._id },
            $or: or
        }).lean();
        if (existing) throw httpError(409, 'Email or phone number already in use');
    }

    Object.assign(user, updates);
    await user.save();

    const token = createAuthTokenFromUser(user);
    setTokenCookie(res, token);
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: safeUser
    });
});

// Logout admin
const logout_admin = wrapAsync(async (req, res) => {
    const rawToken = extractBearerToken(req);
    if (!rawToken) throw httpError(401, 'Authorization token required');

    let payload;
    try {
        payload = verifyToken(rawToken);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    const userId = payload?.sub;
    if (!userId) throw httpError(401, 'Invalid token');
    if (!['admin', 'super_admin', 'agent'].includes(payload?.role)) throw httpError(403, 'Forbidden');

    const expiresAt = typeof payload.exp === 'number'
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const tokenHash = getTokenHash(rawToken);
    await TokenBlacklist.updateOne(
        { token_hash: tokenHash },
        {
            $setOnInsert: {
                token_hash: tokenHash,
                user: userId,
                role: payload.role,
                expires_at: expiresAt,
                reason: 'logout'
            }
        },
        { upsert: true }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax'
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// change password and pin
const change_password = wrapAsync(async (req, res) => {
    const rawToken = extractBearerToken(req);
    if (!rawToken) throw httpError(401, 'Authorization token required');
    await ensureNotBlacklisted(rawToken);

    let payload;
    try {
        payload = verifyToken(rawToken);
    } catch {
        throw httpError(401, 'Invalid or expired token');
    }

    const userId = payload?.sub;
    if (!userId) throw httpError(401, 'Invalid token');
    if (!['admin', 'super_admin', 'agent'].includes(payload?.role)) throw httpError(403, 'Forbidden');

    const { type, current_password, new_password, current_pin, new_pin } = req.body;

    if (type === 'pin') {
        if (payload.role !== 'agent') {
            throw httpError(403, 'Only agents have a PIN');
        }

        if (!current_pin || !new_pin) {
            throw httpError(400, 'Current PIN and New PIN are required');
        }

        const agent = await Agent.findOne({ agent_details: userId });
        if (!agent) throw httpError(404, 'Agent profile not found');

        if (Number(agent.agent_pin) !== Number(current_pin)) {
            throw httpError(401, 'Invalid current PIN');
        }

        if (Number(current_pin) === Number(new_pin)) {
            throw httpError(400, 'New PIN must be different from current PIN');
        }

        if (new_pin < 1000 || new_pin > 99999999) {
            throw httpError(400, 'PIN must be between 4 and 8 digits');
        }

        agent.agent_pin = new_pin;
        await agent.save();

        return res.status(200).json({
            success: true,
            message: 'PIN changed successfully'
        });
    }

    // Default to password change if type is not 'pin'
    const oldPassword = current_password ?? req.body?.old_password;
    const password = new_password ?? req.body?.password;

    const details = [];
    if (!oldPassword) details.push({ path: 'current_password', message: 'Current password is required' });
    if (!password) details.push({ path: 'new_password', message: 'New password is required' });
    if (details.length) throw httpError(400, 'Validation error', details);

    const pwdError = validatePassword(password);
    if (pwdError) throw httpError(400, 'Validation error', [{ path: 'new_password', message: pwdError }]);
    if (String(oldPassword) === String(password)) {
        throw httpError(400, 'Validation error', [{ path: 'new_password', message: 'New password must be different from current password' }]);
    }

    const user = await User.findOne({
        _id: userId,
        role: { $in: ['admin', 'super_admin', 'agent'] },
        is_active: true,
        is_deleted: false
    }).select('+hash_password');
    if (!user) throw httpError(404, 'User not found');

    if (!verifyPassword(oldPassword, user.hash_password)) {
        throw httpError(401, 'Invalid current password');
    }

    user.hash_password = hashPassword(password);
    await user.save();

    const expiresAt = typeof payload.exp === 'number'
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const tokenHash = getTokenHash(rawToken);
    await TokenBlacklist.updateOne(
        { token_hash: tokenHash },
        {
            $setOnInsert: {
                token_hash: tokenHash,
                user: userId,
                role: payload.role,
                expires_at: expiresAt,
                reason: 'password_change'
            }
        },
        { upsert: true }
    );

    const newToken = createAuthTokenFromUser(user);
    setTokenCookie(res, newToken);
    const safeUser = user.toObject();
    delete safeUser.hash_password;

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        user: safeUser
    });
});

// Get current user
const get_me = wrapAsync(async (req, res) => {
    const user = req.auth.user.toObject();
    delete user.hash_password;

    if (user.role === 'agent') {
        const agent = await Agent.findOne({ agent_details: user._id, is_active: true })
            .populate('assigned_properties', 'property_title listing_type property_status')
            .lean();
        if (agent) {
            user.agent_profile = agent;
        }
    }

    res.status(200).json({
        success: true,
        user
    });
});

module.exports = {
    register_admin,
    login_admin,
    login_agent,
    update_admin_profile,
    logout_admin,
    change_password,
    get_me
};
