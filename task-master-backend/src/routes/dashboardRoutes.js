/**
 * Dashboard Routes
 *
 * Serves analytics-oriented endpoints (metrics + recent activity)
 * consumed by the mobile dashboard.
 *
 * @module routes/dashboardRoutes
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { rateLimitModerate } = require('../middleware/rateLimiter');
const {
  getRecentActivity,
  getDashboardMetrics,
  getDashboardAnalytics,
} = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/v1/dashboard/activity - Most recent activity entries for the current user
router.get('/activity', authenticate, rateLimitModerate, getRecentActivity);

// GET /api/v1/dashboard/metrics - Aggregated dashboard metrics
router.get('/metrics', authenticate, rateLimitModerate, getDashboardMetrics);

// GET /api/v1/dashboard/analytics - Deep analytics for charts/insights
router.get('/analytics', authenticate, rateLimitModerate, getDashboardAnalytics);

module.exports = router;
