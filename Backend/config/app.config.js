/**
 * EXPRESS APPLICATION CONFIGURATION
 * 
 * This file configures all Express middleware and app-level settings.
 * It handles:
 * - Security (Helmet, CORS, XSS, etc.)
 * - Request parsing (JSON, URL-encoded, file uploads)
 * - Rate limiting
 * - Logging
 * - Error handling
 * - Performance optimizations
 * 
 * @module config/app.config
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

/**
 * Configure Express application with all middleware
 * @param {Express} app - Express application instance
 * @returns {Express} Configured Express app
 */
const configureApp = (app) => {

    // ========================================================================
    // 1. TRUST PROXY (Important for deployment behind reverse proxies)
    // ========================================================================

    /**
     * Enable if your app is behind a proxy (Nginx, AWS ELB, etc.)
     * This allows Express to trust the X-Forwarded-* headers
     */
    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
        console.log('✅ Trust proxy enabled');
    }

    // ========================================================================
    // 2. SECURITY HEADERS (Helmet)
    // ========================================================================

    /**
     * Helmet sets various HTTP headers to secure your Express app
     * Protects against common vulnerabilities like XSS, clickjacking, etc.
     */
    app.use(helmet({

        // Content Security Policy
        // Controls which resources can be loaded
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'"],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://res.cloudinary.com",  // Cloudinary images
                    "https://replicate.delivery",  // Replicate images
                ],
                connectSrc: ["'self'", "https://api.openai.com"], // API connections
                frameSrc: ["'none'"], // Prevent embedding in iframes (clickjacking protection)
                objectSrc: ["'none'"], // Disable plugins
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
            },
        },

        // Cross-Origin Embedder Policy
        crossOriginEmbedderPolicy: false, // Disable if using external images

        // Cross-Origin Resource Policy
        crossOriginResourcePolicy: { policy: "cross-origin" },

        // DNS Prefetch Control
        dnsPrefetchControl: { allow: false },

        // Frame Guard (X-Frame-Options)
        frameguard: { action: 'deny' }, // Prevent clickjacking

        // Hide Powered By
        hidePoweredBy: true, // Remove X-Powered-By: Express header

        // HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },

        // IE No Open
        ieNoOpen: true,

        // No Sniff (X-Content-Type-Options)
        noSniff: true, // Prevent MIME type sniffing

        // Referrer Policy
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

        // XSS Filter
        xssFilter: true,
    }));

    console.log('✅ Security headers configured (Helmet)');

    // ========================================================================
    // 3. CORS CONFIGURATION
    // ========================================================================

    /**
     * Cross-Origin Resource Sharing
     * Allows your frontend to communicate with your backend
     */
    const corsOptions = {
        // Allow requests from these origins
        origin: (origin, callback) => {
            const allowedOrigins = [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'http://localhost:5173', // Vite default
                'http://localhost:3000', // React default
                'http://127.0.0.1:5173',
            ];

            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },

        // Allow credentials (cookies, authorization headers)
        credentials: true,

        // Allowed HTTP methods
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

        // Allowed headers
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],

        // Exposed headers (accessible to frontend)
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],

        // Preflight request cache duration (in seconds)
        maxAge: 86400, // 24 hours

        // Success status for preflight requests
        optionsSuccessStatus: 200,
    };

    app.use(cors(corsOptions));
    console.log('✅ CORS configured');

    // ========================================================================
    // 4. COMPRESSION
    // ========================================================================

    /**
     * Compress response bodies for better performance
     * Reduces bandwidth and improves load times
     */
    app.use(compression({
        // Compression level (0-9, 6 is default)
        level: 6,

        // Minimum response size to compress (in bytes)
        threshold: 1024, // 1KB

        // Filter function to decide what to compress
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
    }));

    console.log('✅ Compression enabled');

    // ========================================================================
    // 5. REQUEST PARSING
    // ========================================================================

    /**
     * Parse JSON request bodies
     * Limits prevent large payload attacks
     */
    app.use(express.json({
        limit: process.env.JSON_LIMIT || '10mb',
        verify: (req, res, buf) => {
            // Store raw body for webhook signature verification
            req.rawBody = buf.toString();
        }
    }));

    /**
     * Parse URL-encoded request bodies (form data)
     */
    app.use(express.urlencoded({
        extended: true,
        limit: process.env.URLENCODED_LIMIT || '10mb',
    }));

    /**
     * Parse cookies
     */
    if (process.env.COOKIE_PARSER_ENABLED !== 'false') {
        const cookieParser = require('cookie-parser');
        app.use(cookieParser(process.env.COOKIE_SECRET));
    }

    console.log('✅ Request parsers configured');

    // ========================================================================
    // 6. SECURITY MIDDLEWARE
    // ========================================================================

    /**
     * Prevent NoSQL injection attacks
     * Removes $ and . from user input
     */
    app.use(mongoSanitize({
        // Remove data or replace with _
        replaceWith: '_',

        // Also sanitize keys in objects
        onSanitize: ({ req, key }) => {
            console.warn(`⚠️  Sanitized key: ${key} in request from ${req.ip}`);
        },
    }));

    /**
     * Prevent XSS (Cross-Site Scripting) attacks
     * Sanitizes user input by escaping HTML characters
     */
    app.use(xss());

    /**
     * Prevent HTTP Parameter Pollution
     * Protects against duplicate parameters
     */
    app.use(hpp({
        // Whitelist parameters that can be duplicated
        whitelist: [
            'sort',
            'fields',
            'filter',
            'tags',
        ],
    }));

    console.log('✅ Security middleware configured');

    // ========================================================================
    // 7. RATE LIMITING
    // ========================================================================

    /**
     * Global rate limiter
     * Prevents brute force and DDoS attacks
     */
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: Number(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes',
        },
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers

        // Skip rate limiting for certain IPs (e.g., your own servers)
        skip: (req) => {
            const trustedIPs = (process.env.TRUSTED_IPS || '').split(',');
            return trustedIPs.includes(req.ip);
        },

        // Custom key generator (default is IP address)
        keyGenerator: (req) => {
            // Can use user ID if authenticated
            return req.user?.id || req.ip;
        },

        // Handler for when rate limit is exceeded
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: 'Too many requests, please slow down.',
                retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
            });
        },
    });

    // Apply to all routes
    app.use('/api/', globalLimiter);

    /**
     * Stricter rate limiter for authentication routes
     * Prevents brute force password attacks
     */
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Only 5 attempts per 15 minutes
        skipSuccessfulRequests: true, // Don't count successful logins
        message: {
            success: false,
            message: 'Too many login attempts, please try again later.',
        },
    });

    // Apply to auth routes
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);

    /**
     * Rate limiter for AI generation (expensive operations)
     */
    const generationLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // 50 generations per hour for free users
        keyGenerator: (req) => req.user?.id || req.ip,
        skip: (req) => req.user?.tier === 'premium', // Skip for premium users
    });

    app.use('/api/generation', generationLimiter);

    console.log('✅ Rate limiting configured');

    // ========================================================================
    // 8. LOGGING
    // ========================================================================

    /**
     * HTTP request logger
     * Morgan provides different formats for different environments
     */
    if (process.env.NODE_ENV === 'development') {
        // Detailed colorful logs for development
        app.use(morgan('dev'));
        console.log('✅ Morgan logging (dev mode)');
    } else if (process.env.NODE_ENV === 'production') {
        // Apache combined format for production
        app.use(morgan('combined', {
            // Skip logging for health checks
            skip: (req) => req.url === '/health' || req.url === '/api/health',
        }));
        console.log('✅ Morgan logging (production mode)');
    }

    // ========================================================================
    // 9. CUSTOM MIDDLEWARE
    // ========================================================================

    /**
     * Add request ID to each request for tracking
     */
    app.use((req, res, next) => {
        req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.setHeader('X-Request-ID', req.id);
        next();
    });

    /**
     * Log request timing
     */
    app.use((req, res, next) => {
        req.startTime = Date.now();

        // Log when response is sent
        res.on('finish', () => {
            const duration = Date.now() - req.startTime;
            if (duration > 1000) { // Log slow requests (> 1 second)
                console.warn(`⚠️  Slow request: ${req.method} ${req.url} - ${duration}ms`);
            }
        });

        next();
    });

    /**
     * Add common response helpers
     */
    app.use((req, res, next) => {
        // Success response helper
        res.success = (data, message = 'Success', statusCode = 200) => {
            res.status(statusCode).json({
                success: true,
                message,
                data,
            });
        };

        // Error response helper
        res.error = (message, statusCode = 500, errors = null) => {
            res.status(statusCode).json({
                success: false,
                message,
                errors,
            });
        };

        next();
    });

    console.log('✅ Custom middleware configured');

    // ========================================================================
    // 10. HEALTH CHECK ROUTES
    // ========================================================================

    /**
     * Basic health check
     */
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
        });
    });

    /**
     * Detailed health check (includes DB, Redis, etc.)
     */
    app.get('/api/health/detailed', async (req, res) => {
        const mongoose = require('mongoose');

        const health = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            services: {
                database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
                // Add other service checks here
            },
            memory: {
                usage: process.memoryUsage(),
                percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2) + '%',
            },
        };

        const allUp = Object.values(health.services).every(status => status === 'UP');

        res.status(allUp ? 200 : 503).json(health);
    });

    console.log('✅ Health check routes configured');

    // ========================================================================
    // 11. STATIC FILES (if needed)
    // ========================================================================

    /**
     * Serve static files
     * Enabled by default unless explicitly disabled
     */
    if (process.env.SERVE_STATIC !== 'false') {
        app.use(express.static('public', {
            maxAge: '1d', // Cache for 1 day
            etag: true,
        }));
        console.log('✅ Static file serving enabled');
    }

    // ========================================================================
    // 12. API DOCUMENTATION (Swagger)
    // ========================================================================

    /**
     * Swagger API documentation (optional)
     */
    if (process.env.ENABLE_SWAGGER === 'true') {
        try {
            const swaggerUi = require('swagger-ui-express');
            const swaggerDocument = require('../swagger.json');

            app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            console.log('✅ Swagger documentation available at /api-docs');
        } catch (error) {
            console.warn('⚠️  Swagger enabled but failed to load (missing file or package?)');
        }
    }

    // ========================================================================
    // FINAL CONFIGURATION
    // ========================================================================

    console.log('✅ Express app configuration complete');
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);

    return app;
};

// ============================================================================
// CONFIGURATION OBJECT (Alternative Export)
// ============================================================================

/**
 * Configuration settings that can be imported separately
 */
const appSettings = {
    // Server settings
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',

    // Database (Added for compatibility)
    database: {
        uri: process.env.MONGO_URI || process.env.MONGO_URL,
    },

    // Environment
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Security
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5173',
    trustProxy: process.env.TRUST_PROXY === 'true',

    // Limits
    jsonLimit: process.env.JSON_LIMIT || '10mb',
    urlencodedLimit: process.env.URLENCODED_LIMIT || '10mb',

    // Rate limiting
    rateLimit: {
        global: {
            windowMs: 15 * 60 * 1000,
            max: Number(process.env.RATE_LIMIT_MAX) || 100,
        },
        auth: {
            windowMs: 15 * 60 * 1000,
            max: 5,
        },
        generation: {
            windowMs: 60 * 60 * 1000,
            max: 50,
        },
    },

    // Features
    features: {
        swagger: process.env.ENABLE_SWAGGER === 'true',
        compression: process.env.ENABLE_COMPRESSION !== 'false',
        cookieParser: process.env.COOKIE_PARSER_ENABLED !== 'false',
        staticFiles: process.env.SERVE_STATIC !== 'false',
    },
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    configureApp,
    appSettings,
};
