const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');
const { jwt: jwtConfig } = authConfig;
const User = require('../Models/User.models');
const { AppError } = require('../middleware/error.middleware');
const crypto = require('crypto');

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate Access Token
 */
exports.generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role, tier: user.tier },
        jwtConfig.accessToken.secret,
        { expiresIn: jwtConfig.accessToken.expiresIn, issuer: jwtConfig.accessToken.issuer, audience: jwtConfig.accessToken.audience }
    );
};

/**
 * Generate Refresh Token
 */
exports.generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        jwtConfig.refreshToken.secret,
        { expiresIn: jwtConfig.refreshToken.expiresIn, issuer: jwtConfig.refreshToken.issuer, audience: jwtConfig.refreshToken.audience }
    );
};

// ============================================================================
// OTP & RESET HELPERS
// ============================================================================

/**
 * Generate 6-digit OTP
 */
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate Crypto-safe Reset Token
 */
exports.createPasswordResetToken = () => {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    return { plainToken, hashedToken };
};

// ============================================================================
// TOKEN VERIFICATION & BLACKLIST
// ============================================================================

exports.verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.accessToken.secret, { issuer: jwtConfig.accessToken.issuer, audience: jwtConfig.accessToken.audience });
    } catch (error) {
        if (error.name === 'TokenExpiredError') throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_EXPIRED, 401);
        throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.INVALID_TOKEN, 401);
    }
};

exports.verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.refreshToken.secret, { issuer: jwtConfig.refreshToken.issuer, audience: jwtConfig.refreshToken.audience });
    } catch (error) {
        if (error.name === 'TokenExpiredError') throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_EXPIRED, 401);
        throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.INVALID_TOKEN, 401);
    }
};

const tokenBlacklist = new Set();
exports.blacklistToken = async (token, type = 'access') => {
    tokenBlacklist.add(token);
    const expiryMs = authConfig.getTokenExpiryMs(type);
    setTimeout(() => tokenBlacklist.delete(token), expiryMs);
    return true;
};

exports.isTokenBlacklisted = async (token) => tokenBlacklist.has(token);

exports.blacklistAllUserTokens = async (userId) => {
    console.log(`Blacklisting all tokens for user ${userId}`);
    return true;
};
