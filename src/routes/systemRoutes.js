const express = require('express');
const SystemController = require('../controllers/systemController');
const { protect } = require('../middlewares/authMiddleware');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

// Health Check API
router.get('/system/health', SystemController.healthCheck);

// --- Middleware Practice Sandboxes (Lines 193-198) ---
router.get('/middleware/logger', SystemController.practiceLogger);
router.get('/middleware/auth', protect, SystemController.practiceAuth);
router.get('/middleware/rate-limit', searchLimiter, SystemController.practiceRateLimit);
router.get('/middleware/error-handler', SystemController.practiceErrorHandler);
router.get('/middleware/request-time', SystemController.practiceRequestTime);
router.get('/middleware/cache', SystemController.practiceCache);

// --- OPTIONS & HEAD Helpers for System ---
router.options('/system/health', SystemController.optionsHandler(['GET', 'OPTIONS']));
router.route('/system/health')
  .head(SystemController.headHandler);

module.exports = router;
