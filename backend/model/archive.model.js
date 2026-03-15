const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
    leads: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Lead',
            index: true
        }
    ],
    properties: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Property',
            index: true
        }
    ],
    agents: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            index: true
        }
    ],
    restored_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    // before 1 day for delete send reminder
    send_reminder: {
        type: mongoose.Schema.ObjectId,
        ref: 'Notification',
    }
}
    , { timestamps: true });
export default mongoose.model('Archive', archiveSchema);