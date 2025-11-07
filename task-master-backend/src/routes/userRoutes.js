/**
 * User Management Routes
 *
 * This module defines all user management routes including
 * fetching users, user administration, and user statistics.
 *
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Import validators
const {
  getAssignableUsersValidation,
  getAllUsersValidation,
  getUserByIdValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
  deleteUserValidation,
} = require('../validators/userValidator');

/**
 * @route   GET /api/v1/users/assignable
 * @desc    Get assignable users (limited info for task assignment)
 * @access  Private (User, Moderator, Admin)
 *
 * Query Parameters:
 * - search: string (search by name or email)
 * - limit: number (default: 10, max: 50)
 * - offset: number (default: 0)
 * - excludeCurrentUser: boolean (default: false)
 *
 * Response:
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
router.get(
  '/assignable',
  authenticate,
  authorize('user', 'moderator', 'admin'),
  getAssignableUsersValidation,
  handleValidationErrors,
  userController.getAssignableUsers
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - role: string (user, admin, moderator)
 * - isActive: boolean (true, false)
 * - search: string (search by name or email)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     items: [...],
 *     pagination: {...}
 *   }
 * }
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  getAllUsersValidation,
  handleValidationErrors,
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 *
 * Response:
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
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  userController.getUserStats
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or self)
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
  '/:id',
  authenticate,
  getUserByIdValidation,
  handleValidationErrors,
  userController.getUserById
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin only)
 *
 * Request Body:
 * {
 *   isActive: boolean
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "User status updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  updateUserStatusValidation,
  handleValidationErrors,
  userController.updateUserStatus
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 *
 * Request Body:
 * {
 *   role: string (user, admin, moderator)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "User role updated successfully",
 *   data: {
 *     user: {...}
 *   }
 * }
 */
router.patch(
  '/:id/role',
  authenticate,
  authorize('admin'),
  updateUserRoleValidation,
  handleValidationErrors,
  userController.updateUserRole
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user permanently
 * @access  Private (Admin only)
 *
 * Response:
 * {
 *   success: true,
 *   message: "User deleted successfully"
 * }
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteUserValidation,
  handleValidationErrors,
  userController.deleteUser
);

module.exports = router;
