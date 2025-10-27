/**
 * JWT Configuration Module
 *
 * This module centralizes all JWT-related configuration including
 * secrets, token expiration times, and issuer information.
 *
 * @module config/jwt
 */

/**
 * JWT Configuration Object
 *
 * Contains all configuration parameters for JSON Web Token generation
 * and validation throughout the application.
 *
 * @constant {Object} jwtConfig
 * @property {string} accessTokenSecret - Secret key for signing access tokens
 * @property {string} refreshTokenSecret - Secret key for signing refresh tokens
 * @property {string} accessTokenExpire - Expiration time for access tokens
 * @property {string} refreshTokenExpire - Expiration time for refresh tokens
 * @property {string} issuer - Token issuer identifier
 * @property {string} audience - Token audience identifier
 */
const jwtConfig = {
  // Secret key for access token (should be stored in environment variables)
  accessTokenSecret: process.env.JWT_SECRET,

  // Secret key for refresh token (should be different from access token secret)
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,

  // Access token expiration time (short-lived for security)
  // Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
  // Example: '15m' = 15 minutes
  accessTokenExpire: process.env.JWT_ACCESS_TOKEN_EXPIRE || '15m',

  // Refresh token expiration time (longer-lived)
  // Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
  // Example: '7d' = 7 days
  refreshTokenExpire: process.env.JWT_REFRESH_TOKEN_EXPIRE || '7d',

  // Issuer claim identifies the principal that issued the JWT
  issuer: 'task-master-api',

  // Audience claim identifies the recipients that the JWT is intended for
  audience: 'task-master-app',
};

/**
 * Validates that all required JWT configuration values are present
 *
 * @function validateJwtConfig
 * @throws {Error} If any required configuration value is missing
 */
const validateJwtConfig = () => {
  if (!jwtConfig.accessTokenSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  if (!jwtConfig.refreshTokenSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  // Warn if using default values in production
  if (process.env.NODE_ENV === 'production') {
    if (jwtConfig.accessTokenSecret.includes('change-this')) {
      console.warn('⚠️  WARNING: Using default JWT_SECRET in production!');
    }
    if (jwtConfig.refreshTokenSecret.includes('change-this')) {
      console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET in production!');
    }
  }
};

// Validate configuration on module load
validateJwtConfig();

module.exports = jwtConfig;
