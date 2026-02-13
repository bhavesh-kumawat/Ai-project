const express = require('express');
const adminController = require('../Controllers/admin.Controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.get('/generations', adminController.listGenerations);

module.exports = router;
