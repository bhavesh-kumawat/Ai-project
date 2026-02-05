/**
 * LOGGER UTILITY
 * 
 * Centralized logging utility with multiple transports and log levels
 * 
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Console and file logging
 * - Structured logging
 * - Timestamp and environment info
 * - Production-ready configuration
 * 
 * @module utils/logger.utils
 */

const winston = require('winston');
const path = require('path');

// ============================================================================
// LOG LEVELS
// ============================================================================

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(logColors);

// ============================================================================
// LOG FORMAT
// ============================================================================

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Add metadata if exists
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        
        return msg;
    })
);

// ============================================================================
// TRANSPORTS
// ============================================================================

const transports = [];

// Console transport
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
    })
);

// File transports (only in production or when enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    const logDir = process.env.LOG_DIR || 'logs';

    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels: logLevels,
    format: logFormat,
    transports,
    exitOnError: false,
});

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Log database operation
 * @param {string} operation - Database operation name
 * @param {Object} metadata - Additional metadata
 */
logger.database = (operation, metadata = {}) => {
    logger.debug(`DB Operation: ${operation}`, metadata);
};

/**
 * Log API request
 * @param {Object} req - Express request object
 */
logger.request = (req) => {
    logger.http(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
};

/**
 * Log API response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.response = (req, res, duration) => {
    logger.http(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
};

// ============================================================================
// STREAM FOR MORGAN
// ============================================================================

logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = logger;