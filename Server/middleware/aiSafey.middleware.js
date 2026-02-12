const aiConfig = require('../config/ai-services.config');

module.exports = function aiSafety(req, res, next) {
  if (!aiConfig.features.moderation) return next();

  // moderation logic (OpenAI / rules)
  next();
};
