/**
 * DATABASE UTILITIES
 * 
 * Helper utilities for database operations
 * 
 * Features:
 * - Transaction helpers
 * - Query builders
 * - Pagination helpers
 * - Data sanitization
 * 
 * @module utils/database.utils
 */

const mongoose = require('mongoose');
const logger = require('./logger.utils');

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Execute operation within a database transaction
 * @param {Function} operation - Async function to execute in transaction
 * @returns {Promise<*>} Result of the operation
 */
const withTransaction = async (operation) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await operation(session);
        await session.commitTransaction();
        logger.debug('✅ Transaction committed successfully');
        return result;
    } catch (error) {
        await session.abortTransaction();
        logger.error('❌ Transaction aborted:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Execute multiple operations in a transaction
 * @param {Array<Function>} operations - Array of async functions
 * @returns {Promise<Array>} Results of all operations
 */
const withBatchTransaction = async (operations) => {
    return await withTransaction(async (session) => {
        const results = [];
        for (const operation of operations) {
            const result = await operation(session);
            results.push(result);
        }
        return results;
    });
};

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Build pagination options
 * @param {Object} query - Request query parameters
 * @returns {Object} Pagination options
 */
const buildPaginationOptions = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Limit max items per page
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);

    return {
        page,
        limit: finalLimit,
        skip,
    };
};

/**
 * Build pagination metadata
 * @param {number} total - Total count of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
    };
};

/**
 * Execute paginated query
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results with metadata
 */
const paginatedQuery = async (model, filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = '-createdAt', select } = options;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        model
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select(select)
            .lean(),
        model.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(total, page, limit);

    return {
        data,
        meta,
    };
};

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Build search query with multiple fields
 * @param {string} searchTerm - Search term
 * @param {Array<string>} fields - Fields to search in
 * @returns {Object} MongoDB query
 */
const buildSearchQuery = (searchTerm, fields) => {
    if (!searchTerm) return {};

    const searchRegex = new RegExp(searchTerm, 'i');

    return {
        $or: fields.map(field => ({ [field]: searchRegex })),
    };
};

/**
 * Build date range query
 * @param {string} field - Date field name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} MongoDB query
 */
const buildDateRangeQuery = (field, startDate, endDate) => {
    const query = {};

    if (startDate || endDate) {
        query[field] = {};
        
        if (startDate) {
            query[field].$gte = new Date(startDate);
        }
        
        if (endDate) {
            query[field].$lte = new Date(endDate);
        }
    }

    return query;
};

/**
 * Build filter query from request parameters
 * @param {Object} params - Request parameters
 * @param {Array<string>} allowedFilters - Allowed filter fields
 * @returns {Object} MongoDB filter query
 */
const buildFilterQuery = (params, allowedFilters) => {
    const filter = {};

    allowedFilters.forEach(field => {
        if (params[field] !== undefined && params[field] !== '') {
            filter[field] = params[field];
        }
    });

    return filter;
};

// ============================================================================
// DATA SANITIZATION
// ============================================================================

/**
 * Sanitize MongoDB query to prevent injection
 * @param {Object} query - Query object
 * @returns {Object} Sanitized query
 */
const sanitizeQuery = (query) => {
    if (typeof query !== 'object' || query === null) {
        return query;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(query)) {
        // Remove keys starting with $
        if (key.startsWith('$')) {
            logger.warn(`Attempted query injection with key: ${key}`);
            continue;
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeQuery(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Remove sensitive fields from document
 * @param {Object} doc - Document object
 * @param {Array<string>} sensitiveFields - Fields to remove
 * @returns {Object} Sanitized document
 */
const removeSensitiveFields = (doc, sensitiveFields = ['password', '__v']) => {
    const sanitized = { ...doc };

    sensitiveFields.forEach(field => {
        delete sanitized[field];
    });

    return sanitized;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if string is valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Convert string to ObjectId
 * @param {string} id - ID string
 * @returns {mongoose.Types.ObjectId|null} ObjectId or null if invalid
 */
const toObjectId = (id) => {
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (error) {
        logger.warn(`Invalid ObjectId: ${id}`);
        return null;
    }
};

/**
 * Validate and convert array of IDs to ObjectIds
 * @param {Array<string>} ids - Array of ID strings
 * @returns {Array<mongoose.Types.ObjectId>} Array of ObjectIds
 */
const toObjectIds = (ids) => {
    return ids
        .map(toObjectId)
        .filter(id => id !== null);
};

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

/**
 * Build lookup (join) stage for aggregation
 * @param {string} from - Collection to join
 * @param {string} localField - Local field
 * @param {string} foreignField - Foreign field
 * @param {string} as - Output field name
 * @returns {Object} Aggregation lookup stage
 */
const buildLookupStage = (from, localField, foreignField, as) => {
    return {
        $lookup: {
            from,
            localField,
            foreignField,
            as,
        },
    };
};

/**
 * Build match stage with pagination
 * @param {Object} match - Match criteria
 * @param {Object} pagination - Pagination options
 * @returns {Array} Aggregation pipeline stages
 */
const buildPaginatedAggregation = (match, pagination) => {
    const { skip, limit } = pagination;

    return [
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        },
    ];
};

// ============================================================================
// INDEX HELPERS
// ============================================================================

/**
 * Check if index exists on collection
 * @param {mongoose.Model} model - Mongoose model
 * @param {string} indexName - Index name
 * @returns {Promise<boolean>} True if index exists
 */
const indexExists = async (model, indexName) => {
    try {
        const indexes = await model.collection.getIndexes();
        return indexName in indexes;
    } catch (error) {
        logger.error('Error checking index:', error);
        return false;
    }
};

/**
 * Create index if it doesn't exist
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} indexSpec - Index specification
 * @param {Object} options - Index options
 * @returns {Promise<void>}
 */
const ensureIndex = async (model, indexSpec, options = {}) => {
    try {
        await model.collection.createIndex(indexSpec, options);
        logger.info(`✅ Index created on ${model.collection.name}:`, indexSpec);
    } catch (error) {
        if (error.code === 85) {
            // Index already exists
            logger.debug(`Index already exists on ${model.collection.name}`);
        } else {
            logger.error('Error creating index:', error);
            throw error;
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Transaction helpers
    withTransaction,
    withBatchTransaction,

    // Pagination
    buildPaginationOptions,
    buildPaginationMeta,
    paginatedQuery,

    // Query builders
    buildSearchQuery,
    buildDateRangeQuery,
    buildFilterQuery,

    // Sanitization
    sanitizeQuery,
    removeSensitiveFields,

    // Validation
    isValidObjectId,
    toObjectId,
    toObjectIds,

    // Aggregation
    buildLookupStage,
    buildPaginatedAggregation,

    // Indexes
    indexExists,
    ensureIndex,
};