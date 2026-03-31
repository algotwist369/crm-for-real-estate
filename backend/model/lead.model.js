const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true
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
    currency: {
        type: String,
        enum: ['₹', '$', 'AED'],
        default: '₹'
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
        enum: ['website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement', 'personal', 'walk_in', 'other'],
        default: 'website',
        required: true,
        index: true
    },
    properties: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Properties',
        index: true
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
        index: true
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'lost', 'converted', 'archived', 'follow_up', 'wasted', 'closed'],
        default: 'new',
        index: true
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
        index: true
    }],
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: String,
        trim: true,
        index: true
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
        required: true,
        index: true
    },
}, { timestamps: true });

// Compound Indexes for Performance
leadSchema.index({ tenant_id: 1, status: 1 });
leadSchema.index({ tenant_id: 1, assigned_to: 1 });
leadSchema.index({ tenant_id: 1, createdAt: -1 });
leadSchema.index({ tenant_id: 1, next_follow_up_date: 1, follow_up_status: 1 });
leadSchema.index({ tenant_id: 1, email: 1 });
leadSchema.index({ tenant_id: 1, phone: 1 });

module.exports = mongoose.model('Lead', leadSchema);
