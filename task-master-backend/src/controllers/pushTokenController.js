/**
 * Push Token Controller
 *
 * Handles FCM token management including registration, validation, and cleanup.
 *
 * @module controllers/pushTokenController
 */

const User = require("../models/User");
const { validateToken } = require("../utils/firebaseSender");
const { asyncHandler } = require("../middleware/errorHandler");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Save FCM Token
 *
 * Validates and saves an FCM token for the authenticated user
 *
 * @route   POST /api/v1/push/token
 * @access  Private
 */
const saveFCMToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  console.log("token received from the frontend", token);
  if (!token) {
    console.log("no token received");
    throw new ApiError(400, "FCM token is required");
  }

  // Validate token format (basic check)
  if (typeof token !== 'string' || token.length < 10) {
    throw new ApiError(400, "Invalid FCM token format");
  }

  // Optional: Validate token with Firebase (can be slow, so make it optional)
  const shouldValidate = req.query.validate === 'true';

  if (shouldValidate) {
    console.log("Validating FCM token with Firebase...");
    const isValid = await validateToken(token);

    if (!isValid) {
      throw new ApiError(400, "Invalid or unregistered FCM token");
    }
  }

  // Check if token already exists for this user
  const user = await User.findById(req.user.userId).select('fcmTokens');

  if (user.fcmTokens && user.fcmTokens.includes(token)) {
    return res.json({
      success: true,
      message: "Token already registered",
      data: {
        tokenCount: user.fcmTokens.length
      }
    });
  }

  // Add token to user's token list
  await User.updateOne(
    { _id: req.user.userId },
    { $addToSet: { fcmTokens: token } }
  );

  // Get updated token count
  const updatedUser = await User.findById(req.user.userId).select('fcmTokens');

  console.log(`FCM token saved for user ${req.user.userId}. Total tokens: ${updatedUser.fcmTokens.length}`);

  res.json({
    success: true,
    message: "FCM token saved successfully",
    data: {
      tokenCount: updatedUser.fcmTokens.length
    }
  });
});

/**
 * Remove FCM Token
 *
 * Removes a specific FCM token from the authenticated user's account
 *
 * @route   DELETE /api/v1/push/token
 * @access  Private
 */
const removeFCMToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "FCM token is required");
  }

  // Remove token from user's token list
  const result = await User.updateOne(
    { _id: req.user.userId },
    { $pull: { fcmTokens: token } }
  );

  if (result.modifiedCount === 0) {
    throw new ApiError(404, "Token not found or already removed");
  }

  // Get updated token count
  const user = await User.findById(req.user.userId).select('fcmTokens');

  console.log(`FCM token removed for user ${req.user.userId}. Remaining tokens: ${user.fcmTokens.length}`);

  res.json({
    success: true,
    message: "FCM token removed successfully",
    data: {
      tokenCount: user.fcmTokens.length
    }
  });
});

/**
 * Get User's FCM Tokens
 *
 * Returns all FCM tokens registered for the authenticated user
 *
 * @route   GET /api/v1/push/tokens
 * @access  Private
 */
const getUserTokens = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('fcmTokens');

  res.json({
    success: true,
    data: {
      tokens: user.fcmTokens || [],
      count: user.fcmTokens ? user.fcmTokens.length : 0
    }
  });
});

/**
 * Admin: Cleanup Invalid Tokens
 *
 * Validates all FCM tokens across all users and removes invalid ones
 *
 * @route   POST /api/v1/push/admin/cleanup
 * @access  Private/Admin
 */
const adminCleanupInvalidTokens = asyncHandler(async (req, res) => {
  console.log("Starting admin FCM token cleanup...");

  // Get all users with FCM tokens
  const users = await User.find({
    fcmTokens: { $exists: true, $ne: [] }
  }).select('_id fcmTokens');

  console.log(`Found ${users.length} users with FCM tokens`);

  let totalTokensChecked = 0;
  let totalTokensRemoved = 0;
  let usersAffected = 0;

  // Process users in batches to avoid overwhelming Firebase
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    await Promise.all(batch.map(async (user) => {
      const validTokens = [];
      const invalidTokens = [];

      for (const token of user.fcmTokens) {
        totalTokensChecked++;

        const isValid = await validateToken(token);

        if (isValid) {
          validTokens.push(token);
        } else {
          invalidTokens.push(token);
          totalTokensRemoved++;
        }
      }

      // Update user if any tokens were invalid
      if (invalidTokens.length > 0) {
        await User.updateOne(
          { _id: user._id },
          { $set: { fcmTokens: validTokens } }
        );
        usersAffected++;

        console.log(`Removed ${invalidTokens.length} invalid token(s) from user ${user._id}`);
      }
    }));

    // Log progress
    console.log(`Processed ${Math.min(i + batchSize, users.length)}/${users.length} users`);
  }

  console.log(`Cleanup complete: ${totalTokensRemoved} tokens removed from ${usersAffected} users`);

  res.json({
    success: true,
    message: `Cleanup complete: ${totalTokensRemoved} invalid token(s) removed`,
    data: {
      usersChecked: users.length,
      tokensChecked: totalTokensChecked,
      tokensRemoved: totalTokensRemoved,
      usersAffected: usersAffected
    }
  });
});

/**
 * Admin: Get Token Statistics
 *
 * Returns statistics about FCM tokens across all users
 *
 * @route   GET /api/v1/push/admin/stats
 * @access  Private/Admin
 */
const adminGetTokenStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $project: {
        tokenCount: { $size: { $ifNull: ['$fcmTokens', []] } }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        usersWithTokens: {
          $sum: { $cond: [{ $gt: ['$tokenCount', 0] }, 1, 0] }
        },
        totalTokens: { $sum: '$tokenCount' },
        avgTokensPerUser: { $avg: '$tokenCount' },
        maxTokens: { $max: '$tokenCount' }
      }
    }
  ]);

  const result = stats[0] || {
    totalUsers: 0,
    usersWithTokens: 0,
    totalTokens: 0,
    avgTokensPerUser: 0,
    maxTokens: 0
  };

  res.json({
    success: true,
    data: {
      totalUsers: result.totalUsers,
      usersWithTokens: result.usersWithTokens,
      usersWithoutTokens: result.totalUsers - result.usersWithTokens,
      totalTokens: result.totalTokens,
      avgTokensPerUser: parseFloat(result.avgTokensPerUser.toFixed(2)),
      maxTokensPerUser: result.maxTokens
    }
  });
});

module.exports = {
  saveFCMToken,
  removeFCMToken,
  getUserTokens,
  adminCleanupInvalidTokens,
  adminGetTokenStats
};

