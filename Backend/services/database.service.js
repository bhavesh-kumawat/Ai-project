/**
 * DATABASE SERVICE
 * 
 * Handles MongoDB connection, disconnection, and connection management
 * 
 * Features:
 * - MongoDB connection with retry logic
 * - Connection pooling
 * - Event listeners
 * - Graceful shutdown
 * - Connection status monitoring
 * 
 * @module services/database.service
 */

const mongoose = require('mongoose');
const databaseConfig = require('../config/database.config');
const logger = require('../utils/logger.utils');

// ============================================================================
// DATABASE SERVICE CLASS
// ============================================================================

class DatabaseService {
    constructor() {
        this.connection = null;
        this.isInitialized = false;
    }

    /**
     * Initialize database connection
     * @returns {Promise<mongoose.Connection>}
     */
    async initialize() {
        if (this.isInitialized) {
            logger.warn('Database already initialized');
            return this.connection;
        }

        try {
            // Set mongoose configurations
            mongoose.set('debug', databaseConfig.debug);
            mongoose.set('strictQuery', false);

            // Set up event listeners
            this._setupEventListeners();

            logger.info('🔄 Connecting to MongoDB...');

            // Connect to database
            await mongoose.connect(databaseConfig.uri, databaseConfig.options);

            this.connection = mongoose.connection;
            this.isInitialized = true;

            logger.info('✅ MongoDB connected successfully');
            logger.info(`📊 Database: ${this.connection.name}`);
            logger.info(`🌐 Host: ${this.connection.host}`);

            return this.connection;

        } catch (error) {
            logger.error('❌ MongoDB connection failed:', error.message);

            // Retry if enabled
            if (databaseConfig.retry.enabled) {
                logger.info('🔄 Retrying connection...');
                return await this._retryConnection(1);
            } else {
                throw error;
            }
        }
    }

    /**
     * Retry database connection with exponential backoff
     * @param {number} attempt - Current attempt number
     * @returns {Promise<mongoose.Connection>}
     * @private
     */
    async _retryConnection(attempt) {
        if (attempt > databaseConfig.retry.maxAttempts) {
            const errorMsg = `❌ Failed to connect after ${databaseConfig.retry.maxAttempts} attempts`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
            databaseConfig.retry.initialDelay * Math.pow(2, attempt - 1),
            databaseConfig.retry.maxDelay
        );

        logger.info(`⏳ Retry attempt ${attempt}/${databaseConfig.retry.maxAttempts} in ${delay / 1000}s...`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            await mongoose.connect(databaseConfig.uri, databaseConfig.options);
            this.connection = mongoose.connection;
            this.isInitialized = true;
            logger.info('✅ MongoDB connected successfully (after retry)');
            return this.connection;
        } catch (error) {
            logger.error(`❌ Retry ${attempt} failed:`, error.message);
            return await this._retryConnection(attempt + 1);
        }
    }

    /**
     * Disconnect from MongoDB
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.connection.close();
                this.connection = null;
                this.isInitialized = false;
                logger.info('✅ MongoDB disconnected successfully');
            }
        } catch (error) {
            logger.error('❌ MongoDB disconnect error:', error.message);
            throw error;
        }
    }

    /**
     * Check database connection status
     * @returns {boolean} True if connected
     */
    isConnected() {
        return mongoose.connection.readyState === 1;
    }

    /**
     * Get connection status string
     * @returns {string} Connection status
     */
    getConnectionStatus() {
        const states = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };

        return states[mongoose.connection.readyState] || 'Unknown';
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Database stats
     */
    async getStats() {
        if (!this.isConnected()) {
            throw new Error('Database not connected');
        }

        try {
            const stats = await mongoose.connection.db.stats();

            return {
                database: mongoose.connection.name,
                collections: stats.collections,
                documents: stats.objects,
                dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
                indexes: stats.indexes,
                indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
                avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
            };
        } catch (error) {
            logger.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Get connection health information
     * @returns {Object} Health status
     */
    getHealth() {
        return {
            status: this.getConnectionStatus(),
            isConnected: this.isConnected(),
            isInitialized: this.isInitialized,
            database: mongoose.connection.name || null,
            host: mongoose.connection.host || null,
            port: mongoose.connection.port || null,
            readyState: mongoose.connection.readyState,
        };
    }

    /**
     * Set up MongoDB connection event listeners
     * @private
     */
    _setupEventListeners() {
        // Connection successful
        mongoose.connection.on('connected', () => {
            logger.info('📡 Mongoose connected to MongoDB');
        });

        // Connection error
        mongoose.connection.on('error', (err) => {
            logger.error('❌ Mongoose connection error:', err.message);
        });

        // Connection disconnected
        mongoose.connection.on('disconnected', () => {
            logger.warn('📴 Mongoose disconnected from MongoDB');
        });

        // Connection reconnected
        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 Mongoose reconnected to MongoDB');
        });

        // Process termination handlers
        this._setupGracefulShutdown();
    }

    /**
     * Set up graceful shutdown handlers
     * @private
     */
    _setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            try {
                logger.info(`📴 Received ${signal}, closing MongoDB connection...`);
                await this.disconnect();
                logger.info('✅ MongoDB connection closed gracefully');
                process.exit(0);
            } catch (error) {
                logger.error('❌ Error during graceful shutdown:', error.message);
                process.exit(1);
            }
        };

        // Handle different termination signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
    }

    /**
     * Get mongoose instance
     * @returns {mongoose} Mongoose instance
     */
    getMongoose() {
        return mongoose;
    }

    /**
     * Get connection instance
     * @returns {mongoose.Connection} Connection instance
     */
    getConnection() {
        return this.connection || mongoose.connection;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const databaseService = new DatabaseService();

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = databaseService;