/**
 * AUTHENTICATION CONFIGURATION
 * 
 * This file handles all authentication-related configurations including:
 * - JWT (JSON Web Tokens)
 * - Access Tokens (short-lived, for API requests)
 * - Refresh Tokens (long-lived, to get new access tokens)
 * - Password hashing
 * - Token blacklisting
 * - Session management
 * 
 * @module config/auth.config
 */

require('dotenv').config();
const crypto = require('crypto');

// ============================================================================
// JWT CONFIGURATION
// ============================================================================

const jwtConfig = {
    // ========================================================================
    // ACCESS TOKEN (Short-lived, used for API requests)
    // ========================================================================
    accessToken: {
        // Secret key for signing access tokens
        // IMPORTANT: Use a strong, random secret in production!
        secret: process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex'),
        
        // How long access token is valid
        // Short lifetime for security (if stolen, expires quickly)
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m', // 15 minutes
        
        // Token issuer (your app name)
        issuer: process.env.JWT_ISSUER || 'your-app-name',
        
        // Token audience (who can use this token)
        audience: process.env.JWT_AUDIENCE || 'your-app-users',
        
        // Algorithm for signing
        algorithm: 'HS256', // HMAC SHA-256
    },
    
    // ========================================================================
    // REFRESH TOKEN (Long-lived, used to get new access tokens)
    // ========================================================================
    refreshToken: {
        // Separate secret for refresh tokens (more secure)
        secret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex'),
        
        // How long refresh token is valid
        // Longer lifetime (user stays logged in)
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days
        
        // Same issuer/audience
        issuer: process.env.JWT_ISSUER || 'your-app-name',
        audience: process.env.JWT_AUDIENCE || 'your-app-users',
        
        // Algorithm
        algorithm: 'HS256',
        
        // Store refresh tokens in database? (recommended for production)
        storeInDatabase: process.env.STORE_REFRESH_TOKENS !== 'false', // default true
        
        // Rotate refresh tokens? (issue new refresh token on use)
        rotateTokens: process.env.ROTATE_REFRESH_TOKENS === 'true',
    },
    
    // ========================================================================
    // TOKEN PAYLOAD (What data to include in tokens)
    // ========================================================================
    payload: {
        // Include in access token
        accessTokenFields: [
            'id',           // User ID
            'email',        // User email
            'role',         // User role (user, admin, etc.)
            'tier',         // Subscription tier (free, premium, etc.)
        ],
        
        // Include in refresh token (minimal data)
        refreshTokenFields: [
            'id',           // User ID only
        ],
    },
    
    // ========================================================================
    // TOKEN BLACKLIST (Invalidate tokens before expiry)
    // ========================================================================
    blacklist: {
        // Enable token blacklisting (logout, password change)
        enabled: process.env.ENABLE_TOKEN_BLACKLIST !== 'false', // default true
        
        // Where to store blacklisted tokens
        // Options: 'redis' (fast), 'mongodb' (persistent), 'memory' (dev only)
        storage: process.env.BLACKLIST_STORAGE || 'redis',
        
        // How long to keep blacklisted tokens (should match token expiry)
        ttl: {
            accessToken: 15 * 60, // 15 minutes (in seconds)
            refreshToken: 7 * 24 * 60 * 60, // 7 days (in seconds)
        },
    },
};

// ============================================================================
// PASSWORD CONFIGURATION
// ============================================================================

const passwordConfig = {
    // ========================================================================
    // BCRYPT SETTINGS
    // ========================================================================
    bcrypt: {
        // Salt rounds (higher = more secure but slower)
        // 10 = ~10 hashes per second
        // 12 = ~2-3 hashes per second (recommended)
        // 14 = ~1 hash per second
        saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
    },
    
    // ========================================================================
    // PASSWORD REQUIREMENTS
    // ========================================================================
    requirements: {
        // Minimum password length
        minLength: Number(process.env.PASSWORD_MIN_LENGTH) || 8,
        
        // Maximum password length
        maxLength: Number(process.env.PASSWORD_MAX_LENGTH) || 128,
        
        // Require uppercase letter
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
        
        // Require lowercase letter
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
        
        // Require number
        requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
        
        // Require special character
        requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
        
        // Special characters allowed
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    },
    
    // ========================================================================
    // PASSWORD RESET
    // ========================================================================
    reset: {
        // How long reset token is valid
        tokenExpiry: Number(process.env.PASSWORD_RESET_EXPIRY) || 60 * 60 * 1000, // 1 hour
        
        // Token length (random bytes)
        tokenLength: 32,
    },
};

// ============================================================================
// COOKIE CONFIGURATION (for storing refresh tokens)
// ============================================================================

const cookieConfig = {
    // Cookie name for refresh token
    refreshTokenCookieName: 'refreshToken',
    
    // Cookie options
    options: {
        // HttpOnly (prevents XSS attacks - JavaScript cannot access)
        httpOnly: true,
        
        // Secure (only send over HTTPS in production)
        secure: process.env.NODE_ENV === 'production',
        
        // SameSite (CSRF protection)
        // 'strict' = only same-site requests (most secure)
        // 'lax' = allows some cross-site (default)
        // 'none' = allows all cross-site (requires secure: true)
        sameSite: process.env.COOKIE_SAME_SITE || 'strict',
        
        // Max age (should match refresh token expiry)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        
        // Path
        path: '/',
        
        // Domain (for subdomain sharing)
        // domain: '.yourdomain.com', // Uncomment for production
    },
};

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

const securityConfig = {
    // ========================================================================
    // LOGIN ATTEMPTS
    // ========================================================================
    loginAttempts: {
        // Enable login attempt tracking
        enabled: process.env.TRACK_LOGIN_ATTEMPTS !== 'false',
        
        // Max failed attempts before lockout
        maxAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        
        // Lockout duration (in milliseconds)
        lockoutDuration: Number(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 minutes
        
        // Reset failed attempts after successful login
        resetOnSuccess: true,
    },
    
    // ========================================================================
    // EMAIL VERIFICATION
    // ========================================================================
    emailVerification: {
        // Require email verification before login
        required: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
        
        // Verification token expiry
        tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
        
        // Token length
        tokenLength: 32,
        
        // Resend cooldown (prevent spam)
        resendCooldown: 2 * 60 * 1000, // 2 minutes
    },
    
    // ========================================================================
    // TWO-FACTOR AUTHENTICATION (2FA)
    // ========================================================================
    twoFactor: {
        // Enable 2FA (optional for users)
        enabled: process.env.ENABLE_2FA === 'true',
        
        // 2FA methods
        methods: {
            totp: true,  // Time-based OTP (Google Authenticator)
            sms: false,  // SMS OTP (requires SMS service)
            email: true, // Email OTP
        },
        
        // OTP settings
        otp: {
            length: 6,
            expiryTime: 5 * 60 * 1000, // 5 minutes
        },
    },
    
    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================
    session: {
        // Track active sessions
        enabled: process.env.TRACK_SESSIONS !== 'false',
        
        // Max concurrent sessions per user
        maxConcurrentSessions: Number(process.env.MAX_SESSIONS) || 5,
        
        // Session timeout (inactivity)
        inactivityTimeout: Number(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
    },
    
    // ========================================================================
    // OAUTH (Optional - for Google, GitHub, etc.)
    // ========================================================================
    oauth: {
        google: {
            enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        github: {
            enabled: process.env.GITHUB_OAUTH_ENABLED === 'true',
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
        },
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random token
 * @param {number} length - Token length in bytes
 * @returns {string} Random hex token
 */
function generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate password against requirements
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
    const errors = [];
    const { requirements } = passwordConfig;
    
    // Check length
    if (password.length < requirements.minLength) {
        errors.push(`Password must be at least ${requirements.minLength} characters`);
    }
    
    if (password.length > requirements.maxLength) {
        errors.push(`Password must not exceed ${requirements.maxLength} characters`);
    }
    
    // Check uppercase
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check lowercase
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check numbers
    if (requirements.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    // Check special characters
    if (requirements.requireSpecialChars) {
        const specialCharsRegex = new RegExp(`[${requirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (!specialCharsRegex.test(password)) {
            errors.push('Password must contain at least one special character');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calculate token expiry time in seconds
 * @param {string} expiryString - Expiry string (e.g., '15m', '7d')
 * @returns {number} Expiry in seconds
 */
function parseExpiryToSeconds(expiryString) {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1));
    
    const units = {
        s: 1,           // seconds
        m: 60,          // minutes
        h: 3600,        // hours
        d: 86400,       // days
        w: 604800,      // weeks
    };
    
    return value * (units[unit] || 60); // Default to minutes
}

/**
 * Get token expiry in milliseconds
 * @param {string} tokenType - 'access' or 'refresh'
 * @returns {number} Expiry in milliseconds
 */
function getTokenExpiryMs(tokenType) {
    const expiryString = tokenType === 'access' 
        ? jwtConfig.accessToken.expiresIn 
        : jwtConfig.refreshToken.expiresIn;
    
    return parseExpiryToSeconds(expiryString) * 1000;
}

/**
 * Validate JWT configuration
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Check if secrets are set
    if (!process.env.JWT_ACCESS_SECRET) {
        warnings.push('JWT_ACCESS_SECRET not set - using random secret (will invalidate tokens on restart!)');
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
        warnings.push('JWT_REFRESH_SECRET not set - using random secret');
    }
    
    // Check if secrets are different
    if (jwtConfig.accessToken.secret === jwtConfig.refreshToken.secret) {
        warnings.push('Access and refresh tokens use the same secret - recommend using different secrets');
    }
    
    // Check secret strength (should be long)
    if (jwtConfig.accessToken.secret.length < 32) {
        errors.push('JWT_ACCESS_SECRET is too short (minimum 32 characters)');
    }
    
    // Check production settings
    if (process.env.NODE_ENV === 'production') {
        if (!cookieConfig.options.secure) {
            errors.push('Cookie secure flag should be true in production');
        }
        
        if (!jwtConfig.blacklist.enabled) {
            warnings.push('Token blacklist is disabled - cannot invalidate tokens on logout');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_CONSTANTS = {
    // Token types
    TOKEN_TYPES: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        RESET: 'reset',
        VERIFICATION: 'verification',
    },
    
    // User roles
    ROLES: {
        USER: 'user',
        ADMIN: 'admin',
        MODERATOR: 'moderator',
    },
    
    // Subscription tiers
    TIERS: {
        FREE: 'free',
        BASIC: 'basic',
        PREMIUM: 'premium',
        ENTERPRISE: 'enterprise',
    },
    
    // Error messages
    ERRORS: {
        INVALID_TOKEN: 'Invalid or expired token',
        TOKEN_EXPIRED: 'Token has expired',
        TOKEN_BLACKLISTED: 'Token has been revoked',
        INVALID_CREDENTIALS: 'Invalid email or password',
        ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
        EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Insufficient permissions',
    },
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Main configurations
    jwt: jwtConfig,
    password: passwordConfig,
    cookie: cookieConfig,
    security: securityConfig,
    
    // Helper functions
    generateRandomToken,
    validatePassword,
    parseExpiryToSeconds,
    getTokenExpiryMs,
    validateConfig,
    
    // Constants
    AUTH_CONSTANTS,
    
    // Quick access
    accessTokenSecret: jwtConfig.accessToken.secret,
    refreshTokenSecret: jwtConfig.refreshToken.secret,
    accessTokenExpiry: jwtConfig.accessToken.expiresIn,
    refreshTokenExpiry: jwtConfig.refreshToken.expiresIn,
};