/**
 * Authentication DTO Module
 *
 * This module provides Data Transfer Objects (DTOs) for authentication-related
 * API responses. It handles authentication tokens, login/register responses,
 * and ensures consistent auth data structure.
 *
 * @module dtos/auth
 */

const { UserResponseDTO } = require('./user.dto');

/**
 * JWT Tokens DTO
 *
 * Standardized token pair object containing both access and refresh tokens.
 * Used in login, register, and token refresh responses.
 *
 * @class TokensDTO
 *
 * @property {string} accessToken - Short-lived JWT access token (15 minutes)
 * @property {string} refreshToken - Long-lived JWT refresh token (7 days)
 * @property {string} tokenType - Token type (always 'Bearer')
 * @property {number} expiresIn - Access token expiry in seconds
 *
 * @example
 * const tokens = new TokensDTO(accessToken, refreshToken);
 * // Returns: { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900 }
 */
class TokensDTO {
  /**
   * Creates a tokens DTO
   *
   * @constructor
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {number} [expiresIn=900] - Token expiry in seconds (default: 15 minutes)
   */
  constructor(accessToken, refreshToken, expiresIn = 900) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn; // Access token expiry in seconds
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenType: this.tokenType,
      expiresIn: this.expiresIn,
    };
  }
}

/**
 * Registration Response DTO
 *
 * Complete response after successful user registration.
 * Includes new user details and authentication tokens.
 *
 * @class RegisterResponseDTO
 *
 * @property {UserResponseDTO} user - Newly registered user data
 * @property {TokensDTO} tokens - Authentication tokens
 * @property {string} message - Success message
 *
 * @example
 * const response = new RegisterResponseDTO(user, accessToken, refreshToken);
 * // Returns complete registration response with user and tokens
 */
class RegisterResponseDTO {
  /**
   * Creates a registration response DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {string} [message='Registration successful'] - Success message
   */
  constructor(user, accessToken, refreshToken, message = 'Registration successful') {
    this.message = message;
    this.user = new UserResponseDTO(user);
    this.tokens = new TokensDTO(accessToken, refreshToken);
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      user: this.user.toJSON(),
      tokens: this.tokens.toJSON(),
    };
  }
}

/**
 * Login Response DTO
 *
 * Complete response after successful user login.
 * Includes authenticated user details and new authentication tokens.
 *
 * @class LoginResponseDTO
 *
 * @property {UserResponseDTO} user - Authenticated user data
 * @property {TokensDTO} tokens - Authentication tokens
 * @property {string} message - Success message
 * @property {Date|string} loginTimestamp - Login timestamp
 *
 * @example
 * const response = new LoginResponseDTO(user, accessToken, refreshToken);
 * // Returns complete login response with user and tokens
 */
class LoginResponseDTO {
  /**
   * Creates a login response DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {string} [message='Login successful'] - Success message
   */
  constructor(user, accessToken, refreshToken, message = 'Login successful') {
    this.message = message;
    this.user = new UserResponseDTO(user);
    this.tokens = new TokensDTO(accessToken, refreshToken);
    this.loginTimestamp = new Date().toISOString();
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      user: this.user.toJSON(),
      tokens: this.tokens.toJSON(),
      loginTimestamp: this.loginTimestamp,
    };
  }
}

/**
 * Token Refresh Response DTO
 *
 * Response after successfully refreshing authentication tokens.
 * Returns new token pair.
 *
 * @class RefreshTokenResponseDTO
 *
 * @property {TokensDTO} tokens - New authentication tokens
 * @property {string} message - Success message
 *
 * @example
 * const response = new RefreshTokenResponseDTO(accessToken, refreshToken);
 * // Returns new token pair
 */
class RefreshTokenResponseDTO {
  /**
   * Creates a token refresh response DTO
   *
   * @constructor
   * @param {string} accessToken - New JWT access token
   * @param {string} refreshToken - New JWT refresh token
   * @param {string} [message='Token refreshed successfully'] - Success message
   */
  constructor(accessToken, refreshToken, message = 'Token refreshed successfully') {
    this.message = message;
    this.tokens = new TokensDTO(accessToken, refreshToken);
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      tokens: this.tokens.toJSON(),
    };
  }
}

/**
 * Logout Response DTO
 *
 * Simple response after successful logout.
 *
 * @class LogoutResponseDTO
 *
 * @property {string} message - Success message
 * @property {Date|string} logoutTimestamp - Logout timestamp
 *
 * @example
 * const response = new LogoutResponseDTO();
 * // Returns: { message: 'Logged out successfully', logoutTimestamp: '...' }
 */
class LogoutResponseDTO {
  /**
   * Creates a logout response DTO
   *
   * @constructor
   * @param {string} [message='Logged out successfully'] - Success message
   */
  constructor(message = 'Logged out successfully') {
    this.message = message;
    this.logoutTimestamp = new Date().toISOString();
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      logoutTimestamp: this.logoutTimestamp,
    };
  }
}

/**
 * Password Change Response DTO
 *
 * Response after successfully changing password.
 * Optionally includes information about session invalidation.
 *
 * @class PasswordChangeResponseDTO
 *
 * @property {string} message - Success message
 * @property {Date|string} changedAt - Password change timestamp
 * @property {boolean} sessionsInvalidated - Whether other sessions were logged out
 *
 * @example
 * const response = new PasswordChangeResponseDTO(true);
 * // Returns confirmation with session invalidation info
 */
class PasswordChangeResponseDTO {
  /**
   * Creates a password change response DTO
   *
   * @constructor
   * @param {boolean} [sessionsInvalidated=false] - Whether other sessions were logged out
   * @param {string} [message='Password changed successfully'] - Success message
   */
  constructor(sessionsInvalidated = false, message = 'Password changed successfully') {
    this.message = message;
    this.changedAt = new Date().toISOString();
    this.sessionsInvalidated = sessionsInvalidated;

    if (sessionsInvalidated) {
      this.additionalInfo = 'All other sessions have been logged out for security.';
    }
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const response = {
      message: this.message,
      changedAt: this.changedAt,
      sessionsInvalidated: this.sessionsInvalidated,
    };

    if (this.additionalInfo) {
      response.additionalInfo = this.additionalInfo;
    }

    return response;
  }
}

/**
 * Profile Response DTO
 *
 * Response when fetching user's own profile.
 * Includes comprehensive user information.
 *
 * @class ProfileResponseDTO
 *
 * @property {UserResponseDTO} user - User profile data
 *
 * @example
 * const response = new ProfileResponseDTO(user);
 * // Returns user profile data
 */
class ProfileResponseDTO {
  /**
   * Creates a profile response DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document
   */
  constructor(user) {
    this.user = new UserResponseDTO(user);
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      user: this.user.toJSON(),
    };
  }
}

/**
 * Biometric Setup Response DTO
 *
 * Response after successfully setting up biometric authentication.
 * Returns the biometric token and confirmation status.
 *
 * @class BiometricSetupResponseDTO
 *
 * @property {string} biometricToken - Secure biometric token for authentication
 * @property {boolean} biometricEnabled - Confirmation that biometric auth is enabled
 * @property {string} message - Success message
 *
 * @example
 * const response = new BiometricSetupResponseDTO(token, true);
 * // Returns biometric setup confirmation with token
 */
class BiometricSetupResponseDTO {
  /**
   * Creates a biometric setup response DTO
   *
   * @constructor
   * @param {string} biometricToken - Secure biometric token
   * @param {boolean} biometricEnabled - Whether biometric auth is enabled
   * @param {string} [message='Biometric authentication enabled successfully'] - Success message
   */
  constructor(biometricToken, biometricEnabled, message = 'Biometric authentication enabled successfully') {
    this.message = message;
    this.biometricToken = biometricToken;
    this.biometricEnabled = biometricEnabled;
    this.setupTimestamp = new Date().toISOString();
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      biometricToken: this.biometricToken,
      biometricEnabled: this.biometricEnabled,
      setupTimestamp: this.setupTimestamp,
    };
  }
}

/**
 * Biometric Login Response DTO
 *
 * Complete response after successful biometric login.
 * Includes authenticated user details and new authentication tokens.
 *
 * @class BiometricLoginResponseDTO
 *
 * @property {UserResponseDTO} user - Authenticated user data
 * @property {TokensDTO} tokens - Authentication tokens
 * @property {string} message - Success message
 * @property {Date|string} loginTimestamp - Login timestamp
 * @property {string} authMethod - Authentication method used
 *
 * @example
 * const response = new BiometricLoginResponseDTO(user, accessToken, refreshToken);
 * // Returns complete biometric login response
 */
class BiometricLoginResponseDTO {
  /**
   * Creates a biometric login response DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {string} [message='Biometric login successful'] - Success message
   */
  constructor(user, accessToken, refreshToken, message = 'Biometric login successful') {
    this.message = message;
    this.user = new UserResponseDTO(user);
    this.tokens = new TokensDTO(accessToken, refreshToken);
    this.loginTimestamp = new Date().toISOString();
    this.authMethod = 'biometric';
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      message: this.message,
      user: this.user.toJSON(),
      tokens: this.tokens.toJSON(),
      loginTimestamp: this.loginTimestamp,
      authMethod: this.authMethod,
    };
  }
}

module.exports = {
  TokensDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshTokenResponseDTO,
  LogoutResponseDTO,
  PasswordChangeResponseDTO,
  ProfileResponseDTO,
  BiometricSetupResponseDTO,
  BiometricLoginResponseDTO,
};
