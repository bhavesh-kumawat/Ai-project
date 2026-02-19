const User = require('../Models/User.models');
const { AppError } = require('../middleware/error.middleware');
const authService = require('../services/auth.service');
const authConfig = require('../config/auth.config');
const notificationService = require('../services/notification.service');
const crypto = require('crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.login = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    if (!identifier || !password) return next(new AppError('Please provide email and password', 400));

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid email or password', 401));
    if (user.status === "suspended" || user.status === "deleted") return next(new AppError(`Account is ${user.status}`, 403));

    const token = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    const cookieOptions = { ...authConfig.cookie.options };
    if (rememberMe) cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;

    res.cookie(authConfig.cookie.refreshTokenCookieName, refreshToken, cookieOptions);
    res.json({ status: 'success', token, refreshToken, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) { next(error); }
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ email })) return next(new AppError('Email already in use', 400));

    const user = await User.create({ username, email, password });
    const token = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie(authConfig.cookie.refreshTokenCookieName, refreshToken, authConfig.cookie.options);
    res.status(201).json({ status: 'success', token, refreshToken, data: { user: { id: user._id, username: user.username, email: user.email, role: user.role } } });
  } catch (error) { next(error); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Please provide email', 400));

    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    if (!notificationService.isEmailConfigured()) {
      return next(new AppError('Email service is not configured. Please set SMTP credentials in Server/.env', 500));
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return next(new AppError('User not found', 404));

    const otp = authService.generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    await notificationService.sendEmail({
      to: user.email,
      subject: 'Your Password Reset OTP - Skull Bot',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #050816; color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #a78bfa; margin: 0;">Skull Bot</h1>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Secure Authentication System</p>
                    </div>
                    <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                        <p style="font-size: 16px;">You requested a password reset. Use the One-Time Password (OTP) below to continue:</p>
                        <div style="font-size: 32px; font-weight: bold; color: #22d3ee; margin: 25px 0; letter-spacing: 5px;">${otp}</div>
                        <p style="font-size: 14px; color: #9ca3af;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280;">
                        <p>If you did not request this, please ignore this email or contact support.</p>
                        <p>&copy; 2026 Skull Bot. All rights reserved.</p>
                    </div>
                </div>
            `
    });

    res.status(200).json({ status: 'success', message: 'OTP sent successfully to your email.' });
  } catch (err) { next(err); }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError('Provide email and OTP', 400));

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpires');
    if (!user) return next(new AppError('User not found', 404));

    const normalizedOtp = String(otp).trim();
    if (!user.otp || !user.otpExpires || String(user.otp) !== normalizedOtp || user.otpExpires <= Date.now()) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    const { plainToken, hashedToken } = authService.createPasswordResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', resetToken: plainToken });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    if (!req.body.password || String(req.body.password).length < 4) {
      return next(new AppError('Password must be at least 4 characters', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } }).select('+password');

    if (!user) return next(new AppError('Token invalid/expired', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);
    res.cookie(authConfig.cookie.refreshTokenCookieName, refreshToken, authConfig.cookie.options);
    res.json({ status: 'success', token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found', 404));
    res.json({ status: 'success', data: { user: { id: user._id, username: user.username, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt } } });
  } catch (error) { next(error); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found', 404));
    if (username) user.username = username.toLowerCase().trim();
    if (email) user.email = email.toLowerCase().trim();
    await user.save();
    res.json({ status: 'success', message: 'Profile updated success', data: { user: { id: user._id, username: user.username, email: user.email, role: user.role } } });
  } catch (error) { next(error); }
};
