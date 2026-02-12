/**
 * AI UTILITIES
 * 
 * Helper functions for AI operations
 * Extracted from config for better organization
 * 
 * @module utils/ai.utils
 */

const aiConfig = require('../config/ai-services.config');

// ============================================================================
// SERVICE SELECTION
// ============================================================================

/**
 * Get service configuration by name
 * @param {string} serviceName - Service name (openai, replicate, etc.)
 * @returns {Object} Service configuration
 * @throws {Error} If service not found
 */
const getService = (serviceName) => {
    const services = {
        openai: aiConfig.openai,
        replicate: aiConfig.replicate,
        huggingface: aiConfig.huggingface,
        local: aiConfig.localModel,
    };
    
    const service = services[serviceName.toLowerCase()];
    
    if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
    }
    
    return service;
};

/**
 * Check if service is enabled
 * @param {string} serviceName - Service name
 * @returns {boolean} True if enabled
 */
const isServiceEnabled = (serviceName) => {
    return aiConfig.featureFlags.services[serviceName]?.enabled === true;
};

/**
 * Get recommended service for operation
 * @param {string} operation - Operation type
 * @returns {string} Service name
 */
const getRecommendedService = (operation) => {
    const recommendations = {
        textToImage: 'replicate',
        textToVideo: 'runway',
        imageUpscale: 'replicate',
        chatCompletion: 'openai',
        moderation: 'openai',
        backgroundRemoval: 'replicate',
    };
    
    return recommendations[operation] || aiConfig.global.defaultImageProvider;
};

// ============================================================================
// CREDIT CALCULATION
// ============================================================================

/**
 * Calculate credit cost for operation
 * @param {string} operation - Operation type (textToImage, textToVideo, etc.)
 * @param {Object} params - Operation parameters
 * @returns {number} Credit cost
 */
const calculateCredits = (operation, params = {}) => {
    // Text to Image
    if (operation === 'textToImage') {
        const provider = params.provider || 'replicate';
        
        if (provider === 'replicate') {
            return aiConfig.creditCosts.image.textToImage.replicate;
        } else if (provider === 'dalle3') {
            return params.quality === 'hd' 
                ? aiConfig.creditCosts.image.textToImage.dalle3HD
                : aiConfig.creditCosts.image.textToImage.dalle3Standard;
        }
    }
    
    // Text to Video
    if (operation === 'textToVideo') {
        const duration = params.duration || 'short';
        return aiConfig.creditCosts.video.textToVideo[duration] || 10;
    }
    
    // Image operations
    if (operation === 'upscale') {
        return aiConfig.creditCosts.image.upscale;
    }
    
    if (operation === 'backgroundRemoval') {
        return aiConfig.creditCosts.image.backgroundRemoval;
    }
    
    // Default
    return 1;
};

/**
 * Estimate monthly cost
 * @param {Object} usage - Usage statistics
 * @returns {Object} Cost breakdown
 */
const estimateMonthlyCost = (usage) => {
    const costs = {
        images: usage.images * 0.0025,
        chats: usage.chats * 0.001,
        upscales: usage.upscales * 0.005,
        moderation: 0,
    };
    
    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return {
        breakdown: costs,
        total: total.toFixed(2),
        currency: 'USD',
    };
};

// 
// RETRY LOGIC

/**
 * Execute function with exponential backoff retry
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Function result
 */
const retryWithBackoff = async (fn, options = {}) => {
    const {
        maxAttempts = aiConfig.global.retry.maxAttempts,
        initialDelay = aiConfig.global.retry.initialDelay,
        maxDelay = aiConfig.global.retry.maxDelay,
        strategy = aiConfig.global.retry.strategy,
    } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            // Check if error is retryable
            const statusCode = error.response?.status;
            const isRetryable = aiConfig.global.retry.retryableStatusCodes.includes(statusCode);
            
            // Last attempt or non-retryable error
            if (attempt === maxAttempts || !isRetryable) {
                throw error;
            }
            
            // Calculate delay
            let delay;
            if (strategy === 'exponential') {
                delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
            } else if (strategy === 'linear') {
                delay = initialDelay * attempt;
            } else {
                delay = initialDelay;
            }
            
            // Add jitter to prevent thundering herd
            delay = delay + Math.random() * 1000;
            
            console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// VALIDATION


/**
 * Validate AI configuration
 * @returns {Object} Validation result
 */
const validateAIConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Check if at least one service is enabled
    const enabledServices = Object.keys(aiConfig.featureFlags.services)
        .filter(service => isServiceEnabled(service));
    
    if (enabledServices.length === 0) {
        errors.push('No AI services enabled');
    }
    
    // Check API keys
    if (isServiceEnabled('openai') && !aiConfig.openai.apiKey) {
        errors.push('OPENAI_API_KEY is required but not set');
    }
    
    if (isServiceEnabled('replicate') && !aiConfig.replicate.apiKey) {
        errors.push('REPLICATE_API_KEY is required but not set');
    }
    
    // Warnings
    if (!isServiceEnabled('replicate')) {
        warnings.push('Replicate is disabled - missing best free option');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        enabledServices,
    };
};

/**
 * Validate prompt content
 * @param {string} prompt - User prompt
 * @returns {Object} Validation result
 */
const validatePrompt = (prompt) => {
    const errors = [];
    
    // Check if empty
    if (!prompt || prompt.trim().length === 0) {
        errors.push('Prompt cannot be empty');
    }
    
    // Check length
    if (prompt.length > 1000) {
        errors.push('Prompt too long (max 1000 characters)');
    }
    
    // Check for blocked words (basic example)
    const blockedWords = ['violence', 'explicit', 'nsfw']; // Expand as needed
    const containsBlocked = blockedWords.some(word => 
        prompt.toLowerCase().includes(word)
    );
    
    if (containsBlocked && aiConfig.global.safety.blockUnsafeContent) {
        errors.push('Prompt contains inappropriate content');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};


// FORMATTING


/**
 * Format API error for user
 * @param {Error} error - API error
 * @param {string} service - Service name
 * @returns {Object} Formatted error
 */
const formatAPIError = (error, service) => {
    const statusCode = error.response?.status;
    
    // Rate limit error
    if (statusCode === 429) {
        return {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            service,
            retryAfter: error.response?.headers['retry-after'],
        };
    }
    
    // Invalid API key
    if (statusCode === 401) {
        return {
            code: 'INVALID_CREDENTIALS',
            message: 'Service authentication failed',
            service,
        };
    }
    
    // Insufficient credits
    if (statusCode === 402) {
        return {
            code: 'INSUFFICIENT_CREDITS',
            message: 'Insufficient credits in AI service account',
            service,
        };
    }
    
    // Generic error
    return {
        code: 'AI_SERVICE_ERROR',
        message: error.message || 'AI service request failed',
        service,
    };
};

/**
 * Format duration to human readable
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};


// EXPORTS


module.exports = {
    // Service selection
    getService,
    isServiceEnabled,
    getRecommendedService,
    
    // Credit calculation
    calculateCredits,
    estimateMonthlyCost,
    
    // Retry logic
    retryWithBackoff,
    
    // Validation
    validateAIConfig,
    validatePrompt,
    
    // Formatting
    formatAPIError,
    formatDuration,
};