const mongoose = require('mongoose');
const { getSocialMediaConnection } = require('../config/moduleDb');

const platformStatusSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['not_requested', 'queued', 'publishing', 'published', 'failed', 'retrying', 'rate_limited', 'token_expired', 'skipped'],
        default: 'not_requested',
        index: true
    },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' },
    external_post_id: String,
    external_url: String,
    attempts: { type: Number, default: 0 },
    last_error: String,
    last_error_code: String,
    published_at: Date,
    next_retry_at: Date
}, { _id: false });

const mediaSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String },
    resource_type: { type: String, enum: ['image', 'video'], required: true },
    mime_type: String,
    bytes: Number,
    width: Number,
    height: Number,
    cleanup_status: {
        type: String,
        enum: ['pending', 'queued', 'deleted', 'failed', 'skipped'],
        default: 'pending'
    },
    cleanup_attempts: { type: Number, default: 0 },
    cleanup_error: String
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: String,
    reason: String,
    platform: String,
    at: { type: Date, default: Date.now },
    job_id: String
}, { _id: false });

const socialPostSchema = new mongoose.Schema({
    crm_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crm_org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caption: { type: String, trim: true, default: '' },
    ai_caption_prompt: { type: String, trim: true },
    media: [mediaSchema],
    social_account_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount', index: true }],
    platforms: [{ type: String, enum: ['facebook', 'instagram'] }],
    publish_mode: { type: String, enum: ['now', 'schedule'], default: 'now', index: true },
    schedule_time: { type: Date, index: true },
    timezone: { type: String, default: 'UTC' },
    status: {
        type: String,
        enum: ['draft', 'queued', 'scheduled', 'publishing', 'published', 'partial_success', 'failed', 'cancelled', 'cleanup_pending', 'deleted'],
        default: 'draft',
        index: true
    },
    platform_status: {
        facebook: { type: platformStatusSchema, default: () => ({}) },
        instagram: { type: platformStatusSchema, default: () => ({}) }
    },
    idempotency_key: { type: String, required: true },
    publish_lock: {
        locked_by: String,
        locked_at: Date
    },
    queued_at: Date,
    publish_started_at: Date,
    published_at: Date,
    failed_at: Date,
    cleanup_queued_at: Date,
    deleted_at: Date,
    last_error: String,
    scheduler_fallback_required: { type: Boolean, default: false, index: true },
    status_history: [statusHistorySchema],
    retry_count: { type: Number, default: 0 }
}, { timestamps: true });

socialPostSchema.index({ crm_org_id: 1, status: 1, schedule_time: 1 });
socialPostSchema.index({ crm_org_id: 1, createdAt: -1 });
socialPostSchema.index({ crm_org_id: 1, idempotency_key: 1 }, { unique: true });
socialPostSchema.index({ status: 1, scheduler_fallback_required: 1, schedule_time: 1 });

module.exports = getSocialMediaConnection().model('SocialPost', socialPostSchema);
