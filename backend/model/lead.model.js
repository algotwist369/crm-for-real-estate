const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    requirement: {
        type: String,
        required: true,
        trim: true
    },
    budget: {
        type: String,
        required: true,
        trim: true
    },
    budget_min: {
        type: Number,
        min: 0
    },
    budget_max: {
        type: Number,
        min: 0
    },
    inquiry_for: {
        type: String,
        required: true,
        trim: true
    },
    client_type: {
        type: String,
        enum: ['buying', 'renting', 'investing', 'selling', 'other'],
        default: 'buying',
        index: true
    },
    source: {
        type: String,
        enum: ['website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement','personal', 'other'],
        default: 'website',
        required: true
    },
    properties: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Properties',
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'lost', 'converted', 'archived', 'follow_up', 'wasted'],
        default: 'new'
    },
    next_follow_up_date: {
        type: Date,
        index: true
    },
    follow_up_status: {
        type: String,
        enum: ['pending', 'done', 'missed', 'rescheduled'],
        default: 'pending',
        index: true
    },
    followed_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    last_contacted_at: {
        type: Date
    },
    converted_at: {
        type: Date
    },
    lost_reason: {
        type: String,
        trim: true,
        default: ''
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    assigned_to: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    tags: [{
        type: String,
        trim: true
    }],
    notes: {
        type: String,
        default: '',
        trim: true
    },
    utm: {
        source: { type: String, trim: true, default: '' },
        medium: { type: String, trim: true, default: '' },
        campaign: { type: String, trim: true, default: '' },
        term: { type: String, trim: true, default: '' },
        content: { type: String, trim: true, default: '' },
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    tenant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },

}, { timestamps: true });

leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1, priority: 1 });
leadSchema.index({ assigned_to: 1, status: 1 });
leadSchema.index({ created_by: 1, createdAt: -1 });
leadSchema.index({ follow_up_status: 1, next_follow_up_date: 1 });

module.exports = mongoose.model('Lead', leadSchema);
