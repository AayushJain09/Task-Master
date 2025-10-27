/**
 * Error Handling Middleware
 *
 * This module provides centralized error handling for the Express application.
 * It catches and formats errors from throughout the application.
 *
 * @module middleware/errorHandler
 */

/**
 * Custom API Error Class
 *
 * Extends the built-in Error class to include HTTP status codes
 * and structured error responses.
 *
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Creates an API error instance
   *
   * @constructor
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} [isOperational=true] - Whether error is operational
   * @param {string} [stack=''] - Error stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Not Found Error Handler
 *
 * Catches requests to undefined routes and returns 404 error.
 * Should be placed after all route definitions.
 *
 * @function notFound
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @example
 * app.use('/api', routes);
 * app.use(notFound);
 * app.use(errorHandler);
 */
const notFound = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found - ${req.originalUrl}`
  );
  next(error);
};

/**
 * Global Error Handler Middleware
 *
 * Centralized error handling that catches all errors passed to next(error).
 * Formats error responses consistently across the application.
 *
 * @function errorHandler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * Error Response Format:
 * {
 *   success: false,
 *   message: string,
 *   errors: array (optional),
 *   stack: string (development only)
 * }
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    // Extract validation errors from mongoose
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    // Extract field name from error message
    const field = Object.keys(err.keyPattern)[0];
    errors = [
      {
        field,
        message: `${field} already exists`,
      },
    ];
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = [
      {
        field: err.path,
        message: `Invalid ${err.path}`,
      },
    ];
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Express Validator Errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.array();
  }

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      statusCode,
      stack: err.stack,
    });
  }

  // Send error response
  const response = {
    success: false,
    message,
  };

  // Add errors array if present
  if (errors) {
    response.errors = errors;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async Error Handler Wrapper
 *
 * Wraps async route handlers to automatically catch rejected promises
 * and pass them to the error handler.
 *
 * @function asyncHandler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json({ success: true, data: users });
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 *
 * Processes express-validator validation results and throws formatted error.
 * Should be used after validation middleware.
 *
 * @function handleValidationErrors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @example
 * router.post('/users',
 *   [
 *     body('email').isEmail(),
 *     body('password').isLength({ min: 8 })
 *   ],
 *   handleValidationErrors,
 *   controller.createUser
 * );
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
  handleValidationErrors,
};
