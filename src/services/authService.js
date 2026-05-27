const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

class AuthService {
  /**
   * Helper to generate Access and Refresh JWT pairs
   */
  static generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Standard short-lived access token (JWT Expiry Handling)
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Standard long-lived refresh token
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  static async register(userData) {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.badRequest('A user with this email address already exists.');
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    const tokens = this.generateTokens(newUser);
    
    // Save refresh token in DB
    newUser.refreshTokens.push(tokens.refreshToken);
    await newUser.save();

    // Remove password from returned object
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return { user: userResponse, ...tokens };
  }

  /**
   * Login user
   */
  static async login(credentials) {
    const { email, password } = credentials;

    // Find user and select password field
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Compare passwords using User model instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const tokens = this.generateTokens(user);

    // Save refresh token in DB
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    return { user: userResponse, ...tokens };
  }

  /**
   * Logout user by revoking their refresh token
   */
  static async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }
    return true;
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   */
  static async refresh(token) {
    if (!token) {
      throw ApiError.badRequest('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens.includes(token)) {
        throw ApiError.unauthorized('Invalid or revoked refresh token');
      }

      // Rotate tokens
      const tokens = this.generateTokens(user);
      
      // Replace old refresh token with new one
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke a refresh token (manual session revocation)
   */
  static async revokeToken(token) {
    const user = await User.findOne({ refreshTokens: token });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save();
    }
    return true;
  }

  /**
   * Request password reset (Generates a dummy 6-digit OTP for testing)
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound('No user found with that email address.');
    }

    // Generate numeric 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // In production, send email. For testing, return OTP in response.
    return { otp, message: 'OTP verification code has been successfully generated.' };
  }

  /**
   * Reset password using OTP
   */
  static async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({
      email,
      otp,
      otpExpiry: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired OTP verification code.');
    }

    // Update password
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.refreshTokens = []; // Log out from all sessions on password reset
    await user.save();

    return true;
  }

  /**
   * Change current password for authenticated user
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect existing password.');
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Request verification OTP code
   */
  static async sendOtp(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return { otp };
  }

  /**
   * Verify registered email with OTP
   */
  static async verifyEmail(userId, otp) {
    const user = await User.findOne({
      _id: userId,
      otp,
      otpExpiry: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired OTP verification code.');
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return true;
  }

  /**
   * Get user profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).select('-password -refreshTokens');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updateData) {
    const allowedUpdates = ['name']; // Restrict email and password updates to dedicated flows
    const filteredData = {};
    
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }
}

module.exports = AuthService;
