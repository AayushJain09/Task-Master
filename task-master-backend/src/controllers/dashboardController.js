/**
 * Dashboard Controller
 *
 * Provides data endpoints for the Analytics / Dashboard surface area,
 * including recent activity feeds and productivity metrics that power
 * the home screen in the mobile app.
 *
 * @module controllers/dashboardController
 */

const mongoose = require('mongoose');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { getNowInTimeZone } = require('../utils/timezone');

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const MS_IN_WEEK = MS_IN_DAY * 7;

/**
 * Builds a reusable task visibility filter so we only return
 * resources the authenticated user created or is responsible for.
 *
 * @param {string} userId - Authenticated user id string
 * @returns {Object} Mongo query matcher
 */
const buildTaskVisibilityFilter = (userId) => ({
  isActive: true,
  $or: [{ assignedTo: userId }, { assignedBy: userId }],
});

/**
 * Recent Activity Feed
 *
 * Returns the most recent activity log entries visible to the current user.
 *
 * @route   GET /api/v1/dashboard/activity
 * @access  Authenticated
 *
 * Query Parameters:
 * - limit (optional): number of records to return (default 15, max 100)
 * - actions (optional): comma-separated list of action verbs to filter by
 */
const getRecentActivity = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access activity feed.',
      });
    }

    const { userId, role } = req.user;
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 100);
    const actions = req.query.actions
      ? req.query.actions.split(',').map(action => action.trim()).filter(Boolean)
      : [];

    const activities = await ActivityLog.getRecentActivitiesForUser(userId, { limit, actions });

    res.status(200).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: {
        activities,
        userContext: {
          userId,
          role,
        },
        pagination: {
          limit,
          returned: activities.length,
        },
      },
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Dashboard Metrics
 *
 * Provides aggregated productivity metrics, overdue counts, and
 * short-term trends for the authenticated user.
 *
 * @route   GET /api/v1/dashboard/metrics
 * @access  Authenticated
 */
const getDashboardMetrics = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access dashboard metrics.',
      });
    }

    const requestTimezone = req.requestedTimezone || 'UTC';
    const now = getNowInTimeZone(requestTimezone).date;
    const { userId, role } = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const visibilityFilter = buildTaskVisibilityFilter(userObjectId);
    const sevenDaysAgo = new Date(now.getTime() - 7 * MS_IN_DAY);
    const threeDaysAhead = new Date(now.getTime() + 3 * MS_IN_DAY);

    const [
      statusBreakdown,
      priorityBreakdown,
      createdThisWeek,
      completedThisWeek,
      overdueCount,
      upcomingDueSoon,
      activityTrend,
      lastActivity,
    ] = await Promise.all([
      Task.aggregate([
        { $match: visibilityFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: visibilityFilter },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.countDocuments({
        ...visibilityFilter,
        createdAt: { $gte: sevenDaysAgo },
      }),
      Task.countDocuments({
        ...visibilityFilter,
        completedAt: { $gte: sevenDaysAgo },
      }),
      Task.countDocuments({
        ...visibilityFilter,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
      Task.countDocuments({
        ...visibilityFilter,
        dueDate: { $gte: now, $lt: threeDaysAhead },
        status: { $ne: 'done' },
      }),
      Task.aggregate([
        {
          $match: {
            ...visibilityFilter,
            completedAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ActivityLog.findOne({ participants: userObjectId })
        .sort({ createdAt: -1 })
        .select('action description createdAt')
        .lean(),
    ]);

    const statusMap = statusBreakdown.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      { todo: 0, in_progress: 0, done: 0 }
    );

    const priorityMap = priorityBreakdown.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      { high: 0, medium: 0, low: 0 }
    );

    const metrics = {
      tasks: {
        total: statusBreakdown.reduce((sum, entry) => sum + entry.count, 0),
        ...statusMap,
      },
      overdue: {
        active: overdueCount,
        upcoming: upcomingDueSoon,
      },
      weekly: {
        created: createdThisWeek,
        completed: completedThisWeek,
      },
      priority: priorityMap,
      trends: {
        completedLast7Days: activityTrend.map(point => ({
          date: point._id,
          count: point.count,
        })),
      },
      activitySummary: lastActivity
        ? {
            lastAction: lastActivity.action,
            description: lastActivity.description,
            occurredAt: lastActivity.createdAt,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: {
        userContext: {
          userId,
          role,
        },
        metrics,
      },
      meta: {
        timezone: requestTimezone,
      },
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Dashboard Analytics (Deep-Dive)
 *
 * Provides chart-friendly datasets used by the analytics screen:
 * - status/priority distributions
 * - 7-day created vs. completed trend
 * - multi-week velocity trend
 * - cycle time statistics
 *
 * @route   GET /api/v1/dashboard/analytics
 * @access  Authenticated
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access analytics.',
      });
    }

    const requestTimezone = req.requestedTimezone || 'UTC';
    const now = getNowInTimeZone(requestTimezone).date;
    const { userId, role } = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const visibilityFilter = buildTaskVisibilityFilter(userObjectId);

    const sevenDayWindowStart = new Date(now.getTime() - (7 - 1) * MS_IN_DAY);
    const eightWeekWindowStart = new Date(now.getTime() - 8 * MS_IN_WEEK);
    const upcomingWindowEnd = new Date(now.getTime() + 3 * MS_IN_DAY);

    const [
      statusBreakdown,
      priorityBreakdown,
      overdueCount,
      upcomingDueSoon,
      weeklyCreatedRaw,
      weeklyCompletedRaw,
      velocityRaw,
      cycleStats,
    ] = await Promise.all([
      Task.aggregate([
        { $match: visibilityFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: visibilityFilter },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.countDocuments({
        ...visibilityFilter,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
      Task.countDocuments({
        ...visibilityFilter,
        dueDate: { $gte: now, $lt: upcomingWindowEnd },
        status: { $ne: 'done' },
      }),
      Task.aggregate([
        {
          $match: {
            ...visibilityFilter,
            createdAt: { $gte: sevenDayWindowStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        {
          $match: {
            ...visibilityFilter,
            completedAt: { $gte: sevenDayWindowStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        {
          $match: {
            ...visibilityFilter,
            completedAt: { $gte: eightWeekWindowStart },
          },
        },
        {
          $group: {
            _id: {
              week: { $isoWeek: '$completedAt' },
              year: { $isoWeekYear: '$completedAt' },
            },
            completed: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),
      Task.aggregate([
        {
          $match: {
            ...visibilityFilter,
            status: 'done',
            createdAt: { $ne: null },
            completedAt: { $ne: null },
          },
        },
        {
          $project: {
            cycleDays: {
              $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, MS_IN_DAY],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgCycleDays: { $avg: '$cycleDays' },
            fastestDays: { $min: '$cycleDays' },
            slowestDays: { $max: '$cycleDays' },
          },
        },
      ]),
    ]);

    const statusMap = statusBreakdown.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      { todo: 0, in_progress: 0, done: 0 }
    );

    const priorityMap = priorityBreakdown.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      { high: 0, medium: 0, low: 0 }
    );

    const buildDayKey = (date) => date.toISOString().split('T')[0];
    const lastSevenDays = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(now.getTime() - (6 - idx) * MS_IN_DAY);
      return {
        key: buildDayKey(day),
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    });

    const createdMap = weeklyCreatedRaw.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      {}
    );
    const completedMap = weeklyCompletedRaw.reduce(
      (acc, entry) => ({ ...acc, [entry._id]: entry.count }),
      {}
    );

    // Align raw aggregates with the last 7 calendar days (ensures zero-fill).
    const weeklyProgress = lastSevenDays.map(day => ({
      date: day.key,
      label: day.label,
      created: createdMap[day.key] || 0,
      completed: completedMap[day.key] || 0,
    }));

    // Weekly completion trend (8-week lookback) fuels burndown style charts.
    const velocityTrend = velocityRaw.map(entry => ({
      week: entry._id.week,
      year: entry._id.year,
      completed: entry.completed,
    }));

    // Cycle-time stats provide insight into delivery speed.
    const cycleSummary = cycleStats.length
      ? {
          averageDays: parseFloat(cycleStats[0].avgCycleDays.toFixed(2)),
          fastestDays: parseFloat(cycleStats[0].fastestDays.toFixed(2)),
          slowestDays: parseFloat(cycleStats[0].slowestDays.toFixed(2)),
        }
      : {
          averageDays: 0,
          fastestDays: 0,
          slowestDays: 0,
        };

    const totalTasks = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    const summary = {
      totalTasks,
      openTasks: totalTasks - statusMap.done,
      completedTasks: statusMap.done,
      overdueTasks: overdueCount,
      upcomingTasks: upcomingDueSoon,
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        userContext: {
          userId,
          role,
        },
        analytics: {
          summary,
          statusDistribution: statusMap,
          priorityDistribution: priorityMap,
          weeklyProgress,
          velocityTrend,
          cycleTime: cycleSummary,
        },
      },
      meta: {
        timezone: requestTimezone,
      },
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  getRecentActivity,
  getDashboardMetrics,
  getDashboardAnalytics,
};
