const express = require('express');
const adminController = require('../Controllers/admin.Controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.get('/generations', adminController.listGenerations);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/generations/:id', adminController.deleteGeneration);

router.get('/configs', adminController.getConfigs);
router.post('/configs', adminController.updateConfig);
router.get('/moderation', adminController.getModerationQueue);
router.patch('/generations/:id/moderate', adminController.moderateGeneration);

module.exports = router;
