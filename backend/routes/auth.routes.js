const express = require('express');
const authController = require('../controller/auth.controller');
const { uploadProfilePic } = require('./upload');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/admin/register', authController.register_admin); //tested
router.post('/login', authController.login_user); // unified login for all roles
router.post('/logout', authenticate, authController.logout_admin); // tested - works for all roles
router.get('/me', authenticate, authController.get_me);

router.post('/change-password', authenticate, authController.change_password); // pending - works for agent

router.patch('/admin/profile', requireAdmin, uploadProfilePic, authController.update_admin_profile);
router.post('/admin/change-password', requireAdmin, authController.change_password);
router.get('/test-route', (req, res) => res.json({ message: 'Auth routes are working' }));

module.exports = router;
