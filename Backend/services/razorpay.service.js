const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env.config');
const { AppError } = require('../middleware/error.middleware');

// Initialize Razorpay only if credentials are provided
let razorpay = null;

if (config.razorpay && config.razorpay.keyId && config.razorpay.keySecret) {
    razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret
    });
    console.log('✅ Razorpay initialized');
} else {
    console.warn('⚠️  Razorpay credentials not configured. Payment features will be disabled.');
}


/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in lowest currency subunit (e.g., paise for INR)
 * @param {string} currency - Currency code (default: INR)
 * @param {Object} [notes] - Additional notes
 */
exports.createOrder = async (amount, currency = 'INR', notes = {}) => {
    if (!razorpay) {
        throw new AppError('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.', 503);
    }

    try {
        const options = {
            amount, // amount in the smallest currency unit
            currency,
            receipt: `receipt_${Date.now()}`,
            notes
        };
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new AppError(`Razorpay Error: ${error.message}`, 500);
    }
};

/**
 * Verify Razorpay Payment Signature
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
    if (!razorpay || !config.razorpay || !config.razorpay.keySecret) {
        throw new AppError('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.', 503);
    }

    const generated_signature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(orderId + "|" + paymentId)
        .digest('hex');

    return generated_signature === signature;
};
