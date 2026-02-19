const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);
const Credit = require("../Models/Credit.models.js");
const { updateUserPlan } = require("../services/credit.service");

exports.createCheckoutSession = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;

        // Plan details mapping (usually these would be in a config or DB)
        const plans = {
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

        const selectedPlan = plans[planId];
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
            success_url: `${process.env.CLIENT_URL}/dashboard?payment=success`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancel`,
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
        const { userId, planId, credits } = session.metadata;

        console.log(`Processing successful payment. User: ${userId}, Plan: ${planId}, Credits: ${credits}`);

        try {
            if (!userId) {
                throw new Error("Missing userId in session metadata");
            }

            // Update user plan and credits
            const updatedCredit = await updateUserPlan(userId, {
                plan: planId,
                balance_increment: parseInt(credits) || 0,
                subscriptionStatus: "active",
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription || null,
                subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            });

            console.log(`✅ Credits updated for user ${userId}. New balance: ${updatedCredit.balance}`);
        } catch (error) {
            console.error("❌ Error updating user credits after payment:", error);
        }
    }

    res.json({ received: true });
};
