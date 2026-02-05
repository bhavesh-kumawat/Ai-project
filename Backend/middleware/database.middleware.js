/**
 * DATABASE MIDDLEWARE
 * 
 * Express middleware for database-related operations
 * 
 * Features:
 * - Connection status checking
 * - Database health monitoring
 * - Request-level database validation
 * 
 * @module middleware/database.middleware
 */

const databaseService = require('../services/database.service');
const ApiResponse = require('../utils/ApiResponse.utils');
const ApiError = require('../utils/ApiError.utils');
const logger = require('../utils/logger.utils');

// ============================================================================
// DATABASE MIDDLEWARE
// ============================================================================

/**
 * Check if database is connected
 * Middleware to ensure database connection before processing request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkDatabaseConnection = (req, res, next) => {
    try {
        if (!databaseService.isConnected()) {
            const status = databaseService.getConnectionStatus();
            logger.warn(`Database connection check failed. Status: ${status}`);
            
            return res.status(503).json(
                new ApiResponse(503, null, `Database unavailable. Status: ${status}`)
            );
        }
        
        next();
    } catch (error) {
        logger.error('Error checking database connection:', error);
        return res.status(500).json(
            new ApiResponse(500, null, 'Error checking database connection')
        );
    }
};

/**
 * Attach database health info to request
 * Useful for debugging and monitoring
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const attachDatabaseHealth = (req, res, next) => {
    try {
        req.dbHealth = databaseService.getHealth();
        next();
    } catch (error) {
        logger.error('Error attaching database health:', error);
        next(); // Continue even if health check fails
    }
};

/**
 * Log database queries (development only)
 * Middleware to log all database operations in development
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logDatabaseQueries = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        const mongoose = databaseService.getMongoose();
        
        // Store original query methods
        const originalQuery = mongoose.Query.prototype.exec;
        
        // Override exec method to log queries
        mongoose.Query.prototype.exec = async function(...args) {
            const startTime = Date.now();
            const operation = this.op;
            const collection = this.mongooseCollection.name;
            
            try {
                const result = await originalQuery.apply(this, args);
                const duration = Date.now() - startTime;
                
                logger.debug(`DB Query: ${operation} on ${collection} - ${duration}ms`);
                
                return result;
            } catch (error) {
                logger.error(`DB Query Failed: ${operation} on ${collection}`, error);
                throw error;
            }
        };
    }
    
    next();
};

/**
 * Ensure database transaction support
 * Check if replica set is configured for transactions
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const ensureTransactionSupport = async (req, res, next) => {
    try {
        const connection = databaseService.getConnection();
        
        // Check if running in a replica set
        if (!connection.client.topology.s.description.type.includes('ReplicaSet')) {
            logger.warn('Transactions require a MongoDB replica set');
            return res.status(503).json(
                new ApiResponse(503, null, 'Database transactions not supported in current configuration')
            );
        }
        
        next();
    } catch (error) {
        logger.error('Error checking transaction support:', error);
        next(); // Continue anyway, let the actual transaction fail if needed
    }
};

/**
 * Rate limit database operations per IP
 * Prevent database abuse from single source
 * 
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const rateLimitDatabase = (maxRequests = 100, windowMs = 60000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        // Clean up old entries
        for (const [key, data] of requests.entries()) {
            if (now - data.timestamp > windowMs) {
                requests.delete(key);
            }
        }
        
        // Check rate limit
        const requestData = requests.get(ip) || { count: 0, timestamp: now };
        
        if (now - requestData.timestamp < windowMs) {
            requestData.count++;
            
            if (requestData.count > maxRequests) {
                logger.warn(`Rate limit exceeded for IP: ${ip}`);
                return res.status(429).json(
                    new ApiResponse(429, null, 'Too many database requests. Please try again later.')
                );
            }
        } else {
            // Reset window
            requestData.count = 1;
            requestData.timestamp = now;
        }
        
        requests.set(ip, requestData);
        next();
    };
};

/**
 * Handle database errors consistently
 * Error handling middleware for database operations
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleDatabaseError = (err, req, res, next) => {
    // MongoDB specific errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        logger.error('MongoDB Error:', err);
        
        // Duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json(
                new ApiResponse(409, null, `Duplicate value for field: ${field}`)
            );
        }
        
        // General MongoDB error
        return res.status(500).json(
            new ApiResponse(500, null, 'Database operation failed')
        );
    }
    
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json(
            new ApiResponse(400, null, 'Validation failed', errors)
        );
    }
    
    // Mongoose cast errors
    if (err.name === 'CastError') {
        return res.status(400).json(
            new ApiResponse(400, null, `Invalid ${err.path}: ${err.value}`)
        );
    }
    
    // Pass to next error handler if not database related
    next(err);
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    checkDatabaseConnection,
    attachDatabaseHealth,
    logDatabaseQueries,
    ensureTransactionSupport,
    rateLimitDatabase,
    handleDatabaseError,
};