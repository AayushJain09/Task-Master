/**
 * Data Sanitization Middleware
 *
 * This module provides comprehensive data sanitization functionality
 * to clean and validate incoming request data, preventing XSS and injection attacks.
 *
 * @module middleware/sanitization
 */

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * MongoDB Injection Prevention
 *
 * Sanitizes user input to prevent NoSQL injection attacks
 * Removes any keys that start with '$' or contain '.'
 */
const sanitizeMongoDB = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`MongoDB injection attempt detected from ${req.ip}: ${key}`);
  },
});

/**
 * XSS Protection
 *
 * Sanitizes string inputs to prevent Cross-Site Scripting attacks
 * Removes or encodes malicious HTML/JavaScript content
 *
 * @function sanitizeXSS
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeXSS = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 *
 * @function sanitizeObject
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 * @private
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
};

/**
 * Sanitize string content
 *
 * @function sanitizeString
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 * @private
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }

  // Use xss library for comprehensive XSS protection
  const options = {
    whiteList: {
      // Allow basic formatting tags for rich text fields
      b: [],
      i: [],
      em: [],
      strong: [],
      p: [],
      br: [],
      ul: [],
      ol: [],
      li: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  };

  return xss(str, options);
};

/**
 * SQL Injection Prevention
 *
 * Basic SQL injection prevention for any SQL-related fields
 * Though this API uses MongoDB, this provides additional protection
 *
 * @function sanitizeSQL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeSQL = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(\'|(\\')|(;|--|\*|\/\*))/gi,
    /(\b(OR|AND)\b.*(\=|LIKE))/gi,
  ];

  const checkForSQL = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          console.warn(`SQL injection attempt detected from ${req.ip} in ${path}: ${obj}`);
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForSQL(value, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check all input sources
  if (checkForSQL(req.body, 'body') || 
      checkForSQL(req.query, 'query') || 
      checkForSQL(req.params, 'params')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      error: 'Potentially malicious content found in request',
    });
  }

  next();
};

/**
 * Input Length Validation
 *
 * Validates that string inputs don't exceed reasonable length limits
 * Prevents memory exhaustion attacks
 *
 * @function validateInputLength
 * @param {Object} limits - Length limits for different fields
 * @returns {Function} Express middleware function
 *
 * @example
 * const limits = {
 *   title: 200,
 *   description: 2000,
 *   email: 254,
 *   default: 1000
 * };
 * app.use(validateInputLength(limits));
 */
const validateInputLength = (limits = {}) => {
  const defaultLimits = {
    title: 200,
    description: 2000,
    email: 254,
    name: 100,
    firstName: 50,
    lastName: 50,
    category: 50,
    default: 1000,
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    const validateObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        const fieldName = path.split('.').pop();
        const limit = finalLimits[fieldName] || finalLimits.default;
        
        if (obj.length > limit) {
          return {
            field: path,
            length: obj.length,
            limit,
          };
        }
      } else if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          const result = validateObject(value, path ? `${path}.${key}` : key);
          if (result) return result;
        }
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const result = validateObject(obj[i], `${path}[${i}]`);
          if (result) return result;
        }
      }
      return null;
    };

    // Check body
    if (req.body) {
      const violation = validateObject(req.body, 'body');
      if (violation) {
        return res.status(400).json({
          success: false,
          message: `Input too long for field '${violation.field}'`,
          error: `Field exceeds maximum length of ${violation.limit} characters (current: ${violation.length})`,
        });
      }
    }

    // Check query parameters
    if (req.query) {
      const violation = validateObject(req.query, 'query');
      if (violation) {
        return res.status(400).json({
          success: false,
          message: `Query parameter too long for field '${violation.field}'`,
          error: `Parameter exceeds maximum length of ${violation.limit} characters`,
        });
      }
    }

    next();
  };
};

/**
 * Trim Whitespace
 *
 * Trims leading and trailing whitespace from string inputs
 * Helps normalize input data
 *
 * @function trimWhitespace
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const trimWhitespace = (req, res, next) => {
  const trimObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    } else if (Array.isArray(obj)) {
      return obj.map(item => trimObject(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const trimmed = {};
      for (const [key, value] of Object.entries(obj)) {
        trimmed[key] = trimObject(value);
      }
      return trimmed;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = trimObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = trimObject(req.query);
  }

  next();
};

/**
 * Normalize Case
 *
 * Normalizes case for specific fields (e.g., email addresses)
 *
 * @function normalizeCase
 * @param {Object} options - Normalization options
 * @returns {Function} Express middleware function
 *
 * @example
 * const options = {
 *   lowercase: ['email', 'username'],
 *   uppercase: ['countryCode'],
 *   titlecase: ['firstName', 'lastName']
 * };
 * app.use(normalizeCase(options));
 */
const normalizeCase = (options = {}) => {
  const { lowercase = [], uppercase = [], titlecase = [] } = options;

  return (req, res, next) => {
    const normalizeObject = (obj) => {
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const normalized = {};
        for (const [key, value] of Object.entries(obj)) {
          let normalizedValue = value;
          
          if (typeof value === 'string') {
            if (lowercase.includes(key)) {
              normalizedValue = value.toLowerCase();
            } else if (uppercase.includes(key)) {
              normalizedValue = value.toUpperCase();
            } else if (titlecase.includes(key)) {
              normalizedValue = value.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              );
            }
          } else if (typeof value === 'object') {
            normalizedValue = normalizeObject(value);
          }
          
          normalized[key] = normalizedValue;
        }
        return normalized;
      }
      return obj;
    };

    if (req.body && typeof req.body === 'object') {
      req.body = normalizeObject(req.body);
    }

    next();
  };
};

/**
 * Remove Empty Fields
 *
 * Removes empty string fields from request body
 * Helps clean up optional fields
 *
 * @function removeEmptyFields
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const removeEmptyFields = (req, res, next) => {
  const cleanObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => cleanObject(item)).filter(item => item !== '');
    } else if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== '' && cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }

  next();
};

module.exports = {
  sanitizeMongoDB,
  sanitizeXSS,
  sanitizeSQL,
  validateInputLength,
  trimWhitespace,
  normalizeCase,
  removeEmptyFields,
};