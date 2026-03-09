const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    profile_pic: {
        type: String,
        required: true
    },
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone_number: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'agent', 'super_admin'],
        default: 'agent',
        required: true
    },
    hash_password: {
        type: String,
        required: true
    },
    settings: {
        type: mongoose.Schema.ObjectId,
        ref: 'Settings',
    },
    is_paid:{
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);