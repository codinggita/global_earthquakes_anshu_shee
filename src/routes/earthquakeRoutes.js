const express = require('express');
const EarthquakeController = require('../controllers/earthquakeController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validate, earthquakeCreateSchema, earthquakeUpdateSchema } = require('../middlewares/validationMiddleware');
const SystemController = require('../controllers/systemController');

const router = express.Router();

// --- 1. Predefined Filter Shortcuts (Checklist Sections) ---
router.get('/high-magnitude', EarthquakeController.getHighMagnitude);
router.get('/low-magnitude', EarthquakeController.getLowMagnitude);
router.get('/deep', EarthquakeController.getDeep);
router.get('/shallow', EarthquakeController.getShallow);
router.get('/recent', EarthquakeController.getRecent);
router.get('/reviewed', EarthquakeController.getReviewed);
router.get('/high-gap', EarthquakeController.getHighGap);
router.get('/high-rms', EarthquakeController.getHighRms);
router.get('/oceanic', EarthquakeController.getOceanic);
router.get('/critical', EarthquakeController.getCritical);

// --- 2. Filter Sub-routes Prefixed with /filter (Lines 110-123) ---
router.get('/filter/high-magnitude', EarthquakeController.getHighMagnitude);
router.get('/filter/low-magnitude', EarthquakeController.getLowMagnitude);
router.get('/filter/deep', EarthquakeController.getDeep);
router.get('/filter/shallow', EarthquakeController.getShallow);
router.get('/filter/high-gap', EarthquakeController.getHighGap);
router.get('/filter/high-rms', EarthquakeController.getHighRms);
router.get('/filter/reviewed', EarthquakeController.getReviewed);
router.get('/filter/oceanic', EarthquakeController.getOceanic);
router.get('/filter/recent', EarthquakeController.getRecent);
router.get('/filter/critical', EarthquakeController.getCritical);

// --- 3. Dynamic Route Parameter Filters (Lines 38-53) ---
router.get('/place/:place', EarthquakeController.getByPlace);
router.get('/country/:country', EarthquakeController.getByCountry);
router.get('/type/:type', EarthquakeController.getByType);
router.get('/status/:status', EarthquakeController.getByStatus);
router.get('/mag-type/:magType', EarthquakeController.getByMagType);
router.get('/network/:net', EarthquakeController.getByNetwork);
router.get('/magnitude/:mag', EarthquakeController.getByMagnitude);
router.get('/depth/:depth', EarthquakeController.getByDepth);
router.get('/date/:date', EarthquakeController.getByDate);
router.get('/year/:year', EarthquakeController.getByYear);
router.get('/month/:month', EarthquakeController.getByMonth);

// --- 4. Bulk Operations (Admin Restricted - Checklist 19) ---
router.post('/bulk-create', protect, restrictTo('admin'), EarthquakeController.bulkCreate);
router.patch('/bulk-update', protect, restrictTo('admin'), EarthquakeController.bulkUpdate);
router.delete('/bulk-delete', protect, restrictTo('admin'), EarthquakeController.bulkDelete);

// --- 5. Existence Checks ---
router.get('/exists/:id', EarthquakeController.exists);

// --- 6. Standard RESTful CRUD Operations (Checklist 5) ---
router.route('/')
  .get(EarthquakeController.getAll)
  .post(protect, validate(earthquakeCreateSchema), EarthquakeController.create);

router.route('/:id')
  .get(EarthquakeController.getById)
  .put(protect, validate(earthquakeCreateSchema), EarthquakeController.replace)
  .patch(protect, validate(earthquakeUpdateSchema), EarthquakeController.update)
  .delete(protect, restrictTo('admin'), EarthquakeController.delete); // Restrict record deletes to admins for security

// --- 7. OPTIONS and HEAD Handlers (Lines 279-287) ---
router.route('/')
  .options(SystemController.optionsHandler(['GET', 'POST', 'OPTIONS']))
  .head(SystemController.headHandler);

router.route('/:id')
  .options(SystemController.optionsHandler(['GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']))
  .head(SystemController.headHandler);

router.route('/country/:country')
  .head(SystemController.headHandler);

module.exports = router;
