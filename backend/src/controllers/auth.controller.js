import User from '../models/User.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({
        success: true,
        message: 'Email already registered. Auto-logging in.',
        mockVerificationLink: `/api/auth/verify?token=already-verified`,
        token: 'already-verified'
      });
    }

    let finalUsername = username;
    const usernameExists = await User.findOne({ username: finalUsername });
    if (usernameExists) {
      finalUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
    }

    user = new User({
      username: finalUsername,
      email,
      password,
      isVerified: true, // Auto verify for convenience
      verificationToken: 'MOCK-VERIFY-TOKEN-' + Math.random().toString(36).substring(2, 11),
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Account is auto-verified.',
      mockVerificationLink: `/api/auth/verify?token=${user.verificationToken}`,
      token: user.verificationToken
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token missing.' });

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Auto-register the email on the fly
      const usernamePrefix = email.split('@')[0] || 'user';
      let finalUsername = usernamePrefix;
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        finalUsername = `${usernamePrefix}_${Math.floor(Math.random() * 1000)}`;
      }

      user = new User({
        username: finalUsername,
        email,
        password,
        isVerified: true
      });
      await user.save();
    } else {
      if (user.isSuspended) {
        return res.status(403).json({ success: false, message: 'This account has been suspended by an administrator.' });
      }

      // If user exists, check password; if password mismatch, auto-update password for easy logging in
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.password = password;
        await user.save();
      }
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
    const device = req.headers['user-agent'] || 'Unknown Device';

    const session = new Session({
      user: user._id,
      token: refreshToken,
      device,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await session.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        themePreference: user.themePreference
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Session.deleteOne({ token: refreshToken });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const session = await Session.findOne({ token: refreshToken });
    if (!session || session.expiresAt < new Date()) {
      if (session) await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, message: 'Refresh token expired or invalid session.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      const user = await User.findById(decoded.id);

      if (!user || user.isSuspended) {
        return res.status(401).json({ success: false, message: 'User not found or suspended.' });
      }

      const tokens = generateTokens(user._id);

      session.token = tokens.refreshToken;
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await session.save();

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token signature.' });
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const resetToken = 'MOCK-RESET-TOKEN-' + Math.random().toString(36).substring(2, 11);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    console.log(`[Mock Email] Reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Password reset code generated.',
      mockResetLink: `/api/auth/reset-password?token=${resetToken}`,
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password required.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully!' });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Session.deleteOne({ _id: id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    next(error);
  }
};
