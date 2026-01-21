/**
 * Token Cleanup Service
 *
 * Handles scheduled cleanup of stale and invalid FCM tokens
 *
 * @module lib/tokenCleanup
 */

const User = require('../models/User');

/**
 * Cleanup tokens from inactive users
 *
 * Removes FCM tokens from users who haven't logged in for 90+ days
 *
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupStaleTokens() {
    console.log('Starting stale token cleanup...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find users with tokens who haven't logged in for 90 days
    const result = await User.updateMany(
        {
            lastLogin: { $lt: ninetyDaysAgo },
            fcmTokens: { $exists: true, $ne: [] }
        },
        { $set: { fcmTokens: [] } }
    );

    console.log(`Cleaned up tokens from ${result.modifiedCount} inactive users (90+ days)`);

    return {
        usersAffected: result.modifiedCount,
        cutoffDate: ninetyDaysAgo
    };
}

/**
 * Cleanup tokens from users with excessive tokens
 *
 * Limits each user to maximum 5 tokens (keeps most recent)
 *
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupExcessiveTokens() {
    console.log('Starting excessive token cleanup...');

    const maxTokensPerUser = 5;
    let usersAffected = 0;
    let tokensRemoved = 0;

    // Find users with more than max tokens
    const users = await User.find({
        $expr: { $gt: [{ $size: { $ifNull: ['$fcmTokens', []] } }, maxTokensPerUser] }
    }).select('_id fcmTokens');

    for (const user of users) {
        const excessCount = user.fcmTokens.length - maxTokensPerUser;

        // Keep only the last N tokens (most recent)
        const tokensToKeep = user.fcmTokens.slice(-maxTokensPerUser);

        await User.updateOne(
            { _id: user._id },
            { $set: { fcmTokens: tokensToKeep } }
        );

        usersAffected++;
        tokensRemoved += excessCount;

        console.log(`Removed ${excessCount} excess token(s) from user ${user._id}`);
    }

    console.log(`Cleaned up ${tokensRemoved} excess tokens from ${usersAffected} users`);

    return {
        usersAffected,
        tokensRemoved,
        maxTokensPerUser
    };
}

/**
 * Run all token cleanup tasks
 *
 * @returns {Promise<Object>} Combined cleanup results
 */
async function runTokenCleanup() {
    console.log('=== Starting scheduled token cleanup ===');

    const startTime = Date.now();

    try {
        const [staleResults, excessResults] = await Promise.all([
            cleanupStaleTokens(),
            cleanupExcessiveTokens()
        ]);

        const duration = Date.now() - startTime;

        const results = {
            success: true,
            duration: `${duration}ms`,
            staleTokens: staleResults,
            excessiveTokens: excessResults,
            totalUsersAffected: staleResults.usersAffected + excessResults.usersAffected
        };

        console.log('=== Token cleanup complete ===');
        console.log(JSON.stringify(results, null, 2));

        return results;
    } catch (error) {
        console.error('Token cleanup failed:', error);
        throw error;
    }
}

module.exports = {
    cleanupStaleTokens,
    cleanupExcessiveTokens,
    runTokenCleanup
};
