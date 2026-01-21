/**
 * Push Token Routes
 *
 * Routes for FCM token management
 *
 * @module routes/pushTokenRoutes
 */

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
    saveFCMToken,
    removeFCMToken,
    getUserTokens,
    adminCleanupInvalidTokens,
    adminGetTokenStats
} = require("../controllers/pushTokenController");

// ============================================================================
// USER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/push/token
 * @desc    Save FCM token for authenticated user
 * @access  Private
 * @query   validate=true (optional) - Validate token with Firebase before saving
 */
router.post("/token", authenticate, saveFCMToken);

/**
 * @route   DELETE /api/v1/push/token
 * @desc    Remove FCM token from authenticated user
 * @access  Private
 */
router.delete("/token", authenticate, removeFCMToken);

/**
 * @route   GET /api/v1/push/tokens
 * @desc    Get all FCM tokens for authenticated user
 * @access  Private
 */
router.get("/tokens", authenticate, getUserTokens);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/push/admin/cleanup
 * @desc    Cleanup invalid FCM tokens across all users
 * @access  Private/Admin
 */
router.post("/admin/cleanup", authenticate, authorize("admin"), adminCleanupInvalidTokens);

/**
 * @route   GET /api/v1/push/admin/stats
 * @desc    Get FCM token statistics
 * @access  Private/Admin
 */
router.get("/admin/stats", authenticate, authorize("admin", "moderator"), adminGetTokenStats);

module.exports = router;

