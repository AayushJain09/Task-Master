/**
 * Helper Utilities Module
 *
 * This module provides common utility functions used throughout the application.
 *
 * @module utils/helpers
 */

/**
 * Sanitize User Object
 *
 * Removes sensitive fields from user object before sending in response.
 * Use this when you need more control than the default toJSON method.
 *
 * @function sanitizeUser
 * @param {Object} user - User object or document
 * @returns {Object} Sanitized user object
 *
 * @example
 * const cleanUser = sanitizeUser(userDoc);
 * res.json({ success: true, data: { user: cleanUser } });
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;

  // Remove sensitive fields
  delete userObj.password;
  delete userObj.refreshTokens;
  delete userObj.__v;

  return userObj;
};

/**
 * Generate Random String
 *
 * Generates a cryptographically secure random string.
 * Useful for generating tokens, verification codes, etc.
 *
 * @function generateRandomString
 * @param {number} [length=32] - Length of the random string
 * @returns {string} Random hexadecimal string
 *
 * @example
 * const resetToken = generateRandomString(64);
 */
const generateRandomString = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Parse Pagination Parameters
 *
 * Extracts and validates pagination parameters from request query.
 * Applies defaults and maximum limits.
 *
 * @function parsePagination
 * @param {Object} query - Request query object
 * @param {number} [query.page] - Page number
 * @param {number} [query.limit] - Items per page
 * @param {number} [defaultPage=1] - Default page number
 * @param {number} [defaultLimit=10] - Default items per page
 * @param {number} [maxLimit=100] - Maximum items per page
 * @returns {Object} Parsed pagination object with page, limit, and skip
 *
 * @example
 * const { page, limit, skip } = parsePagination(req.query);
 * const users = await User.find().skip(skip).limit(limit);
 */
const parsePagination = (
  query,
  defaultPage = 1,
  defaultLimit = 10,
  maxLimit = 100
) => {
  // Parse page number
  let page = parseInt(query.page) || defaultPage;
  if (page < 1) page = defaultPage;

  // Parse limit
  let limit = parseInt(query.limit) || defaultLimit;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  // Calculate skip value
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build Pagination Response
 *
 * Creates a standardized pagination response object.
 *
 * @function buildPaginationResponse
 * @param {Array} data - Array of items for current page
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total number of items
 * @returns {Object} Pagination response object
 *
 * @example
 * const paginationData = buildPaginationResponse(users, page, limit, totalCount);
 * res.json({ success: true, data: paginationData });
 */
const buildPaginationResponse = (data, page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items: data,
    pagination: {
      currentPage: page,
      totalPages,
      itemsPerPage: limit,
      totalItems,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Format Date
 *
 * Formats a date object to a standardized string format.
 *
 * @function formatDate
 * @param {Date} date - Date object to format
 * @param {string} [format='ISO'] - Format type ('ISO', 'date', 'datetime')
 * @returns {string} Formatted date string
 *
 * @example
 * const formatted = formatDate(new Date(), 'datetime');
 */
const formatDate = (date, format = 'ISO') => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'datetime':
      return date.toLocaleString();
    case 'ISO':
    default:
      return date.toISOString();
  }
};

/**
 * Validate Email Format
 *
 * Validates email address format using regex.
 *
 * @function isValidEmail
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 *
 * @example
 * if (!isValidEmail(email)) {
 *   throw new Error('Invalid email format');
 * }
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize First Letter
 *
 * Capitalizes the first letter of a string.
 *
 * @function capitalizeFirst
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 *
 * @example
 * const name = capitalizeFirst('john'); // "John"
 */
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Sleep/Delay Function
 *
 * Creates a promise that resolves after specified milliseconds.
 * Useful for adding delays in async functions.
 *
 * @function sleep
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 *
 * @example
 * await sleep(1000); // Wait 1 second
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Remove Undefined Fields
 *
 * Removes undefined or null fields from an object.
 * Useful for building update queries.
 *
 * @function removeUndefined
 * @param {Object} obj - Object to clean
 * @returns {Object} Object with undefined/null fields removed
 *
 * @example
 * const updateData = removeUndefined({
 *   name: 'John',
 *   age: undefined,
 *   email: null
 * }); // { name: 'John' }
 */
const removeUndefined = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

/**
 * Calculate Age
 *
 * Calculates age from birthdate.
 *
 * @function calculateAge
 * @param {Date|string} birthDate - Birth date
 * @returns {number} Age in years
 *
 * @example
 * const age = calculateAge('1990-01-01'); // 34 (in 2024)
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

module.exports = {
  sanitizeUser,
  generateRandomString,
  parsePagination,
  buildPaginationResponse,
  formatDate,
  isValidEmail,
  capitalizeFirst,
  sleep,
  removeUndefined,
  calculateAge,
};
