const jwt = require('jsonwebtoken');
const { jwt: jwtConfig, auth: authConfig } = require('../config/auth.config');
const User = require('../Models/User.models');
const { AppError } = require('../middleware/error.middleware');

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate Access Token
 * @param {Object} user - User object
 * @returns {string} JWT Access Token
 */
exports.generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            tier: user.tier,
        },
        jwtConfig.accessToken.secret,
        {
            expiresIn: jwtConfig.accessToken.expiresIn,
            issuer: jwtConfig.accessToken.issuer,
            audience: jwtConfig.accessToken.audience,
        }
    );
};

/**
 * Generate Refresh Token
 * @param {Object} user - User object
 * @returns {string} JWT Refresh Token
 */
exports.generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
        },
        jwtConfig.refreshToken.secret,
        {
            expiresIn: jwtConfig.refreshToken.expiresIn,
            issuer: jwtConfig.refreshToken.issuer,
            audience: jwtConfig.refreshToken.audience,
        }
    );
};

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

/**
 * Verify Access Token
 * @param {string} token - JWT Access Token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
exports.verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.accessToken.secret, {
            issuer: jwtConfig.accessToken.issuer,
            audience: jwtConfig.accessToken.audience,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_EXPIRED, 401);
        }
        throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.INVALID_TOKEN, 401);
    }
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT Refresh Token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
exports.verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.refreshToken.secret, {
            issuer: jwtConfig.refreshToken.issuer,
            audience: jwtConfig.refreshToken.audience,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_EXPIRED, 401);
        }
        throw new AppError(authConfig.AUTH_CONSTANTS.ERRORS.INVALID_TOKEN, 401);
    }
};

// ============================================================================
// TOKEN BLACKLIST
// ============================================================================

// In-memory blacklist for simple implementation
// In production, use Redis or Database
const tokenBlacklist = new Set();

/**
 * Blacklist a token
 * @param {string} token - Token to blacklist
 * @param {string} type - 'access' or 'refresh'
 */
exports.blacklistToken = async (token, type = 'access') => {
    // For production, implementation depends on storage (Redis/DB)
    // Here we use in-memory Set for demonstration
    tokenBlacklist.add(token);

    // Set timeout to remove from blacklist after expiry to prevent memory leak
    const expiryMs = authConfig.getTokenExpiryMs(type);
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, expiryMs);

    return true;
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} True if blacklisted
 */
exports.isTokenBlacklisted = async (token) => {
    return tokenBlacklist.has(token);
};

/**
 * Blacklist all tokens for a user
 * @param {string} userId - User ID
 */
exports.blacklistAllUserTokens = async (userId) => {
    // In a real implementation with Redis, you might store tokens with userId as key prefix
    // For this in-memory mock, we can't easily do this without iterating everything
    // This is a placeholder for the concept
    console.log(`Blacklisting all tokens for user ${userId}`);
    return true;
};
