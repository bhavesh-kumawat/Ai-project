const express = require("express");
const rateLimit = require("express-rate-limit");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const User = require("../Models/User.models");
const verifyAdmin = require("../middleware/verifyAdmin");
const { refreshAccessToken, logoutAll, authenticate } = require("../middleware/auth.middleware");
const authController = require("../Controllers/auth.Controller");
const passport = require("passport");
const { generateToken } = require("../config/auth.config");
const config = require("../config/env.config");

const router = express.Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", authLimiter, authController.login);

// Public route - always creates role "user"
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      email,
      password,
      role: "user",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { username: newUser.username, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email or username already exists" });
    }
    res.status(500).json({ message: err.message });
  }
});

// Protected route - only creates role "admin" when verifyAdmin passes
router.post("/register/admin", adminLimiter, authLimiter, verifyAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newAdmin = await User.create({
      username: username.toLowerCase().trim(),
      email,
      password,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      user: { username: newAdmin.username, email: newAdmin.email, role: newAdmin.role },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email or username already exists" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/refresh", refreshAccessToken);
router.get("/me", authenticate, authController.getMe);
router.patch("/me", authenticate, authController.updateMe);
router.post("/logout-all", authenticate, logoutAll);
router.post("/reset-password/:token", authLimiter, authController.resetPassword);
router.post("/verify-otp", authLimiter, authController.verifyOTP);

// Google OAuth
router.get("/google", (req, res, next) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(501).json({
      success: false,
      message: "Google OAuth is not configured on this server."
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(501).json({
      success: false,
      message: "Google OAuth is not configured on this server."
    });
  }
  passport.authenticate("google", { failureRedirect: "/login", session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`);
    }

    const { accessToken, refreshToken } = generateToken(user);

    // Set tokens in cookies
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`);
  })(req, res, next);
});

module.exports = router;
