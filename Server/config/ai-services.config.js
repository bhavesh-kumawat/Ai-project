/**
 * AI SERVICES CONFIGURATION (Clean Version)
 * 
 * This file ONLY contains configuration values for AI services.
 * No helper functions, no business logic - just settings!
 * 
 * Related files:
 * - services/ai/text-to-image.service.js
 * - services/ai/text-to-video.service.js
 * - utils/ai.utils.js
 * 
 * @module config/ai-services.config
 */

require('dotenv').config();


// GLOBAL CONFIGURATION


const globalConfig = {
    environment: process.env.NODE_ENV || 'development',
    defaultTextProvider: process.env.AI_TEXT_PROVIDER || 'openai',
    defaultImageProvider: process.env.AI_IMAGE_PROVIDER || 'openai',
    defaultVideoProvider: process.env.AI_VIDEO_PROVIDER || 'stability',
    timeout: Number(process.env.AI_TIMEOUT) || 60000,

    retry: {
        maxAttempts: Number(process.env.MAX_RETRIES) || 3,
        strategy: process.env.RETRY_STRATEGY || 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },

    rateLimit: {
        requestsPerMinute: Number(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 60,
        requestsPerHour: Number(process.env.RATE_LIMIT_REQUESTS_PER_HOUR) || 3000,
    },

    logging: {
        enabled: process.env.ENABLE_AI_LOGGING !== 'false',
        level: process.env.LOG_LEVEL || 'info',
        logPrompts: process.env.LOG_AI_PROMPTS === 'true',
        logResponses: process.env.LOG_AI_RESPONSES === 'true',
        logTokenUsage: true,
        logLatency: true,
    },

    safety: {
        enableModeration: process.env.ENABLE_AI_MODERATION !== 'false',
        blockUnsafeContent: process.env.BLOCK_UNSAFE_CONTENT !== 'false',
        moderationProvider: 'openai',
    },
};


// OPENAI CONFIGURATION


const openai = {
    enabled: process.env.OPENAI_ENABLED !== 'false',
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    baseURL: 'https://api.openai.com/v1',

    endpoints: {
        chat: '/chat/completions',
        imageGeneration: '/images/generations',
        moderation: '/moderations',
    },

    gpt: {
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
        maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 1024,
        topP: Number(process.env.OPENAI_TOP_P) || 1,
    },

    dalle: {
        enabled: process.env.DALLE_ENABLED !== 'false',
        model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
    },

    pricing: {
        gpt35Turbo: { input: 0.0015, output: 0.002 },
        gpt4: { input: 0.03, output: 0.06 },
        dalle3: { standard: 0.040, hd: 0.080 },
    },

    rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000,
    },

    timeout: 120000,
};

// ============================================================================
// STABILITY CONFIGURATION
// ============================================================================

const stability = {
    enabled: process.env.STABILITY_ENABLED !== 'false',
    apiKey: process.env.STABILITY_API_KEY,
    baseURL: process.env.STABILITY_BASE_URL || 'https://api.stability.ai',

    endpoints: {
        textToImage: '/v2beta/stable-image/generate/core',
        imageToVideo: '/v2beta/image-to-video',
    },

    image: {
        outputFormat: process.env.STABILITY_IMAGE_FORMAT || 'png',
        aspectRatio: process.env.STABILITY_ASPECT_RATIO || '1:1',
    },

    video: {
        pollIntervalMs: Number(process.env.STABILITY_VIDEO_POLL_INTERVAL_MS) || 5000,
        maxPollAttempts: Number(process.env.STABILITY_VIDEO_MAX_POLL_ATTEMPTS) || 60,
    },

    timeout: Number(process.env.STABILITY_TIMEOUT_MS) || 300000,
};

// ============================================================================
// GEMINI CONFIGURATION
// ============================================================================

const gemini = {
    enabled: process.env.GEMINI_ENABLED !== 'false',
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp-image-generation',
    videoModel: process.env.GEMINI_VIDEO_MODEL || '',
    timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 180000,
};


// REPLICATE CONFIGURATION


const replicate = {
    enabled: process.env.REPLICATE_ENABLED !== 'false',
    apiKey: process.env.REPLICATE_API_KEY,
    baseURL: 'https://api.replicate.com/v1',

    endpoints: {
        predictions: '/predictions',
        models: '/models',
    },

    models: {
        sdxl: {
            name: 'stability-ai/sdxl',
            version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            enabled: true,
            pricing: 0.0025,
        },
        flux: {
            name: 'black-forest-labs/flux-schnell',
            version: 'bf0c7d53e7d88e5e1c98e7c26d9fcf8f6d3f4e4c5b6a7f8e9d0c1b2a3f4e5d6c',
            enabled: true,
            pricing: 0.003,
        },
        realESRGAN: {
            name: 'nightmareai/real-esrgan',
            version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
            enabled: true,
            pricing: 0.005,
        },
        backgroundRemoval: {
            name: 'cjwbw/rembg',
            version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
            enabled: true,
            pricing: 0.001,
        },
    },

    polling: {
        interval: 3000,
        maxAttempts: 100,
    },

    timeout: 300000,
};

// ============================================================================
// HUGGING FACE CONFIGURATION
// ============================================================================

const huggingface = {
    enabled: process.env.HUGGINGFACE_ENABLED === 'true',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseURL: 'https://api-inference.huggingface.co/models',

    models: {
        stableDiffusion: {
            name: 'stabilityai/stable-diffusion-xl-base-1.0',
            enabled: true,
            pricing: 0,
        },
        backgroundRemoval: {
            name: 'briaai/RMBG-1.4',
            enabled: true,
            pricing: 0,
        },
    },

    freeTier: {
        rateLimit: {
            requestsPerHour: 100,
            requestsPerDay: 1000,
        },
    },

    timeout: 120000,
};


const localModel = {
    enabled: process.env.LOCAL_AI_ENABLED === 'true',
    baseURL: process.env.LOCAL_AI_BASE_URL || 'http://localhost:11434',

    availableModels: {
        llama3: {
            name: 'llama3',
            size: '4.7GB',
            enabled: true,
        },
        mistral: {
            name: 'mistral',
            size: '4.1GB',
            enabled: true,
        },
    },

    settings: {
        contextWindow: 4096,
        temperature: 0.7,
    },

    pricing: {
        perToken: 0,
    },
};


const creditCosts = {
    text: {
        chatMessage: 1,
        promptEnhancement: 2,
        moderation: 0,
    },

    image: {
        textToImage: {
            replicate: 5,
            dalle3Standard: 10,
            dalle3HD: 20,
        },
        upscale: 3,
        backgroundRemoval: 1,
        faceRestore: 2,
    },

    video: {
        textToVideo: {
            short: 10,
            medium: 18,
            long: 32,
        },
        imageToVideo: {
            short: 8,
            medium: 15,
            long: 28,
        },
    },
};


const featureFlags = {
    services: {
        openai: {
            enabled: process.env.OPENAI_ENABLED !== 'false',
            dalle: process.env.DALLE_ENABLED !== 'false',
            gpt4: process.env.GPT4_ENABLED === 'true',
        },
        stability: {
            enabled: process.env.STABILITY_ENABLED !== 'false',
        },
        gemini: {
            enabled: process.env.GEMINI_ENABLED !== 'false',
        },
        replicate: {
            enabled: process.env.REPLICATE_ENABLED !== 'false',
        },
        huggingface: {
            enabled: process.env.HUGGINGFACE_ENABLED === 'true',
        },
        localModel: {
            enabled: process.env.LOCAL_AI_ENABLED === 'true',
        },
    },

    features: {
        imageGeneration: true,
        imageUpscaling: true,
        videoGeneration: true,
        batchProcessing: true,
        promptEnhancement: true,
    },
};


module.exports = {
    global: globalConfig,
    openai,
    stability,
    gemini,
    replicate,
    huggingface,
    localModel,
    creditCosts,
    featureFlags,
};
