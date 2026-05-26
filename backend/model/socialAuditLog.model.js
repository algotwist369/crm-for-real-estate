const mongoose = require('mongoose');
const { getSocialMediaConnection } = require('../config/moduleDb');

const socialAuditLogSchema = new mongoose.Schema({
    crm_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crm_org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
        type: String,
        enum: ['connect', 'disconnect', 'create', 'schedule', 'publish', 'retry', 'fail', 'delete', 'cleanup', 'caption'],
        required: true,
        index: true
    },
    entity_type: { type: String, enum: ['account', 'post', 'queue', 'caption'], required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    platform: { type: String, enum: ['facebook', 'instagram', 'system', null], default: null },
    message: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

socialAuditLogSchema.index({ crm_org_id: 1, createdAt: -1 });
socialAuditLogSchema.index({ entity_id: 1, createdAt: -1 });

module.exports = getSocialMediaConnection().model('SocialAuditLog', socialAuditLogSchema);
