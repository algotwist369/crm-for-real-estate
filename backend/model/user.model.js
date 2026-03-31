const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    profile_pic: {
        type: String,
        trim: true,
        default: ''
    },
    user_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        index: true
    },
    phone_number: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    role: {
        type: String,
        enum: ['admin', 'agent', 'super_admin'],
        default: 'agent',
        required: true,
        index: true
    },
    hash_password: {
        type: String,
        required: true,
        select: false
    },
    settings: {
        type: mongoose.Schema.ObjectId,
        ref: 'Settings',
    },
    last_login_at: {
        type: Date
    },
    is_paid:{
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    is_deleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deleted_at: {
        type: Date
    },
    tenant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
}, { timestamps: true });

userSchema.index({ role: 1, is_active: 1, tenant_id: 1 });
userSchema.index({ tenant_id: 1, is_deleted: 1 });

module.exports = mongoose.model('User', userSchema);
