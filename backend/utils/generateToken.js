const crypto = require('crypto');

function base64UrlEncode(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecodeToString(input) {
    const padLength = (4 - (input.length % 4)) % 4;
    const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
    return Buffer.from(padded, 'base64').toString('utf8');
}

function getTokenSecret(explicitSecret) {
    const secret = explicitSecret || process.env.TOKEN_SECRET || process.env.JWT_SECRET;
    if (!secret || typeof secret !== 'string' || secret.trim().length < 16) {
        throw new Error('TOKEN_SECRET (or JWT_SECRET) must be set and at least 16 characters long');
    }
    return secret;
}

function signHmacSha256(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function createToken(payload, options = {}) {
    const secret = getTokenSecret(options.secret);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number.isFinite(options.expiresInSeconds)
        ? options.expiresInSeconds
        : 60 * 60 * 24 * 7;

    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
        ...payload,
        iat: nowSeconds,
        exp: nowSeconds + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(body));
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const signature = signHmacSha256(unsigned, secret);
    return `${unsigned}.${signature}`;
}

function verifyToken(token, options = {}) {
    const secret = getTokenSecret(options.secret);
    if (!token || typeof token !== 'string') {
        throw new Error('Token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const expected = signHmacSha256(unsigned, secret);
    if (typeof signature !== 'string' || signature.length !== expected.length) {
        throw new Error('Invalid token signature');
    }
    const isValidSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!isValidSignature) {
        throw new Error('Invalid token signature');
    }

    let payload;
    try {
        const payloadRaw = base64UrlDecodeToString(encodedPayload);
        payload = JSON.parse(payloadRaw);
    } catch {
        throw new Error('Invalid token payload');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < nowSeconds) {
        throw new Error('Token expired');
    }

    return payload;
}

function createRandomToken(byteLength = 32) {
    if (!Number.isInteger(byteLength) || byteLength < 16) {
        throw new Error('byteLength must be an integer >= 16');
    }
    return crypto.randomBytes(byteLength).toString('hex');
}

function createAuthTokenFromUser(user, options = {}) {
    if (!user) {
        throw new Error('user is required');
    }
    const userId = user._id ? String(user._id) : undefined;
    return createToken(
        {
            sub: userId,
            role: user.role,
            email: user.email
        },
        options
    );
}

module.exports = {
    createToken,
    verifyToken,
    createRandomToken,
    createAuthTokenFromUser
};
