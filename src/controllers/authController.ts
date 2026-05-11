import { Request, Response } from 'express';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const lowercaseEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: lowercaseEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Store refresh token in DB
      user.refreshToken = refreshToken;
      user.refreshTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await user.save();

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken || (user.refreshTokenExpire && user.refreshTokenExpire < new Date())) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Update refresh token in DB (Rotation)
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    res.status(401).json({ message: 'Session expired' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email' });
  }

  const lowercaseEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.ADMIN_URL || "http://localhost:3000"}/auth/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following link to reset your password: \n\n ${resetUrl}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center;">
          <div style="background: rgba(255,255,255,0.1); width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 20px; text-align: center; line-height: 60px;">
            <span style="font-size: 30px; vertical-align: middle;">🔑</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Password Reset Request</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">GFI Security Service</p>
        </div>
        <div style="padding: 40px; background: #ffffff;">
          <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">Hello,</p>
          <p style="font-size: 15px; color: #4b5563; margin-bottom: 30px;">We received a request to reset the password for your GFI Admin account. If you did not make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">Reset My Password</a>
          </div>
          
          <p style="font-size: 13px; color: #9ca3af; text-align: center;">
            This link will expire in 10 minutes. <br/>
            If the button doesn't work, copy and paste this URL into your browser: <br/>
            <span style="color: #4F46E5; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
        <div style="background-color: #f9fafb; color: #9ca3af; padding: 25px; text-align: center; font-size: 11px; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0 0 10px;">Security Alert: If you did not request this, please contact your administrator.</p>
          &copy; ${new Date().getFullYear()} Grace For Impact. All rights reserved.
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'GFI Password Reset Request',
        message,
        html,
      });

      res.status(200).json({ message: 'Reset email dispatched.' });
    } catch (err: any) {
      console.error('Email could not be sent:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken as string)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date(Date.now()) },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Generate new tokens on reset
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    user.refreshTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await user.save();

    res.status(200).json({
      message: 'Password reset successful',
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
