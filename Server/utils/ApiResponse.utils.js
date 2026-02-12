/**
 * API RESPONSE UTILITY
 * 
 * Standardized API response format for consistent responses
 * 
 * @module utils/ApiResponse.utils
 */

class ApiResponse {
    /**
     * Create a standardized API response
     * @param {number} statusCode - HTTP status code
     * @param {*} data - Response data
     * @param {string} message - Response message
     * @param {Array} errors - Array of error messages (optional)
     */
    constructor(statusCode, data = null, message = 'Success', errors = null) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        
        if (errors) {
            this.errors = errors;
        }
        
        this.timestamp = new Date().toISOString();
    }

    /**
     * Create success response
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @returns {ApiResponse}
     */
    static success(data = null, message = 'Operation successful') {
        return new ApiResponse(200, data, message);
    }

    /**
     * Create created response
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @returns {ApiResponse}
     */
    static created(data = null, message = 'Resource created successfully') {
        return new ApiResponse(201, data, message);
    }

    /**
     * Create bad request response
     * @param {string} message - Error message
     * @param {Array} errors - Validation errors
     * @returns {ApiResponse}
     */
    static badRequest(message = 'Bad request', errors = null) {
        return new ApiResponse(400, null, message, errors);
    }

    /**
     * Create unauthorized response
     * @param {string} message - Error message
     * @returns {ApiResponse}
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiResponse(401, null, message);
    }

    /**
     * Create forbidden response
     * @param {string} message - Error message
     * @returns {ApiResponse}
     */
    static forbidden(message = 'Forbidden') {
        return new ApiResponse(403, null, message);
    }

    /**
     * Create not found response
     * @param {string} message - Error message
     * @returns {ApiResponse}
     */
    static notFound(message = 'Resource not found') {
        return new ApiResponse(404, null, message);
    }

    /**
     * Create internal server error response
     * @param {string} message - Error message
     * @returns {ApiResponse}
     */
    static error(message = 'Internal server error') {
        return new ApiResponse(500, null, message);
    }
}

module.exports = ApiResponse;