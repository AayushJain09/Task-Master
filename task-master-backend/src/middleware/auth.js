/**
 * Authentication Middleware
 *
 * This module provides middleware functions for JWT-based authentication
 * and role-based authorization in Express routes.
 *
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

/**
 * Authentication Middleware
 *
 * Verifies JWT access token and attaches user information to request object.
 * Protects routes from unauthorized access.
 *
 * Usage:
 * @example
 * router.get('/protected', authenticate, controller.method);
 *
 * @async
 * @function authenticate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @throws {401} If no token is provided
 * @throws {401} If token is invalid or expired
 * @throws {404} If user associated with token is not found
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token with secret key
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    // Find user associated with the token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    // Attach user information to request object for use in subsequent middleware/controllers
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Also attach the full user document if needed
    req.userDoc = user;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }

    // Handle other errors
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Role Authorization Middleware Factory
 *
 * Creates middleware that restricts access based on user roles.
 * Must be used after authenticate middleware.
 *
 * @function authorize
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 *
 * @example
 * // Single role
 * router.delete('/users/:id', authenticate, authorize('admin'), controller.deleteUser);
 *
 * @example
 * // Multiple roles
 * router.put('/posts/:id', authenticate, authorize('admin', 'moderator'), controller.updatePost);
 */
const authorize = (...allowedRoles) => {
  /**
   * Authorization Middleware
   *
   * @async
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void}
   *
   * @throws {401} If user is not authenticated
   * @throws {403} If user role is not authorized
   */
  return async (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed.',
      });
    }
  };
};

/**
 * Optional Authentication Middleware
 *
 * Similar to authenticate, but doesn't fail if no token is provided.
 * Useful for routes that work differently for authenticated vs unauthenticated users.
 *
 * @async
 * @function optionalAuth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @example
 * // Public route that shows extra info for authenticated users
 * router.get('/posts', optionalAuth, controller.getPosts);
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // If no token, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Extract the token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    // Find user
    const user = await User.findById(decoded.userId);

    // Only attach user if found and active
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      req.userDoc = user;
    }

    next();
  } catch (error) {
    // On error, continue without authentication (don't fail the request)
    next();
  }
};

/**
 * Verify Refresh Token Middleware
 *
 * Verifies refresh token and checks if it's in the user's valid token list.
 * Used specifically for token refresh endpoints.
 *
 * @async
 * @function verifyRefreshToken
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @throws {401} If no refresh token is provided
 * @throws {401} If refresh token is invalid or expired
 * @throws {401} If refresh token is not in user's valid token list
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    // Extract refresh token from request body
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshTokenSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    // Check token type
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.',
      });
    }

    // Find user and include refreshTokens field
    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    // Check if refresh token is in user's valid token list
    if (!user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    // Attach user and refresh token to request
    req.user = user;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired.',
      });
    }

    // Handle other errors
    console.error('Refresh token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  verifyRefreshToken,
};
