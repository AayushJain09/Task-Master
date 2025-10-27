/**
 * Authentication Validation Module
 *
 * This module provides validation rules for authentication-related endpoints
 * using express-validator.
 *
 * @module validators/authValidator
 */

const { body } = require('express-validator');

/**
 * Register Validation Rules
 *
 * Validates user registration request data including email, password,
 * first name, and last name.
 *
 * Validation Rules:
 * - email: Must be valid email format, normalized to lowercase
 * - password: Minimum 8 characters, must contain letters and numbers
 * - firstName: Required, trimmed, 2-50 characters
 * - lastName: Required, trimmed, 2-50 characters
 *
 * @constant {Array} registerValidation
 *
 * @example
 * router.post('/register',
 *   registerValidation,
 *   handleValidationErrors,
 *   authController.register
 * );
 */
const registerValidation = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters'),

  // Confirm password validation
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  // First name validation
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  // Last name validation
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
];

/**
 * Login Validation Rules
 *
 * Validates user login request data including email and password.
 *
 * Validation Rules:
 * - email: Must be valid email format
 * - password: Required, non-empty
 *
 * @constant {Array} loginValidation
 *
 * @example
 * router.post('/login',
 *   loginValidation,
 *   handleValidationErrors,
 *   authController.login
 * );
 */
const loginValidation = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Refresh Token Validation Rules
 *
 * Validates refresh token request data.
 *
 * Validation Rules:
 * - refreshToken: Required, must be a JWT string format
 *
 * @constant {Array} refreshTokenValidation
 *
 * @example
 * router.post('/refresh',
 *   refreshTokenValidation,
 *   handleValidationErrors,
 *   authController.refreshToken
 * );
 */
const refreshTokenValidation = [
  // Refresh token validation
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
    .matches(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)
    .withMessage('Invalid refresh token format'),
];

/**
 * Change Password Validation Rules
 *
 * Validates password change request data including current and new passwords.
 *
 * Validation Rules:
 * - currentPassword: Required
 * - newPassword: Minimum 8 characters, must contain letters and numbers
 * - confirmNewPassword: Must match newPassword
 *
 * @constant {Array} changePasswordValidation
 *
 * @example
 * router.post('/change-password',
 *   authenticate,
 *   changePasswordValidation,
 *   handleValidationErrors,
 *   authController.changePassword
 * );
 */
const changePasswordValidation = [
  // Current password validation
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  // New password validation
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  // Confirm new password validation
  body('confirmNewPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Email Validation Rules
 *
 * Validates single email field (for forgot password, email verification, etc.)
 *
 * Validation Rules:
 * - email: Must be valid email format
 *
 * @constant {Array} emailValidation
 *
 * @example
 * router.post('/forgot-password',
 *   emailValidation,
 *   handleValidationErrors,
 *   authController.forgotPassword
 * );
 */
const emailValidation = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * Update Profile Validation Rules
 *
 * Validates profile update request data.
 * Prevents updating restricted fields like email, password, role.
 *
 * Validation Rules:
 * - firstName: Optional, trimmed, 2-50 characters if provided
 * - lastName: Optional, trimmed, 2-50 characters if provided
 * - Blocks attempts to update email, password, role, refreshTokens
 *
 * @constant {Array} updateProfileValidation
 *
 * @example
 * router.put('/profile',
 *   authenticate,
 *   updateProfileValidation,
 *   handleValidationErrors,
 *   authController.updateProfile
 * );
 */
const updateProfileValidation = [
  // First name validation (optional)
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  // Last name validation (optional)
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Block attempts to update restricted fields
  body('email')
    .not()
    .exists()
    .withMessage('Email cannot be updated through this endpoint'),

  body('password')
    .not()
    .exists()
    .withMessage('Password cannot be updated through this endpoint. Use /change-password instead'),

  body('role')
    .not()
    .exists()
    .withMessage('Role cannot be updated through this endpoint'),

  body('refreshTokens')
    .not()
    .exists()
    .withMessage('Refresh tokens cannot be modified directly'),

  body('isActive')
    .not()
    .exists()
    .withMessage('Account status cannot be modified through this endpoint'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  emailValidation,
  updateProfileValidation,
};
