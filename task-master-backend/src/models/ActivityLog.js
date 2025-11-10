/**
 * Activity Log Model
 *
 * Centralized tracking of user-facing activities so the dashboard
 * and notification layers can render consistent histories.
 *
 * Each log entry records the action performer, the target entity,
 * and the participants who should be able to view the event.
 *
 * @module models/ActivityLog
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // High-level verb that describes the action
    action: {
      type: String,
      required: true,
      enum: [
        'task_created',
        'task_updated',
        'task_status_changed',
        'task_completed',
        'task_reassigned',
        'task_deleted',
        'task_comment_added',
      ],
    },

    // Entity metadata allows filtering by resource type
    entityType: {
      type: String,
      required: true,
      default: 'task',
      enum: ['task', 'user', 'system'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Who triggered the event (always visible for auditing)
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Optional context string (e.g., "kanban_board" / "dashboard")
    context: {
      type: String,
      default: null,
    },

    // Short human-readable summary shown to users
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Any additional JSON payload a consumer might need
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Users that should see this log (e.g., assignor + assignee)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index helps fetch most recent per participant efficiently
activityLogSchema.index({ participants: 1, createdAt: -1 });

/**
 * Records a task-related activity and automatically assigns
 * both the assignor and assignee as participants (when available).
 *
 * @async
 * @method logTaskActivity
 * @param {Object} params - Activity parameters
 * @param {Object} params.task - Task mongoose document or plain object
 * @param {string} params.performedBy - User ID of actor
 * @param {string} params.action - Activity verb
 * @param {string} params.description - Human-readable summary
 * @param {Object} [params.metadata={}] - Structured metadata payload
 * @param {string|null} [params.context=null] - Additional context flag
 * @returns {Promise<ActivityLog>}
 */
activityLogSchema.statics.logTaskActivity = async function ({
  task,
  performedBy,
  action,
  description,
  metadata = {},
  context = null,
}) {
  if (!task?._id) {
    throw new Error('Task reference is required to log activity');
  }

  const participantSet = new Set();

  if (task.assignedTo) {
    participantSet.add(task.assignedTo.toString());
  }
  if (task.assignedBy) {
    participantSet.add(task.assignedBy.toString());
  }

  // Ensure the performer also sees the entry even if not assignor/assignee
  if (performedBy) {
    participantSet.add(performedBy.toString());
  }

  const participants = Array.from(participantSet).map(id => new mongoose.Types.ObjectId(id));

  return this.create({
    action,
    entityType: 'task',
    entityId: task._id,
    performedBy,
    description,
    metadata: {
      taskId: task._id,
      taskTitle: task.title,
      priority: task.priority,
      status: task.status,
      ...metadata,
    },
    context,
    participants,
  });
};

/**
 * Fetches recent activities visible to the provided user with
 * optional filtering and pagination.
 *
 * @async
 * @method getRecentActivitiesForUser
 * @param {string} userId - Authenticated user ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Max entries to return
 * @param {string[]} [options.actions] - Optional action filter
 * @returns {Promise<ActivityLog[]>}
 */
activityLogSchema.statics.getRecentActivitiesForUser = function (userId, { limit = 20, actions = [] } = {}) {
  const query = { participants: userId };
  if (Array.isArray(actions) && actions.length > 0) {
    query.action = { $in: actions };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .populate('performedBy', 'firstName lastName email')
    .lean();
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
