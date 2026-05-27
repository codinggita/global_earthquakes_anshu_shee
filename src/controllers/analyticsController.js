const AnalyticsService = require('../services/analyticsService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AnalyticsController {
  // ==========================================
  // --- Analytics Handlers ------------------
  // ==========================================

  highestMagnitude = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getHighestMagnitude();
    return ApiResponse.success(res, 'Highest magnitude earthquake analytics compiled.', data);
  });

  deepest = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getDeepest();
    return ApiResponse.success(res, 'Deepest earthquake analytics compiled.', data);
  });

  recentActivity = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getRecentActivity();
    return ApiResponse.success(res, 'Recent seismic activity breakdown compiled.', data);
  });

  locationAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getLocationAnalysis();
    return ApiResponse.success(res, 'Geographic location analysis compiled.', data);
  });

  countryAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getCountryAnalysis();
    return ApiResponse.success(res, 'Country-wise seismic distribution analysis compiled.', data);
  });

  networkAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getNetworkAnalysis();
    return ApiResponse.success(res, 'Seismic network distribution analysis compiled.', data);
  });

  magnitudeAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getMagnitudeAnalysis();
    return ApiResponse.success(res, 'Seismic magnitude category analysis compiled.', data);
  });

  depthAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getDepthAnalysis();
    return ApiResponse.success(res, 'Seismic depth distribution analysis compiled.', data);
  });

  errorAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getErrorAnalysis();
    return ApiResponse.success(res, 'Data error rate and accuracy analysis compiled.', data);
  });

  monthlyAnalysis = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getMonthlyAnalysis();
    return ApiResponse.success(res, 'Monthly earthquake trend analysis compiled.', data);
  });

  // ==========================================
  // --- Statistics Handlers -----------------
  // ==========================================

  count = asyncHandler(async (req, res) => {
    const total = await AnalyticsService.getCount();
    return ApiResponse.success(res, 'Total earthquake records counted.', { total });
  });

  highestMagnitudeRecord = asyncHandler(async (req, res) => {
    const record = await AnalyticsService.getHighestMagnitudeRecord();
    return ApiResponse.success(res, 'Highest magnitude earthquake record retrieved.', record);
  });

  deepestRecord = asyncHandler(async (req, res) => {
    const record = await AnalyticsService.getDeepestRecord();
    return ApiResponse.success(res, 'Deepest earthquake record retrieved.', record);
  });

  averageDepth = asyncHandler(async (req, res) => {
    const average = await AnalyticsService.getAverageDepth();
    return ApiResponse.success(res, 'Average earthquake depth calculated.', { averageDepthKm: average });
  });

  averageMagnitude = asyncHandler(async (req, res) => {
    const average = await AnalyticsService.getAverageMagnitude();
    return ApiResponse.success(res, 'Average earthquake magnitude calculated.', { averageMagnitude: average });
  });

  countryCount = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getCountryCount();
    return ApiResponse.success(res, 'Earthquake counts per country retrieved.', data);
  });

  typeCount = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getTypeCount();
    return ApiResponse.success(res, 'Earthquake counts by event type retrieved.', data);
  });

  networkCount = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getNetworkCount();
    return ApiResponse.success(res, 'Earthquake counts by reporting network retrieved.', data);
  });

  reviewedCount = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getReviewedCount();
    return ApiResponse.success(res, 'Reviewed vs automatic records counted.', data);
  });

  monthlyCount = asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getMonthlyCount();
    return ApiResponse.success(res, 'Monthly earthquake count trends retrieved.', data);
  });
}

module.exports = new AnalyticsController();
