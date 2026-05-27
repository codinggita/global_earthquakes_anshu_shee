const express = require('express');
const authRoutes = require('./authRoutes');
const earthquakeRoutes = require('./earthquakeRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const systemRoutes = require('./systemRoutes');
const EarthquakeController = require('../controllers/earthquakeController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');
const { validate, earthquakeCreateSchema, earthquakeUpdateSchema } = require('../middlewares/validationMiddleware');
const SystemController = require('../controllers/systemController');

const router = express.Router();

// --- 1. Sub-Router Mounts ---
router.use('/auth', authRoutes);
router.use('/jwt', authRoutes); // Reuse auth routes under /jwt mount point for clean structure
router.use('/earthquakes', earthquakeRoutes);
router.use('/', analyticsRoutes); // Mounts /analytics/earthquakes/* and /stats/earthquakes/*
router.use('/', systemRoutes);    // Mounts /system/health and /middleware/*

// --- 2. Central Search Endpoint (Lines 97-109) ---
router.get('/search/earthquakes', searchLimiter, EarthquakeController.search);
router.options('/search/earthquakes', SystemController.optionsHandler(['GET', 'OPTIONS']));

// --- 3. Protected & Admin Aliases (Lines 187-192) ---
// Admin management endpoints
router.get('/admin/earthquakes', protect, restrictTo('admin'), EarthquakeController.getAll);
router.get('/admin/analytics', protect, restrictTo('admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome Admin. Core statistics aggregates.',
    role: req.user.role,
    endpoints: {
      locationAnalysis: '/api/v1/analytics/earthquakes/location-analysis',
      countryAnalysis: '/api/v1/analytics/earthquakes/country-analysis'
    }
  });
});
router.get('/admin/reports', protect, restrictTo('admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome Admin. System activity report.',
    uptimeSeconds: Math.round(process.uptime()),
    databaseStatus: 'CONNECTED'
  });
});

// Admin OPTIONS helpers
router.options('/admin/earthquakes', SystemController.optionsHandler(['GET', 'OPTIONS']));

// Protected CRUD aliases
router.post('/protected/earthquakes', protect, validate(earthquakeCreateSchema), EarthquakeController.create);
router.patch('/protected/earthquakes/:id', protect, validate(earthquakeUpdateSchema), EarthquakeController.update);
router.delete('/protected/earthquakes/:id', protect, restrictTo('admin'), EarthquakeController.delete);

module.exports = router;
