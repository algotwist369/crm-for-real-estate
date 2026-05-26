const mongoose = require('mongoose');
const { getSocialMediaConnection } = require('../config/moduleDb');

const tokenSchema = new mongoose.Schema({
    encrypted: { type: String, required: true, select: false },
    iv: { type: String, required: true, select: false },
    tag: { type: String, required: true, select: false }
}, { _id: false });

const socialAccountSchema = new mongoose.Schema({
    crm_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crm_org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['facebook', 'instagram'], required: true, index: true },
    account_type: {
        type: String,
        enum: ['facebook_page', 'instagram_business', 'instagram_creator'],
        required: true,
        index: true
    },
    provider_account_id: { type: String, required: true, trim: true },
    platform_account_id: { type: String, trim: true, index: true },
    provider_parent_id: { type: String, trim: true },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    picture_url: { type: String, trim: true },
    access_token: { type: tokenSchema, required: true, select: false },
    token_expires_at: { type: Date, index: true },
    permissions: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'permission_denied', 'disconnected', 'deleted'],
        default: 'active',
        index: true
    },
    last_error: {
        message: String,
        code: String,
        at: Date
    },
    disconnected_at: Date
}, { timestamps: true });

socialAccountSchema.index({ crm_org_id: 1, platform: 1, status: 1 });
socialAccountSchema.index({ crm_org_id: 1, provider_account_id: 1, platform: 1 }, { unique: true });

module.exports = getSocialMediaConnection().model('SocialAccount', socialAccountSchema);
