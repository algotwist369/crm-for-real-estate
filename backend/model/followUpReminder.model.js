const mongoose = require('mongoose');

const followUpReminderSchema = new mongoose.Schema({

    channel: [{
        type: String,
        enum: ['email', 'sms', 'in_app','whatsapp', 'call', 'other'],
       default: 'email',
    }],
    lead: {
        type: mongoose.Schema.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['before_1h', 'before_5m', 'overdue_grace'],
        required: true,
        index: true
    },
    due_at: {
        type: Date,
        required: true,
        index: true
    },
    recipients: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'cancelled', 'error'],
        default: 'pending',
        index: true
    },
    sent_at: {
        type: Date
    },
    processing_at: {
        type: Date
    },
    error_message: {
        type: String,
        trim: true,
        default: ''
    },
    cleanup_at: {
        type: Date,
        required: true
    }
}, { timestamps: true });

followUpReminderSchema.index({ lead: 1, type: 1 }, { unique: true });
followUpReminderSchema.index({ status: 1, due_at: 1 });
followUpReminderSchema.index({ cleanup_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FollowUpReminder', followUpReminderSchema);
