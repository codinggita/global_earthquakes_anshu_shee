const express = require('express');
const AuthController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, userRegisterSchema, userLoginSchema } = require('../middlewares/validationMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const SystemController = require('../controllers/systemController');

const router = express.Router();

// Apply strict rate limiting on account authentication pathways to prevent brute-forcing
router.use('/register', authLimiter);
router.use('/login', authLimiter);

// --- Standard Authentication Routes (Checklist 13) ---
router.post('/register', validate(userRegisterSchema), AuthController.register);
router.post('/login', validate(userLoginSchema), AuthController.login);
router.post('/logout', protect, AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/change-password', protect, AuthController.changePassword);
router.post('/send-otp', protect, AuthController.sendOtp);
router.post('/verify-email', protect, AuthController.verifyEmail);

// User Profile routes
router.route('/profile')
  .get(protect, AuthController.getProfile)
  .patch(protect, AuthController.updateProfile);

// OPTIONS and HEAD helpers for login and profile
router.options('/login', SystemController.optionsHandler(['POST', 'OPTIONS']));
router.route('/profile')
  .head(protect, SystemController.headHandler);

// --- JWT Specific Test Routes (Checklist JWT Section) ---
router.post('/jwt/generate-token', validate(userLoginSchema), AuthController.login); // Login is token generation
router.post('/jwt/verify-token', protect, (req, res) => {
  return res.status(200).json({ success: true, message: 'Security token is valid.', user: { id: req.user._id, role: req.user.role } });
});
router.post('/jwt/refresh-token', AuthController.refresh);
router.delete('/jwt/revoke-token', AuthController.revoke);

router.get('/jwt/profile', protect, AuthController.getProfile);
router.get('/jwt/dashboard', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to the JWT secure administration dashboard.',
    systemTime: new Date().toISOString(),
    metrics: { activeUsers: 1, alerts: 0 }
  });
});

// OPTIONS helpers for jwt routes
router.options('/jwt/profile', SystemController.optionsHandler(['GET', 'OPTIONS']));

module.exports = router;
