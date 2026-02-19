const express = require("express");
const router = express.Router();
const stripeController = require("../Controllers/stripe.Controller");
const { authenticate } = require("../middleware/auth.middleware");

// Webhook is handled directly in Server.js before body parsing
router.post("/create-checkout-session", authenticate, stripeController.createCheckoutSession);

module.exports = router;
