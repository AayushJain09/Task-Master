/**
 * User Model
 *
 * This module defines the User schema and model for MongoDB using Mongoose.
 * It includes user authentication functionality, password hashing, and token management.
 *
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * User Schema Definition
 *
 * Defines the structure and validation rules for user documents in MongoDB.
 *
 * @typedef {Object} UserSchema
 * @property {string} email - User's email address (unique, required)
 * @property {string} password - User's hashed password (required)
 * @property {string} firstName - User's first name (required)
 * @property {string} lastName - User's last name (required)
 * @property {string} role - User's role in the system (default: 'user')
 * @property {boolean} isEmailVerified - Email verification status (default: false)
 * @property {string[]} refreshTokens - Array of valid refresh tokens
 * @property {Date} lastLogin - Timestamp of last login
 * @property {boolean} isActive - Account active status (default: true)
 * @property {Date} createdAt - Account creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */
const userSchema = new mongoose.Schema(
  {
    // Email address - used as unique identifier for login
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true, // Index for faster queries
    },

    // Password - stored as bcrypt hash
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in query results by default
    },

    // First name of the user
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    // Last name of the user
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    // User role for authorization purposes
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'moderator'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
    },

    // Email verification status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Store active refresh tokens (for token invalidation on logout)
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // Don't include in query results by default
    },

    // Last login timestamp for security tracking
    lastLogin: {
      type: Date,
      default: null,
    },

    // Account active status (for soft delete)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Biometric authentication settings
    biometricEnabled: {
      type: Boolean,
      default: false,
    },

    // Biometric authentication token (hashed)
    biometricToken: {
      type: String,
      default: null,
      select: false, // Don't include in query results by default
    },
  },
  {
    // Enable automatic timestamps
    timestamps: true,

    // Transform output when converting to JSON
    toJSON: {
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.biometricToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save Middleware
 *
 * Automatically hashes the password before saving to database
 * Only runs when password is modified or created
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 10 rounds (balance between security and performance)
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare Password
 *
 * Compares a provided password with the hashed password in database
 *
 * @async
 * @method comparePassword
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance Method: Generate Access Token
 *
 * Generates a short-lived JWT access token for authentication
 *
 * @method generateAccessToken
 * @returns {string} JWT access token
 */
userSchema.methods.generateAccessToken = function () {
  // Payload contains user identification and role information
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
  };

  // Sign token with secret and set expiration
  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpire,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
};

/**
 * Instance Method: Generate Refresh Token
 *
 * Generates a long-lived JWT refresh token for obtaining new access tokens
 *
 * @method generateRefreshToken
 * @returns {string} JWT refresh token
 */
userSchema.methods.generateRefreshToken = function () {
  // Payload for refresh token (minimal information)
  const payload = {
    userId: this._id,
    type: 'refresh',
  };

  // Sign token with different secret and longer expiration
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpire,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
};

/**
 * Instance Method: Add Refresh Token
 *
 * Adds a refresh token to the user's valid token list
 * Limits the number of active refresh tokens per user
 *
 * @async
 * @method addRefreshToken
 * @param {string} token - Refresh token to add
 * @returns {Promise<void>}
 */
userSchema.methods.addRefreshToken = async function (token) {
  // Limit to 5 active refresh tokens per user
  // This allows multiple devices but prevents token accumulation
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }

  this.refreshTokens.push(token);
  await this.save();
};

/**
 * Instance Method: Remove Refresh Token
 *
 * Removes a refresh token from the user's valid token list (logout)
 *
 * @async
 * @method removeRefreshToken
 * @param {string} token - Refresh token to remove
 * @returns {Promise<void>}
 */
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
  await this.save();
};

/**
 * Instance Method: Clear All Refresh Tokens
 *
 * Removes all refresh tokens (logout from all devices)
 *
 * @async
 * @method clearAllRefreshTokens
 * @returns {Promise<void>}
 */
userSchema.methods.clearAllRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

/**
 * Instance Method: Generate Biometric Token
 *
 * Generates a secure token for biometric authentication
 *
 * @method generateBiometricToken
 * @returns {string} JWT biometric token
 */
userSchema.methods.generateBiometricToken = function () {
  // Payload for biometric token
  const payload = {
    userId: this._id,
    email: this.email,
    type: 'biometric',
  };

  // Sign token with refresh token secret (same security level)
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: '30d', // Biometric tokens last 30 days
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
};

/**
 * Instance Method: Set Biometric Token
 *
 * Hashes and stores a biometric token for the user
 *
 * @async
 * @method setBiometricToken
 * @param {string} token - Plain biometric token to hash and store
 * @returns {Promise<void>}
 */
userSchema.methods.setBiometricToken = async function (token) {
  const salt = await bcrypt.genSalt(10);
  this.biometricToken = await bcrypt.hash(token, salt);
  this.biometricEnabled = true;
  await this.save();
};

/**
 * Instance Method: Compare Biometric Token
 *
 * Compares a provided biometric token with the hashed token in database
 *
 * @async
 * @method compareBiometricToken
 * @param {string} candidateToken - Plain text biometric token to compare
 * @returns {Promise<boolean>} True if tokens match, false otherwise
 */
userSchema.methods.compareBiometricToken = async function (candidateToken) {
  if (!this.biometricToken || !this.biometricEnabled) {
    return false;
  }
  
  try {
    return await bcrypt.compare(candidateToken, this.biometricToken);
  } catch (error) {
    throw new Error('Biometric token comparison failed');
  }
};

/**
 * Instance Method: Disable Biometric Authentication
 *
 * Disables biometric authentication and removes stored token
 *
 * @async
 * @method disableBiometricAuth
 * @returns {Promise<void>}
 */
userSchema.methods.disableBiometricAuth = async function () {
  this.biometricEnabled = false;
  this.biometricToken = null;
  await this.save();
};

/**
 * Static Method: Find By Credentials
 *
 * Finds a user by email and validates password
 * Used for login authentication
 *
 * @async
 * @static
 * @method findByCredentials
 * @param {string} email - User's email address
 * @param {string} password - User's plain text password
 * @returns {Promise<Object>} User document if credentials are valid
 * @throws {Error} If credentials are invalid
 */
userSchema.statics.findByCredentials = async function (email, password) {
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email (including password and refreshTokens fields)
  const user = await this.findOne({ email: normalizedEmail, isActive: true }).select('+password +refreshTokens');

  if (!user) {
    const error = new Error('Invalid login credentials');
    error.name = 'InvalidCredentialsError';
    throw error;
  }

  // Compare provided password with stored hash
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    const error = new Error('Invalid login credentials');
    error.name = 'InvalidCredentialsError';
    throw error;
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  return user;
};

/**
 * Virtual Property: Full Name
 *
 * Combines first name and last name
 *
 * @virtual
 * @returns {string} User's full name
 */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

/**
 * User Model
 *
 * Mongoose model for user documents
 *
 * @type {mongoose.Model}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
