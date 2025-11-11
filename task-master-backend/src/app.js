/**
 * Express Application Configuration
 *
 * This module configures and exports the Express application instance.
 * It sets up middleware, routes, and error handlers.
 *
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const serverless = require('serverless-http');

// Import configuration
const appConfig = require('./config/app');

// Import routes
const routes = require('./routes');

// Import error handling middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Import additional security and sanitization middleware
const { 
  sanitizeXSS, 
  sanitizeSQL, 
  validateInputLength, 
  trimWhitespace,
  normalizeCase,
  removeEmptyFields 
} = require('./middleware/sanitization');

const { 
  preventParameterPollution, 
  validateContentType 
} = require('./middleware/security');

/**
 * Initialize Express Application
 */
const app = express();
app = serverless(app);
app.set('trust proxy', 1); // trust Vercel/Proxy headers for accurate client IPs

/**
 * Determine client IP address across different proxy setups. Needed because
 * some serverless platforms may not populate req.ip before middleware runs.
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'unknown'
  );
};

// Ensure req.ip is populated even if upstream proxies strip it
app.use((req, _res, next) => {
  if (!req.ip) {
    req.ip = getClientIp(req);
  }
  next();
});

/**
 * Security Middleware - Helmet
 *
 * Helmet helps secure Express apps by setting various HTTP headers.
 * Protects against common web vulnerabilities.
 *
 * Note: Content Security Policy is relaxed for Swagger UI to work properly.
 * In production, you may want to serve Swagger on a separate subdomain.
 */
if (appConfig.security.helmetEnabled) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );
}

/**
 * CORS Middleware
 *
 * Enable Cross-Origin Resource Sharing for frontend applications.
 * Configured with allowed origins, methods, and headers.
 */
app.use(cors(appConfig.cors));

/**
 * Request Logging Middleware - Morgan
 *
 * Logs HTTP requests for monitoring and debugging.
 * Format depends on environment (dev/production).
 */
app.use(morgan(appConfig.logging.format, {
  skip: appConfig.logging.skip,
}));

/**
 * Body Parser Middleware
 *
 * Parse incoming request bodies in JSON format.
 * Limit payload size to prevent abuse.
 */
app.use(express.json({
  limit: '10mb', // Maximum request body size
}));

/**
 * URL-Encoded Parser Middleware
 *
 * Parse URL-encoded request bodies (form submissions).
 */
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

/**
 * Content Type Validation
 *
 * Ensures requests with body have proper Content-Type header.
 */
app.use(validateContentType(['application/json']));

/**
 * Parameter Pollution Prevention
 *
 * Prevents HTTP parameter pollution attacks.
 */
app.use(preventParameterPollution);

/**
 * Input Length Validation
 *
 * Validates that input doesn't exceed reasonable length limits.
 */
app.use(validateInputLength({
  title: 200,
  description: 2000,
  email: 254,
  firstName: 50,
  lastName: 50,
  category: 50,
  default: 1000,
}));

/**
 * Trim Whitespace
 *
 * Trims leading and trailing whitespace from string inputs.
 */
app.use(trimWhitespace);

/**
 * Normalize Case
 *
 * Normalizes case for specific fields.
 */
app.use(normalizeCase({
  lowercase: ['email', 'username'],
  titlecase: ['firstName', 'lastName'],
}));

/**
 * Data Sanitization Middleware - MongoDB
 *
 * Sanitizes user input to prevent MongoDB operator injection attacks.
 * Removes $ and . characters from request body, params, and query.
 */
app.use(mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input on key: ${key}`);
  },
}));

/**
 * XSS Protection
 *
 * Sanitizes string inputs to prevent Cross-Site Scripting attacks.
 */
app.use(sanitizeXSS);

/**
 * SQL Injection Prevention
 *
 * Additional protection against SQL injection attempts.
 */
app.use(sanitizeSQL);

/**
 * Remove Empty Fields
 *
 * Removes empty string fields from request body.
 */
app.use(removeEmptyFields);

/**
 * Rate Limiting Middleware
 *
 * Limits repeated requests to public APIs to prevent abuse.
 * Applies to all routes by default.
 * Swagger UI and health check endpoints are excluded from rate limiting.
 */
const swaggerPaths = ['/api-docs', '/api/api-docs'];

const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: appConfig.rateLimit.message,
  statusCode: appConfig.rateLimit.statusCode,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    // Skip rate limiting for Swagger UI and health check
    const isSwagger = swaggerPaths.some((path) => req.path.startsWith(path));
    return isSwagger || req.path === '/health' || req.path === '/api/v1/health';
  },
});

// Apply rate limiting to all routes
app.use(limiter);

/**
 * Swagger API Documentation
 *
 * Interactive API documentation using Swagger UI.
 * Access at: /api-docs
 */
app.use(
  swaggerPaths,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Task Master API Docs',
  })
);

// Swagger JSON endpoint
app.get(['/api-docs.json', '/api/api-docs.json'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * API Routes
 *
 * Mount all API routes under the configured API prefix.
 * Example: /api/v1/auth/register
 */
app.use(appConfig.server.apiPrefix, routes);

/**
 * Root Endpoint
 *
 * Simple welcome message for the root path.
 * Redirects users to the API documentation.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Task Master API',
    version: '1.0.0',
    documentation: {
      swagger: swaggerPaths,
      api: `${appConfig.server.apiPrefix}`,
    },
  });
});

/**
 * 404 Not Found Handler
 *
 * Catches requests to undefined routes.
 * Must be placed after all valid routes.
 */
app.use(notFound);

/**
 * Global Error Handler
 *
 * Catches and formats all errors passed through next(error).
 * Must be the last middleware in the chain.
 */
app.use(errorHandler);

/**
 * Export Express Application
 *
 * The configured app instance is imported by server.js
 * to start the HTTP server.
 */
module.exports = app;
