const rateLimit = require('express-rate-limit');
const aiConfig = require('../config/ai-services.config');

const userOrIpKey = (req) =>
  req.user?.id ? `user:${req.user.id}` : req.ip;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: userOrIpKey,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: userOrIpKey,
  skip: (req) => req.user?.tier === 'premium',
});

// AI rate limiter middleware
const aiRateLimit = function (req, res, next) {
  // placeholder (Redis / DB later)
  // uses aiConfig.rateLimit
  next();
};

module.exports = {
  globalLimiter,
  authLimiter,
  generationLimiter,
  aiRateLimit,
};
