// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true
// });

// module.exports = cloudinary;


/**
 * CLOUDINARY CONFIGURATION
 * 
 * Cloud storage configuration for images and videos
 * 
 * Features:
 * - Image upload and optimization
 * - Video upload and processing
 * - Automatic format conversion
 * - CDN delivery
 * 
 * Related files:
 * - services/storage.service.js (upload/delete operations)
 * - middleware/upload.middleware.js (file handling)
 * 
 * @module config/cloudinary.config
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// ============================================================================
// CLOUDINARY CONFIGURATION
// ============================================================================

const cloudinaryConfig = {
    // API Credentials
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    
    // Security
    secure: true, // Use HTTPS URLs
    
    // Upload options
    upload: {
        // Image upload options
        image: {
            folder: process.env.CLOUDINARY_FOLDER || 'ai-generations/images',
            resourceType: 'image',
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            
            // Transformations
            transformation: [
                {
                    width: 2048,
                    height: 2048,
                    crop: 'limit', // Don't upscale, only limit max size
                },
                {
                    quality: 'auto:good', // Automatic quality optimization
                },
                {
                    fetchFormat: 'auto', // Serve best format (WebP for browsers that support it)
                },
            ],
            
            // Options
            overwrite: false, // Don't overwrite existing files
            uniqueFilename: true, // Generate unique filenames
            useFilename: false, // Don't use original filename
        },
        
        // Video upload options
        video: {
            folder: process.env.CLOUDINARY_FOLDER || 'ai-generations/videos',
            resourceType: 'video',
            allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
            
            // Eager transformations (process immediately)
            eager: [
                {
                    width: 1920,
                    height: 1080,
                    crop: 'limit',
                    format: 'mp4',
                    videoCodec: 'h264',
                },
                {
                    width: 1280,
                    height: 720,
                    crop: 'limit',
                    format: 'mp4',
                    videoCodec: 'h264',
                },
            ],
            
            // Process in background
            eagerAsync: true,
            
            // Options
            overwrite: false,
            uniqueFilename: true,
            useFilename: false,
        },
        
        // Avatar upload options
        avatar: {
            folder: 'users/avatars',
            resourceType: 'image',
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            
            transformation: [
                {
                    width: 400,
                    height: 400,
                    crop: 'fill', // Crop to exact size
                    gravity: 'face', // Focus on face
                },
                {
                    radius: 'max', // Make circular
                },
                {
                    quality: 'auto:good',
                },
            ],
            
            overwrite: true, // Overwrite previous avatar
            uniqueFilename: false,
        },
        
        // Raw file upload (no transformations)
        raw: {
            folder: 'uploads/raw',
            resourceType: 'raw',
            allowedFormats: ['pdf', 'doc', 'docx', 'txt'],
            
            overwrite: false,
            uniqueFilename: true,
        },
    },
    
    // URL generation options
    url: {
        // Secure HTTPS URLs
        secure: true,
        
        // CDN subdomain
        cdnSubdomain: true,
        
        // URL signature (for private resources)
        signUrl: process.env.CLOUDINARY_SIGN_URLS === 'true',
        
        // Default transformations
        defaultImageTransformation: {
            quality: 'auto:good',
            fetchFormat: 'auto',
        },
    },
    
    // Limits
    limits: {
        // File size limits (in bytes)
        image: {
            maxSize: Number(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024, // 10MB
        },
        video: {
            maxSize: Number(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024, // 100MB
        },
        avatar: {
            maxSize: 5 * 1024 * 1024, // 5MB
        },
        raw: {
            maxSize: 20 * 1024 * 1024, // 20MB
        },
    },
    
    // Deletion options
    delete: {
        // Delete related derived resources
        invalidate: true,
    },
    
    // Auto-cleanup settings
    autoCleanup: {
        enabled: process.env.CLOUDINARY_AUTO_CLEANUP === 'true',
        
        // Delete files older than X days
        expiryDays: Number(process.env.CLOUDINARY_EXPIRY_DAYS) || 30,
        
        // Folders to auto-clean
        folders: [
            'ai-generations/images',
            'ai-generations/videos',
        ],
    },
};

// ============================================================================
// INITIALIZE CLOUDINARY
// ============================================================================

/**
 * Configure Cloudinary with credentials
 */
const initializeCloudinary = () => {
    try {
        cloudinary.config({
            cloud_name: cloudinaryConfig.cloudName,
            api_key: cloudinaryConfig.apiKey,
            api_secret: cloudinaryConfig.apiSecret,
            secure: cloudinaryConfig.secure,
        });
        
        console.log('✅ Cloudinary configured successfully');
        
        return true;
    } catch (error) {
        console.error('❌ Cloudinary configuration failed:', error.message);
        return false;
    }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate Cloudinary configuration
 * @returns {Object} Validation result
 */
const validateConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Check required credentials
    if (!cloudinaryConfig.cloudName) {
        errors.push('CLOUDINARY_CLOUD_NAME is required but not set');
    }
    
    if (!cloudinaryConfig.apiKey) {
        errors.push('CLOUDINARY_API_KEY is required but not set');
    }
    
    if (!cloudinaryConfig.apiSecret) {
        errors.push('CLOUDINARY_API_SECRET is required but not set');
    }
    
    // Check URL signing in production
    if (process.env.NODE_ENV === 'production' && !cloudinaryConfig.url.signUrl) {
        warnings.push('Consider enabling URL signing in production for security');
    }
    
    // Check auto-cleanup
    if (cloudinaryConfig.autoCleanup.enabled && cloudinaryConfig.autoCleanup.expiryDays < 7) {
        warnings.push('Auto-cleanup expiry is less than 7 days - files may be deleted too quickly');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

// ============================================================================
// HELPER FUNCTIONS (Configuration-related only)
// ============================================================================

/**
 * Get upload options for a specific type
 * @param {string} type - Upload type (image, video, avatar, raw)
 * @returns {Object} Upload options
 */
const getUploadOptions = (type = 'image') => {
    const options = cloudinaryConfig.upload[type];
    
    if (!options) {
        throw new Error(`Unknown upload type: ${type}`);
    }
    
    return { ...options };
};

/**
 * Get file size limit for a type
 * @param {string} type - Upload type
 * @returns {number} Max size in bytes
 */
const getFileSizeLimit = (type = 'image') => {
    return cloudinaryConfig.limits[type]?.maxSize || 10 * 1024 * 1024;
};

/**
 * Check if file format is allowed
 * @param {string} type - Upload type
 * @param {string} format - File format/extension
 * @returns {boolean} True if allowed
 */
const isFormatAllowed = (type, format) => {
    const options = cloudinaryConfig.upload[type];
    
    if (!options) {
        return false;
    }
    
    const allowedFormats = options.allowedFormats || [];
    return allowedFormats.includes(format.toLowerCase());
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Configuration object
    config: cloudinaryConfig,
    
    // Cloudinary instance (already configured)
    cloudinary,
    
    // Initialize function
    initializeCloudinary,
    
    // Validation
    validateConfig,
    
    // Helper functions
    getUploadOptions,
    getFileSizeLimit,
    isFormatAllowed,
    
    // Quick access to common values
    cloudName: cloudinaryConfig.cloudName,
    imageFolder: cloudinaryConfig.upload.image.folder,
    videoFolder: cloudinaryConfig.upload.video.folder,
};