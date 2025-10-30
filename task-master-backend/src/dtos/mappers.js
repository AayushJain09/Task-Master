/**
 * DTO Mappers Module
 *
 * This module provides utility functions for mapping data to DTOs.
 * It simplifies controller logic by providing reusable transformation functions.
 *
 * Benefits:
 * - Centralized data transformation logic
 * - Type safety and consistency
 * - Easier testing and maintenance
 * - Cleaner controller code
 *
 * @module dtos/mappers
 */

const {
  SuccessResponseDTO,
  ErrorResponseDTO,
  PaginatedListDTO,
} = require('./common.dto');

const {
  UserResponseDTO,
  UserSummaryDTO,
  UserListItemDTO,
  UserStatsDTO,
  ProfileUpdateResponseDTO,
} = require('./user.dto');

const {
  TokensDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshTokenResponseDTO,
  LogoutResponseDTO,
  PasswordChangeResponseDTO,
  ProfileResponseDTO,
  BiometricSetupResponseDTO,
  BiometricLoginResponseDTO,
} = require('./auth.dto');

/**
 * ========================================
 * COMMON RESPONSE MAPPERS
 * ========================================
 */

/**
 * Create Success Response
 *
 * Creates a standardized success response with optional data and metadata.
 *
 * @function createSuccessResponse
 * @param {string} [message] - Success message
 * @param {Object} [data] - Response data
 * @param {Object} [meta] - Additional metadata
 * @returns {Object} Standardized success response
 *
 * @example
 * return createSuccessResponse('User created', { user: {...} });
 */
const createSuccessResponse = (message, data = null, meta = null) => {
  return new SuccessResponseDTO(message, data, meta).toJSON();
};

/**
 * Create Error Response
 *
 * Creates a standardized error response with optional detailed errors.
 *
 * @function createErrorResponse
 * @param {string} message - Error message
 * @param {Array<Object>} [errors] - Detailed error information
 * @param {string} [stack] - Error stack trace
 * @returns {Object} Standardized error response
 *
 * @example
 * return createErrorResponse('Validation failed', [{ field: 'email', message: '...' }]);
 */
const createErrorResponse = (message, errors = null, stack = null) => {
  return new ErrorResponseDTO(message, errors, stack).toJSON();
};

/**
 * Create Paginated Response
 *
 * Creates a paginated response with items and pagination metadata.
 *
 * @function createPaginatedResponse
 * @param {Array} items - Array of items (will be wrapped in success response)
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total items count
 * @returns {Object} Paginated response wrapped in success response
 *
 * @example
 * return createPaginatedResponse(users, 1, 10, 95);
 */
const createPaginatedResponse = (items, page, limit, totalItems) => {
  const paginatedData = new PaginatedListDTO(items, page, limit, totalItems).toJSON();
  return createSuccessResponse(null, paginatedData);
};

/**
 * ========================================
 * USER RESPONSE MAPPERS
 * ========================================
 */

/**
 * Map User to Response DTO
 *
 * Transforms a user document to a clean response DTO.
 *
 * @function mapUserToResponse
 * @param {Object} user - Mongoose user document
 * @returns {Object} User response DTO
 *
 * @example
 * const userResponse = mapUserToResponse(user);
 */
const mapUserToResponse = (user) => {
  return new UserResponseDTO(user).toJSON();
};

/**
 * Map User to Summary DTO
 *
 * Transforms a user document to a lightweight summary DTO.
 *
 * @function mapUserToSummary
 * @param {Object} user - Mongoose user document
 * @returns {Object} User summary DTO
 *
 * @example
 * const userSummary = mapUserToSummary(user);
 */
const mapUserToSummary = (user) => {
  return new UserSummaryDTO(user).toJSON();
};

/**
 * Map Users to List DTOs
 *
 * Transforms an array of user documents to list item DTOs.
 *
 * @function mapUsersToList
 * @param {Array<Object>} users - Array of user documents
 * @returns {Array<Object>} Array of user list item DTOs
 *
 * @example
 * const usersList = mapUsersToList(users);
 */
const mapUsersToList = (users) => {
  return users.map(user => new UserListItemDTO(user).toJSON());
};

/**
 * Map User Stats to DTO
 *
 * Transforms user statistics data to DTO.
 *
 * @function mapUserStatsToDTO
 * @param {Object} stats - User statistics object
 * @returns {Object} User statistics DTO
 *
 * @example
 * const statsDTO = mapUserStatsToDTO(statsData);
 */
const mapUserStatsToDTO = (stats) => {
  return new UserStatsDTO(stats).toJSON();
};

/**
 * Map Profile Update to Response
 *
 * Transforms updated user profile to response DTO.
 *
 * @function mapProfileUpdateToResponse
 * @param {Object} user - Updated user document
 * @param {Array<string>} [updatedFields] - Fields that were updated
 * @returns {Object} Profile update response DTO
 *
 * @example
 * const response = mapProfileUpdateToResponse(user, ['firstName', 'lastName']);
 */
const mapProfileUpdateToResponse = (user, updatedFields = []) => {
  return new ProfileUpdateResponseDTO(user, updatedFields).toJSON();
};

/**
 * ========================================
 * AUTHENTICATION RESPONSE MAPPERS
 * ========================================
 */

/**
 * Map Registration to Response
 *
 * Creates a complete registration response with user and tokens.
 *
 * @function mapRegistrationToResponse
 * @param {Object} user - Newly registered user document
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} Registration response wrapped in success response
 *
 * @example
 * const response = mapRegistrationToResponse(user, accessToken, refreshToken);
 */
const mapRegistrationToResponse = (user, accessToken, refreshToken) => {
  const dto = new RegisterResponseDTO(user, accessToken, refreshToken).toJSON();
  return createSuccessResponse(dto.message, {
    user: dto.user,
    tokens: dto.tokens,
  });
};

/**
 * Map Login to Response
 *
 * Creates a complete login response with user and tokens.
 *
 * @function mapLoginToResponse
 * @param {Object} user - Authenticated user document
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} Login response wrapped in success response
 *
 * @example
 * const response = mapLoginToResponse(user, accessToken, refreshToken);
 */
const mapLoginToResponse = (user, accessToken, refreshToken) => {
  const dto = new LoginResponseDTO(user, accessToken, refreshToken).toJSON();
  return createSuccessResponse(dto.message, {
    user: dto.user,
    tokens: dto.tokens,
    loginTimestamp: dto.loginTimestamp,
  });
};

/**
 * Map Token Refresh to Response
 *
 * Creates a token refresh response with new tokens.
 *
 * @function mapTokenRefreshToResponse
 * @param {string} accessToken - New JWT access token
 * @param {string} refreshToken - New JWT refresh token
 * @returns {Object} Token refresh response wrapped in success response
 *
 * @example
 * const response = mapTokenRefreshToResponse(accessToken, refreshToken);
 */
const mapTokenRefreshToResponse = (accessToken, refreshToken) => {
  const dto = new RefreshTokenResponseDTO(accessToken, refreshToken).toJSON();
  return createSuccessResponse(dto.message, {
    tokens: dto.tokens,
  });
};

/**
 * Map Logout to Response
 *
 * Creates a logout response.
 *
 * @function mapLogoutToResponse
 * @param {boolean} [allDevices=false] - Whether all devices were logged out
 * @returns {Object} Logout response wrapped in success response
 *
 * @example
 * const response = mapLogoutToResponse();
 */
const mapLogoutToResponse = (allDevices = false) => {
  const message = allDevices
    ? 'Logged out from all devices successfully'
    : 'Logged out successfully';
  const dto = new LogoutResponseDTO(message).toJSON();
  return createSuccessResponse(dto.message, {
    logoutTimestamp: dto.logoutTimestamp,
  });
};

/**
 * Map Password Change to Response
 *
 * Creates a password change response.
 *
 * @function mapPasswordChangeToResponse
 * @param {boolean} [sessionsInvalidated=false] - Whether other sessions were logged out
 * @returns {Object} Password change response wrapped in success response
 *
 * @example
 * const response = mapPasswordChangeToResponse(true);
 */
const mapPasswordChangeToResponse = (sessionsInvalidated = false) => {
  const dto = new PasswordChangeResponseDTO(sessionsInvalidated).toJSON();
  return createSuccessResponse(dto.message, {
    changedAt: dto.changedAt,
    sessionsInvalidated: dto.sessionsInvalidated,
    ...(dto.additionalInfo && { additionalInfo: dto.additionalInfo }),
  });
};

/**
 * Map Profile to Response
 *
 * Creates a profile response with user data.
 *
 * @function mapProfileToResponse
 * @param {Object} user - User document
 * @returns {Object} Profile response wrapped in success response
 *
 * @example
 * const response = mapProfileToResponse(user);
 */
const mapProfileToResponse = (user) => {
  const dto = new ProfileResponseDTO(user).toJSON();
  return createSuccessResponse(null, dto);
};

/**
 * Map Biometric Setup to Response
 *
 * Creates a biometric setup response with token.
 *
 * @function mapBiometricSetupToResponse
 * @param {string} biometricToken - Generated biometric token
 * @param {boolean} biometricEnabled - Whether biometric auth is enabled
 * @returns {Object} Biometric setup response wrapped in success response
 *
 * @example
 * const response = mapBiometricSetupToResponse(token, true);
 */
const mapBiometricSetupToResponse = (biometricToken, biometricEnabled) => {
  const dto = new BiometricSetupResponseDTO(biometricToken, biometricEnabled).toJSON();
  return createSuccessResponse(dto.message, {
    biometricToken: dto.biometricToken,
    biometricEnabled: dto.biometricEnabled,
    setupTimestamp: dto.setupTimestamp,
  });
};

/**
 * Map Biometric Login to Response
 *
 * Creates a biometric login response with user data and tokens.
 *
 * @function mapBiometricLoginToResponse
 * @param {Object} user - User document
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} Biometric login response wrapped in success response
 *
 * @example
 * const response = mapBiometricLoginToResponse(user, accessToken, refreshToken);
 */
const mapBiometricLoginToResponse = (user, accessToken, refreshToken) => {
  const dto = new BiometricLoginResponseDTO(user, accessToken, refreshToken).toJSON();
  return createSuccessResponse(dto.message, {
    user: dto.user,
    tokens: dto.tokens,
    loginTimestamp: dto.loginTimestamp,
    authMethod: dto.authMethod,
  });
};

/**
 * ========================================
 * USER MANAGEMENT RESPONSE MAPPERS
 * ========================================
 */

/**
 * Map Users List to Response
 *
 * Creates a paginated response for users list.
 *
 * @function mapUsersListToResponse
 * @param {Array<Object>} users - Array of user documents
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total users count
 * @returns {Object} Paginated users list response
 *
 * @example
 * const response = mapUsersListToResponse(users, 1, 10, 95);
 */
const mapUsersListToResponse = (users, page, limit, totalItems) => {
  const userDTOs = mapUsersToList(users);
  return createPaginatedResponse(userDTOs, page, limit, totalItems);
};

/**
 * Map User Details to Response
 *
 * Creates a response with single user details.
 *
 * @function mapUserDetailsToResponse
 * @param {Object} user - User document
 * @returns {Object} User details response
 *
 * @example
 * const response = mapUserDetailsToResponse(user);
 */
const mapUserDetailsToResponse = (user) => {
  const userDTO = mapUserToResponse(user);
  return createSuccessResponse(null, { user: userDTO });
};

/**
 * Map User Stats to Response
 *
 * Creates a response with user statistics.
 *
 * @function mapUserStatsToResponse
 * @param {Object} stats - User statistics object
 * @returns {Object} User statistics response
 *
 * @example
 * const response = mapUserStatsToResponse(statsData);
 */
const mapUserStatsToResponse = (stats) => {
  const statsDTO = mapUserStatsToDTO(stats);
  return createSuccessResponse(null, statsDTO);
};

/**
 * Map User Update to Response
 *
 * Creates a response after updating user (status, role, etc.).
 *
 * @function mapUserUpdateToResponse
 * @param {Object} user - Updated user document
 * @param {string} message - Success message
 * @returns {Object} User update response
 *
 * @example
 * const response = mapUserUpdateToResponse(user, 'User status updated');
 */
const mapUserUpdateToResponse = (user, message) => {
  const userDTO = mapUserToResponse(user);
  return createSuccessResponse(message, { user: userDTO });
};

/**
 * Map User Deletion to Response
 *
 * Creates a response after deleting user.
 *
 * @function mapUserDeletionToResponse
 * @param {string} [message='User deleted successfully'] - Success message
 * @returns {Object} User deletion response
 *
 * @example
 * const response = mapUserDeletionToResponse();
 */
const mapUserDeletionToResponse = (message = 'User deleted successfully') => {
  return createSuccessResponse(message);
};

module.exports = {
  // Common mappers
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,

  // User mappers
  mapUserToResponse,
  mapUserToSummary,
  mapUsersToList,
  mapUserStatsToDTO,
  mapProfileUpdateToResponse,

  // Auth mappers
  mapRegistrationToResponse,
  mapLoginToResponse,
  mapTokenRefreshToResponse,
  mapLogoutToResponse,
  mapPasswordChangeToResponse,
  mapProfileToResponse,
  mapBiometricSetupToResponse,
  mapBiometricLoginToResponse,

  // User management mappers
  mapUsersListToResponse,
  mapUserDetailsToResponse,
  mapUserStatsToResponse,
  mapUserUpdateToResponse,
  mapUserDeletionToResponse,
};
