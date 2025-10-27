/**
 * Authentication Controller
 *
 * This module handles all authentication-related operations including
 * user registration, login, token refresh, logout, and password management.
 *
 * @module controllers/authController
 */

const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const {
  mapRegistrationToResponse,
  mapLoginToResponse,
  mapTokenRefreshToResponse,
  mapLogoutToResponse,
  mapPasswordChangeToResponse,
  mapProfileToResponse,
  mapProfileUpdateToResponse,
} = require('../dtos');

/**
 * Register New User
 *
 * Creates a new user account with hashed password and returns
 * authentication tokens.
 *
 * @async
 * @function register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data and tokens
 *
 * @throws {409} If email already exists
 * @throws {500} If registration fails
 *
 * Response Format:
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
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Create new user
  const user = new User({
    email,
    password, // Will be hashed by pre-save middleware
    firstName,
    lastName,
  });

  // Save user to database
  await user.save();

  // Generate authentication tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in user's token list
  await user.addRefreshToken(refreshToken);

  // Map to DTO and send success response
  res.status(201).json(mapRegistrationToResponse(user, accessToken, refreshToken));
});

/**
 * Login User
 *
 * Authenticates user with email and password, returns authentication tokens.
 *
 * @async
 * @function login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data and tokens
 *
 * @throws {401} If credentials are invalid
 * @throws {500} If login fails
 *
 * Response Format:
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
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by credentials (static method handles validation)
  const user = await User.findByCredentials(email, password);

  // Generate authentication tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in user's token list
  await user.addRefreshToken(refreshToken);

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Map to DTO and send success response
  res.status(200).json(mapLoginToResponse(user, accessToken, refreshToken));
});

/**
 * Refresh Access Token
 *
 * Generates a new access token using a valid refresh token.
 *
 * @async
 * @function refreshToken
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.refreshToken - Valid refresh token
 * @param {Object} req.user - User object (attached by verifyRefreshToken middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with new access token
 *
 * @throws {401} If refresh token is invalid
 * @throws {500} If token refresh fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Token refreshed successfully",
 *   data: {
 *     accessToken: "..."
 *   }
 * }
 */
const refreshToken = asyncHandler(async (req, res) => {
  // User is already validated by verifyRefreshToken middleware
  const user = req.user;

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Replace old refresh token with new one
  await user.removeRefreshToken(req.body.refreshToken);
  await user.addRefreshToken(newRefreshToken);

  // Map to DTO and send success response
  res.status(200).json(mapTokenRefreshToResponse(newAccessToken, newRefreshToken));
});

/**
 * Logout User
 *
 * Invalidates the provided refresh token by removing it from user's token list.
 *
 * @async
 * @function logout
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.refreshToken - Refresh token to invalidate
 * @param {Object} req.user - User object (attached by authenticate middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming logout
 *
 * @throws {500} If logout fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Logout successful"
 * }
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Get user from database with refresh tokens
  const user = await User.findById(req.user.userId).select('+refreshTokens');

  if (user && refreshToken) {
    // Remove the specific refresh token
    await user.removeRefreshToken(refreshToken);
  }

  // Map to DTO and send success response
  res.status(200).json(mapLogoutToResponse(false));
});

/**
 * Logout From All Devices
 *
 * Invalidates all refresh tokens for the user, effectively logging them out
 * from all devices.
 *
 * @async
 * @function logoutAll
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object (attached by authenticate middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming logout from all devices
 *
 * @throws {500} If logout fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Logged out from all devices"
 * }
 */
const logoutAll = asyncHandler(async (req, res) => {
  // Get user from database with refresh tokens
  const user = await User.findById(req.user.userId).select('+refreshTokens');

  if (user) {
    // Clear all refresh tokens
    await user.clearAllRefreshTokens();
  }

  // Map to DTO and send success response
  res.status(200).json(mapLogoutToResponse(true));
});

/**
 * Get Current User Profile
 *
 * Returns the authenticated user's profile information.
 *
 * @async
 * @function getProfile
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object (attached by authenticate middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user profile
 *
 * @throws {404} If user not found
 * @throws {500} If retrieval fails
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     user: {...}
 *   }
 * }
 */
const getProfile = asyncHandler(async (req, res) => {
  // Get full user data from database
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Map to DTO and send success response
  res.status(200).json(mapProfileToResponse(user));
});

/**
 * Update User Profile
 *
 * Updates the authenticated user's profile information.
 * Password cannot be updated through this endpoint.
 *
 * @async
 * @function updateProfile
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} [req.body.firstName] - Updated first name
 * @param {string} [req.body.lastName] - Updated last name
 * @param {Object} req.user - User object (attached by authenticate middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated user data
 *
 * @throws {404} If user not found
 * @throws {400} If trying to update restricted fields
 * @throws {500} If update fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Profile updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  // Get user from database
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Explicitly prevent updating restricted fields (defense in depth)
  const restrictedFields = ['email', 'password', 'role', 'refreshTokens', 'isActive', '_id'];
  for (const field of restrictedFields) {
    if (field in req.body) {
      delete req.body[field];
    }
  }

  // Track updated fields for response
  const updatedFields = [];

  // Update only allowed fields
  if (firstName !== undefined) {
    user.firstName = firstName;
    updatedFields.push('firstName');
  }
  if (lastName !== undefined) {
    user.lastName = lastName;
    updatedFields.push('lastName');
  }

  // Save updated user
  await user.save();

  // Map to DTO and send success response
  const response = mapProfileUpdateToResponse(user, updatedFields);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: response,
  });
});

/**
 * Change Password
 *
 * Changes the authenticated user's password after verifying current password.
 *
 * @async
 * @function changePassword
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.currentPassword - Current password
 * @param {string} req.body.newPassword - New password
 * @param {Object} req.user - User object (attached by authenticate middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming password change
 *
 * @throws {401} If current password is incorrect
 * @throws {404} If user not found
 * @throws {500} If password change fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Password changed successfully"
 * }
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user from database with password field
  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  // Invalidate all refresh tokens for security
  await user.clearAllRefreshTokens();

  // Map to DTO and send success response
  res.status(200).json(mapPasswordChangeToResponse(true));
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
};
