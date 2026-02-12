/**
 * API ERROR UTILITY
 * 
 * Custom error class for API errors
 * 
 * @module utils/ApiError.utils
 */

class ApiError extends Error {
    /**
     * Create a custom API error
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {boolean} isOperational - Whether error is operational (true) or programming error (false)
     * @param {string} stack - Error stack trace
     */
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Create bad request error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static badRequest(message = 'Bad request') {
        return new ApiError(400, message);
    }

    /**
     * Create unauthorized error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }

    /**
     * Create forbidden error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }

    /**
     * Create not found error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }

    /**
     * Create internal server error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static internal(message = 'Internal server error') {
        return new ApiError(500, message);
    }
}

module.exports = ApiError;