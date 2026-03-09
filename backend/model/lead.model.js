const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    requirement: {
        type: String,
        required: true
    },
    budget: {
        type: String,
        required: true
    },
    inquiry_for: {
        type: String,
        required: true
    },
    source: {
        type: String,
        enum: ['website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement', 'other'],
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
        type: mongoose.Schema.ObjectId,
        ref: 'FollowUp',
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

});

module.exports = mongoose.model('Lead', leadSchema);