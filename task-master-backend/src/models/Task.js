/**
 * Task Model
 *
 * This module defines the Task schema and model for MongoDB using Mongoose.
 * It includes task management functionality with user assignment and filtering capabilities.
 *
 * @module models/Task
 */

const mongoose = require('mongoose');

/**
 * Task Schema Definition
 *
 * Defines the structure and validation rules for task documents in MongoDB.
 *
 * @typedef {Object} TaskSchema
 * @property {string} title - Task title (required)
 * @property {string} description - Task description (optional)
 * @property {string} status - Task status (todo, in_progress, done)
 * @property {string} priority - Task priority (low, medium, high)
 * @property {string[]} tags - Optional tags for task categorization
 * @property {ObjectId} assignedBy - User who assigned the task
 * @property {ObjectId} assignedTo - User who is assigned to complete the task
 * @property {Date} dueDate - Task due date (optional)
 * @property {Date} completedAt - Task completion timestamp
 * @property {boolean} isActive - Task active status (default: true)
 * @property {Date} createdAt - Task creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */
const taskSchema = new mongoose.Schema(
  {
    // Task title - concise description of what needs to be done
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
      minlength: [3, 'Task title must be at least 3 characters long'],
    },

    // Detailed description of the task
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Task description cannot exceed 2000 characters'],
      default: '',
    },

    // Current status of the task
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'done'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'todo',
      index: true, // Index for efficient filtering
    },

    // Priority level of the task
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
      index: true, // Index for efficient filtering
    },

    // Optional tags for categorization and filtering
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags) {
          // Limit to 10 tags maximum
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags per task',
      },
    },

    // User who created/assigned the task
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have an assignor'],
      index: true, // Index for efficient queries
    },

    // User who is responsible for completing the task
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a user'],
      index: true, // Index for efficient queries
    },

    // Optional due date for the task
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(dueDate) {
          // Due date should be in the future (only for new tasks)
          if (this.isNew && dueDate) {
            return dueDate > new Date();
          }
          return true;
        },
        message: 'Due date must be in the future',
      },
    },

    // Timestamp when task was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // Task active status (for soft delete)
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for efficient filtering of active tasks
    },

    // Estimated time to complete (in hours)
    estimatedHours: {
      type: Number,
      min: [0.1, 'Estimated hours must be at least 0.1'],
      max: [1000, 'Estimated hours cannot exceed 1000'],
      default: null,
    },

    // Actual time spent (in hours)
    actualHours: {
      type: Number,
      min: [0, 'Actual hours cannot be negative'],
      max: [1000, 'Actual hours cannot exceed 1000'],
      default: 0,
    },

    // Category for task organization
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      default: 'General',
    },
  },
  {
    // Enable automatic timestamps
    timestamps: true,

    // Transform output when converting to JSON
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove internal fields from JSON output
        delete ret.__v;
        return ret;
      },
    },

    // Enable virtuals for Object conversion
    toObject: { virtuals: true },
  }
);

/**
 * Compound Indexes for Efficient Queries
 */
// Index for finding tasks by assignee and status
taskSchema.index({ assignedTo: 1, status: 1 });

// Index for finding tasks by assignor and status
taskSchema.index({ assignedBy: 1, status: 1 });

// Index for finding tasks by due date and priority
taskSchema.index({ dueDate: 1, priority: -1 });

// Index for finding active tasks by assignee
taskSchema.index({ assignedTo: 1, isActive: 1 });

// Text index for full-text search on title and description
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

/**
 * Pre-save Middleware
 *
 * Automatically sets completedAt timestamp when task status changes to 'done'
 * and clears it if status changes away from 'done'
 */
taskSchema.pre('save', function (next) {
  // If status is changed to 'done', set completedAt timestamp
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done' && this.completedAt) {
      this.completedAt = null;
    }
  }

  // Normalize tags: remove duplicates, trim whitespace, convert to lowercase
  if (this.isModified('tags')) {
    this.tags = [...new Set(this.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0))];
  }

  next();
});

/**
 * Virtual Property: Is Overdue
 *
 * Determines if the task is overdue based on due date and completion status
 *
 * @virtual
 * @returns {boolean} True if task is overdue, false otherwise
 */
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'done') {
    return false;
  }
  return new Date() > this.dueDate;
});

/**
 * Virtual Property: Days Until Due
 *
 * Calculates the number of days until the task is due
 *
 * @virtual
 * @returns {number|null} Number of days until due (negative if overdue), null if no due date
 */
taskSchema.virtual('daysUntilDue').get(function () {
  if (!this.dueDate) {
    return null;
  }
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual Property: Time Variance
 *
 * Calculates the difference between estimated and actual time
 *
 * @virtual
 * @returns {number|null} Time variance in hours (positive if over estimate)
 */
taskSchema.virtual('timeVariance').get(function () {
  if (!this.estimatedHours || this.actualHours === 0) {
    return null;
  }
  return this.actualHours - this.estimatedHours;
});

/**
 * Instance Method: Assign To User
 *
 * Assigns the task to a different user
 *
 * @async
 * @method assignToUser
 * @param {ObjectId} userId - ID of the user to assign the task to
 * @param {ObjectId} assignorId - ID of the user making the assignment
 * @returns {Promise<void>}
 */
taskSchema.methods.assignToUser = async function (userId, assignorId) {
  this.assignedTo = userId;
  this.assignedBy = assignorId;
  await this.save();
};

/**
 * Instance Method: Update Status
 *
 * Updates the task status with proper validation
 *
 * @async
 * @method updateStatus
 * @param {string} newStatus - New status for the task
 * @returns {Promise<void>}
 */
taskSchema.methods.updateStatus = async function (newStatus) {
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid task status');
  }
  
  this.status = newStatus;
  await this.save();
};

/**
 * Instance Method: Add Tag
 *
 * Adds a tag to the task if it doesn't already exist
 *
 * @async
 * @method addTag
 * @param {string} tag - Tag to add
 * @returns {Promise<void>}
 */
taskSchema.methods.addTag = async function (tag) {
  const normalizedTag = tag.trim().toLowerCase();
  if (normalizedTag && !this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
    await this.save();
  }
};

/**
 * Instance Method: Remove Tag
 *
 * Removes a tag from the task
 *
 * @async
 * @method removeTag
 * @param {string} tag - Tag to remove
 * @returns {Promise<void>}
 */
taskSchema.methods.removeTag = async function (tag) {
  const normalizedTag = tag.trim().toLowerCase();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  await this.save();
};

/**
 * Static Method: Find By User
 *
 * Finds tasks assigned to or created by a specific user
 *
 * @async
 * @static
 * @method findByUser
 * @param {ObjectId} userId - User ID to search for
 * @param {Object} options - Query options
 * @param {string} options.role - 'assignee' or 'assignor' or 'both'
 * @param {string} options.status - Filter by status
 * @param {boolean} options.activeOnly - Only return active tasks
 * @returns {Promise<Array>} Array of task documents
 */
taskSchema.statics.findByUser = async function (userId, options = {}) {
  const { role = 'both', status, activeOnly = true } = options;
  
  let query = {};
  
  // Build query based on role
  if (role === 'assignee') {
    query.assignedTo = userId;
  } else if (role === 'assignor') {
    query.assignedBy = userId;
  } else {
    query.$or = [{ assignedTo: userId }, { assignedBy: userId }];
  }
  
  // Add status filter if provided
  if (status) {
    query.status = status;
  }
  
  // Add active filter
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query)
    .populate('assignedBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

/**
 * Static Method: Find Overdue Tasks
 *
 * Finds all overdue tasks for a specific user or all users
 *
 * @async
 * @static
 * @method findOverdueTasks
 * @param {ObjectId} userId - Optional user ID to filter by
 * @returns {Promise<Array>} Array of overdue task documents
 */
taskSchema.statics.findOverdueTasks = async function (userId = null) {
  let query = {
    dueDate: { $lt: new Date() },
    status: { $ne: 'done' },
    isActive: true,
  };
  
  if (userId) {
    query.assignedTo = userId;
  }
  
  return this.find(query)
    .populate('assignedBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ dueDate: 1 });
};

/**
 * Static Method: Get Task Statistics
 *
 * Gets task statistics for a specific user
 *
 * @async
 * @static
 * @method getTaskStatistics
 * @param {ObjectId} userId - User ID to get statistics for
 * @returns {Promise<Object>} Task statistics object
 */
taskSchema.statics.getTaskStatistics = async function (userId) {
  const pipeline = [
    {
      $match: {
        assignedTo: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgActualHours: { $avg: '$actualHours' },
      },
    },
  ];
  
  const stats = await this.aggregate(pipeline);
  
  // Transform results into a more usable format
  const result = {
    todo: 0,
    in_progress: 0,
    done: 0,
    total: 0,
    avgHours: 0,
  };
  
  let totalHours = 0;
  let totalTasks = 0;
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    totalHours += stat.avgActualHours * stat.count;
    totalTasks += stat.count;
  });
  
  result.avgHours = totalTasks > 0 ? totalHours / totalTasks : 0;
  
  return result;
};

/**
 * Task Model
 *
 * Mongoose model for task documents
 *
 * @type {mongoose.Model}
 */
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;