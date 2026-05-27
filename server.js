const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const loggingMiddleware = require('./src/middlewares/loggingMiddleware');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const { globalLimiter } = require('./src/middlewares/rateLimitMiddleware');
const ApiError = require('./src/utils/apiError');

// Load environment variables from .env
dotenv.config();

const app = express();

// 1. Establish MongoDB connection (Checklist 3)
connectDB();

// 2. Setup CORS policy (Checklist 11)
app.use(cors({
  origin: '*', // Allow all origins for testing/development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Content-Response-Meta']
}));

// 3. Setup global parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Setup Custom logging middleware (Good to Have 2)
app.use(loggingMiddleware);

// 5. Setup request duration tracer middleware (Good to Have 19)
app.use((req, res, next) => {
  const start = Date.now();
  res.locals.startTime = start;
  
  // Custom timing listener
  res.on('finish', () => {
    res.locals.duration = `${Date.now() - start}ms`;
  });
  next();
});

// 6. Setup global Rate Limiter (Good to Have 8)
app.use('/api', globalLimiter);

// 7. Mount Centralized API Versioned Router (Checklist 7 / Good to Have 14)
app.use('/api/v1', routes);

// 8. Redirect default queries to Health or welcome page
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Global Earthquakes Analytics API. Navigate to /api/v1/system/health for health checks.',
    version: 'v1.0.0',
    documentation: 'Check README.md or import postman_collection.json'
  });
});

// 9. Catch-all: Route Not Found (404)
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Resource path '${req.baseUrl}' does not exist on this server.`));
});

// 10. Mount Global Error Handler Middleware (Checklist 14)
app.use(errorMiddleware);

// 11. Start Express Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Server] Express active in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = server;
