const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);
const Transaction = require("../Models/Transaction.models.js");
const { updateUserPlan } = require("../services/credit.service");

const PLANS = {
    starter: {
        name: "Starter Plan",
        amount: 1000, // $10.00
        credits: 100,
    },
    pro: {
        name: "Pro Plan",
        amount: 2500, // $25.00
        credits: 500,
    },
    ultra: {
        name: "Ultra Plan",
        amount: 5000, // $50.00
        credits: 1500,
    },
};

const applyCheckoutCredits = async (session, source = "webhook") => {
    const { userId, planId, credits } = session.metadata || {};
    const stripeSessionId = session.id;

    if (!userId || !planId || !stripeSessionId) {
        throw new Error("Missing checkout metadata (userId/planId/sessionId)");
    }

    const existingTransaction = await Transaction.findOne({
        user: userId,
        type: "payment",
        "metadata.stripeSessionId": stripeSessionId,
    });

    if (existingTransaction) {
        return { alreadyProcessed: true };
    }

    const parsedCredits = Number(credits) || 0;
    const updatedCredit = await updateUserPlan(userId, {
        plan: planId,
        balance_increment: parsedCredits,
        subscriptionStatus: "active",
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        transactionMetadata: {
            stripeSessionId,
            stripePaymentIntentId:
                typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id || null,
            paymentSource: source,
            paidAmount: session.amount_total || null,
            currency: session.currency || null,
        },
    });

    return { alreadyProcessed: false, updatedCredit };
};

exports.createCheckoutSession = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;

        const selectedPlan = PLANS[planId];
        if (!selectedPlan) {
            return res.status(400).json({ success: false, message: "Invalid plan selected" });
        }

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: selectedPlan.name,
                            description: `Upgrade to ${selectedPlan.name} and get ${selectedPlan.credits} credits.`,
                        },
                        unit_amount: selectedPlan.amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancel`,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
                planId: planId,
                credits: selectedPlan.credits.toString(),
            },
        });

        res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ success: false, message: "Failed to create checkout session" });
    }
};

exports.confirmCheckoutSession = async (req, res) => {
    try {
        const sessionId = req.body?.sessionId || req.query?.sessionId;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: "sessionId is required" });
        }

        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: "Checkout session not found" });
        }

        if (session.payment_status !== "paid") {
            return res.status(400).json({ success: false, message: "Payment is not completed yet" });
        }

        const metadataUserId = session.metadata?.userId;
        if (!metadataUserId || metadataUserId !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized session confirmation request" });
        }

        const result = await applyCheckoutCredits(session, "client-confirmation");

        return res.status(200).json({
            success: true,
            credited: !result.alreadyProcessed,
            message: result.alreadyProcessed
                ? "Checkout already processed"
                : "Credits added successfully",
        });
    } catch (error) {
        console.error("Checkout confirmation error:", error);
        return res.status(500).json({ success: false, message: "Failed to confirm checkout session" });
    }
};

exports.handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    console.log("Stripe Webhook received. Signature:", sig ? "Present" : "Missing");

    try {
        event = getStripe().webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("Stripe Webhook Verified. Event Type:", event.type);
    } catch (err) {
        console.error("Webhook Signature Error:", err.message);
        // Important: return 400 so Stripe retries or shows error in CLI
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, planId, credits } = session.metadata || {};
        console.log(`Processing successful payment. User: ${userId}, Plan: ${planId}, Credits: ${credits}, Session: ${session.id}`);

        try {
            const result = await applyCheckoutCredits(session, "webhook");
            if (result.alreadyProcessed) {
                console.log(`ℹ️ Stripe session already processed: ${session.id}`);
            } else {
                console.log(`✅ Credits updated for user ${userId}. New balance: ${result.updatedCredit.balance}`);
            }
        } catch (error) {
            console.error("❌ Error updating user credits after payment:", error);
        }
    }

    res.json({ received: true });
};
