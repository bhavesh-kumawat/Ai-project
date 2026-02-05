/**
 * DATABASE CONFIGURATION
 * 
 * Core MongoDB database connection configuration
 * Simplified version - functionality extracted to services, middleware, and utils
 * 
 * @module config/database.config
 */

require('dotenv').config();

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const databaseConfig = {
    // MongoDB Connection URI
    uri: process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/ai-media-gen',

    // Mongoose Connection Options
    options: {
        // Server selection timeout (ms)
        serverSelectionTimeoutMS: Number(process.env.DB_SERVER_TIMEOUT) || 5000,

        // Socket timeout (ms)
        socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT) || 45000,

        // Connection pool settings
        maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 2,

        // Heartbeat frequency (ms)
        heartbeatFrequencyMS: 10000,

        // Retry writes
        retryWrites: true,

        // Write concern
        w: 'majority',

        // Auto-index (disable in production for performance)
        autoIndex: process.env.NODE_ENV !== 'production',

        // Buffer commands (wait for connection)
        bufferCommands: false,
    },

    // Retry connection settings
    retry: {
        enabled: true,
        maxAttempts: Number(process.env.DB_RETRY_ATTEMPTS) || 5,
        initialDelay: Number(process.env.DB_RETRY_DELAY) || 5000, // 5 seconds
        maxDelay: 60000, // 1 minute
    },

    // Database name
    dbName: process.env.DB_NAME || 'ai-media-gen',

    // Debug mode (log all queries)
    debug: process.env.DB_DEBUG === 'true' || process.env.NODE_ENV === 'development',
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = databaseConfig;