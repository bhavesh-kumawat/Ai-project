const User = require('../Models/User.models');
const { AppError } = require('../middleware/error.middleware');
const authService = require('../services/auth.service');
const authConfig = require('../config/auth.config');

exports.login = async (req, res, next) => {

  try {
    // i use identifier if user login username or email than i use mongodb $or operator 
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ 
      $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase()},
    ],
   }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.status === "suspended") {
      return next(new AppError("Account is suspended", 403));
    }
    if (user.status === "deleted") {
      return next(new AppError("Account is deleted", 403));
    }

    const token = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie(
      authConfig.cookie.refreshTokenCookieName,
      refreshToken,
      authConfig.cookie.options
    );

    res.json({
      status: 'success',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    const user = await User.create({
      username,
      email,
      password
    });

    const token = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie(
      authConfig.cookie.refreshTokenCookieName,
      refreshToken,
      authConfig.cookie.options
    );

    res.status(201).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  // Placeholder for forgot password logic
  next(new AppError('Forgot Password Not Implemented Yet', 501));
};
