const EarthquakeService = require('../services/earthquakeService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

class EarthquakeController {
  /**
   * Fetch all records with dynamic filters, sorting, and pagination
   */
  getAll = asyncHandler(async (req, res) => {
    // Handle specific static filter triggers within req.query
    const result = await EarthquakeService.getEarthquakes(req.query);
    return ApiResponse.paginate(res, 'Earthquake records successfully retrieved.', result.data, result.pagination);
  });

  /**
   * Fetch a single earthquake record by ID
   */
  getById = asyncHandler(async (req, res) => {
    const earthquake = await EarthquakeService.getEarthquakeById(req.params.id);
    return ApiResponse.success(res, 'Earthquake record successfully retrieved.', earthquake);
  });

  /**
   * Check if earthquake record exists
   */
  exists = asyncHandler(async (req, res) => {
    const exists = await EarthquakeService.checkExistence(req.params.id);
    return ApiResponse.success(res, 'Earthquake existence check completed.', { exists });
  });

  /**
   * Add a new earthquake record
   */
  create = asyncHandler(async (req, res) => {
    const earthquake = await EarthquakeService.createEarthquake(req.body);
    return ApiResponse.success(res, 'Earthquake record successfully created.', earthquake, 201);
  });

  /**
   * Replace complete earthquake record (PUT)
   */
  replace = asyncHandler(async (req, res) => {
    const earthquake = await EarthquakeService.replaceEarthquake(req.params.id, req.body);
    return ApiResponse.success(res, 'Earthquake record completely replaced.', earthquake);
  });

  /**
   * Update specific fields of an earthquake record (PATCH)
   */
  update = asyncHandler(async (req, res) => {
    const earthquake = await EarthquakeService.updateEarthquake(req.params.id, req.body);
    return ApiResponse.success(res, 'Earthquake record fields successfully updated.', earthquake);
  });

  /**
   * Delete an earthquake record (DELETE)
   */
  delete = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.deleteEarthquake(req.params.id, req.query.hard === 'true');
    return ApiResponse.success(res, result.message, {});
  });

  /**
   * Insert multiple earthquake records (Bulk Create)
   */
  bulkCreate = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.bulkCreate(req.body.records);
    return ApiResponse.success(res, 'Bulk creation successfully completed.', result, 201);
  });

  /**
   * Update multiple earthquake records (Bulk Update)
   */
  bulkUpdate = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.bulkUpdate(req.body.updates);
    return ApiResponse.success(res, 'Bulk updates successfully completed.', result);
  });

  /**
   * Delete multiple earthquake records (Bulk Delete)
   */
  bulkDelete = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.bulkDelete(req.body.ids, req.query.hard === 'true');
    return ApiResponse.success(res, result.message, result);
  });

  /**
   * Search earthquakes using regex text-search matching
   */
  search = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      throw ApiError.badRequest('Please provide a search keyword using ?q=');
    }
    const result = await EarthquakeService.search(q, req.query);
    return ApiResponse.paginate(res, `Search results for '${q}' retrieved.`, result.data, result.pagination);
  });

  // ==========================================
  // --- Dynamic Route Parameter Handlers -----
  // ==========================================

  getByPlace = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ place: req.params.place, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching place '${req.params.place}' retrieved.`, result.data, result.pagination);
  });

  getByCountry = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ country: req.params.country, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching country '${req.params.country}' retrieved.`, result.data, result.pagination);
  });

  getByType = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ type: req.params.type, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching type '${req.params.type}' retrieved.`, result.data, result.pagination);
  });

  getByStatus = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ status: req.params.status, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching status '${req.params.status}' retrieved.`, result.data, result.pagination);
  });

  getByMagType = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ magType: req.params.magType, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching magnitude type '${req.params.magType}' retrieved.`, result.data, result.pagination);
  });

  getByNetwork = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ network: req.params.net, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes matching network '${req.params.net}' retrieved.`, result.data, result.pagination);
  });

  getByMagnitude = asyncHandler(async (req, res) => {
    const mag = parseFloat(req.params.mag);
    if (isNaN(mag)) throw ApiError.badRequest('Invalid magnitude value parameter.');
    const result = await EarthquakeService.getEarthquakes({ minMagnitude: mag, maxMagnitude: mag, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes with magnitude '${mag}' retrieved.`, result.data, result.pagination);
  });

  getByDepth = asyncHandler(async (req, res) => {
    const depth = parseFloat(req.params.depth);
    if (isNaN(depth)) throw ApiError.badRequest('Invalid depth value parameter.');
    const result = await EarthquakeService.getEarthquakes({ minDepth: depth, maxDepth: depth, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes with depth '${depth} km' retrieved.`, result.data, result.pagination);
  });

  getByDate = asyncHandler(async (req, res) => {
    const dateStr = req.params.date; // Expecting YYYY-MM-DD
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) throw ApiError.badRequest('Invalid date parameter. Use YYYY-MM-DD.');
    
    const end = new Date(dateStr);
    end.setUTCHours(23, 59, 59, 999);
    
    // We pass dates directly as bounds
    const queryOverride = { ...req.query };
    const result = await EarthquakeService.getEarthquakes({ 
      ...queryOverride 
    });
    
    // Manually override filter within service? Or do it in controller
    // Let's filter manually or let filterBuilder support start/end query
    // Let's pass a query that has year/month/day
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    // Since FilterBuilder handles year & month, let's filter after matching or implement a quick day match
    // Better yet, let's filter inside Mongoose query:
    const data = await EarthquakeService.getEarthquakes({ ...req.query });
    
    // Filter the records that match this day
    const filteredData = data.data.filter(eq => {
      const eqDate = new Date(eq.time).toISOString().split('T')[0];
      return eqDate === dateStr;
    });

    return ApiResponse.paginate(res, `Earthquakes matching date '${dateStr}' retrieved.`, filteredData, data.pagination);
  });

  getByYear = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ year: req.params.year, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes occurring in year '${req.params.year}' retrieved.`, result.data, result.pagination);
  });

  getByMonth = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ month: req.params.month, ...req.query });
    return ApiResponse.paginate(res, `Earthquakes occurring in month '${req.params.month}' retrieved.`, result.data, result.pagination);
  });

  // ==========================================
  // --- Pre-defined Filter Shortcuts --------
  // ==========================================

  getHighMagnitude = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ minMagnitude: 5.0, ...req.query });
    return ApiResponse.paginate(res, 'High magnitude earthquakes (mag >= 5.0) retrieved.', result.data, result.pagination);
  });

  getLowMagnitude = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ maxMagnitude: 4.0, ...req.query });
    return ApiResponse.paginate(res, 'Low magnitude earthquakes (mag < 4.0) retrieved.', result.data, result.pagination);
  });

  getDeep = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ minDepth: 300, ...req.query });
    return ApiResponse.paginate(res, 'Deep earthquakes (depth >= 300 km) retrieved.', result.data, result.pagination);
  });

  getShallow = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ maxDepth: 70, ...req.query });
    return ApiResponse.paginate(res, 'Shallow earthquakes (depth < 70 km) retrieved.', result.data, result.pagination);
  });

  getRecent = asyncHandler(async (req, res) => {
    // Recent implies sorting by time desc which is our default
    const result = await EarthquakeService.getEarthquakes({ ...req.query });
    return ApiResponse.paginate(res, 'Recent earthquake records retrieved.', result.data, result.pagination);
  });

  getReviewed = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ status: 'reviewed', ...req.query });
    return ApiResponse.paginate(res, 'Reviewed earthquake records retrieved.', result.data, result.pagination);
  });

  getHighGap = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ minGap: 180, ...req.query });
    return ApiResponse.paginate(res, 'Earthquakes with high seismic gap (gap >= 180 deg) retrieved.', result.data, result.pagination);
  });

  getHighRms = asyncHandler(async (req, res) => {
    const result = await EarthquakeService.getEarthquakes({ minRms: 1.0, ...req.query });
    return ApiResponse.paginate(res, 'Earthquakes with high RMS value (rms >= 1.0) retrieved.', result.data, result.pagination);
  });

  getOceanic = asyncHandler(async (req, res) => {
    // Oceanic matches place containing "ocean", "sea", "bay", "gulf", "strait"
    const result = await EarthquakeService.getEarthquakes({ place: 'ocean|sea|gulf|strait|bay', ...req.query });
    return ApiResponse.paginate(res, 'Oceanic earthquake events retrieved.', result.data, result.pagination);
  });

  getCritical = asyncHandler(async (req, res) => {
    // Critical events: mag >= 6.0, depth < 70, status = reviewed
    const result = await EarthquakeService.getEarthquakes({
      minMagnitude: 6.0,
      maxDepth: 70,
      status: 'reviewed',
      ...req.query
    });
    return ApiResponse.paginate(res, 'Critical seismic events (mag >= 6.0, shallow, reviewed) retrieved.', result.data, result.pagination);
  });
}

module.exports = new EarthquakeController();
