/**
 * Authentication Routes
 *
 * This module defines all authentication-related routes including
 * registration, login, token management, and profile operations.
 *
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');

// Import middleware
const { authenticate, verifyRefreshToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Import validators
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation,
  biometricLoginValidation,
} = require('../validators/authValidator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * Request Body:
 * {
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   firstName: string,
 *   lastName: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "User registered successfully",
 *   data: {
 *     user: {...},
 *     tokens: {
 *       accessToken: "...",
 *       refreshToken: "..."
 *     }
 *   }
 * }
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return authentication tokens
 * @access  Public
 *
 * Request Body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     user: {...},
 *     tokens: {
 *       accessToken: "...",
 *       refreshToken: "..."
 *     }
 *   }
 * }
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 *
 * Request Body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Token refreshed successfully",
 *   data: {
 *     accessToken: "..."
 *   }
 * }
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  verifyRefreshToken,
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user by invalidating refresh token
 * @access  Private (requires authentication)
 *
 * Request Body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Logout successful"
 * }
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout user from all devices by invalidating all refresh tokens
 * @access  Private (requires authentication)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Logged out from all devices"
 * }
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user's profile
 * @access  Private (requires authentication)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: {...}
 *   }
 * }
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user's profile
 * @access  Private (requires authentication)
 *
 * Request Body:
 * {
 *   firstName?: string,
 *   lastName?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Profile updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user's password
 * @access  Private (requires authentication)
 *
 * Request Body:
 * {
 *   currentPassword: string,
 *   newPassword: string,
 *   confirmNewPassword: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Password changed successfully. Please login again."
 * }
 */
router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/biometric/setup
 * @desc    Setup biometric authentication for user
 * @access  Private (requires authentication)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Biometric authentication enabled successfully",
 *   data: {
 *     biometricToken: "...",
 *     biometricEnabled: true,
 *     setupTimestamp: "..."
 *   }
 * }
 */
router.post(
  '/biometric/setup',
  authenticate,
  authController.setupBiometric
);

/**
 * @route   POST /api/v1/auth/biometric/login
 * @desc    Login using biometric authentication
 * @access  Public
 *
 * Request Body:
 * {
 *   email: string,
 *   biometricToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Biometric login successful",
 *   data: {
 *     user: {...},
 *     tokens: {
 *       accessToken: "...",
 *       refreshToken: "..."
 *     },
 *     authMethod: "biometric"
 *   }
 * }
 */
router.post(
  '/biometric/login',
  biometricLoginValidation,
  handleValidationErrors,
  authController.loginWithBiometric
);

/**
 * @route   POST /api/v1/auth/biometric/disable
 * @desc    Disable biometric authentication for user
 * @access  Private (requires authentication)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Biometric authentication disabled successfully",
 *   data: {
 *     biometricEnabled: false
 *   }
 * }
 */
router.post(
  '/biometric/disable',
  authenticate,
  authController.disableBiometric
);

/**
 * @route   GET /api/v1/auth/biometric/status
 * @desc    Get biometric authentication status for user
 * @access  Private (requires authentication)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     biometricEnabled: boolean
 *   }
 * }
 */
router.get(
  '/biometric/status',
  authenticate,
  authController.getBiometricStatus
);

module.exports = router;
