const Earthquake = require('../models/Earthquake');

class AnalyticsService {
  // ==========================================
  // --- Core Aggregation Analytics Pipelines ---
  // ==========================================

  /**
   * Fetch highest magnitude earthquakes using aggregation
   */
  static async getHighestMagnitude() {
    return await Earthquake.aggregate([
      { $match: { mag: { $ne: null } } },
      { $sort: { mag: -1, time: -1 } },
      { $limit: 10 },
      {
        $project: {
          id: 1,
          time: 1,
          place: 1,
          country: 1,
          mag: 1,
          magType: 1,
          depth: 1
        }
      }
    ]);
  }

  /**
   * Fetch deepest earthquakes using aggregation
   */
  static async getDeepest() {
    return await Earthquake.aggregate([
      { $match: { depth: { $ne: null } } },
      { $sort: { depth: -1, time: -1 } },
      { $limit: 10 },
      {
        $project: {
          id: 1,
          time: 1,
          place: 1,
          country: 1,
          mag: 1,
          depth: 1
        }
      }
    ]);
  }

  /**
   * Analyze recent activity broken down by status and network
   */
  static async getRecentActivity() {
    return await Earthquake.aggregate([
      { $sort: { time: -1 } },
      { $limit: 100 }, // Analyze the 100 most recent events
      {
        $group: {
          _id: { net: '$net', status: '$status' },
          count: { $sum: 1 },
          avgMagnitude: { $avg: '$mag' },
          maxMagnitude: { $max: '$mag' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          network: '$_id.net',
          status: '$_id.status',
          count: 1,
          avgMagnitude: { $round: ['$avgMagnitude', 2] },
          maxMagnitude: 1
        }
      }
    ]);
  }

  /**
   * Country wise breakdown with counts, average mag, and average depth
   */
  static async getCountryAnalysis() {
    return await Earthquake.aggregate([
      { $match: { country: { $ne: null } } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
          avgMagnitude: { $avg: '$mag' },
          maxMagnitude: { $max: '$mag' },
          avgDepth: { $avg: '$depth' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }, // Return top 15 countries for clarity
      {
        $project: {
          _id: 0,
          country: '$_id',
          count: 1,
          avgMagnitude: { $round: ['$avgMagnitude', 2] },
          maxMagnitude: 1,
          avgDepth: { $round: ['$avgDepth', 2] }
        }
      }
    ]);
  }

  /**
   * Geographic location summary grouping by latitude & longitude cells
   */
  static async getLocationAnalysis() {
    return await Earthquake.aggregate([
      {
        $group: {
          _id: {
            latCell: { $round: ['$latitude', 0] },
            lonCell: { $round: ['$longitude', 0] }
          },
          count: { $sum: 1 },
          avgMagnitude: { $avg: '$mag' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 0,
          latitudeCell: '$_id.latCell',
          longitudeCell: '$_id.lonCell',
          count: 1,
          avgMagnitude: { $round: ['$avgMagnitude', 2] }
        }
      }
    ]);
  }

  /**
   * Network-wise metrics tracking rms accuracy and magnitude counts
   */
  static async getNetworkAnalysis() {
    return await Earthquake.aggregate([
      {
        $group: {
          _id: '$net',
          totalEvents: { $sum: 1 },
          avgMagnitude: { $avg: '$mag' },
          avgRms: { $avg: '$rms' }
        }
      },
      { $sort: { totalEvents: -1 } },
      {
        $project: {
          _id: 0,
          network: '$_id',
          totalEvents: 1,
          avgMagnitude: { $round: ['$avgMagnitude', 2] },
          avgRms: { $round: ['$avgRms', 3] }
        }
      }
    ]);
  }

  /**
   * Magnitude bucket grouping (Minor, Light, Moderate, Strong, Major)
   */
  static async getMagnitudeAnalysis() {
    return await Earthquake.aggregate([
      {
        $project: {
          magTypeClass: {
            $cond: [
              { $lt: ['$mag', 3.0] }, 'Minor (mag < 3.0)',
              {
                $cond: [
                  { $lt: ['$mag', 4.5] }, 'Light (3.0 <= mag < 4.5)',
                  {
                    $cond: [
                      { $lt: ['$mag', 6.0] }, 'Moderate (4.5 <= mag < 6.0)',
                      {
                        $cond: [
                          { $lt: ['$mag', 7.5] }, 'Strong (6.0 <= mag < 7.5)',
                          'Major (mag >= 7.5)'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$magTypeClass',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1
        }
      }
    ]);
  }

  /**
   * Depth categorization (Shallow, Intermediate, Deep)
   */
  static async getDepthAnalysis() {
    return await Earthquake.aggregate([
      {
        $project: {
          depthClass: {
            $cond: [
              { $lt: ['$depth', 70.0] }, 'Shallow (depth < 70km)',
              {
                $cond: [
                  { $lt: ['$depth', 300.0] }, 'Intermediate (70km <= depth < 300km)',
                  'Deep (depth >= 300km)'
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$depthClass',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1
        }
      }
    ]);
  }

  /**
   * Error value analytics (horizontal, depth, magnitude error rates)
   */
  static async getErrorAnalysis() {
    return await Earthquake.aggregate([
      {
        $group: {
          _id: '$net',
          count: { $sum: 1 },
          avgHorizontalError: { $avg: '$horizontalError' },
          avgDepthError: { $avg: '$depthError' },
          avgMagError: { $avg: '$magError' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          network: '$_id',
          count: 1,
          avgHorizontalError: { $round: ['$avgHorizontalError', 2] },
          avgDepthError: { $round: ['$avgDepthError', 2] },
          avgMagError: { $round: ['$avgMagError', 3] }
        }
      }
    ]);
  }

  /**
   * Monthly trend aggregation tracking magnitude stats
   */
  static async getMonthlyAnalysis() {
    return await Earthquake.aggregate([
      {
        $project: {
          year: { $year: '$time' },
          month: { $month: '$time' },
          mag: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          count: { $sum: 1 },
          avgMagnitude: { $avg: '$mag' },
          maxMagnitude: { $max: '$mag' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          avgMagnitude: { $round: ['$avgMagnitude', 2] },
          maxMagnitude: 1
        }
      }
    ]);
  }

  // ==========================================
  // --- Core Statistics Methods ---
  // ==========================================

  static async getCount() {
    return await Earthquake.countDocuments();
  }

  static async getHighestMagnitudeRecord() {
    return await Earthquake.findOne({ mag: { $ne: null } }).sort({ mag: -1, time: -1 });
  }

  static async getDeepestRecord() {
    return await Earthquake.findOne({ depth: { $ne: null } }).sort({ depth: -1, time: -1 });
  }

  static async getAverageDepth() {
    const stats = await Earthquake.aggregate([
      { $match: { depth: { $ne: null } } },
      { $group: { _id: null, avgDepth: { $avg: '$depth' } } }
    ]);
    return stats.length > 0 ? Math.round(stats[0].avgDepth * 100) / 100 : 0;
  }

  static async getAverageMagnitude() {
    const stats = await Earthquake.aggregate([
      { $match: { mag: { $ne: null } } },
      { $group: { _id: null, avgMag: { $avg: '$mag' } } }
    ]);
    return stats.length > 0 ? Math.round(stats[0].avgMag * 100) / 100 : 0;
  }

  static async getCountryCount() {
    return await Earthquake.aggregate([
      { $match: { country: { $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, country: '$_id', count: 1 } }
    ]);
  }

  static async getTypeCount() {
    return await Earthquake.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, type: '$_id', count: 1 } }
    ]);
  }

  static async getNetworkCount() {
    return await Earthquake.aggregate([
      { $group: { _id: '$net', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, network: '$_id', count: 1 } }
    ]);
  }

  static async getReviewedCount() {
    return await Earthquake.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
  }

  static async getMonthlyCount() {
    return await this.getMonthlyAnalysis();
  }
}

module.exports = AnalyticsService;
