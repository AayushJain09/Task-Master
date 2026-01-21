/**
 * Notification Routes
 *
 * This module defines all notification-related API routes.
 * Includes both user and admin endpoints with proper authentication and authorization.
 *
 * @module routes/notificationRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const {
    validateGetNotifications,
    validateNotificationId,
    validateMarkManyAsRead,
    validateAdminGetNotifications,
    validateSendCustomNotification,
    validateDeleteOld,
} = require('../validators/notificationValidator');
const {
    // User endpoints
    getNotifications,
    getNotificationById,
    getUnreadCount,
    markAsRead,
    markManyAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    deleteOldNotifications,

    // Admin endpoints
    adminGetAllNotifications,
    adminGetStats,
    adminSendNotification,
    adminDeleteNotification,
    adminBulkDelete,
} = require('../controllers/notificationController');

// ============================================================================
// USER ROUTES
// All routes require authentication
// ============================================================================

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications with pagination and filtering
 * @access  Private
 */
router.get(
    '/',
    authenticate,
    validateGetNotifications,
    handleValidationErrors,
    getNotifications
);

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get(
    '/:id',
    authenticate,
    validateNotificationId,
    handleValidationErrors,
    getNotificationById
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', authenticate, markAllAsRead);

/**
 * @route   PATCH /api/v1/notifications/read-many
 * @desc    Mark multiple notifications as read
 * @access  Private
 */
router.patch(
    '/read-many',
    authenticate,
    validateMarkManyAsRead,
    handleValidationErrors,
    markManyAsRead
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch(
    '/:id/read',
    authenticate,
    validateNotificationId,
    handleValidationErrors,
    markAsRead
);

/**
 * @route   DELETE /api/v1/notifications/old
 * @desc    Delete old read notifications
 * @access  Private
 */
router.delete(
    '/old',
    authenticate,
    validateDeleteOld,
    handleValidationErrors,
    deleteOldNotifications
);

/**
 * @route   DELETE /api/v1/notifications/read
 * @desc    Delete all read notifications
 * @access  Private
 */
router.delete('/read', authenticate, deleteAllRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete single notification
 * @access  Private
 */
router.delete(
    '/:id',
    authenticate,
    validateNotificationId,
    handleValidationErrors,
    deleteNotification
);

// ============================================================================
// ADMIN ROUTES
// All routes require authentication and admin/moderator role
// ============================================================================

/**
 * @route   GET /api/v1/notifications/admin/stats
 * @desc    Get notification statistics
 * @access  Private/Admin
 */
router.get(
    '/admin/stats',
    authenticate,
    authorize('admin', 'moderator'),
    adminGetStats
);

/**
 * @route   GET /api/v1/notifications/admin/all
 * @desc    Get all notifications with advanced filtering
 * @access  Private/Admin
 */
router.get(
    '/admin/all',
    authenticate,
    authorize('admin', 'moderator'),
    validateAdminGetNotifications,
    handleValidationErrors,
    adminGetAllNotifications
);

/**
 * @route   POST /api/v1/notifications/admin/send
 * @desc    Send custom notification to users
 * @access  Private/Admin
 */
router.post(
    '/admin/send',
    authenticate,
    authorize('admin', 'moderator'),
    validateSendCustomNotification,
    handleValidationErrors,
    adminSendNotification
);

/**
 * @route   DELETE /api/v1/notifications/admin/bulk
 * @desc    Bulk delete notifications by criteria
 * @access  Private/Admin
 */
router.delete(
    '/admin/bulk',
    authenticate,
    authorize('admin'),
    adminBulkDelete
);

/**
 * @route   DELETE /api/v1/notifications/admin/:id
 * @desc    Delete any notification by ID
 * @access  Private/Admin
 */
router.delete(
    '/admin/:id',
    authenticate,
    authorize('admin', 'moderator'),
    validateNotificationId,
    handleValidationErrors,
    adminDeleteNotification
);

module.exports = router;
