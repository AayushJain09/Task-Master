/**
 * Notification Model
 *
 * This module defines the Notification schema for storing user notifications.
 * Supports multiple notification types with automatic cleanup and indexing.
 *
 * @module models/Notification
 */

const mongoose = require('mongoose');

/**
 * Notification Schema Definition
 *
 * @typedef {Object} NotificationSchema
 * @property {ObjectId} user - User who receives the notification
 * @property {string} type - Type of notification
 * @property {string} title - Notification title
 * @property {string} message - Notification message body
 * @property {boolean} isRead - Read status
 * @property {string} priority - Notification priority level
 * @property {Object} metadata - Additional context data
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const NotificationSchema = new mongoose.Schema(
  {
    // User who receives this notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true, // Index for efficient user queries
    },

    // Type of notification
    type: {
      type: String,
      enum: {
        values: [
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
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true, // Index for filtering by type
    },

    // Notification title
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Notification message body
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Index for filtering unread notifications
    },

    // Priority level for notification importance
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
    },

    // Additional context data (taskId, userId, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // Enable automatic timestamps
    timestamps: true,

    // Transform output when converting to JSON
    toJSON: {
      transform: function (doc, ret) {
        // Remove version key
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Compound Indexes for Efficient Queries
 */

// Index for fetching user's notifications sorted by date
NotificationSchema.index({ user: 1, createdAt: -1 });

// Index for fetching unread notifications
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Index for filtering by type and user
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });

// TTL Index - Automatically delete notifications older than 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days in seconds
);

/**
 * Static Method: Mark Multiple as Read
 *
 * Marks multiple notifications as read for a user
 *
 * @async
 * @static
 * @method markManyAsRead
 * @param {ObjectId} userId - User ID
 * @param {Array<ObjectId>} notificationIds - Array of notification IDs
 * @returns {Promise<Object>} Update result
 */
NotificationSchema.statics.markManyAsRead = async function (userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      user: userId,
      isRead: false,
    },
    { isRead: true }
  );
};

/**
 * Static Method: Mark All as Read
 *
 * Marks all unread notifications as read for a user
 *
 * @async
 * @static
 * @method markAllAsRead
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Update result
 */
NotificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

/**
 * Static Method: Get Unread Count
 *
 * Gets count of unread notifications for a user
 *
 * @async
 * @static
 * @method getUnreadCount
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

/**
 * Static Method: Delete Old Notifications
 *
 * Deletes read notifications older than specified days
 *
 * @async
 * @static
 * @method deleteOldNotifications
 * @param {ObjectId} userId - User ID
 * @param {number} daysOld - Age in days (default: 30)
 * @returns {Promise<Object>} Delete result
 */
NotificationSchema.statics.deleteOldNotifications = async function (userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    user: userId,
    isRead: true,
    createdAt: { $lt: cutoffDate },
  });
};

/**
 * Notification Model
 *
 * Mongoose model for notification documents
 *
 * @type {mongoose.Model}
 */
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;

