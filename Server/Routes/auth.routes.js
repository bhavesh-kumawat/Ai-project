const express = require('express');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { login, register, forgotPassword } = require('../Controllers/auth.Controller');

const router = express.Router();


router.post('/login', authLimiter, login);

router.post('/register', authLimiter, register);

router.post('/forgot-password', authLimiter, forgotPassword);

module.exports = router;
