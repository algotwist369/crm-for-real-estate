const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token_hash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    role: {
        type: String,
        index: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        trim: true,
        default: ''
    }
}, { timestamps: true });

tokenBlacklistSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
