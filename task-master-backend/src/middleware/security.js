/**
 * Security Middleware Module
 *
 * This module provides additional security middleware functions
 * to protect against common vulnerabilities and attacks.
 *
 * @module middleware/security
 */

/**
 * Prevent Parameter Pollution
 *
 * Middleware to prevent HTTP parameter pollution attacks.
 * Ensures that request parameters are not arrays when they shouldn't be.
 *
 * @function preventParameterPollution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @example
 * app.use(preventParameterPollution);
 */
const preventParameterPollution = (req, res, next) => {
  // Check query parameters
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      // Take only the first value if it's an array
      req.query[key] = req.query[key][0];
    }
  }

  // Check body parameters
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (Array.isArray(req.body[key]) && !shouldBeArray(key)) {
        // Take only the first value if it's an array and shouldn't be
        req.body[key] = req.body[key][0];
      }
    }
  }

  next();
};

/**
 * Helper function to determine if a field should be an array
 *
 * @function shouldBeArray
 * @param {string} key - Field name
 * @returns {boolean} True if field should be an array
 * @private
 */
const shouldBeArray = (key) => {
  // Add field names that should legitimately be arrays
  const arrayFields = ['tags', 'categories', 'ids', 'items'];
  return arrayFields.includes(key);
};

/**
 * Prevent Restricted Fields Update
 *
 * Middleware to prevent updates to restricted fields in request body.
 * Works as an additional layer of protection alongside validators.
 *
 * @function preventRestrictedFieldsUpdate
 * @param {...string} restrictedFields - List of field names to block
 * @returns {Function} Express middleware function
 *
 * @example
 * router.put('/profile',
 *   authenticate,
 *   preventRestrictedFieldsUpdate('email', 'password', 'role'),
 *   controller.updateProfile
 * );
 */
const preventRestrictedFieldsUpdate = (...restrictedFields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of restrictedFields) {
        if (field in req.body) {
          delete req.body[field];
          console.warn(`Attempted to update restricted field: ${field}`);
        }
      }
    }
    next();
  };
};

/**
 * Request Size Validator
 *
 * Validates that request doesn't exceed reasonable size limits
 * beyond what body-parser provides.
 *
 * @function validateRequestSize
 * @param {number} maxFields - Maximum number of fields allowed
 * @param {number} maxDepth - Maximum nesting depth for objects
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/data',
 *   validateRequestSize(50, 5),
 *   controller.handleData
 * );
 */
const validateRequestSize = (maxFields = 100, maxDepth = 5) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      // Count fields
      const fieldCount = countFields(req.body);
      if (fieldCount > maxFields) {
        return res.status(400).json({
          success: false,
          message: `Request body exceeds maximum field count of ${maxFields}`,
        });
      }

      // Check depth
      const depth = getObjectDepth(req.body);
      if (depth > maxDepth) {
        return res.status(400).json({
          success: false,
          message: `Request body exceeds maximum nesting depth of ${maxDepth}`,
        });
      }
    }
    next();
  };
};

/**
 * Count total number of fields in an object recursively
 *
 * @function countFields
 * @param {Object} obj - Object to count fields in
 * @returns {number} Total number of fields
 * @private
 */
const countFields = (obj) => {
  let count = 0;
  for (const key in obj) {
    count++;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countFields(obj[key]);
    }
  }
  return count;
};

/**
 * Get maximum depth of nested objects
 *
 * @function getObjectDepth
 * @param {Object} obj - Object to measure depth
 * @param {number} currentDepth - Current recursion depth
 * @returns {number} Maximum nesting depth
 * @private
 */
const getObjectDepth = (obj, currentDepth = 1) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      const depth = getObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  return maxDepth;
};

/**
 * Content Type Validation
 *
 * Ensures requests with body have proper Content-Type header.
 *
 * @function validateContentType
 * @param {Array<string>} allowedTypes - Allowed content types
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/data',
 *   validateContentType(['application/json']),
 *   controller.handleData
 * );
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    // Skip for GET and DELETE requests
    if (['GET', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Skip if no body
    if (!req.body || Object.keys(req.body).length === 0) {
      return next();
    }

    const contentType = req.get('Content-Type');
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type header is required',
      });
    }

    const isValidType = allowedTypes.some(type => contentType.includes(type));
    if (!isValidType) {
      return res.status(415).json({
        success: false,
        message: `Unsupported Content-Type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  preventParameterPollution,
  preventRestrictedFieldsUpdate,
  validateRequestSize,
  validateContentType,
};
