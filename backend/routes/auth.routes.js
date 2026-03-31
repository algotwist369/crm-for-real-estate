const express = require('express');
const authController = require('../controller/auth.controller');
const { uploadProfilePic } = require('./upload');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { authSchemas } = require('../utils/validation');

const router = express.Router();

router.post('/admin/register', validateRequest(authSchemas.registerAdmin), authController.register_admin); //tested
router.post('/admin/login', validateRequest(authSchemas.login), authController.login_admin); //tested
router.post('/logout', authenticate, authController.logout_admin); // tested - works for both admin and agent
router.get('/me', authenticate, authController.get_me);

router.post('/agent/login', validateRequest(authSchemas.login), authController.login_agent); //tested
router.post('/change-password', authenticate, authController.change_password); // pending - works for agent

router.patch('/admin/profile', requireAdmin, uploadProfilePic, authController.update_admin_profile);
router.post('/admin/change-password', requireAdmin, authController.change_password);

module.exports = router;
