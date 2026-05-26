const mongoose = require('mongoose');
const { getSocialMediaConnection } = require('../config/moduleDb');

const socialWorkerHealthSchema = new mongoose.Schema({
    worker_name: { type: String, required: true, unique: true },
    status: { type: String, enum: ['starting', 'healthy', 'degraded', 'stopped'], default: 'starting', index: true },
    pid: Number,
    last_heartbeat_at: { type: Date, index: true },
    queues: { type: mongoose.Schema.Types.Mixed },
    last_error: String
}, { timestamps: true });

module.exports = getSocialMediaConnection().model('SocialWorkerHealth', socialWorkerHealthSchema);
