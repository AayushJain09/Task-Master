/**
 * User Management Controller
 *
 * This module handles user management operations including
 * fetching all users, user details, and user administration.
 *
 * @module controllers/userController
 */

const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const {
  mapUsersListToResponse,
  mapUserDetailsToResponse,
  mapUserUpdateToResponse,
  mapUserDeletionToResponse,
  mapUserStatsToResponse,
} = require('../dtos');

/**
 * Get Assignable Users
 *
 * Fetches users that can be assigned to tasks (limited information).
 * Accessible by all authenticated users for task assignment purposes.
 *
 * @async
 * @function getAssignableUsers
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.search] - Search by name or email
 * @param {number} [req.query.limit=10] - Number of results to return (max 50)
 * @param {number} [req.query.offset=0] - Number of results to skip
 * @param {boolean} [req.query.excludeCurrentUser=false] - Exclude current user from results
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with assignable users
 *
 * @throws {500} If fetch fails
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     users: [
 *       {
 *         id: "userId",
 *         firstName: "John",
 *         lastName: "Doe",
 *         fullName: "John Doe",
 *         email: "john@example.com",
 *         role: "user",
 *         isActive: true
 *       }
 *     ],
 *     total: 25,
 *     hasMore: true
 *   }
 * }
 */
const getAssignableUsers = asyncHandler(async (req, res) => {
  // Parse query parameters with defaults and limits
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 users per request
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  const excludeCurrentUser = req.query.excludeCurrentUser === 'true';

  // Build filter object - only return active users
  const filter = { isActive: true };

  // Exclude current user if requested
  if (excludeCurrentUser && req.user.userId) {
    filter._id = { $ne: req.user.userId };
  }

  // Add search filter if provided
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  // Fetch users with limited fields for security
  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select('firstName lastName email role isActive') // Only return necessary fields
      .sort({ firstName: 1, lastName: 1 }) // Sort alphabetically by name
      .skip(offset)
      .limit(limit)
      .lean(), // Return plain JavaScript objects for better performance
    User.countDocuments(filter),
  ]);

  // Transform users to include computed fullName and id fields
  const transformedUsers = users.map(user => ({
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }));

  // Determine if there are more results
  const hasMore = offset + users.length < totalCount;

  // Send response
  res.status(200).json({
    success: true,
    data: {
      users: transformedUsers,
      total: totalCount,
      hasMore
    }
  });
});

/**
 * Get All Users
 *
 * Fetches all users from the database with pagination and filtering.
 * Accessible by admin and moderator users.
 *
 * @async
 * @function getAllUsers
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {string} [req.query.role] - Filter by role
 * @param {string} [req.query.isActive] - Filter by active status
 * @param {string} [req.query.search] - Search by name or email
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with users list
 *
 * @throws {500} If fetch fails
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     items: [...],
 *     pagination: {
 *       currentPage: 1,
 *       totalPages: 5,
 *       itemsPerPage: 10,
 *       totalItems: 50,
 *       hasNextPage: true,
 *       hasPrevPage: false
 *     }
 *   }
 * }
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const allowedRoles = new Set(['admin', 'moderator']);
  if (!allowedRoles.has(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators or moderators can view all users.',
    });
  }

  // Parse pagination parameters
  const { page, limit, skip } = parsePagination(req.query);

  // Build filter object
  const filter = {};

  // Filter by role if provided
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Filter by active status if provided
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  // Fetch users with pagination
  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokens') // Exclude sensitive fields
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean(), // Return plain JavaScript objects
    User.countDocuments(filter),
  ]);

  // Map to DTO and send success response
  res.status(200).json(mapUsersListToResponse(users, page, limit, totalCount));
});

/**
 * Get User By ID
 *
 * Fetches a specific user by their ID.
 * Accessible by admin users or the user themselves.
 *
 * @async
 * @function getUserById
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data
 *
 * @throws {404} If user not found
 * @throws {500} If fetch fails
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     user: {...}
 *   }
 * }
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find user by ID
  const user = await User.findById(id).select('-password -refreshTokens');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if user has permission to view this profile
  // Admin can view any profile, users can only view their own
  if (req.user.role !== 'admin' && req.user.userId.toString() !== id) {
    throw new ApiError(403, 'Access denied. You can only view your own profile.');
  }

  // Map to DTO and send success response
  res.status(200).json(mapUserDetailsToResponse(user));
});

/**
 * Update User Status (Admin Only)
 *
 * Updates a user's active status (activate/deactivate account).
 * Accessible by admin users only.
 *
 * @async
 * @function updateUserStatus
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Request body
 * @param {boolean} req.body.isActive - New active status
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated user
 *
 * @throws {400} If trying to deactivate own account
 * @throws {404} If user not found
 * @throws {500} If update fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "User status updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Prevent admin from deactivating their own account
  if (req.user.userId.toString() === id && isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  // Find and update user
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = isActive;
  await user.save();

  // If deactivating, clear all refresh tokens
  if (!isActive) {
    await user.clearAllRefreshTokens();
  }

  // Map to DTO and send success response
  res.status(200).json(mapUserUpdateToResponse(user, 'User status updated successfully'));
});

/**
 * Update User Role (Admin Only)
 *
 * Updates a user's role in the system.
 * Accessible by admin users only.
 *
 * @async
 * @function updateUserRole
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.role - New role (user, admin, moderator)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated user
 *
 * @throws {400} If trying to change own role
 * @throws {404} If user not found
 * @throws {500} If update fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "User role updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Prevent admin from changing their own role
  if (req.user.userId.toString() === id) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  // Find and update user
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = role;
  await user.save();

  // Map to DTO and send success response
  res.status(200).json(mapUserUpdateToResponse(user, 'User role updated successfully'));
});

/**
 * Delete User (Admin Only)
 *
 * Permanently deletes a user from the system.
 * Accessible by admin users only.
 *
 * @async
 * @function deleteUser
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming deletion
 *
 * @throws {400} If trying to delete own account
 * @throws {404} If user not found
 * @throws {500} If deletion fails
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "User deleted successfully"
 * }
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting their own account
  if (req.user.userId.toString() === id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  // Find and delete user
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Map to DTO and send success response
  res.status(200).json(mapUserDeletionToResponse('User deleted successfully'));
});

/**
 * Get User Statistics (Admin Only)
 *
 * Returns statistics about users in the system.
 * Accessible by admin users only.
 *
 * @async
 * @function getUserStats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with statistics
 *
 * @throws {500} If fetch fails
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     totalUsers: 100,
 *     activeUsers: 85,
 *     inactiveUsers: 15,
 *     usersByRole: {...},
 *     recentUsers: [...]
 *   }
 * }
 */
const getUserStats = asyncHandler(async (req, res) => {
  // Get various statistics
  const [totalUsers, activeUsers, verifiedUsers, usersByRole, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    User.find()
      .select('firstName lastName email role isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const inactiveUsers = totalUsers - activeUsers;
  const unverifiedUsers = totalUsers - verifiedUsers;

  // Format role statistics
  const roleStats = {};
  usersByRole.forEach((item) => {
    roleStats[item._id] = item.count;
  });

  // Build stats object
  const stats = {
    totalUsers,
    activeUsers,
    inactiveUsers,
    verifiedUsers,
    unverifiedUsers,
    usersByRole: roleStats,
    recentUsers,
  };

  // Map to DTO and send success response
  res.status(200).json(mapUserStatsToResponse(stats));
});

module.exports = {
  getAssignableUsers,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
};
