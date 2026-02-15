const express = require("express");
const rateLimit = require("express-rate-limit");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const { login, forgotPassword } = require("../Controllers/auth.Controller");
const User = require("../Models/User.models");
const verifyAdmin = require("../middleware/verifyAdmin");
const { refreshAccessToken, logoutAll, authenticate } = require("../middleware/auth.middleware");
const authController = require("../Controllers/auth.Controller");

const router = express.Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", authLimiter, login);

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

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/refresh", refreshAccessToken);
router.get("/me", authenticate, authController.getMe);
router.patch("/me", authenticate, authController.updateMe);
router.post("/logout-all", authenticate, logoutAll);

module.exports = router;
