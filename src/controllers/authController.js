const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  /**
   * Register new user account
   */
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    return ApiResponse.success(res, 'User successfully registered.', result, 201);
  });

  /**
   * Login existing user
   */
  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    return ApiResponse.success(res, 'User successfully authenticated.', result, 200);
  });

  /**
   * Logout authenticated user
   */
  logout = asyncHandler(async (req, res) => {
    // Expecting refresh token in body
    const { refreshToken } = req.body;
    await AuthService.logout(req.user._id, refreshToken);
    return ApiResponse.success(res, 'User successfully logged out.', {}, 200);
  });

  /**
   * Refresh JWT access token
   */
  refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refresh(refreshToken);
    return ApiResponse.success(res, 'Tokens successfully rotated.', tokens, 200);
  });

  /**
   * Revoke JWT token manually
   */
  revoke = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await AuthService.revokeToken(refreshToken);
    return ApiResponse.success(res, 'Session token revoked.', {}, 200);
  });

  /**
   * Request password reset OTP
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    return ApiResponse.success(res, result.message, { otp: result.otp }, 200);
  });

  /**
   * Reset password using OTP
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    await AuthService.resetPassword(email, otp, newPassword);
    return ApiResponse.success(res, 'Password successfully reset. All active sessions revoked.', {}, 200);
  });

  /**
   * Change current password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user._id, oldPassword, newPassword);
    return ApiResponse.success(res, 'Password successfully updated.', {}, 200);
  });

  /**
   * Send email verification OTP
   */
  sendOtp = asyncHandler(async (req, res) => {
    const result = await AuthService.sendOtp(req.user._id);
    return ApiResponse.success(res, 'Verification OTP successfully sent.', { otp: result.otp }, 200);
  });

  /**
   * Verify registered email with OTP
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    await AuthService.verifyEmail(req.user._id, otp);
    return ApiResponse.success(res, 'Email successfully verified.', {}, 200);
  });

  /**
   * Get user profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const profile = await AuthService.getProfile(req.user._id);
    return ApiResponse.success(res, 'User profile successfully retrieved.', profile, 200);
  });

  /**
   * Update authenticated profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const profile = await AuthService.updateProfile(req.user._id, req.body);
    return ApiResponse.success(res, 'User profile successfully updated.', profile, 200);
  });
}

module.exports = new AuthController();
