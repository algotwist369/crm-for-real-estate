const express = require('express');
const propertyController = require('../controller/property.controller');
const { uploadPropertyPhotos } = require('./upload');
const { requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/properties', requireRoles(['admin', 'super_admin', 'agent']), propertyController.get_all_properties);
router.get('/properties/:id', requireRoles(['admin', 'super_admin', 'agent']), propertyController.get_property_by_id);
router.post('/properties', requireRoles(['admin', 'super_admin', 'agent']), uploadPropertyPhotos, propertyController.create_property);
router.patch('/properties/:id', requireRoles(['admin', 'super_admin', 'agent']), uploadPropertyPhotos, propertyController.update_property);
router.patch('/properties/:id/status', requireRoles(['admin', 'super_admin', 'agent']), propertyController.update_property_status);
router.delete('/properties/:id', requireRoles(['admin', 'super_admin', 'agent']), propertyController.delete_property);

module.exports = router;
