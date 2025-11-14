/**
 * Task Controller
 *
 * This module contains all the controller functions for task management operations.
 * It handles CRUD operations, task assignment, filtering, and status updates.
 *
 * @module controllers/taskController
 */

const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/**
 * Determines overdue severity based on how many days a task is past due
 * and the task's inherent priority.
 *
 * @param {number} daysPastDue - Whole days past the original due date
 * @param {'low'|'medium'|'high'} priority - Task priority hint
 * @returns {'critical'|'high'|'medium'|'low'} severity bucket
 */
const classifyOverdueSeverity = (daysPastDue, priority = 'medium') => {
  if (daysPastDue >= 7 || (priority === 'high' && daysPastDue >= 3)) {
    return 'critical';
  }
  if (daysPastDue >= 3 || ((priority === 'medium' || priority === 'high') && daysPastDue >= 1)) {
    return 'high';
  }
  if (daysPastDue >= 1) {
    return 'medium';
  }
  return 'low';
};

/**
 * Builds the overdue metadata object that the mobile app expects so
 * that every task response (not just the overdue endpoint) carries
 * consistent deadline intelligence.
 *
 * @param {Object} task - Plain task object (not a mongoose document)
 * @param {Date} referenceDate - Date used to calculate lateness (defaults to now)
 * @returns {Object|null} Overdue metadata payload or null when not overdue
 */
const buildOverdueMetadata = (task, referenceDate = new Date()) => {
  if (!task?.dueDate || task.status === 'done') {
    return null;
  }

  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime()) || dueDate >= referenceDate) {
    return null;
  }

  const daysPastDue = Math.ceil((referenceDate - dueDate) / MS_IN_DAY);

  return {
    daysPastDue,
    severity: classifyOverdueSeverity(daysPastDue, task.priority),
    isOverdue: true,
  };
};

/**
 * Safely records a task-related activity without blocking the main request.
 * Any logging error is swallowed after being reported to the console so that
 * primary task operations continue unaffected.
 *
 * @param {Object} params - Parameters accepted by ActivityLog.logTaskActivity
 */
const recordTaskActivity = async (params) => {
  try {
    await ActivityLog.logTaskActivity(params);
  } catch (error) {
    console.error('Activity logging failed:', error.message);
  }
};

/**
 * Safely converts a variety of mongoose value shapes (documents, ObjectIds,
 * raw strings) into a string representation of the underlying identifier.
 *
 * @param {*} value - Candidate value to normalize
 * @returns {string|null}
 */
const normalizeObjectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === 'function') return value.toString();
  return String(value);
};

const PRIVILEGED_TASK_ROLES = new Set(['admin', 'moderator']);

/**
 * Checks whether the requesting user can manage (edit/delete) a task.
 *
 * @param {Object} task - Task mongoose document
 * @param {Object} user - Authenticated user details
 * @returns {boolean}
 */
const hasTaskManagementPermission = (task, user = {}) => {
  if (!task || !user) return false;
  if (PRIVILEGED_TASK_ROLES.has(user.role)) {
    return true;
  }

  const creatorId = normalizeObjectId(task.assignedBy);
  const requesterId = normalizeObjectId(user.userId);
  return creatorId && requesterId && creatorId === requesterId;
};

/**
 * Get All Tasks for User
 *
 * Retrieves all tasks assigned to or created by the authenticated user
 * with optional filtering by status, priority, and other criteria
 *
 * @async
 * @function getAllTasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      status,
      priority,
      role = 'both', // 'assignee', 'assignor', or 'both'
      category,
      tags,
      dueDate,
      overdue,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query options
    const options = {
      role,
      activeOnly: true,
    };

    if (status) options.status = status;

    // Build additional filters
    let additionalFilters = {};

    if (priority) {
      additionalFilters.priority = priority;
    }

    if (category) {
      additionalFilters.category = new RegExp(category, 'i');
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      additionalFilters.tags = { $in: tagArray };
    }

    if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        additionalFilters.dueDate = {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        };
      }
    }

    if (overdue === 'true') {
      additionalFilters.dueDate = { $lt: new Date() };
      additionalFilters.status = { $ne: 'done' };
    }

    // Get base tasks using the model method
    let tasks = await Task.findByUser(userId, options);
    const referenceDate = new Date();

    // Work with plain objects so we can annotate metadata consistently
    tasks = tasks.map(task => (typeof task.toObject === 'function' ? task.toObject() : task));

    // Apply additional filters
    if (Object.keys(additionalFilters).length > 0) {
      tasks = tasks.filter(task => {
        return Object.entries(additionalFilters).every(([key, value]) => {
          if (key === 'category' && value instanceof RegExp) {
            return value.test(task.category);
          }
          if (key === 'tags' && value.$in) {
            return task.tags.some(tag => value.$in.includes(tag));
          }
          if (key === 'dueDate' && typeof value === 'object') {
            if (value.$lt) return new Date(task.dueDate) < value.$lt;
            if (value.$gte && value.$lt) {
              return new Date(task.dueDate) >= value.$gte && new Date(task.dueDate) < value.$lt;
            }
          }
          if (key === 'status' && value.$ne) {
            return task.status !== value.$ne;
          }
          return task[key] === value;
        });
      });
    }

    // Attach overdue metadata so every consumer gets the same insights
    tasks = tasks.map(task => {
      const overdueMetadata = buildOverdueMetadata(task, referenceDate);
      if (overdueMetadata) {
        task.overdueMetadata = overdueMetadata;
        task.isOverdue = true;
      } else if (task.status !== 'done') {
        task.isOverdue = false;
      }
      return task;
    });

    // Sort tasks
    tasks.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === 'desc' ? -1 : 1;

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // Response metadata
    const totalTasks = tasks.length;
    const totalPages = Math.ceil(totalTasks / limit);

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks: paginatedTasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage: endIndex < totalTasks,
          hasPrevPage: page > 1,
        },
        filters: {
          status,
          priority,
          role,
          category,
          tags,
          dueDate,
          overdue,
        },
      },
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get Tasks by Status with Enhanced Filtering and Pagination
 *
 * Retrieves tasks for a specific status with comprehensive filtering, sorting,
 * and pagination support. This endpoint is optimized for Kanban board columns
 * where each status can have independent pagination and filtering.
 *
 * Features:
 * - Status-specific task retrieval (todo, in_progress, done)
 * - Independent pagination per status column
 * - Comprehensive filtering by priority, category, tags, due date
 * - Role-based filtering (assignee, assignor, both)
 * - Overdue task detection
 * - Flexible sorting options
 * - Search functionality across title, description, and tags
 * - Optimized for Kanban board user experience
 *
 * Query Parameters:
 * @param {string} status - Task status (todo, in_progress, done) - REQUIRED
 * @param {string} [priority] - Filter by priority (low, medium, high)
 * @param {string} [role=both] - User role filter ('assignee', 'assignor', 'both')
 * @param {string} [category] - Filter by category (case-insensitive partial match)
 * @param {string} [tags] - Comma-separated list of tags to filter by
 * @param {string} [dueDate] - Filter by specific due date (ISO format)
 * @param {boolean} [overdue] - Filter overdue tasks (true/false)
 * @param {string} [search] - Search term for title, description, and tags
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of tasks per page (max 100)
 * @param {string} [sortBy=updatedAt] - Sort field (createdAt, updatedAt, dueDate, priority, title)
 * @param {string} [sortOrder=desc] - Sort order (asc, desc)
 *
 * Response Format:
 * - tasks: Array of task objects with populated user data
 * - pagination: Complete pagination metadata
 * - filters: Applied filter summary
 * - statusMetadata: Status-specific information
 *
 * Use Cases:
 * - Kanban board column data loading
 * - Status-specific task management
 * - Independent column pagination
 * - Column-specific filtering and search
 * - Real-time status updates
 *
 * @async
 * @function getTasksByStatus
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.userId - User ID from JWT token
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with tasks, pagination, and metadata
 *
 * @example
 * // Get todo tasks for current user with pagination
 * GET /api/tasks/status?status=todo&page=1&limit=10
 *
 * @example
 * // Get in-progress high priority tasks
 * GET /api/tasks/status?status=in_progress&priority=high
 *
 * @example
 * // Search within done tasks
 * GET /api/tasks/status?status=done&search=project&sortBy=completedAt
 */
const getTasksByStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      status, // Required parameter
      priority,
      role = 'both', // 'assignee', 'assignor', or 'both'
      category,
      tags,
      dueDate,
      overdue,
      search,
      page = 1,
      limit = 10, // Smaller default for column-specific pagination
      sortBy = 'updatedAt', // Default to most recently updated
      sortOrder = 'desc',
    } = req.query;

    // Validate required status parameter
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status parameter is required',
        error: 'Please specify one of: todo, in_progress, done',
      });
    }

    // Validate status value
    const validStatuses = ['todo', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status parameter',
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page

    // Build base query options for the specific status
    const options = {
      role,
      activeOnly: true,
      status, // Always filter by the specified status
    };

    // Build additional filters for enhanced querying
    let additionalFilters = {};

    // Priority filter
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        additionalFilters.priority = priority;
      }
    }

    // Category filter (case-insensitive partial match)
    if (category) {
      additionalFilters.category = new RegExp(category, 'i');
    }

    // Tags filter (support multiple tags)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      additionalFilters.tags = { $in: tagArray };
    }

    // Due date filter (specific date)
    if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        additionalFilters.dueDate = {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Same day
        };
      }
    }

    // Overdue filter (only for non-done tasks)
    if (overdue === 'true' && status !== 'done') {
      additionalFilters.dueDate = { $lt: new Date() };
      additionalFilters.status = { $ne: 'done' };
    }

    // Get base tasks for the specified status using the model method
    let tasks = await Task.findByUser(userId, options);
    const referenceDate = new Date();

    tasks = tasks.map(task => (typeof task.toObject === 'function' ? task.toObject() : task));

    // Apply additional filters
    if (Object.keys(additionalFilters).length > 0) {
      tasks = tasks.filter(task => {
        return Object.entries(additionalFilters).every(([key, value]) => {
          if (key === 'category' && value instanceof RegExp) {
            return value.test(task.category || '');
          }
          if (key === 'tags' && value.$in) {
            return task.tags && task.tags.some(tag => value.$in.includes(tag.toLowerCase()));
          }
          if (key === 'dueDate' && typeof value === 'object') {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            if (value.$lt) return taskDate < value.$lt;
            if (value.$gte && value.$lt) {
              return taskDate >= value.$gte && taskDate < value.$lt;
            }
          }
          if (key === 'status' && value.$ne) {
            return task.status !== value.$ne;
          }
          return task[key] === value;
        });
      });
    }

    // Apply search filter across multiple fields
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      tasks = tasks.filter(task => {
        return (
          searchRegex.test(task.title || '') ||
          searchRegex.test(task.description || '') ||
          (task.tags && task.tags.some(tag => searchRegex.test(tag))) ||
          searchRegex.test(task.category || '')
        );
      });
    }

    // Attach overdue metadata to keep downstream consumers aligned
    tasks = tasks.map(task => {
      const overdueMetadata = buildOverdueMetadata(task, referenceDate);
      if (overdueMetadata) {
        task.overdueMetadata = overdueMetadata;
        task.isOverdue = true;
      } else if (task.status !== 'done') {
        task.isOverdue = false;
      }
      return task;
    });

    // Sort tasks with enhanced sorting options
    tasks.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'priority':
          // Sort by priority: high > medium > low
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'dueDate':
          // Handle null due dates (put them last)
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'daysPastDue':
          aValue = a.overdueMetadata?.daysPastDue || 0;
          bValue = b.overdueMetadata?.daysPastDue || 0;
          break;
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        default:
          // Default to date-based sorting
          aValue = new Date(a[sortBy] || a.createdAt);
          bValue = new Date(b[sortBy] || b.createdAt);
      }

      const multiplier = sortOrder === 'desc' ? -1 : 1;

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });

    // Calculate pagination
    const totalTasks = tasks.length;
    const totalPages = Math.ceil(totalTasks / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // Status-specific metadata
    const statusMetadata = {
      status,
      totalInStatus: totalTasks,
      currentPageCount: paginatedTasks.length,
      hasOverdue: status !== 'done' && paginatedTasks.some(task => task.overdueMetadata?.isOverdue),
    };

    // Enhanced response with comprehensive metadata
    res.status(200).json({
      success: true,
      message: `${status.replace('_', ' ')} tasks retrieved successfully`,
      data: {
        tasks: paginatedTasks,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalTasks,
          limit: limitNum,
          hasNextPage: endIndex < totalTasks,
          hasPrevPage: pageNum > 1,
          startIndex: startIndex + 1, // 1-based index for display
          endIndex: Math.min(endIndex, totalTasks), // 1-based index for display
        },
        filters: {
          status,
          priority,
          role,
          category,
          tags,
          dueDate,
          overdue,
          search,
          sortBy,
          sortOrder,
        },
        statusMetadata,
      },
    });
  } catch (error) {
    console.error(`Get tasks by status (${req.query.status}) error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks by status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get Task by ID
 *
 * Retrieves a specific task by its ID, ensuring the user has access to it
 *
 * @async
 * @function getTaskById
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
      isActive: true,
    })
      .populate('assignedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Create New Task
 *
 * Creates a new task with proper validation and user assignment
 *
 * @async
 * @function createTask
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createTask = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const {
      title,
      description,
      priority = 'medium',
      assignedTo,
      dueDate,
      tags = [],
      category = 'General',
      estimatedHours,
    } = req.body;

    // Validate assigned user exists
    const assigneeUser = await User.findById(assignedTo || userId);
    if (!assigneeUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found',
      });
    }

    // Create task data
    const taskData = {
      title: title.trim(),
      description: description?.trim() || '',
      priority,
      assignedBy: userId,
      assignedTo: assignedTo || userId, // Self-assign if no assignee specified
      tags: Array.isArray(tags) ? tags : [],
      category: category.trim(),
    };

    // Add optional fields
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format',
          code: 'INVALID_DUE_DATE_FORMAT'
        });
      }
      taskData.dueDate = parsedDate;
    }

    if (estimatedHours) {
      taskData.estimatedHours = parseFloat(estimatedHours);
    }

    // Create the task
    const task = new Task(taskData);
    await task.save();

    // Populate user references for response
    await task.populate('assignedBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

    // Log activity asynchronously (fire-and-forget)
    recordTaskActivity({
      task,
      performedBy: userId,
      action: 'task_created',
      description: `Created task "${task.title}"`,
      metadata: {
        priority: task.priority,
        dueDate: task.dueDate,
      },
      context: 'dashboard',
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Task validation failed',
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Update Task
 *
 * Updates an existing task with proper validation and access control
 *
 * @async
 * @function updateTask
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateTask = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { taskId } = req.params;
    const userId = req.user.userId?.toString();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find the task and ensure user has access
    const task = await Task.findOne({
      _id: taskId,
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has edit permission (creator, moderator, or admin)
    if (!hasTaskManagementPermission(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the task creator, moderators, or admins can edit this task.',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    const previousStatus = task.status;
    const previousAssignee = normalizeObjectId(task.assignedTo);

    // Extract update fields
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      tags,
      category,
      estimatedHours,
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    // Handle user assignment
    if (assignedTo !== undefined) {
      const assigneeUser = await User.findById(assignedTo);
      if (!assigneeUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found',
        });
      }
      updateData.assignedTo = assignedTo;
    }

    // Handle date fields
    if (dueDate !== undefined) {
      if (dueDate) {
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format',
            code: 'INVALID_DUE_DATE_FORMAT'
          });
        }
        updateData.dueDate = parsedDate;
      } else {
        updateData.dueDate = null;
      }
    }

    // Handle numeric fields
    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    }

    // Update the task
    Object.assign(task, updateData);
    if (status !== undefined && status !== previousStatus) {
      task.applyStatusTimerChange(previousStatus);
    }
    await task.save();

    // Populate user references for response
    await task.populate('assignedBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

    const changedFields = Object.keys(updateData);
    const currentAssignee = normalizeObjectId(task.assignedTo);

    if (status !== undefined && status !== previousStatus) {
      const isCompletion = task.status === 'done';
      recordTaskActivity({
        task,
        performedBy: userId,
        action: isCompletion ? 'task_completed' : 'task_status_changed',
        description: isCompletion
          ? `Completed task "${task.title}"`
          : `Moved task "${task.title}" to ${task.status.replace('_', ' ')}`,
        metadata: {
          previousStatus,
          newStatus: task.status,
        },
      });
    }

    if (assignedTo !== undefined && previousAssignee !== currentAssignee) {
      recordTaskActivity({
        task,
        performedBy: userId,
        action: 'task_reassigned',
        description: `Reassigned task "${task.title}"`,
        metadata: {
          previousAssignee,
          newAssignee: currentAssignee,
        },
      });
    }

    const genericFields = changedFields.filter(
      field => !['status', 'assignedTo'].includes(field)
    );

    if (genericFields.length > 0) {
      recordTaskActivity({
        task,
        performedBy: userId,
        action: 'task_updated',
        description: `Updated ${genericFields.join(', ')} on "${task.title}"`,
        metadata: {
          changedFields: genericFields,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Task validation failed',
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Delete Task
 *
 * Soft deletes a task (sets isActive to false)
 *
 * @async
 * @function deleteTask
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId?.toString();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find the task
    const task = await Task.findOne({
      _id: taskId,
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!hasTaskManagementPermission(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the task creator, moderators, or admins can delete this task.',
      });
    }

    // Stop any running timer and soft delete the task
    task.pauseWorkTimer();
    task.isActive = false;
    await task.save();

    recordTaskActivity({
      task,
      performedBy: userId,
      action: 'task_deleted',
      description: `Archived task "${task.title}"`,
      metadata: { reason: 'user_deleted' },
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { taskId: task._id },
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Update Task Status
 *
 * Updates only the status of a task with proper validation
 *
 * @async
 * @function updateTaskStatus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateTaskStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find the task and ensure user has access
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    const previousStatus = task.status;

    // Update the status using the model method
    await task.updateStatus(status);

    // Populate user references for response
    await task.populate('assignedBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

    recordTaskActivity({
      task,
      performedBy: userId,
      action: status === 'done' ? 'task_completed' : 'task_status_changed',
      description: status === 'done'
        ? `Completed task "${task.title}"`
        : `Updated status of "${task.title}" to ${status.replace('_', ' ')}`,
      metadata: {
        previousStatus,
        newStatus: status,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get Task Statistics
 *
 * Retrieves task statistics for the authenticated user
 *
 * @async
 * @function getTaskStatistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getTaskStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get statistics using the model method
    const stats = await Task.getTaskStatistics(userId);

    res.status(200).json({
      success: true,
      message: 'Task statistics retrieved successfully',
      data: { statistics: stats },
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get Overdue Tasks
 *
 * Retrieves all overdue tasks for the authenticated user
 *
 * @async
 * @function getOverdueTasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const overdueTasks = await Task.findOverdueTasks(userId);

    res.status(200).json({
      success: true,
      message: 'Overdue tasks retrieved successfully',
      data: { 
        tasks: overdueTasks,
        count: overdueTasks.length,
      },
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get Overdue Tasks by Status
 *
 * Retrieves overdue tasks filtered by a specific status with comprehensive filtering,
 * sorting, and pagination support. This endpoint is specifically designed for
 * status-specific overdue task management and Kanban board overdue indicators.
 *
 * Features:
 * - Status-specific overdue task retrieval (todo, in_progress only)
 * - Overdue severity categorization (critical, high, medium, low)
 * - Days past due filtering for escalation management
 * - Enhanced filtering by priority, category, tags, and search
 * - Role-based filtering (assignee, assignor, both)
 * - Flexible sorting with overdue-specific options
 * - Independent pagination for status-based overdue management
 * - Detailed overdue metadata including severity analysis
 *
 * Overdue Severity Categories:
 * - Critical: 7+ days overdue OR high priority tasks 3+ days overdue
 * - High: 3-6 days overdue OR medium/high priority tasks 1-2 days overdue
 * - Medium: 1-2 days overdue for low priority tasks
 * - Low: Just overdue (same day)
 *
 * Query Parameters:
 * @param {string} status - Task status (todo, in_progress) - REQUIRED
 * @param {string} [priority] - Filter by priority (low, medium, high)
 * @param {string} [role=both] - User role filter ('assignee', 'assignor', 'both')
 * @param {string} [category] - Filter by category (case-insensitive partial match)
 * @param {string} [tags] - Comma-separated list of tags to filter by
 * @param {string} [search] - Search term for title, description, and tags
 * @param {number} [daysPast] - Filter tasks overdue by X days or more
 * @param {string} [severity] - Filter by overdue severity (critical, high, medium, low)
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of tasks per page (max 100)
 * @param {string} [sortBy=dueDate] - Sort field (dueDate, daysPastDue, priority, title, etc.)
 * @param {string} [sortOrder=asc] - Sort order (asc, desc)
 *
 * Response Format:
 * - tasks: Array of overdue task objects with populated user data and overdue metadata
 * - pagination: Complete pagination metadata
 * - overdueMetadata: Status-specific overdue analysis and severity breakdown
 * - filters: Applied filter summary
 *
 * @async
 * @function getOverdueTasksByStatus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getOverdueTasksByStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const {
      status, // Required parameter
      priority,
      role = 'both', // 'assignee', 'assignor', or 'both'
      category,
      tags,
      search,
      daysPast,
      severity,
      page = 1,
      limit = 10, // Smaller default for overdue-specific pagination
      sortBy = 'dueDate', // Default to due date for overdue tasks
      sortOrder = 'asc', // Ascending to show most overdue first
    } = req.query;

    // Build query options for Task.findByUser
    const options = {
      role,
      status, // Ensure we only get tasks of the specified status
      activeOnly: true,
    };

    // Additional filters for overdue-specific logic
    let additionalFilters = {
      // Base overdue filter: due date in the past and not done
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }, // Redundant but explicit
    };

    // Priority filter
    if (priority) {
      additionalFilters.priority = priority;
    }

    // Category filter (case-insensitive partial match)
    if (category) {
      additionalFilters.category = new RegExp(category, 'i');
    }

    // Tags filter (comma-separated string to array)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      additionalFilters.tags = { $in: tagArray };
    }

    // Days past due filter
    if (daysPast) {
      const daysPastNum = parseInt(daysPast);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysPastNum);
      additionalFilters.dueDate = { $lt: cutoffDate };
    }

    // Get base tasks for the specified status using the model method
    let tasks = await Task.findByUser(userId, options);

    // Apply additional filters
    if (Object.keys(additionalFilters).length > 0) {
      tasks = tasks.filter(task => {
        return Object.entries(additionalFilters).every(([key, value]) => {
          if (key === 'category' && value instanceof RegExp) {
            return value.test(task.category);
          }
          if (key === 'tags' && value.$in) {
            return task.tags.some(tag => value.$in.includes(tag));
          }
          if (key === 'dueDate' && typeof value === 'object') {
            if (value.$lt) return new Date(task.dueDate) < value.$lt;
          }
          if (key === 'status') {
            if (value.$ne) return task.status !== value.$ne;
          }
          return task[key] === value;
        });
      });
    }

    // Calculate overdue metadata for each task
    const now = new Date();
    tasks = tasks.map(task => {
      const taskObj = task.toObject();
      if (taskObj.dueDate) {
        const daysPastDue = Math.ceil((now - new Date(taskObj.dueDate)) / (1000 * 60 * 60 * 24));
        
        // Calculate overdue severity
        let calculatedSeverity = 'low';
        if (daysPastDue >= 7 || (taskObj.priority === 'high' && daysPastDue >= 3)) {
          calculatedSeverity = 'critical';
        } else if (daysPastDue >= 3 || ((taskObj.priority === 'medium' || taskObj.priority === 'high') && daysPastDue >= 1)) {
          calculatedSeverity = 'high';
        } else if (daysPastDue >= 1) {
          calculatedSeverity = 'medium';
        }

        taskObj.overdueMetadata = {
          daysPastDue,
          severity: calculatedSeverity,
          isOverdue: true,
        };
      }
      return taskObj;
    });

    // Apply severity filter if specified
    if (severity) {
      tasks = tasks.filter(task => task.overdueMetadata?.severity === severity);
    }

    // Apply search filter (title, description, tags)
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(task => {
        return (
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower)) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Sort tasks
    const sortOrderNum = sortOrder === 'desc' ? -1 : 1;
    tasks.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'daysPastDue':
          aVal = a.overdueMetadata?.daysPastDue || 0;
          bVal = b.overdueMetadata?.daysPastDue || 0;
          break;
        case 'dueDate':
          aVal = new Date(a.dueDate);
          bVal = new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
          break;
        default:
          aVal = new Date(a.dueDate);
          bVal = new Date(b.dueDate);
      }
      
      if (aVal < bVal) return -1 * sortOrderNum;
      if (aVal > bVal) return 1 * sortOrderNum;
      return 0;
    });

    // Calculate overdue severity breakdown
    const severityBreakdown = tasks.reduce((acc, task) => {
      const sev = task.overdueMetadata?.severity || 'low';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalTasks = tasks.length;
    const totalPages = Math.ceil(totalTasks / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // Overdue-specific metadata
    const overdueMetadata = {
      status,
      totalOverdueInStatus: totalTasks,
      currentPageCount: paginatedTasks.length,
      severityBreakdown,
      averageDaysPastDue: totalTasks > 0 
        ? Math.round(tasks.reduce((sum, task) => sum + (task.overdueMetadata?.daysPastDue || 0), 0) / totalTasks)
        : 0,
      criticalTasksCount: severityBreakdown.critical,
      oldestOverdueTask: totalTasks > 0 
        ? Math.max(...tasks.map(task => task.overdueMetadata?.daysPastDue || 0))
        : 0,
    };

    // Enhanced response with comprehensive overdue metadata
    res.status(200).json({
      success: true,
      message: `Overdue ${status.replace('_', ' ')} tasks retrieved successfully`,
      data: {
        tasks: paginatedTasks,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalTasks,
          tasksPerPage: limitNum,
          hasNextPage: endIndex < totalTasks,
          hasPrevPage: pageNum > 1,
          startIndex: startIndex + 1, // 1-based index for display
          endIndex: Math.min(endIndex, totalTasks), // 1-based index for display
        },
        filters: {
          status,
          priority,
          role,
          category,
          tags,
          search,
          daysPast,
          severity,
          sortBy,
          sortOrder,
        },
        overdueMetadata,
      },
    });
  } catch (error) {
    console.error(`Get overdue tasks by status (${req.query.status}) error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue tasks by status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  getAllTasks,
  getTasksByStatus,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStatistics,
  getOverdueTasks,
  getOverdueTasksByStatus,
};
