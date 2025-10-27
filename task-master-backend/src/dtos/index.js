/**
 * DTOs Index Module
 *
 * Central export point for all Data Transfer Objects (DTOs) and mappers.
 * Import from this file to access any DTO or mapper function.
 *
 * @module dtos
 *
 * @example
 * // Import specific DTOs
 * const { UserResponseDTO, LoginResponseDTO } = require('./dtos');
 *
 * @example
 * // Import specific mappers
 * const { mapLoginToResponse, mapUsersListToResponse } = require('./dtos');
 *
 * @example
 * // Import all mappers
 * const mappers = require('./dtos/mappers');
 */

// Export all common DTOs
const {
  SuccessResponseDTO,
  ErrorResponseDTO,
  PaginationDTO,
  PaginatedListDTO,
} = require('./common.dto');

// Export all user DTOs
const {
  UserResponseDTO,
  UserSummaryDTO,
  UserListItemDTO,
  UserStatsDTO,
  ProfileUpdateResponseDTO,
} = require('./user.dto');

// Export all auth DTOs
const {
  TokensDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshTokenResponseDTO,
  LogoutResponseDTO,
  PasswordChangeResponseDTO,
  ProfileResponseDTO,
} = require('./auth.dto');

// Export all mappers
const mappers = require('./mappers');

module.exports = {
  // Common DTOs
  SuccessResponseDTO,
  ErrorResponseDTO,
  PaginationDTO,
  PaginatedListDTO,

  // User DTOs
  UserResponseDTO,
  UserSummaryDTO,
  UserListItemDTO,
  UserStatsDTO,
  ProfileUpdateResponseDTO,

  // Auth DTOs
  TokensDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshTokenResponseDTO,
  LogoutResponseDTO,
  PasswordChangeResponseDTO,
  ProfileResponseDTO,

  // Mappers (also export individual mapper functions for convenience)
  ...mappers,

  // Export mappers object for namespaced usage
  mappers,
};
