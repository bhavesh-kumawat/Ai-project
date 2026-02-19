const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const creditController = require('../Controllers/Credit.Controller');

const router = express.Router();

// Validation schemas
const deductSchema = {
  body: Joi.object({
    amount: Joi.number().integer().min(1).default(1),
  }),
};

const addSchema = {
  body: Joi.object({
    amount: Joi.number().integer().min(1).required(),
    isBonus: Joi.boolean().default(false),
  }),
};

const updatePlanSchema = {
  body: Joi.object({
    plan: Joi.string().valid('free', 'daily', 'monthly').optional(),
    dailyLimit: Joi.number().integer().min(0).optional(),
    monthlyLimit: Joi.number().integer().min(0).optional(),
    isUnlimited: Joi.boolean().optional(),
    subscriptionExpiresAt: Joi.date().optional(),
    subscriptionStatus: Joi.string().valid('active', 'expired', 'canceled', 'trialing').optional(),
    stripeSubscriptionId: Joi.string().optional(),
    stripeCustomerId: Joi.string().optional(),
    stripSbscriptionId: Joi.string().optional(),
    stripCustomerId: Joi.string().optional(),
  }),
};

// Routes (all protected)
router.get('/', authenticate, creditController.getUserCredit);
router.get('/stats', authenticate, creditController.getUserStats);
router.post('/deduct', authenticate, validate(deductSchema), creditController.deductCredits);
router.post('/add', authenticate, validate(addSchema), creditController.addCredits);
router.put('/plan', authenticate, validate(updatePlanSchema), creditController.updatePlan);
router.get('/transactions', authenticate, creditController.getTransactions);
router.post('/cancel', authenticate, creditController.cancelSubscription);

module.exports = router;
