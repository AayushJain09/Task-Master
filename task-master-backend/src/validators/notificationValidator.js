/**
 * Notification Validation Rules
 *
 * This module contains validation rules for notification-related operations
 * using express-validator.
 *
 * @module validators/notificationValidator
 */

const { query, param, body } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get Notifications Query Validation
 *
 * Validates query parameters for fetching notifications
 */
const validateGetNotifications = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),

    query('unreadOnly')
        .optional()
        .isBoolean()
        .withMessage('unreadOnly must be a boolean')
        .toBoolean(),

    query('type')
        .optional()
        .isIn([
            'task_assigned',
            'task_updated',
            'task_completed',
            'task_deleted',
            'task_overdue',
            'task_status_changed',
            'reminder',
            'update_user_status',
            'update_user_role',
            'delete_user',
            'system_announcement',
        ])
        .withMessage('Invalid notification type'),

    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),
];

/**
 * Notification ID Parameter Validation
 *
 * Validates notification ID in URL parameters
 */
const validateNotificationId = [
    param('id')
        .notEmpty()
        .withMessage('Notification ID is required')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid notification ID format');
            }
            return true;
        }),
];

/**
 * Mark Multiple as Read Validation
 *
 * Validates request body for marking multiple notifications as read
 */
const validateMarkManyAsRead = [
    body('notificationIds')
        .isArray({ min: 1, max: 100 })
        .withMessage('notificationIds must be an array with 1-100 items'),

    body('notificationIds.*')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid notification ID in array');
            }
            return true;
        }),
];

/**
 * Admin: Get All Notifications Validation
 *
 * Validates query parameters for admin fetching all notifications
 */
const validateAdminGetNotifications = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),

    query('userId')
        .optional()
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid user ID format');
            }
            return true;
        }),

    query('type')
        .optional()
        .isIn([
            'task_assigned',
            'task_updated',
            'task_completed',
            'task_deleted',
            'task_overdue',
            'task_status_changed',
            'reminder',
            'update_user_status',
            'update_user_role',
            'delete_user',
            'system_announcement',
        ])
        .withMessage('Invalid notification type'),

    query('isRead')
        .optional()
        .isBoolean()
        .withMessage('isRead must be a boolean')
        .toBoolean(),

    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),

    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('startDate must be a valid ISO 8601 date'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('endDate must be a valid ISO 8601 date'),
];

/**
 * Admin: Send Custom Notification Validation
 *
 * Validates request body for sending custom notifications
 */
const validateSendCustomNotification = [
    body('userIds')
        .isArray({ min: 1, max: 1000 })
        .withMessage('userIds must be an array with 1-1000 items'),

    body('userIds.*')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid user ID in array');
            }
            return true;
        }),

    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters')
        .trim(),

    body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
        .trim(),

    body('type')
        .optional()
        .isIn([
            'task_assigned',
            'task_updated',
            'task_completed',
            'task_deleted',
            'task_overdue',
            'task_status_changed',
            'reminder',
            'update_user_status',
            'update_user_role',
            'delete_user',
            'system_announcement',
        ])
        .withMessage('Invalid notification type'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),

    body('sendPush')
        .optional()
        .isBoolean()
        .withMessage('sendPush must be a boolean')
        .toBoolean(),
];

/**
 * Delete Old Notifications Validation
 *
 * Validates query parameters for deleting old notifications
 */
const validateDeleteOld = [
    query('daysOld')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('daysOld must be between 1 and 365')
        .toInt(),
];

module.exports = {
    validateGetNotifications,
    validateNotificationId,
    validateMarkManyAsRead,
    validateAdminGetNotifications,
    validateSendCustomNotification,
    validateDeleteOld,
};
