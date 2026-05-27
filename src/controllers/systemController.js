const mongoose = require('mongoose');
const os = require('os');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

class SystemController {
  /**
   * Complete health check endpoint
   */
  healthCheck = asyncHandler(async (req, res) => {
    const memoryUsage = process.memoryUsage();
    
    const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    
    const healthInfo = {
      status: 'UP',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        cpuCores: os.cpus().length,
        freeMemoryBytes: os.freemem(),
        totalMemoryBytes: os.totalmem(),
        loadAverage: os.loadavg()
      },
      process: {
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100} MB`
        }
      },
      database: {
        status: dbStatus,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    };

    return ApiResponse.success(res, 'System status health report.', healthInfo);
  });

  // ==========================================
  // --- Middleware Practice Sandboxes -------
  // ==========================================

  practiceLogger = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, 'Logger middleware practice completed. The request was successfully logged on server stdout.', {
      loggedDetails: {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  });

  practiceAuth = asyncHandler(async (req, res) => {
    // If the request reached here, the auth middleware already authenticated the user
    return ApiResponse.success(res, 'Authentication middleware practice completed successfully.', {
      authenticatedUser: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  });

  practiceRateLimit = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, 'Rate limit middleware practice completed. Your IP address is within allowable limits.', {
      windowLimit: '30 requests per 15 minutes for search/analytics paths'
    });
  });

  practiceErrorHandler = asyncHandler(async (req, res) => {
    // Intentionally trigger a standard Operational ApiError to practice error intercepting
    throw ApiError.badRequest('This error was intentionally thrown for global error-handler practicing.');
  });

  practiceRequestTime = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, 'Request timing middleware practice completed.', {
      requestedAt: new Date().toISOString(),
      responseTimeMs: res.locals.duration || 'Calculated automatically on header write.'
    });
  });

  practiceCache = asyncHandler(async (req, res) => {
    // Simulate a simple API Cache response
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute HTTP caching
    return ApiResponse.success(res, 'Caching middleware practice completed. Cache headers successfully bound to response.', {
      cacheControl: 'public, max-age=60',
      simulatedCachedAt: new Date().toISOString()
    });
  });

  // ==========================================
  // --- HEAD & OPTIONS Handlers --------------
  // ==========================================

  /**
   * Custom OPTIONS endpoint to list allowed methods
   */
  optionsHandler = (allowedMethods) => (req, res) => {
    res.set('Allow', allowedMethods.join(', '));
    res.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
    return res.status(200).end();
  };

  /**
   * Custom HEAD endpoint to list metadata headers only
   */
  headHandler = asyncHandler(async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.set('X-Content-Response-Meta', 'HEAD-ONLY');
    return res.status(200).end();
  });
}

module.exports = new SystemController();
