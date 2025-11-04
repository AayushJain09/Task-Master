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
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

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
      additionalFilters.dueDate = {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    if (overdue === 'true') {
      additionalFilters.dueDate = { $lt: new Date() };
      additionalFilters.status = { $ne: 'done' };
    }

    // Get base tasks using the model method
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
      taskData.dueDate = new Date(dueDate);
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
      actualHours,
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    // Handle user assignment (only assignor or admin can reassign)
    if (assignedTo !== undefined && task.assignedBy.toString() === userId) {
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
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Handle numeric fields
    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    }

    if (actualHours !== undefined) {
      updateData.actualHours = parseFloat(actualHours) || 0;
    }

    // Update the task
    Object.assign(task, updateData);
    await task.save();

    // Populate user references for response
    await task.populate('assignedBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

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
    const userId = req.user.userId;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find the task and ensure user has delete permission (only assignor can delete)
    const task = await Task.findOne({
      _id: taskId,
      assignedBy: userId, // Only the creator can delete
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or permission denied',
      });
    }

    // Soft delete the task
    task.isActive = false;
    await task.save();

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

    // Update the status using the model method
    await task.updateStatus(status);

    // Populate user references for response
    await task.populate('assignedBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

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

    // Get overdue tasks count
    const overdueTasks = await Task.findOverdueTasks(userId);
    stats.overdue = overdueTasks.length;

    // Calculate completion rate
    stats.completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

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

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStatistics,
  getOverdueTasks,
};