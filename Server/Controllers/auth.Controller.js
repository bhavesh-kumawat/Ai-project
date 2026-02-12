const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/auth.config');
const User = require('../Models/User.models');
const { AppError } = require('../middleware/error.middleware');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      jwtConfig.accessToken.secret,
      { expiresIn: jwtConfig.accessToken.expiresIn }
    );

    res.json({
      status: 'success',
      token
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

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      jwtConfig.accessToken.secret,
      { expiresIn: jwtConfig.accessToken.expiresIn }
    );

    res.status(201).json({
      status: 'success',
      token,
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