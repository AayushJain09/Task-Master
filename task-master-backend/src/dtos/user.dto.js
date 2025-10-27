/**
 * User DTO Module
 *
 * This module provides Data Transfer Objects (DTOs) for user-related
 * API responses. It handles data transformation, field filtering, and
 * ensures consistent user data structure across the application.
 *
 * @module dtos/user
 */

/**
 * User Response DTO
 *
 * Standardized user object for API responses.
 * Transforms Mongoose user document to a clean, consistent format.
 * Excludes sensitive fields like password, refreshTokens.
 *
 * @class UserResponseDTO
 *
 * @property {string} id - User's unique identifier (mapped from _id)
 * @property {string} email - User's email address
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} fullName - User's full name (computed field)
 * @property {string} role - User's role (user, admin, moderator)
 * @property {boolean} isActive - Account active status
 * @property {boolean} isEmailVerified - Email verification status
 * @property {Date|string|null} lastLogin - Last login timestamp
 * @property {Date|string} createdAt - Account creation timestamp
 * @property {Date|string} updatedAt - Last update timestamp
 *
 * @example
 * const userDTO = new UserResponseDTO(userDocument);
 * // Returns clean user object without sensitive fields
 */
class UserResponseDTO {
  /**
   * Creates a user response DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document or plain object
   */
  constructor(user) {
    // Convert _id to id for cleaner API
    this.id = user._id ? user._id.toString() : user.id;

    // Basic user information
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;

    // Computed full name (handle virtual field or compute manually)
    this.fullName = user.fullName || `${user.firstName} ${user.lastName}`;

    // Role and status information
    this.role = user.role;
    this.isActive = user.isActive;
    this.isEmailVerified = user.isEmailVerified;

    // Timestamps
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * User Summary DTO
 *
 * Lightweight user object with minimal information.
 * Used in lists, search results, or when full user details aren't needed.
 *
 * @class UserSummaryDTO
 *
 * @property {string} id - User's unique identifier
 * @property {string} email - User's email address
 * @property {string} fullName - User's full name
 * @property {string} role - User's role
 * @property {boolean} isActive - Account active status
 *
 * @example
 * const userSummary = new UserSummaryDTO(userDocument);
 * // Returns minimal user info for lists
 */
class UserSummaryDTO {
  /**
   * Creates a user summary DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document or plain object
   */
  constructor(user) {
    this.id = user._id ? user._id.toString() : user.id;
    this.email = user.email;
    this.fullName = user.fullName || `${user.firstName} ${user.lastName}`;
    this.role = user.role;
    this.isActive = user.isActive;
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
    };
  }
}

/**
 * User List Item DTO
 *
 * User object optimized for list views.
 * Contains more information than summary but less than full details.
 *
 * @class UserListItemDTO
 *
 * @property {string} id - User's unique identifier
 * @property {string} email - User's email address
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} fullName - User's full name
 * @property {string} role - User's role
 * @property {boolean} isActive - Account active status
 * @property {boolean} isEmailVerified - Email verification status
 * @property {Date|string|null} lastLogin - Last login timestamp
 * @property {Date|string} createdAt - Account creation timestamp
 *
 * @example
 * const users = userDocuments.map(user => new UserListItemDTO(user));
 */
class UserListItemDTO {
  /**
   * Creates a user list item DTO
   *
   * @constructor
   * @param {Object} user - Mongoose user document or plain object
   */
  constructor(user) {
    this.id = user._id ? user._id.toString() : user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = user.fullName || `${user.firstName} ${user.lastName}`;
    this.role = user.role;
    this.isActive = user.isActive;
    this.isEmailVerified = user.isEmailVerified;
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
    };
  }
}

/**
 * User Statistics DTO
 *
 * Aggregated statistics about users in the system.
 * Used for admin dashboard and analytics.
 *
 * @class UserStatsDTO
 *
 * @property {number} totalUsers - Total number of users
 * @property {number} activeUsers - Number of active users
 * @property {number} inactiveUsers - Number of inactive users
 * @property {number} verifiedUsers - Number of email-verified users
 * @property {number} unverifiedUsers - Number of unverified users
 * @property {Object} usersByRole - Count of users by role
 * @property {number} usersByRole.user - Number of regular users
 * @property {number} usersByRole.admin - Number of admins
 * @property {number} usersByRole.moderator - Number of moderators
 * @property {Array<UserSummaryDTO>} recentUsers - Recently registered users
 *
 * @example
 * const stats = new UserStatsDTO({
 *   totalUsers: 100,
 *   activeUsers: 85,
 *   usersByRole: { user: 90, admin: 5, moderator: 5 },
 *   recentUsers: [...]
 * });
 */
class UserStatsDTO {
  /**
   * Creates a user statistics DTO
   *
   * @constructor
   * @param {Object} stats - Statistics object
   * @param {number} stats.totalUsers - Total users count
   * @param {number} stats.activeUsers - Active users count
   * @param {number} stats.inactiveUsers - Inactive users count
   * @param {number} [stats.verifiedUsers] - Verified users count
   * @param {number} [stats.unverifiedUsers] - Unverified users count
   * @param {Object} stats.usersByRole - Users count by role
   * @param {Array} [stats.recentUsers] - Recent users array
   */
  constructor(stats) {
    this.totalUsers = stats.totalUsers || 0;
    this.activeUsers = stats.activeUsers || 0;
    this.inactiveUsers = stats.inactiveUsers || 0;
    this.verifiedUsers = stats.verifiedUsers || 0;
    this.unverifiedUsers = stats.unverifiedUsers || 0;

    this.usersByRole = {
      user: stats.usersByRole?.user || 0,
      admin: stats.usersByRole?.admin || 0,
      moderator: stats.usersByRole?.moderator || 0,
    };

    // Transform recent users to summary DTOs
    this.recentUsers = stats.recentUsers
      ? stats.recentUsers.map(user => new UserSummaryDTO(user))
      : [];
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      totalUsers: this.totalUsers,
      activeUsers: this.activeUsers,
      inactiveUsers: this.inactiveUsers,
      verifiedUsers: this.verifiedUsers,
      unverifiedUsers: this.unverifiedUsers,
      usersByRole: this.usersByRole,
      recentUsers: this.recentUsers.map(user => user.toJSON()),
    };
  }
}

/**
 * Profile Update Response DTO
 *
 * Response after updating user profile.
 * Includes updated user data and success message.
 *
 * @class ProfileUpdateResponseDTO
 *
 * @property {UserResponseDTO} user - Updated user data
 * @property {Array<string>} updatedFields - List of fields that were updated
 *
 * @example
 * const response = new ProfileUpdateResponseDTO(user, ['firstName', 'lastName']);
 */
class ProfileUpdateResponseDTO {
  /**
   * Creates a profile update response DTO
   *
   * @constructor
   * @param {Object} user - Updated user document
   * @param {Array<string>} [updatedFields] - Fields that were updated
   */
  constructor(user, updatedFields = []) {
    this.user = new UserResponseDTO(user);

    if (updatedFields.length > 0) {
      this.updatedFields = updatedFields;
    }
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const response = {
      user: this.user.toJSON(),
    };

    if (this.updatedFields) {
      response.updatedFields = this.updatedFields;
    }

    return response;
  }
}

module.exports = {
  UserResponseDTO,
  UserSummaryDTO,
  UserListItemDTO,
  UserStatsDTO,
  ProfileUpdateResponseDTO,
};
