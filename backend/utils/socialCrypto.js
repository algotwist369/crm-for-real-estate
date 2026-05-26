const crypto = require('crypto');

function getKey() {
    const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || process.env.TOKEN_SECRET || process.env.JWT_SECRET;
    if (!raw) throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY or TOKEN_SECRET is required for social token encryption');
    return crypto.createHash('sha256').update(String(raw)).digest();
}

function encryptToken(token) {
    if (!token) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(String(token), 'utf8'), cipher.final()]);
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64')
    };
}

function decryptToken(payload = {}) {
    if (!payload.encrypted || !payload.iv || !payload.tag) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.encrypted, 'base64')),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}

module.exports = {
    encryptToken,
    decryptToken
};
