/**
 * AUTHENTICATION MIDDLEWARE (Clean Version)
 * 
 * Route protection and authentication middleware
 * Uses auth.service for business logic
 * 
 * @module middleware/auth.middleware
 */

const User = require('../Models/User.models');
const authConfig = require('../config/auth.config');
const authService = require('../services/auth.service');

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate request using access token
 * Verifies JWT and attaches user to request
 * 
 * @usage
 * router.get('/profile', authenticate, controller.getProfile);
 */
const authenticate = async (req, res, next) => {
    try {
        // 1. Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.UNAUTHORIZED,
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // 2. Check if token is blacklisted
        const blacklisted = await authService.isTokenBlacklisted(token);
        if (blacklisted) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_BLACKLISTED,
            });
        }

        // 3. Verify token
        let decoded;
        try {
            decoded = authService.verifyAccessToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        // 4. Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // 5. Check if account is active
        if (user.status === 'suspended' || user.status === 'deleted') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active',
            });
        }

        // 6. Attach user and token to request
        req.user = user;
        req.token = token;

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};

/**
 * Optional authentication (doesn't fail if no token)
 * Useful for routes that work differently for logged-in users
 * 
 * @usage
 * router.get('/posts', optionalAuth, controller.getPosts);
 * // If logged in: req.user exists
 * // If not logged in: req.user is null
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // If no token, continue without user
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.replace('Bearer ', '');

        // Try to verify token
        try {
            const decoded = authService.verifyAccessToken(token);
            const user = await User.findById(decoded.id).select('-password');
            req.user = user || null;
        } catch (error) {
            // Invalid token - continue without user
            req.user = null;
        }

        next();

    } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        next();
    }
};

/**
 * Require specific role(s)
 * Must be used AFTER authenticate middleware
 * 
 * @param {...string} roles - Required roles
 * @usage
 * router.delete('/users/:id', 
 *   authenticate, 
 *   requireRole('admin', 'moderator'), 
 *   controller.deleteUser
 * );
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.UNAUTHORIZED,
            });
        }

        // Check if user has required role
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.FORBIDDEN,
                required: roles,
                current: req.user.role,
            });
        }

        next();
    };
};

/**
 * Require specific tier (subscription level)
 * Must be used AFTER authenticate middleware
 * 
 * @param {...string} tiers - Required tiers
 * @usage
 * router.post('/generation/video', 
 *   authenticate, 
 *   requireTier('premium', 'enterprise'), 
 *   controller.generateVideo
 * );
 */
const requireTier = (...tiers) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.UNAUTHORIZED,
            });
        }

        if (!tiers.includes(req.user.tier)) {
            return res.status(403).json({
                success: false,
                message: 'This feature requires a higher subscription tier',
                requiredTier: tiers,
                currentTier: req.user.tier,
            });
        }

        next();
    };
};

/**
 * Verify email is confirmed
 * Must be used AFTER authenticate middleware
 * 
 * @usage
 * router.post('/posts', authenticate, requireVerifiedEmail, controller.createPost);
 */
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: authConfig.AUTH_CONSTANTS.ERRORS.UNAUTHORIZED,
        });
    }

    if (!req.user.emailVerified) {
        return res.status(403).json({
            success: false,
            message: authConfig.AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED,
        });
    }

    next();
};

/**
 * Check if user owns the resource
 * Must be used AFTER authenticate middleware
 * 
 * @param {string} paramName - Name of URL parameter containing resource owner ID
 * @usage
 * router.put('/posts/:userId/profile', 
 *   authenticate, 
 *   requireOwnership('userId'), 
 *   controller.updateProfile
 * );
 */
const requireOwnership = (paramName = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.UNAUTHORIZED,
            });
        }

        const resourceOwnerId = req.params[paramName];

        // Allow if user is admin or owns the resource
        if (req.user.role === 'admin' || req.user.id === resourceOwnerId) {
            return next();
        }

        res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource',
        });
    };
};

// ============================================================================
// REFRESH TOKEN HANDLER
// ============================================================================

/**
 * Refresh access token using refresh token
 * This is a route handler, not middleware
 * 
 * @usage
 * router.post('/auth/refresh', refreshAccessToken);
 */
const refreshAccessToken = async (req, res) => {
    try {
        // 1. Get refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided',
            });
        }

        // 2. Check if blacklisted
        const blacklisted = await authService.isTokenBlacklisted(refreshToken);
        if (blacklisted) {
            return res.status(401).json({
                success: false,
                message: authConfig.AUTH_CONSTANTS.ERRORS.TOKEN_BLACKLISTED,
            });
        }

        // 3. Verify refresh token
        let decoded;
        try {
            decoded = authService.verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        // 4. Get user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // 5. Generate new access token
        const newAccessToken = authService.generateAccessToken(user);

        // 6. Optionally rotate refresh token
        let newRefreshToken = refreshToken;
        if (authConfig.jwt.refreshToken.rotateTokens) {
            // Blacklist old refresh token
            await authService.blacklistToken(refreshToken, 'refresh');

            // Generate new refresh token
            newRefreshToken = authService.generateRefreshToken(user);

            // Set new refresh token in cookie
            res.cookie(
                authConfig.cookie.refreshTokenCookieName,
                newRefreshToken,
                authConfig.cookie.options
            );
        }

        // 7. Send new access token
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                ...(authConfig.jwt.refreshToken.rotateTokens && {
                    refreshToken: newRefreshToken
                }),
            },
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
        });
    }
};

// ============================================================================
// LOGOUT HANDLER
// ============================================================================

/**
 * Logout user by blacklisting tokens
 * 
 * @usage
 * router.post('/auth/logout', authenticate, logout);
 */
const logout = async (req, res) => {
    try {
        // 1. Blacklist access token
        if (req.token) {
            await authService.blacklistToken(req.token, 'access');
        }

        // 2. Blacklist refresh token
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (refreshToken) {
            await authService.blacklistToken(refreshToken, 'refresh');
        }

        // 3. Clear refresh token cookie
        res.clearCookie(authConfig.cookie.refreshTokenCookieName);

        // 4. Send response
        res.json({
            success: true,
            message: 'Logged out successfully',
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
};

/**
 * Logout from all devices (blacklist all user tokens)
 * 
 * @usage
 * router.post('/auth/logout-all', authenticate, logoutAll);
 */
const logoutAll = async (req, res) => {
    try {
        // Blacklist all tokens for this user
        await authService.blacklistAllUserTokens(req.user.id);

        // Clear current refresh token cookie
        res.clearCookie(authConfig.cookie.refreshTokenCookieName);

        res.json({
            success: true,
            message: 'Logged out from all devices',
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout from all devices',
        });
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Middleware
    authenticate,
    optionalAuth,
    requireRole,
    requireTier,
    requireVerifiedEmail,
    requireOwnership,

    // Handlers (route controllers)
    refreshAccessToken,
    logout,
    logoutAll,
};