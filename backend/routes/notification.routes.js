const express = require('express');
const { 
    getMyNotifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    deleteOne
} = require('../controller/notification.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All notification routes are protected
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-all', clearAll);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteOne);

module.exports = router;
