/**
 * Notification Controller
 *
 * This module handles all notification-related operations including
 * fetching, marking as read, deleting, and admin management.
 *
 * @module controllers/notificationController
 */

const Notification = require('../models/notification');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { ApiError } = require('../middleware/errorHandler');
const firebaseSender = require('../utils/firebaseSender');

/**
 * Get User Notifications
 *
 * Retrieves notifications for the authenticated user with pagination and filtering
 *
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type,
        priority,
    } = req.query;

    // Build query
    const query = { user: req.user.userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    if (type) {
        query.type = type;
    }

    if (priority) {
        query.priority = priority;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notifications
    const [notifications, total] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
        Notification.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        },
    });
});

/**
 * Get Single Notification
 *
 * Retrieves a specific notification by ID
 *
 * @route   GET /api/v1/notifications/:id
 * @access  Private
 */
const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user.userId,
    }).lean();

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    res.status(200).json({
        success: true,
        data: { notification },
    });
});

/**
 * Get Unread Count
 *
 * Gets the count of unread notifications for the authenticated user
 *
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.getUnreadCount(req.user.userId);

    res.status(200).json({
        success: true,
        data: { count },
    });
});

/**
 * Mark Notification as Read
 *
 * Marks a single notification as read
 *
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            user: req.user.userId,
            isRead: false,
        },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, 'Notification not found or already read');
    }

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
    });
});

/**
 * Mark Multiple Notifications as Read
 *
 * Marks multiple notifications as read in a single request
 *
 * @route   PATCH /api/v1/notifications/read-many
 * @access  Private
 */
const markManyAsRead = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    const result = await Notification.markManyAsRead(
        req.user.userId,
        notificationIds
    );

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notification(s) marked as read`,
        data: {
            modifiedCount: result.modifiedCount,
        },
    });
});

/**
 * Mark All Notifications as Read
 *
 * Marks all unread notifications as read for the authenticated user
 *
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.markAllAsRead(req.user.userId);

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notification(s) marked as read`,
        data: {
            modifiedCount: result.modifiedCount,
        },
    });
});

/**
 * Delete Notification
 *
 * Deletes a single notification
 *
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
    });

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
    });
});

/**
 * Delete All Read Notifications
 *
 * Deletes all read notifications for the authenticated user
 *
 * @route   DELETE /api/v1/notifications/read
 * @access  Private
 */
const deleteAllRead = asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({
        user: req.user.userId,
        isRead: true,
    });

    res.status(200).json({
        success: true,
        message: `${result.deletedCount} notification(s) deleted`,
        data: {
            deletedCount: result.deletedCount,
        },
    });
});

/**
 * Delete Old Notifications
 *
 * Deletes read notifications older than specified days
 *
 * @route   DELETE /api/v1/notifications/old
 * @access  Private
 */
const deleteOldNotifications = asyncHandler(async (req, res) => {
    const { daysOld = 30 } = req.query;

    const result = await Notification.deleteOldNotifications(
        req.user.userId,
        parseInt(daysOld)
    );

    res.status(200).json({
        success: true,
        message: `${result.deletedCount} old notification(s) deleted`,
        data: {
            deletedCount: result.deletedCount,
            daysOld: parseInt(daysOld),
        },
    });
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Admin: Get All Notifications
 *
 * Retrieves all notifications with advanced filtering (admin only)
 *
 * @route   GET /api/v1/notifications/admin/all
 * @access  Private/Admin
 */
const adminGetAllNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        userId,
        type,
        isRead,
        priority,
        startDate,
        endDate,
    } = req.query;

    // Build query
    const query = {};

    if (userId) {
        query.user = userId;
    }

    if (type) {
        query.type = type;
    }

    if (isRead !== undefined) {
        query.isRead = isRead;
    }

    if (priority) {
        query.priority = priority;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.createdAt.$lte = new Date(endDate);
        }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notifications with user details
    const [notifications, total] = await Promise.all([
        Notification.find(query)
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
        Notification.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
            },
        },
    });
});

/**
 * Admin: Get Notification Statistics
 *
 * Gets statistics about notifications (admin only)
 *
 * @route   GET /api/v1/notifications/admin/stats
 * @access  Private/Admin
 */
const adminGetStats = asyncHandler(async (req, res) => {
    const stats = await Notification.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                unread: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
                },
                read: {
                    $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] },
                },
            },
        },
    ]);

    const typeStats = await Notification.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    const priorityStats = await Notification.aggregate([
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 },
            },
        },
    ]);

    res.status(200).json({
        success: true,
        data: {
            overall: stats[0] || { total: 0, unread: 0, read: 0 },
            byType: typeStats,
            byPriority: priorityStats,
        },
    });
});

/**
 * Admin: Send Custom Notification
 *
 * Sends a custom notification to specified users (admin only)
 *
 * @route   POST /api/v1/notifications/admin/send
 * @access  Private/Admin
 */
const adminSendNotification = asyncHandler(async (req, res) => {
    const {
        userIds,
        title,
        message,
        type = 'system_announcement',
        priority = 'medium',
        metadata = {},
        sendPush = true,
    } = req.body;

    // Verify all users exist
    const users = await User.find({ _id: { $in: userIds } }).select('_id');

    if (users.length !== userIds.length) {
        throw new ApiError(400, 'One or more user IDs are invalid');
    }

    // Create notifications
    const notifications = userIds.map((userId) => ({
        user: userId,
        type,
        title,
        message,
        priority,
        metadata,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // Send push notifications if requested
    let pushResult = null;
    if (sendPush) {
        try {
            pushResult = await firebaseSender.sendToUsers(userIds, {
                title,
                body: message,
                data: { type, priority },
            });
        } catch (error) {
            console.error('Failed to send push notifications:', error);
            // Don't fail the request if push fails
        }
    }

    res.status(201).json({
        success: true,
        message: `Notification sent to ${userIds.length} user(s)`,
        data: {
            notificationCount: createdNotifications.length,
            pushSent: sendPush,
            pushResult,
        },
    });
});

/**
 * Admin: Delete Any Notification
 *
 * Deletes any notification by ID (admin only)
 *
 * @route   DELETE /api/v1/notifications/admin/:id
 * @access  Private/Admin
 */
const adminDeleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
    });
});

/**
 * Admin: Delete Notifications by Criteria
 *
 * Bulk deletes notifications matching criteria (admin only)
 *
 * @route   DELETE /api/v1/notifications/admin/bulk
 * @access  Private/Admin
 */
const adminBulkDelete = asyncHandler(async (req, res) => {
    const { userId, type, isRead, olderThanDays } = req.query;

    const query = {};

    if (userId) {
        query.user = userId;
    }

    if (type) {
        query.type = type;
    }

    if (isRead !== undefined) {
        query.isRead = isRead;
    }

    if (olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
        query.createdAt = { $lt: cutoffDate };
    }

    // Require at least one filter to prevent accidental deletion of all notifications
    if (Object.keys(query).length === 0) {
        throw new ApiError(400, 'At least one filter parameter is required');
    }

    const result = await Notification.deleteMany(query);

    res.status(200).json({
        success: true,
        message: `${result.deletedCount} notification(s) deleted`,
        data: {
            deletedCount: result.deletedCount,
            filters: query,
        },
    });
});

module.exports = {
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
};
