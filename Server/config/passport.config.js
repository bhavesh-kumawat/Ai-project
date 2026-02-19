const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Models/User.models");

const config = require("./env.config");

const googleConfig = {
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL || "/api/auth/google/callback",
};

if (googleConfig.clientID && googleConfig.clientSecret) {
    passport.use(
        new GoogleStrategy(
            googleConfig,
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        // Check if user with same email exists
                        user = await User.findOne({ email: profile.emails[0].value });
                        if (user) {
                            user.googleId = profile.id;
                            await user.save();
                        } else {
                            user = await User.create({
                                username: profile.displayName.replace(/\s+/g, "_").toLowerCase(),
                                email: profile.emails[0].value,
                                googleId: profile.id,
                                status: "active",
                            });
                        }
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );
    console.log("✅ Google OAuth Strategy registered");
} else {
    console.warn("⚠️  Google OAuth credentials not configured. Google login will be disabled.");
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
