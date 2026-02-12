const Joi = require('joi');
require('dotenv').config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    MONGO_URI: Joi.string().optional(),
    MONGO_URL: Joi.string().optional(),

    // JWT
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

    // Razorpay (Optional - for payment gateway)
    RAZORPAY_KEY_ID: Joi.string().optional().allow(''),
    RAZORPAY_KEY_SECRET: Joi.string().optional().allow(''),

}).unknown();

const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongo: {
        uri: envVars.MONGO_URI || envVars.MONGO_URL,
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpiry: envVars.JWT_ACCESS_EXPIRY,
        refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
    },
    razorpay: {
        keyId: envVars.RAZORPAY_KEY_ID,
        keySecret: envVars.RAZORPAY_KEY_SECRET,
    }
};
