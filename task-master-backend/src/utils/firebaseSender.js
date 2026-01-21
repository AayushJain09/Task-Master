/**
 * Firebase Cloud Messaging Sender
 *
 * This module handles sending push notifications via Firebase Cloud Messaging (FCM).
 * Includes automatic cleanup of invalid tokens and detailed error tracking.
 *
 * @module utils/firebaseSender
 */

const admin = require("firebase-admin");
const User = require("../models/User");

/**
 * Check if error indicates an invalid or unregistered token
 *
 * @param {Object} error - Firebase error object
 * @returns {boolean} True if token is invalid
 */
function isInvalidTokenError(error) {
  if (!error || !error.code) return false;

  return (
    error.code === 'messaging/invalid-registration-token' ||
    error.code === 'messaging/registration-token-not-registered' ||
    error.code === 'messaging/invalid-argument'
  );
}

/**
 * Validate a single FCM token
 *
 * @param {string} token - FCM token to validate
 * @returns {Promise<boolean>} True if token is valid
 */
async function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    // Try to send a dry-run message to validate the token
    await admin.messaging().send({
      token,
      data: { type: 'validation' }
    }, true); // dryRun = true

    return true;
  } catch (error) {
    if (isInvalidTokenError(error)) {
      return false;
    }
    // For other errors, assume token might be valid
    return true;
  }
}

/**
 * Send push notifications to multiple users
 *
 * Automatically removes invalid tokens from the database
 *
 * @param {Array<string>} userIds - Array of user IDs to send notifications to
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} [payload.data={}] - Additional data to send
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function sendToUsers(userIds, { title, body, data = {} }) {
  try {
    // Fetch all tokens of users
    const users = await User.find(
      { _id: { $in: userIds } },
      { fcmTokens: 1 }
    ).lean();

    const tokens = users.flatMap(u => u.fcmTokens || []);

    if (!tokens.length) {
      console.log("No device tokens available for notification");
      return {
        success: 0,
        failure: 0,
        invalidTokensRemoved: 0,
        totalTokens: 0
      };
    }

    console.log(`Sending notification to ${tokens.length} device(s)`);

    // Send notifications
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      // Android-specific options
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      // iOS-specific options
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });

    console.log(`Push notification results: ${response.successCount} success, ${response.failureCount} failed`);

    // Identify and remove invalid tokens
    const invalidTokens = [];
    const errorDetails = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const token = tokens[idx];
        const error = resp.error;

        // Track error details for logging
        errorDetails.push({
          token: token.substring(0, 20) + '...', // Truncate for security
          errorCode: error?.code,
          errorMessage: error?.message
        });

        // Check if token is invalid
        if (isInvalidTokenError(error)) {
          invalidTokens.push(token);
        }
      }
    });

    // Log error details if any failures
    if (errorDetails.length > 0) {
      console.error('Push notification errors:', JSON.stringify(errorDetails, null, 2));
    }

    // Remove invalid tokens from database
    let tokensRemoved = 0;
    if (invalidTokens.length > 0) {
      const result = await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );

      tokensRemoved = invalidTokens.length;
      console.log(`Removed ${tokensRemoved} invalid FCM token(s) from database`);
    }

    return {
      success: response.successCount,
      failure: response.failureCount,
      invalidTokensRemoved: tokensRemoved,
      totalTokens: tokens.length,
      successRate: ((response.successCount / tokens.length) * 100).toFixed(2) + '%'
    };

  } catch (err) {
    console.error("Critical error in sendToUsers:", err);
    throw err; // Re-throw for caller to handle
  }
}

/**
 * Send notification to a single token (for testing)
 *
 * @param {string} token - FCM token
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Send result
 */
async function sendToToken(token, { title, body, data = {} }) {
  try {
    const result = await admin.messaging().send({
      token,
      notification: { title, body },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      messageId: result
    };
  } catch (error) {
    console.error('Failed to send to token:', error);

    // If token is invalid, return specific error
    if (isInvalidTokenError(error)) {
      return {
        success: false,
        error: 'Invalid or unregistered token',
        shouldRemove: true
      };
    }

    return {
      success: false,
      error: error.message,
      shouldRemove: false
    };
  }
}

module.exports = {
  sendToUsers,
  sendToToken,
  validateToken,
  isInvalidTokenError
};

