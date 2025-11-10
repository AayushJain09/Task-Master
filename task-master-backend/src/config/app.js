/**
 * Application Configuration Module
 *
 * This module centralizes all application-level configuration settings
 * including server, CORS, rate limiting, and general app settings.
 *
 * @module config/app
 */

/**
 * Application Configuration Object
 *
 * Contains all configuration parameters for the Express application
 *
 * @constant {Object} appConfig
 */
const appConfig = {
  // Server configuration
  server: {
    // Port number for the server to listen on
    port: process.env.PORT || 8000,

    // Environment (development, production, test)
    env: process.env.NODE_ENV || 'development',

    // API base path
    apiPrefix: '/api/v1',
  },

  // CORS (Cross-Origin Resource Sharing) configuration
  cors: {
    // Allowed origins for CORS requests
    // In development: allow all origins for mobile development
    // In production: specify exact domains
    origin: process.env.CORS_ORIGIN || true,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: ['Content-Type', 'Authorization'],

    // Exposed headers
    exposedHeaders: ['Content-Range', 'X-Content-Range'],

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Cache preflight request results (in seconds)
    maxAge: 86400, // 24 hours
  },

  // Rate limiting configuration
  rateLimit: {
    // Time window in milliseconds
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes

    // Maximum number of requests per window
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1200,

    // Message to send when rate limit is exceeded
    message: 'Too many requests from this IP, please try again later.',

    // Status code to send when rate limit is exceeded
    statusCode: 429,

    // Skip successful requests (only count errors)
    skipSuccessfulRequests: false,

    // Skip failed requests (only count successful)
    skipFailedRequests: false,
  },

  // Security configuration
  security: {
    // Enable helmet security headers
    helmetEnabled: true,

    // Content Security Policy
    contentSecurityPolicy: process.env.NODE_ENV === 'production',

    // HSTS (HTTP Strict Transport Security)
    hsts: process.env.NODE_ENV === 'production',
  },

  // Logging configuration
  logging: {
    // Morgan logging format
    // 'dev' for development (colored, concise)
    // 'combined' for production (Apache combined log format)
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',

    // Skip logging for specific routes
    skip: (req, res) => {
      // Skip health check endpoint logs
      return req.url === '/health';
    },
  },

  // Pagination defaults
  pagination: {
    // Default page number
    defaultPage: 1,

    // Default number of items per page
    defaultLimit: 10,

    // Maximum items per page
    maxLimit: 100,
  },
};

/**
 * Validates that all required configuration values are present
 *
 * @function validateAppConfig
 * @throws {Error} If any required configuration value is missing or invalid
 */
const validateAppConfig = () => {
  // Validate port
  if (isNaN(appConfig.server.port) || appConfig.server.port < 1 || appConfig.server.port > 65535) {
    throw new Error('Invalid PORT configuration');
  }

  // Validate environment
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(appConfig.server.env)) {
    throw new Error(`Invalid NODE_ENV: ${appConfig.server.env}. Must be one of: ${validEnvironments.join(', ')}`);
  }

  // Warn if using default CORS origin in production
  if (appConfig.server.env === 'production' && appConfig.cors.origin === 'http://localhost:3000') {
    console.warn('⚠️  WARNING: Using default CORS_ORIGIN in production!');
  }
};

// Validate configuration on module load
validateAppConfig();

module.exports = appConfig;
