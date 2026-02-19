const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Config = require("../Models/Config.models");

const SEED_CONFIGS = [
    // Generation
    { key: "default_video_quality", value: "1080p", category: "generation", description: "Default quality for video generation" },
    { key: "max_video_duration", value: 30, category: "generation", description: "Maximum duration in seconds" },
    { key: "credit_cost_per_sec", value: 2, category: "generation", description: "Credits consumed per second of video" },
    { key: "allowed_video_formats", value: ["mp4", "webm"], category: "generation", description: "Supported export formats" },
    { key: "generation_engine_version", value: "v3.5-turbo", category: "generation", description: "Active AI processing engine version" },
    { key: "frame_rate_limit", value: 60, category: "generation", description: "Maximum render frame rate" },

    // Security
    { key: "admin_2fa_enabled", value: false, category: "security", description: "Require 2FA for admin logins" },
    { key: "session_expiry_hours", value: 24, category: "security", description: "JWT session duration" },
    { key: "min_password_strength", value: "medium", category: "security", description: "Password complexity requirement" },
    { key: "max_login_retries", value: 5, category: "security", description: "Attempts before temporary IP lockout" },
    { key: "allowed_api_origins", value: ["*"], category: "security", description: "CORS allowed origins for API" },

    // Billing
    { key: "currency", value: "USD", category: "billing", description: "Primary currency for payments" },
    { key: "starter_plan_credits", value: 100, category: "billing", description: "Credits included in Starter plan" },
    { key: "pro_plan_credits", value: 500, category: "billing", description: "Credits included in Pro plan" },
    { key: "free_tier_enabled", value: true, category: "billing", description: "Toggle for free new user credits" },
    { key: "tax_rate", value: 0.15, category: "billing", description: "Default GST/Tax percentage" },
    { key: "stripe_mode", value: "test", category: "billing", description: "Live or test mode for Stripe payments" },

    // Email
    { key: "support_email", value: "support@nexusai.com", category: "email", description: "Support contact email" },
    { key: "smtp_server", value: "smtp.nexusai.com", category: "email", description: "SMTP host address" },
    { key: "email_footer_text", value: "© 2026 Nexus AI Corp", category: "email", description: "Footer text for automated emails" },
    { key: "newsletter_enabled", value: true, category: "email", description: "Toggle for automatic weekly digests" },

    // Platform
    { key: "site_name", value: "Nexus AI", category: "platform", description: "Public platform name" },
    { key: "maintenance_mode", value: false, category: "platform", description: "Global maintenance toggle" },
    { key: "api_version", value: "v2.1.0", category: "platform", description: "Current API version string" },
    { key: "primary_theme_color", value: "#dc2626", category: "platform", description: "Main brand accent color" },
    { key: "footer_copyright", value: "All Rights Reserved", category: "platform", description: "Global footer copyright notice" },
    { key: "social_links", value: { twitter: "https://x.com/nexusai", discord: "https://discord.gg/nexus" }, category: "platform", description: "Official social media links" },
];

async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-project";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for expanded seeding...");

        for (const config of SEED_CONFIGS) {
            await Config.findOneAndUpdate(
                { key: config.key },
                { $set: config }, // Use $set to update existing ones too
                { upsert: true, new: true }
            );
            console.log(`Updated key: ${config.key}`);
        }

        console.log("Expanded seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
