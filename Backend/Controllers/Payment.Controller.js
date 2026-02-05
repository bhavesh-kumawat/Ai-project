const razorpayService = require('../services/razorpay.service');
const { AppError } = require('../middleware/error.middleware');

exports.createOrder = async (req, res, next) => {
    try {
        const { amount, currency } = req.body;

        if (!amount) {
            return next(new AppError('Amount is required', 400));
        }

        const order = await razorpayService.createOrder(amount, currency);

        res.status(200).json({
            status: 'success',
            order
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new AppError('Payment details are missing', 400));
        }

        const isValid = razorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (isValid) {
            res.status(200).json({
                status: 'success',
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id
            });
        } else {
            return next(new AppError('Invalid payment signature', 400));
        }
    } catch (error) {
        next(error);
    }
};
