const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const aiConfig = require("../config/ai-services.config");

/**
 * Safely generate a rate-limit key:
 * - Logged-in users → user:<id>
 * - Anonymous users → IPv6-safe IP key
 */
const userOrIpKey = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return ipKeyGenerator(req);
};

/**
 * Global limiter (entire app)
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth limiter (login / register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI / generation limiter
 */
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: userOrIpKey,
  skip: (req) => req.user?.tier === "premium",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI provider–specific rate limiting
 * (Redis / DB-backed later)
 */
const aiRateLimit = function (req, res, next) {
  // Placeholder:
  // Use aiConfig.rateLimit + Redis token bucket later
  next();
};

module.exports = {
  globalLimiter,
  authLimiter,
  generationLimiter,
  aiRateLimit,
};
