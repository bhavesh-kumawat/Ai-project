/**
 * DATABASE MONITORING JOB
 * 
 * Background job for monitoring database health and performance
 * 
 * Features:
 * - Periodic health checks
 * - Connection monitoring
 * - Performance metrics collection
 * - Automatic alerting on issues
 * - Database statistics logging
 * 
 * @module jobs/database-monitoring.job
 */

const cron = require('node-cron');
const databaseService = require('../services/database.service');
const logger = require('../utils/logger.utils');
const notificationService = require('../services/notification.service');

// ============================================================================
// MONITORING CONFIGURATION
// ============================================================================

const monitoringConfig = {
    // Health check interval (every 5 minutes)
    healthCheckInterval: process.env.DB_HEALTH_CHECK_INTERVAL || '*/5 * * * *',
    
    // Stats collection interval (every hour)
    statsInterval: process.env.DB_STATS_INTERVAL || '0 * * * *',
    
    // Connection pool monitoring interval (every minute)
    poolMonitorInterval: process.env.DB_POOL_MONITOR_INTERVAL || '* * * * *',
    
    // Alert thresholds
    thresholds: {
        maxResponseTime: Number(process.env.DB_MAX_RESPONSE_TIME) || 1000, // ms
        minAvailableConnections: Number(process.env.DB_MIN_AVAILABLE_CONNECTIONS) || 2,
        maxDataSizeGB: Number(process.env.DB_MAX_DATA_SIZE_GB) || 100,
    },
};

// ============================================================================
// MONITORING JOBS
// ============================================================================

/**
 * Database health check job
 * Checks database connectivity and basic health
 */
const healthCheckJob = cron.schedule(
    monitoringConfig.healthCheckInterval,
    async () => {
        try {
            logger.debug('🔍 Running database health check...');

            const health = databaseService.getHealth();

            if (!health.isConnected) {
                logger.error('❌ Database health check failed: Not connected');
                
                // Send alert
                await notificationService.sendAlert({
                    type: 'database_health',
                    severity: 'critical',
                    message: 'Database connection lost',
                    data: health,
                });

                return;
            }

            // Check response time
            const startTime = Date.now();
            await databaseService.getConnection().db.admin().ping();
            const responseTime = Date.now() - startTime;

            if (responseTime > monitoringConfig.thresholds.maxResponseTime) {
                logger.warn(`⚠️  Database response time high: ${responseTime}ms`);
                
                await notificationService.sendAlert({
                    type: 'database_performance',
                    severity: 'warning',
                    message: `Database response time: ${responseTime}ms`,
                    data: { responseTime, threshold: monitoringConfig.thresholds.maxResponseTime },
                });
            }

            logger.debug(`✅ Database health check passed (${responseTime}ms)`);

        } catch (error) {
            logger.error('❌ Database health check error:', error);
            
            await notificationService.sendAlert({
                type: 'database_health',
                severity: 'critical',
                message: 'Database health check failed',
                error: error.message,
            });
        }
    },
    {
        scheduled: false, // Don't start automatically
    }
);

/**
 * Database statistics collection job
 * Collects and logs database performance metrics
 */
const statsCollectionJob = cron.schedule(
    monitoringConfig.statsInterval,
    async () => {
        try {
            logger.debug('📊 Collecting database statistics...');

            if (!databaseService.isConnected()) {
                logger.warn('⚠️  Cannot collect stats: Database not connected');
                return;
            }

            const stats = await databaseService.getStats();

            // Log statistics
            logger.info('📊 Database Statistics:');
            logger.info(`  Database: ${stats.database}`);
            logger.info(`  Collections: ${stats.collections}`);
            logger.info(`  Documents: ${stats.documents}`);
            logger.info(`  Data Size: ${stats.dataSize}`);
            logger.info(`  Storage Size: ${stats.storageSize}`);
            logger.info(`  Indexes: ${stats.indexes}`);
            logger.info(`  Index Size: ${stats.indexSize}`);

            // Check thresholds
            const dataSizeGB = parseFloat(stats.dataSize);
            if (dataSizeGB > monitoringConfig.thresholds.maxDataSizeGB) {
                logger.warn(`⚠️  Database size exceeds threshold: ${dataSizeGB}GB`);
                
                await notificationService.sendAlert({
                    type: 'database_storage',
                    severity: 'warning',
                    message: `Database size: ${dataSizeGB}GB`,
                    data: stats,
                });
            }

        } catch (error) {
            logger.error('❌ Database stats collection error:', error);
        }
    },
    {
        scheduled: false,
    }
);

/**
 * Connection pool monitoring job
 * Monitors database connection pool utilization
 */
const poolMonitorJob = cron.schedule(
    monitoringConfig.poolMonitorInterval,
    async () => {
        try {
            if (!databaseService.isConnected()) {
                return;
            }

            const mongoose = databaseService.getMongoose();
            const connection = databaseService.getConnection();

            // Get pool statistics
            const poolStats = {
                totalConnections: connection.client?.topology?.s?.pool?.totalConnectionCount || 0,
                availableConnections: connection.client?.topology?.s?.pool?.availableConnectionCount || 0,
                pendingOperations: connection.client?.topology?.s?.pool?.waitQueueSize || 0,
            };

            // Log if pool is under pressure
            if (poolStats.availableConnections < monitoringConfig.thresholds.minAvailableConnections) {
                logger.warn('⚠️  Database connection pool under pressure:', poolStats);
                
                await notificationService.sendAlert({
                    type: 'database_pool',
                    severity: 'warning',
                    message: 'Low available database connections',
                    data: poolStats,
                });
            }

            // Log high pending operations
            if (poolStats.pendingOperations > 10) {
                logger.warn('⚠️  High pending database operations:', poolStats);
            }

        } catch (error) {
            logger.debug('Pool monitoring error (expected for some drivers):', error.message);
        }
    },
    {
        scheduled: false,
    }
);

/**
 * Database cleanup job
 * Performs periodic maintenance tasks
 */
const cleanupJob = cron.schedule(
    '0 2 * * *', // Run at 2 AM daily
    async () => {
        try {
            logger.info('🧹 Running database cleanup...');

            if (!databaseService.isConnected()) {
                logger.warn('⚠️  Cannot run cleanup: Database not connected');
                return;
            }

            const connection = databaseService.getConnection();

            // Example: Clean up expired sessions
            const expiredDocs = await connection.db
                .collection('sessions')
                .deleteMany({ expiresAt: { $lt: new Date() } });

            logger.info(`✅ Cleaned up ${expiredDocs.deletedCount} expired sessions`);

            // Example: Compact collections (only for standalone, not replica sets)
            // await connection.db.command({ compact: 'sessions' });

        } catch (error) {
            logger.error('❌ Database cleanup error:', error);
        }
    },
    {
        scheduled: false,
    }
);

// ============================================================================
// JOB CONTROL
// ============================================================================

/**
 * Start all monitoring jobs
 */
const startMonitoring = () => {
    logger.info('🚀 Starting database monitoring jobs...');
    
    healthCheckJob.start();
    statsCollectionJob.start();
    poolMonitorJob.start();
    cleanupJob.start();
    
    logger.info('✅ Database monitoring jobs started');
};

/**
 * Stop all monitoring jobs
 */
const stopMonitoring = () => {
    logger.info('🛑 Stopping database monitoring jobs...');
    
    healthCheckJob.stop();
    statsCollectionJob.stop();
    poolMonitorJob.stop();
    cleanupJob.stop();
    
    logger.info('✅ Database monitoring jobs stopped');
};

/**
 * Get monitoring status
 * @returns {Object} Status of all monitoring jobs
 */
const getMonitoringStatus = () => {
    return {
        healthCheck: {
            running: healthCheckJob.getStatus() === 'scheduled',
            schedule: monitoringConfig.healthCheckInterval,
        },
        statsCollection: {
            running: statsCollectionJob.getStatus() === 'scheduled',
            schedule: monitoringConfig.statsInterval,
        },
        poolMonitor: {
            running: poolMonitorJob.getStatus() === 'scheduled',
            schedule: monitoringConfig.poolMonitorInterval,
        },
        cleanup: {
            running: cleanupJob.getStatus() === 'scheduled',
            schedule: '0 2 * * *',
        },
    };
};

/**
 * Run health check immediately
 * @returns {Promise<void>}
 */
const runHealthCheckNow = async () => {
    logger.info('🔍 Running immediate health check...');
    await healthCheckJob._task();
};

/**
 * Run stats collection immediately
 * @returns {Promise<void>}
 */
const runStatsCollectionNow = async () => {
    logger.info('📊 Running immediate stats collection...');
    await statsCollectionJob._task();
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    startMonitoring,
    stopMonitoring,
    getMonitoringStatus,
    runHealthCheckNow,
    runStatsCollectionNow,
    jobs: {
        healthCheck: healthCheckJob,
        statsCollection: statsCollectionJob,
        poolMonitor: poolMonitorJob,
        cleanup: cleanupJob,
    },
};