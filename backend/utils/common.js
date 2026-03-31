const crypto = require('crypto');
const TokenBlacklist = require('../model/tokenBlacklist.model');

function httpError(statusCode, message, details) {
    const err = new Error(message);
    err.statusCode = statusCode;
    if (Array.isArray(details) && details.length) err.details = details;
    return err;
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
    return String(value || '').replace(/[^\d]/g, '');
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function validatePassword(password) {
    const str = String(password || '');
    if (str.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Za-z]/.test(str) || !/\d/.test(str)) return 'Password must include at least 1 letter and 1 number';
    return null;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const params = { N: 16384, r: 8, p: 1, dkLen: 64 };
    const derivedKey = crypto.scryptSync(String(password), salt, params.dkLen, {
        N: params.N,
        r: params.r,
        p: params.p
    });
    return `scrypt$${params.N}$${params.r}$${params.p}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

function verifyPassword(password, stored) {
    const parts = String(stored || '').split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const saltHex = parts[4];
    const hashHex = parts[5];
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = crypto.scryptSync(String(password), salt, expected.length, { N, r, p });
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
}

function extractBearerToken(req) {
    const authHeader = String(req.headers?.authorization || '').trim();
    if (authHeader) {
        return authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice(7).trim()
            : authHeader;
    }
    const token = String(req.cookies?.token || '').trim();
    if (!token && process.env.NODE_ENV === 'production') {
        console.warn(`[extractBearerToken] No token found. Cookies present: ${Object.keys(req.cookies || {}).join(', ')}`);
    }
    return token;
}

function getTokenHash(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function pickProfilePicFile(req) {
    if (req?.file) return req.file;
    const files = req?.files;
    if (!files) return null;
    if (Array.isArray(files)) {
        return files.find(f => ['profile_pic', 'profilePic', 'file', 'image'].includes(f?.fieldname)) || null;
    }
    const candidate = files.profile_pic || files.profilePic || files.file || files.image;
    if (Array.isArray(candidate)) return candidate[0] || null;
    return candidate || null;
}

function isProbablyUrl(value) {
    const str = String(value || '').trim().toLowerCase();
    return str.startsWith('http://') || str.startsWith('https://');
}

function isDataUri(value) {
    return String(value || '').trim().toLowerCase().startsWith('data:');
}

async function ensureNotBlacklisted(token) {
    const tokenHash = getTokenHash(token);
    const blocked = await TokenBlacklist.findOne({ token_hash: tokenHash }).select('_id').lean();
    if (blocked) throw httpError(401, 'Invalid or expired token');
}

function generateSlug(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // remove non-word chars (except spaces & hyphens)
        .replace(/[\s_-]+/g, '-') // replace spaces, underscores, multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // trim hyphens from start & end
}

module.exports = {
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
    ensureNotBlacklisted,
    generateSlug
};
