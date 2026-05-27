const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');
const SystemController = require('../controllers/systemController');

const router = express.Router();

// Apply query rate limiter to prevent database exhaustion on heavy calculations
router.use(searchLimiter);

// ==========================================
// --- Analytics Aggregate Routes ----------
// ==========================================
router.get('/analytics/earthquakes/highest-magnitude', AnalyticsController.highestMagnitude);
router.get('/analytics/earthquakes/deepest', AnalyticsController.deepest);
router.get('/analytics/earthquakes/recent-activity', AnalyticsController.recentActivity);
router.get('/analytics/earthquakes/location-analysis', AnalyticsController.locationAnalysis);
router.get('/analytics/earthquakes/country-analysis', AnalyticsController.countryAnalysis);
router.get('/analytics/earthquakes/network-analysis', AnalyticsController.networkAnalysis);
router.get('/analytics/earthquakes/magnitude-analysis', AnalyticsController.magnitudeAnalysis);
router.get('/analytics/earthquakes/depth-analysis', AnalyticsController.depthAnalysis);
router.get('/analytics/earthquakes/error-analysis', AnalyticsController.errorAnalysis);
router.get('/analytics/earthquakes/monthly-analysis', AnalyticsController.monthlyAnalysis);

// ==========================================
// --- Statistics Counts Routes -------------
// ==========================================
router.get('/stats/earthquakes/count', AnalyticsController.count);
router.get('/stats/earthquakes/highest-magnitude', AnalyticsController.highestMagnitudeRecord);
router.get('/stats/earthquakes/deepest', AnalyticsController.deepestRecord);
router.get('/stats/earthquakes/average-depth', AnalyticsController.averageDepth);
router.get('/stats/earthquakes/average-magnitude', AnalyticsController.averageMagnitude);
router.get('/stats/earthquakes/country-count', AnalyticsController.countryCount);
router.get('/stats/earthquakes/type-count', AnalyticsController.typeCount);
router.get('/stats/earthquakes/network-count', AnalyticsController.networkCount);
router.get('/stats/earthquakes/reviewed-count', AnalyticsController.reviewedCount);
router.get('/stats/earthquakes/monthly-count', AnalyticsController.monthlyCount);

// OPTIONS and HEAD helpers for key endpoints (Lines 282-283)
router.options('/analytics/earthquakes/highest-magnitude', SystemController.optionsHandler(['GET', 'OPTIONS']));
router.options('/stats/earthquakes/count', SystemController.optionsHandler(['GET', 'OPTIONS']));

router.route('/analytics/earthquakes/highest-magnitude')
  .head(SystemController.headHandler);

router.route('/stats/earthquakes/count')
  .head(SystemController.headHandler);

module.exports = router;
