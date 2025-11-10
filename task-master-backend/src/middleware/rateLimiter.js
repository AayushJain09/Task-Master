/**
 * Rate Limiting Middleware
 *
 * This module provides rate limiting functionality to protect against
 * abuse and DoS attacks. It uses memory store for simplicity but can
 * be configured to use Redis for production environments.
 *
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

/**
 * Create Rate Limiter Helper
 *
 * Helper function to create rate limiter with consistent error response format
 *
 * @function createRateLimiter
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express rate limiting middleware
 * @private
 */
const createRateLimiter = (options) => {
  return rateLimit({
    ...options,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'Rate limit exceeded',
        retryAfter: Math.round(options.windowMs / 1000), // Convert to seconds
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks and certain endpoints
      const skipPaths = ['/health', '/api/health', '/ping'];
      return skipPaths.includes(req.path);
    },
  });
};

/**
 * General Rate Limiter
 *
 * General purpose rate limiter for most API endpoints
 * 1200 requests per 15 minutes per IP
 */
const rateLimitGeneral = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1200, // Limit each IP to 1200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Strict Rate Limiter
 *
 * Stricter rate limiter for sensitive operations like task creation/updates
 * 30 requests per 15 minutes per IP
 */
const rateLimitStrict = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many modification requests from this IP, please try again later.',
});

/**
 * Moderate Rate Limiter
 *
 * Moderate rate limiter for read operations where higher throughput is acceptable
 * 1200 requests per 15 minutes per IP
 */
const rateLimitModerate = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1200, // Limit each IP to 1200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Authentication Rate Limiter
 *
 * Special rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP for failed logins
 */
const rateLimitAuth = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Registration Rate Limiter
 *
 * Rate limiter for user registration
 * 3 registrations per hour per IP
 */
const rateLimitRegistration = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: 'Too many registration attempts from this IP, please try again later.',
});

/**
 * Password Reset Rate Limiter
 *
 * Rate limiter for password reset requests
 * 3 attempts per hour per IP
 */
const rateLimitPasswordReset = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts from this IP, please try again later.',
});

/**
 * File Upload Rate Limiter
 *
 * Rate limiter for file upload operations
 * 10 uploads per hour per IP
 */
const rateLimitUpload = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many file upload attempts from this IP, please try again later.',
});

/**
 * API Key Rate Limiter
 *
 * Rate limiter for API key generation/refresh
 * 5 requests per day per IP
 */
const rateLimitApiKey = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 API key requests per day
  message: 'Too many API key requests from this IP, please try again later.',
});

/**
 * Dynamic Rate Limiter Factory
 *
 * Creates a custom rate limiter with specified parameters
 *
 * @function createCustomRateLimiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @param {string} message - Custom error message
 * @returns {Function} Express rate limiting middleware
 *
 * @example
 * const customLimiter = createCustomRateLimiter(
 *   10 * 60 * 1000, // 10 minutes
 *   50, // 50 requests
 *   'Custom rate limit exceeded'
 * );
 */
const createCustomRateLimiter = (windowMs, max, message) => {
  return createRateLimiter({
    windowMs,
    max,
    message,
  });
};

/**
 * Sliding Window Rate Limiter
 *
 * More sophisticated rate limiter using sliding window
 * Better for handling burst traffic
 *
 * @function slidingWindowRateLimiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @returns {Function} Express rate limiting middleware
 */
const slidingWindowRateLimiter = (windowMs, max) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key);
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      requests.set(key, validRequests);
    }

    // Get current request count
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((currentRequests[0] - windowStart) / 1000),
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(key, currentRequests);

    next();
  };
};

/**
 * User-based Rate Limiter
 *
 * Rate limiter that uses user ID instead of IP address
 * Useful for authenticated endpoints
 *
 * @function userBasedRateLimiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @returns {Function} Express rate limiting middleware
 */
const userBasedRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Use user ID if authenticated, fallback to IP
      return req.user?.userId?.toString() || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'User rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

module.exports = {
  rateLimitGeneral,
  rateLimitStrict,
  rateLimitModerate,
  rateLimitAuth,
  rateLimitRegistration,
  rateLimitPasswordReset,
  rateLimitUpload,
  rateLimitApiKey,
  createCustomRateLimiter,
  slidingWindowRateLimiter,
  userBasedRateLimiter,
};
