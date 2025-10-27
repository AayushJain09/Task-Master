/**
 * User Management Validation Module
 *
 * This module provides validation rules for user management endpoints
 * using express-validator.
 *
 * @module validators/userValidator
 */

const { body, param, query } = require('express-validator');

/**
 * Get All Users Query Validation
 *
 * Validates query parameters for fetching all users.
 *
 * @constant {Array} getAllUsersValidation
 */
const getAllUsersValidation = [
  // Page number validation
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  // Limit validation
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Role filter validation
  query('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator'),

  // Active status filter validation
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),

  // Search query validation
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

/**
 * Get User By ID Validation
 *
 * Validates user ID parameter.
 *
 * @constant {Array} getUserByIdValidation
 */
const getUserByIdValidation = [
  // User ID validation
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

/**
 * Update User Status Validation
 *
 * Validates user status update request.
 *
 * @constant {Array} updateUserStatusValidation
 */
const updateUserStatusValidation = [
  // User ID validation
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  // isActive field validation
  body('isActive')
    .notEmpty()
    .withMessage('isActive field is required')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

/**
 * Update User Role Validation
 *
 * Validates user role update request.
 *
 * @constant {Array} updateUserRoleValidation
 */
const updateUserRoleValidation = [
  // User ID validation
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  // Role validation
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator'),
];

/**
 * Delete User Validation
 *
 * Validates user deletion request.
 *
 * @constant {Array} deleteUserValidation
 */
const deleteUserValidation = [
  // User ID validation
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

module.exports = {
  getAllUsersValidation,
  getUserByIdValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
  deleteUserValidation,
};
