const Notification = require('../model/notification.model');

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.auth.user._id || req.auth.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ recipient: userId }),
            Notification.countDocuments({ recipient: userId, is_read: false })
        ]);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    total,
                    unread: unreadCount,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.user._id || req.auth.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { is_read: true },
            { returnDocument: 'after' }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.auth.user._id || req.auth.user.id;

        await Notification.updateMany(
            { recipient: userId, is_read: false },
            { is_read: true }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const clearAll = async (req, res) => {
    try {
        const userId = req.auth.user._id || req.auth.user.id;

        await Notification.deleteMany({ recipient: userId });

        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteOne = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.user._id || req.auth.user.id;

        const result = await Notification.deleteOne({ _id: id, recipient: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteOne
};
