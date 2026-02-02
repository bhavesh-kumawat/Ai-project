require(`dotenv`).config();

const globalConfig = {
  //environment
  environment: process.env.NODE_ENV || "development",

  // default provider for text operations
  defaultTextProvider: process.env.DEFAULT_TEXT_PROVIDER || "openai",

  // default provider for image operations
  defaultImageProvider: process.env.DEFAULT_IMAGE_PROVIDER || "stability",

  // default provider for video operations
  defaultVideoProvider: process.env.DEFAULT_VIDEO_PROVIDER || "runway",

  // global timeout
  timeout: Number(process.env.AI_SERVICE_TIMEOUT) || 60000, //60sec

  // retry config
  retry: {
    maxAttempts: Number(process.env.MAX_RETRIES) || 3,
    strategy: process.env.RETRY_STRATEGY || `exponential`, // exponential, fixed, linear
    initialDelay: 1000, // 1sec
    maxDelay: 30000, // 30sec
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },

  // Rate limitting
  rateLimit: {
    requestsPerMinute: Number(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 60,
    requestPerHour: Number(process.env.RATE_LIMIT_REQUESTS_PER_HOUR) || 3000,
    tokensPerMinute: Number(process.env.RATE_LIMIT_TOKENS_PER_MINUTE) || 60000,
    tokenPerDay: Number(process.env.RATE_LIMIT_TOKENS_PER_DAY) || 1000000,
  },

  // logging and monitoring
  logging: {
    enabled: process.env.ENABLE_AI_LOGGING !== "false",
    level: process.env.LOG_LEVEL || "info",
    logPrompts: process.env.LOG_AI_PROMPTS === "true",
    logResponses: process.env.LOG_AI_RESPONSES === "true",
    logTokenUsage: process.env.LOG_TOKEN_USAGE !== "false",
    logLatency: true, // always log preformance
    redactSensitiveData: process.env.NODE_ENV === "production", // auto redact in production
  },

  //safty and moderation
  safety: {
    enableModeration: process.env.ENABLE_AI_MODERATION !== "false",
    blockUnsafeContent: process.env.BLOCK_UNSAFE_CONTENT !== "false",
    moderationProviders: process.env.MODERATION_PROVIDER || "opebai",
    contentPolicy: {
      allowedNSFM: process.env.ALLOW_NSFW === "true",
      allowViolence: process.env.ALLOW_VIOLENCE === "true",
      allowHateSpeech: false, // always block hate speech
    },
  },
};

// open ai config

const openai = {
  // authentication
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  apiBaseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",

  // ENpoints
  endpoints: {
    chat: "/chat/completions",
    imageGeneration: "/images/generations",
    imageEdit: "/images/edits",
    imageVariation1: ".imaeges/variations",
    moderation: "/moderations",
  },

  // gpt config
  gpt: {
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 1024,
    topP: Number(process.env.OPENAI_TOP_P) || 1,
    frequencyPenalty: Number(process.env.OPENAI_FREQUENCY_PENALTY) || 0,
    presencePenalty: Number(process.env.OPENAI_PRESENCE_PENALTY) || 0,
  },

  //dall-e config means image generation
  dalle: {
    model: process.env.DALLE_MODEL || "dall-e-3",
    size: process.env.DALLE_SIZE || "1024x1024",
    quality: process.env.DALLE_QUALITY || "standard", // standard or hd
    style: process.env.DALLE_STYLE || "vivid", //vivid or natural
    n: 1, //number of images to generate or dall-e-3 only supports 1
  },

  // Pricing (for credit calculation)
  pricing: {
    gpt35Turbo: {
      input: 0.0015, // per 1K tokens
      output: 0.002, // per 1K tokens
    },
    gpt4: {
      input: 0.03,
      output: 0.06,
    },
    dalle3: {
      standard: {
        "1024x1024": 0.04,
        "1024x1792": 0.08,
        "1792x1024": 0.08,
      },
      hd: {
        "1024x1024": 0.08,
        "1024x1792": 0.12,
        "1792x1024": 0.12,
      },
    },
  },
  // Service-specific rate limits
  rateLimit: {
    requestsPerMinute: 500,
    tokensPerMinute: 150000,
    imagesPerMinute: 5,
  },
};


//stability ai config
const stability = {
    // Authentication
    apiKey: process.env.STABILITY_API_KEY,
    baseURL: 'https://api.stability.ai',
    
    // Endpoints
    endpoints: {
        textToImage: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        imageToImage: '/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
        upscale: '/v1/generation/esrgan-v1-x2plus/image-to-image/upscale',
    },
    
    // Default parameters
    defaults: {
        width: Number(process.env.STABILITY_WIDTH) || 1024,
        height: Number(process.env.STABILITY_HEIGHT) || 1024,
        steps: Number(process.env.STABILITY_STEPS) || 50,
        cfgScale: Number(process.env.STABILITY_CFG_SCALE) || 7,
        samples: 1,
        sampler: process.env.STABILITY_SAMPLER || 'K_DPM_2_ANCESTRAL',
    },
    
    // Pricing
    pricing: {
        textToImage: {
            '512x512': 0.002,
            '1024x1024': 0.004,
            '1024x1792': 0.006,
        },
        upscale: 0.008,
    },
    
    // Rate limits
    rateLimit: {
        requestsPerMinute: 150,
        requestsPerHour: 5000,
    },
    
    // Timeout (image generation takes longer)
    timeout: Number(process.env.STABILITY_TIMEOUT) || 120000, // 2 minutes
};

// runway ai config
const runway = {
    // Authentication
    apiKey: process.env.RUNWAY_API_KEY,
    baseURL: 'https://api.runwayml.com/v1',
    enabled: process.env.RUNWAY_ENABLED === 'true',
    
    // Endpoints
    endpoints: {
        textToVideo: '/generations',
        imageToVideo: '/generations/image-to-video',
        status: '/generations',
    },
    
    // Default parameters
    defaults: {
        duration: Number(process.env.RUNWAY_DURATION) || 4, // seconds
        resolution: process.env.RUNWAY_RESOLUTION || '1280x768',
        fps: Number(process.env.RUNWAY_FPS) || 24,
        motion: Number(process.env.RUNWAY_MOTION) || 5,
    },
    
    // Pricing
    pricing: {
        textToVideo: {
            4: 0.50,   // 4 seconds
            8: 0.90,   // 8 seconds  
            16: 1.60,  // 16 seconds
        },
        imageToVideo: {
            4: 0.40,
            8: 0.75,
            16: 1.40,
        },
    },
    
    // Polling configuration (videos are async)
    polling: {
        interval: Number(process.env.RUNWAY_POLL_INTERVAL) || 5000, // 5 seconds
        maxAttempts: Number(process.env.RUNWAY_POLL_MAX_ATTEMPTS) || 120, // 10 minutes max
    },
    
    // Timeout
    timeout: Number(process.env.RUNWAY_TIMEOUT) || 600000, // 10 minutes
};

// replicate ai config
const replicate = {
    // Authentication
    apiKey: process.env.REPLICATE_API_KEY,
    baseURL: 'https://api.replicate.com/v1',
    enabled: process.env.REPLICATE_ENABLED !== 'false',
    
    // Available models
    models: {
        sdxl: 'stability-ai/sdxl:latest',
        realESRGAN: 'nightmareai/real-esrgan:latest',
        codeFormer: 'sczhou/codeformer:latest',
        backgroundRemoval: 'cjwbw/rembg:latest',
    },
    
    // Pricing
    pricing: {
        textToImage: 0.004,
        imageUpscale: 0.006,
        faceRestore: 0.004,
        backgroundRemoval: 0.002,
    },
    
    // Polling
    polling: {
        interval: 3000,
        maxAttempts: 100,
    },
};


// loacl ai config
const localModel = {
    enabled: process.env.LOCAL_AI_ENABLED === 'true',
    baseURL: process.env.LOCAL_AI_BASE_URL || 'http://localhost:8000',
    model: process.env.LOCAL_AI_MODEL || 'llama3',
    
    // Local model settings
    settings: {
        contextWindow: Number(process.env.LOCAL_AI_CONTEXT_WINDOW) || 4096,
        temperature: Number(process.env.LOCAL_AI_TEMPERATURE) || 0.7,
        topP: Number(process.env.LOCAL_AI_TOP_P) || 0.9,
        topK: Number(process.env.LOCAL_AI_TOP_K) || 40,
    },
    
    // No rate limits for local
    rateLimit: null,
    
    // Pricing (free if self-hosted)
    pricing: {
        perToken: 0,
    },
};


// credit cost per system or provider
const creditCosts = {
    // Text operations (credits)
    text: {
        chatMessage: 0.1,         // Per message
        promptEnhancement: 0.5,   // Enhance user prompts
        moderation: 0,            // Free (safety first!)
    },
    
    // Image operations (credits)
    image: {
        textToImage: {
            low: 1,      // 512x512
            medium: 2,   // 1024x1024
            high: 4,     // 1792x1024 or HD
        },
        imageToImage: 2,
        variation: 2,
        edit: 3,
        upscale2x: 2,
        upscale4x: 4,
        backgroundRemoval: 1,
        faceRestore: 2,
    },
    
    // Video operations (credits)
    video: {
        textToVideo: {
            short: 10,   // 4 seconds
            medium: 18,  // 8 seconds
            long: 32,    // 16 seconds
        },
        imageToVideo: {
            short: 8,
            medium: 15,
            long: 28,
        },
        enhance: 10,
    },
};


// feature flags
const featureFlags = {
    // Services
    services: {
        openai: {
            enabled: process.env.OPENAI_ENABLED !== 'false',
            dalle: process.env.DALLE_ENABLED !== 'false',
            gpt4: process.env.GPT4_ENABLED === 'true',
        },
        stability: {
            enabled: process.env.STABILITY_ENABLED !== 'false',
        },
        runway: {
            enabled: process.env.RUNWAY_ENABLED === 'true',
        },
        replicate: {
            enabled: process.env.REPLICATE_ENABLED !== 'false',
        },
        localModel: {
            enabled: process.env.LOCAL_AI_ENABLED === 'true',
        },
    },
    
    // Features
    features: {
        videoGeneration: process.env.FEATURE_VIDEO_GEN === 'true',
        imageUpscaling: process.env.FEATURE_UPSCALING !== 'false',
        batchProcessing: process.env.FEATURE_BATCH === 'true',
        promptEnhancement: process.env.FEATURE_PROMPT_ENHANCE !== 'false',
    },
    
    // Beta features (dev/staging only)
    beta: {
        aiVideoGeneration: globalConfig.environment !== 'production',
        customModels: false,
        apiWhiteLabel: false,
    },
};

// helper function to get service config
/**
 * Get service configuration by name
 * @param {string} serviceName - Service name (openai, stability, runway, etc.)
 * @returns {Object} Service configuration
 */
function getService(serviceName) {
    const services = {
        openai,
        stability,
        runway,
        replicate,
        local: localModel,
    };
    
    const service = services[serviceName.toLowerCase()];
    
    if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
    }
    
    return service;
}

/**
 * Check if service is enabled
 * @param {string} serviceName 
 * @returns {boolean}
 */
function isServiceEnabled(serviceName) {
    return featureFlags.services[serviceName]?.enabled === true;
}

/**
 * Calculate credit cost for operation
 * @param {string} operation - Operation type (textToImage, textToVideo, etc.)
 * @param {Object} params - Operation parameters (size, duration, etc.)
 * @returns {number} Credit cost
 */
function calculateCredits(operation, params = {}) {
    // Text to Image
    if (operation === 'textToImage') {
        const size = params.size || 'medium';
        return creditCosts.image.textToImage[size] || 2;
    }
    
    // Text to Video
    if (operation === 'textToVideo') {
        const duration = params.duration || 'short';
        return creditCosts.video.textToVideo[duration] || 10;
    }
    
    // Image Upscale
    if (operation === 'upscale') {
        const factor = params.factor || 2;
        return factor === 2 ? creditCosts.image.upscale2x : creditCosts.image.upscale4x;
    }
    
    // Default
    return 1;
}

/**
 * Get recommended service for operation
 * @param {string} operation 
 * @returns {string} Service name
 */
function getRecommendedService(operation) {
    const recommendations = {
        textToImage: 'stability',      // Best quality/price
        textToVideo: 'runway',         // Industry leader
        imageUpscale: 'replicate',     // Real-ESRGAN
        chatCompletion: 'openai',      // GPT best for text
        moderation: 'openai',          // Best moderation API
    };
    
    return recommendations[operation] || globalConfig.defaultImageProvider;
}

/**
 * Validate API keys are present
 * @returns {Object} Validation results
 */
function validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Check required keys
    if (isServiceEnabled('openai') && !openai.apiKey) {
        errors.push('OPENAI_API_KEY is required but not set');
    }
    
    if (isServiceEnabled('stability') && !stability.apiKey) {
        errors.push('STABILITY_API_KEY is required but not set');
    }
    
    if (isServiceEnabled('runway') && !runway.apiKey) {
        warnings.push('RUNWAY_API_KEY not set - video generation disabled');
    }
    
    // Check safety settings
    if (!globalConfig.safety.enableModeration) {
        warnings.push('Content moderation is disabled - this is a security risk');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// export configurations and helper functions
module.exports = {
    // Global config
    global: globalConfig,
    
    // Service configs
    openai,
    stability,
    runway,
    replicate,
    localModel,
    
    // Cost & features
    creditCosts,
    featureFlags,
    
    // Helper functions
    getService,
    isServiceEnabled,
    calculateCredits,
    getRecommendedService,
    validateConfig,
    
    // Backward compatibility with your code
    AI_SERVICES: {
        provider: globalConfig.defaultTextProvider,
        environment: globalConfig.environment,
        timeout: globalConfig.timeout,
        maxRetries: globalConfig.retry.maxAttempts,
        openai,
        localModel,
        rateLimit: globalConfig.rateLimit,
        logging: globalConfig.logging,
        safety: globalConfig.safety,
    },
};
