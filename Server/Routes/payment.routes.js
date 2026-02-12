const express = require('express');
const router = express.Router();
const paymentController = require('../Controllers/Payment.Controller');
const validate = require('../middleware/validation.middleware');
const Joi = require('joi');
const { authLimiter } = require('../middleware/rateLimit.middleware'); // Reusing auth limiter or create a new one

// Validation Schemas
const createOrderSchema = {
    body: Joi.object({
        amount: Joi.number().required().min(100), // Min 1 INR
        currency: Joi.string().default('INR')
    })
};

const verifyPaymentSchema = {
    body: Joi.object({
        razorpay_order_id: Joi.string().required(),
        razorpay_payment_id: Joi.string().required(),
        razorpay_signature: Joi.string().required()
    })
};

router.post('/create-order', authLimiter, validate(createOrderSchema), paymentController.createOrder);
router.post('/verify-payment', authLimiter, validate(verifyPaymentSchema), paymentController.verifyPayment);

module.exports = router;
