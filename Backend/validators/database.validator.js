/**
 * DATABASE VALIDATOR
 * 
 * Validates database configuration and connection parameters
 * 
 * Features:
 * - Configuration validation
 * - URI format validation
 * - Environment-specific checks
 * - Security recommendations
 * 
 * @module validators/database.validator
 */

const logger = require('../utils/logger.utils');

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = {
    uri: {
        required: true,
        pattern: /^mongodb(\+srv)?:\/\/.+/,
        message: 'MongoDB URI must start with mongodb:// or mongodb+srv://',
    },
    maxPoolSize: {
        min: 1,
        max: 100,
        message: 'maxPoolSize should be between 1 and 100',
    },
    minPoolSize: {
        min: 0,
        max: 50,
        message: 'minPoolSize should be between 0 and 50',
    },
    serverSelectionTimeoutMS: {
        min: 1000,
        max: 60000,
        message: 'serverSelectionTimeoutMS should be between 1000ms and 60000ms',
    },
    socketTimeoutMS: {
        min: 5000,
        max: 300000,
        message: 'socketTimeoutMS should be between 5000ms and 300000ms',
    },
};

// ============================================================================
// VALIDATOR FUNCTIONS
// ============================================================================

/**
 * Validate database configuration
 * @param {Object} config - Database configuration object
 * @returns {Object} Validation result with errors and warnings
 */
const validateDatabaseConfig = (config) => {
    const errors = [];
    const warnings = [];

    // Validate URI
    if (!config.uri) {
        errors.push('MongoDB URI (MONGO_URI or MONGO_URL) is required but not set');
    } else if (!validationRules.uri.pattern.test(config.uri)) {
        errors.push(validationRules.uri.message);
    }

    // Validate pool sizes
    if (config.options?.maxPoolSize < config.options?.minPoolSize) {
        warnings.push('maxPoolSize should be greater than or equal to minPoolSize');
    }

    if (config.options?.maxPoolSize) {
        if (config.options.maxPoolSize < validationRules.maxPoolSize.min || 
            config.options.maxPoolSize > validationRules.maxPoolSize.max) {
            warnings.push(validationRules.maxPoolSize.message);
        }
    }

    if (config.options?.minPoolSize) {
        if (config.options.minPoolSize < validationRules.minPoolSize.min || 
            config.options.minPoolSize > validationRules.minPoolSize.max) {
            warnings.push(validationRules.minPoolSize.message);
        }
    }

    // Validate timeouts
    if (config.options?.serverSelectionTimeoutMS) {
        if (config.options.serverSelectionTimeoutMS < validationRules.serverSelectionTimeoutMS.min || 
            config.options.serverSelectionTimeoutMS > validationRules.serverSelectionTimeoutMS.max) {
            warnings.push(validationRules.serverSelectionTimeoutMS.message);
        }
    }

    if (config.options?.socketTimeoutMS) {
        if (config.options.socketTimeoutMS < validationRules.socketTimeoutMS.min || 
            config.options.socketTimeoutMS > validationRules.socketTimeoutMS.max) {
            warnings.push(validationRules.socketTimeoutMS.message);
        }
    }

    // Production environment checks
    if (process.env.NODE_ENV === 'production') {
        if (config.options?.autoIndex !== false) {
            warnings.push('autoIndex should be disabled in production for better performance');
        }

        if (config.debug === true) {
            warnings.push('Database debug mode should be disabled in production');
        }

        if (config.uri?.includes('localhost') || config.uri?.includes('127.0.0.1')) {
            errors.push('Using localhost database in production environment is not allowed');
        }

        if (!config.uri?.includes('mongodb+srv://')) {
            warnings.push('Consider using MongoDB Atlas (mongodb+srv://) for production deployments');
        }
    }

    // Security checks
    const securityWarnings = validateSecurity(config);
    warnings.push(...securityWarnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Validate security aspects of database configuration
 * @param {Object} config - Database configuration object
 * @returns {Array} Array of security warnings
 */
const validateSecurity = (config) => {
    const warnings = [];

    // Check for hardcoded credentials in URI
    if (config.uri) {
        const uriPattern = /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/;
        const match = config.uri.match(uriPattern);

        if (match) {
            const username = match[2];
            const password = match[3];

            // Check for weak passwords
            if (password.length < 12) {
                warnings.push('Database password should be at least 12 characters long');
            }

            // Check for default credentials
            const weakCredentials = ['admin', 'root', 'user', 'password', '123456'];
            if (weakCredentials.includes(username.toLowerCase()) || 
                weakCredentials.includes(password.toLowerCase())) {
                warnings.push('Weak or default credentials detected. Use strong, unique credentials');
            }
        }

        // Check for IP whitelist (Atlas)
        if (config.uri.includes('mongodb.net') && !config.uri.includes('0.0.0.0/0')) {
            // This is good - not accessible from everywhere
        } else if (config.uri.includes('mongodb.net')) {
            warnings.push('Database appears to be accessible from all IPs (0.0.0.0/0). Restrict IP access for better security');
        }
    }

    // Check SSL/TLS
    if (process.env.NODE_ENV === 'production' && !config.options?.ssl && !config.uri?.includes('+srv')) {
        warnings.push('Consider enabling SSL/TLS for production database connections');
    }

    return warnings;
};

/**
 * Validate connection URI format
 * @param {string} uri - MongoDB connection URI
 * @returns {Object} Validation result
 */
const validateConnectionUri = (uri) => {
    const errors = [];
    const warnings = [];

    if (!uri) {
        errors.push('Connection URI is required');
        return { valid: false, errors, warnings };
    }

    // Check URI format
    const uriPattern = /^mongodb(\+srv)?:\/\/.+/;
    if (!uriPattern.test(uri)) {
        errors.push('Invalid MongoDB URI format');
    }

    // Check for required components
    const parts = uri.split('@');
    if (parts.length < 2) {
        warnings.push('No authentication detected in URI. Ensure database has proper authentication');
    }

    // Check for database name in URI
    const dbNameMatch = uri.match(/\/([^/?]+)(\?|$)/);
    if (!dbNameMatch) {
        warnings.push('No database name specified in URI');
    }

    // Check for connection options
    if (uri.includes('?')) {
        const options = uri.split('?')[1];
        const optionPairs = options.split('&');
        
        const hasRetryWrites = optionPairs.some(opt => opt.startsWith('retryWrites='));
        const hasW = optionPairs.some(opt => opt.startsWith('w='));
        
        if (!hasRetryWrites) {
            warnings.push('Consider adding retryWrites=true to connection URI');
        }
        
        if (!hasW) {
            warnings.push('Consider adding w=majority to connection URI for write concern');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Validate retry configuration
 * @param {Object} retryConfig - Retry configuration object
 * @returns {Object} Validation result
 */
const validateRetryConfig = (retryConfig) => {
    const errors = [];
    const warnings = [];

    if (!retryConfig) {
        warnings.push('No retry configuration provided');
        return { valid: true, errors, warnings };
    }

    // Validate maxAttempts
    if (retryConfig.maxAttempts < 1) {
        errors.push('maxAttempts should be at least 1');
    }

    if (retryConfig.maxAttempts > 10) {
        warnings.push('maxAttempts > 10 may cause long startup delays');
    }

    // Validate delays
    if (retryConfig.initialDelay < 1000) {
        warnings.push('initialDelay < 1000ms may not give database enough time to recover');
    }

    if (retryConfig.maxDelay < retryConfig.initialDelay) {
        errors.push('maxDelay should be greater than or equal to initialDelay');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
const validateEnvironmentVariables = () => {
    const errors = [];
    const warnings = [];

    const requiredVars = ['MONGO_URI'];
    const recommendedVars = [
        'DB_NAME',
        'DB_MAX_POOL_SIZE',
        'DB_SERVER_TIMEOUT',
        'NODE_ENV',
    ];

    // Check required variables
    requiredVars.forEach(varName => {
        if (!process.env[varName] && !process.env.MONGO_URL) {
            errors.push(`Missing required environment variable: ${varName}`);
        }
    });

    // Check recommended variables
    recommendedVars.forEach(varName => {
        if (!process.env[varName]) {
            warnings.push(`Consider setting environment variable: ${varName}`);
        }
    });

    // Check NODE_ENV
    const validEnvironments = ['development', 'production', 'test', 'staging'];
    if (process.env.NODE_ENV && !validEnvironments.includes(process.env.NODE_ENV)) {
        warnings.push(`NODE_ENV should be one of: ${validEnvironments.join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Run comprehensive validation and log results
 * @param {Object} config - Database configuration object
 * @returns {boolean} True if all validations pass
 */
const runValidation = (config) => {
    logger.info('🔍 Validating database configuration...');

    // Validate configuration
    const configValidation = validateDatabaseConfig(config);
    
    // Validate URI
    const uriValidation = validateConnectionUri(config.uri);
    
    // Validate retry config
    const retryValidation = validateRetryConfig(config.retry);
    
    // Validate environment variables
    const envValidation = validateEnvironmentVariables();

    // Combine all results
    const allErrors = [
        ...configValidation.errors,
        ...uriValidation.errors,
        ...retryValidation.errors,
        ...envValidation.errors,
    ];

    const allWarnings = [
        ...configValidation.warnings,
        ...uriValidation.warnings,
        ...retryValidation.warnings,
        ...envValidation.warnings,
    ];

    // Log errors
    if (allErrors.length > 0) {
        logger.error('❌ Configuration validation errors:');
        allErrors.forEach(error => logger.error(`  - ${error}`));
    }

    // Log warnings
    if (allWarnings.length > 0) {
        logger.warn('⚠️  Configuration warnings:');
        allWarnings.forEach(warning => logger.warn(`  - ${warning}`));
    }

    // Log success
    if (allErrors.length === 0) {
        logger.info('✅ Configuration validation passed');
        if (allWarnings.length > 0) {
            logger.info(`⚠️  Found ${allWarnings.length} warning(s) - review recommended`);
        }
    }

    return allErrors.length === 0;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    validateDatabaseConfig,
    validateConnectionUri,
    validateRetryConfig,
    validateSecurity,
    validateEnvironmentVariables,
    runValidation,
    validationRules,
};