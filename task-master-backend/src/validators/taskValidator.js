/**
 * Task Validation Rules
 *
 * This module contains validation rules for task-related operations using express-validator.
 * It provides comprehensive validation for task creation, updates, and queries.
 *
 * @module validators/taskValidator
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Task Creation Validation Rules
 *
 * Validates the request body for creating a new task
 */
const validateTaskCreation = [
  // Task title validation
  body('title')
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters')
    .trim()
    .escape(),

  // Task description validation (optional)
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Task description cannot exceed 2000 characters')
    .trim()
    .escape(),

  // Priority validation
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  // Assigned user validation (optional, defaults to current user)
  body('assignedTo')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format for assignedTo');
      }
      return true;
    }),

  // Due date validation
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .custom((value) => {
      const dueDate = new Date(value);
      
      // Check if the date is valid
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format');
      }
      
      // Use a more lenient date comparison - allow dates from 24 hours ago
      // This accounts for timezone differences between client and server
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Allow dates from yesterday onwards (very permissive)
      if (dueDate < yesterday) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),

  // Tags validation
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),

  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string')
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .trim()
    .escape(),

  // Category validation
  body('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),

  // Estimated hours validation
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),
];

/**
 * Task Update Validation Rules
 *
 * Validates the request body for updating an existing task
 */
const validateTaskUpdate = [
  // Task title validation (optional for updates)
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters')
    .trim()
    .escape(),

  // Task description validation (optional)
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Task description cannot exceed 2000 characters')
    .trim()
    .escape(),

  // Status validation
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),

  // Priority validation
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  // Assigned user validation
  body('assignedTo')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format for assignedTo');
      }
      return true;
    }),

  // Due date validation
  body('dueDate')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true; // Allow clearing due date
      }
      if (!Date.parse(value)) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),

  // Tags validation
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),

  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string')
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .trim()
    .escape(),

  // Category validation
  body('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),

  // Estimated hours validation
  body('estimatedHours')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true; // Allow clearing estimated hours
      }
      const hours = parseFloat(value);
      if (isNaN(hours) || hours < 0.1 || hours > 1000) {
        throw new Error('Estimated hours must be between 0.1 and 1000');
      }
      return true;
    }),

  // Actual hours validation
  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Actual hours must be between 0 and 1000'),
];

/**
 * Task Status Update Validation Rules
 *
 * Validates the request body for updating only the task status
 */
const validateTaskStatusUpdate = [
  // Status validation (required for status updates)
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),
];

/**
 * Task ID Parameter Validation
 *
 * Validates the task ID in URL parameters
 */
const validateTaskId = [
  param('taskId')
    .notEmpty()
    .withMessage('Task ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid task ID format');
      }
      return true;
    }),
];

/**
 * Task Query Parameters Validation
 *
 * Validates query parameters for task filtering and pagination
 */
const validateTaskQuery = [
  // Status filter validation
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),

  // Priority filter validation
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  // Role filter validation
  query('role')
    .optional()
    .isIn(['assignee', 'assignor', 'both'])
    .withMessage('Role must be one of: assignee, assignor, both'),

  // Category filter validation
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),

  // Tags filter validation
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  // Due date filter validation
  query('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  // Overdue filter validation
  query('overdue')
    .optional()
    .isBoolean()
    .withMessage('Overdue must be a boolean value'),

  // Pagination validation
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  // Sorting validation
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title', 'daysPastDue'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, dueDate, priority, status, title, daysPastDue'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

/**
 * Task Search Validation Rules
 *
 * Validates search query parameters
 */
const validateTaskSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
    .escape(),

  query('searchFields')
    .optional()
    .isArray()
    .withMessage('Search fields must be an array'),

  query('searchFields.*')
    .optional()
    .isIn(['title', 'description', 'tags', 'category'])
    .withMessage('Search fields must be one of: title, description, tags, category'),
];

/**
 * Task Status Query Validation Rules
 *
 * Validates query parameters specifically for the getTasksByStatus endpoint
 * where status is a required parameter, with comprehensive filtering options.
 * 
 * This validator is optimized for Kanban board column-specific queries
 * where each column represents a specific status and requires independent
 * pagination and filtering capabilities.
 *
 * Required Parameters:
 * @param {string} status - Task status (todo, in_progress, done) - REQUIRED
 *
 * Optional Parameters:
 * @param {string} [priority] - Filter by priority (low, medium, high)
 * @param {string} [role] - User role filter ('assignee', 'assignor', 'both')
 * @param {string} [category] - Category filter (case-insensitive partial match)
 * @param {string} [tags] - Comma-separated tags for filtering
 * @param {string} [dueDate] - Specific due date filter (ISO 8601 format)
 * @param {boolean} [overdue] - Filter overdue tasks
 * @param {string} [search] - Search term for multiple fields
 * @param {number} [page] - Page number for pagination (min: 1)
 * @param {number} [limit] - Items per page (min: 1, max: 100)
 * @param {string} [sortBy] - Sort field
 * @param {string} [sortOrder] - Sort direction (asc, desc)
 *
 * Use Cases:
 * - Kanban board column data loading
 * - Status-specific task filtering
 * - Column-independent pagination
 * - Real-time status-based updates
 */
const validateTaskStatusQuery = [
  // Status validation - REQUIRED for this endpoint
  query('status')
    .notEmpty()
    .withMessage('Status parameter is required')
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),

  // Priority filter validation
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  // Role filter validation
  query('role')
    .optional()
    .isIn(['assignee', 'assignor', 'both'])
    .withMessage('Role must be one of: assignee, assignor, both'),

  // Category filter validation
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),

  // Tags filter validation (comma-separated string)
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
    .isLength({ max: 200 })
    .withMessage('Tags string cannot exceed 200 characters'),

  // Due date filter validation
  query('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  // Overdue filter validation
  query('overdue')
    .optional()
    .isBoolean()
    .withMessage('Overdue must be a boolean value (true/false)'),

  // Search functionality validation
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
    .escape(),

  // Pagination validation - optimized for column-specific pagination
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  // Enhanced sorting validation for status-specific queries
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'completedAt', 'daysPastDue'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, dueDate, priority, title, completedAt, daysPastDue'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

/**
 * Bulk Task Operation Validation
 *
 * Validates bulk operations on multiple tasks
 */
const validateBulkTaskOperation = [
  body('taskIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Task IDs must be an array with 1 to 50 items'),

  body('taskIds.*')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Each task ID must be a valid ObjectId');
      }
      return true;
    }),

  body('operation')
    .notEmpty()
    .withMessage('Operation is required')
    .isIn(['delete', 'updateStatus', 'updatePriority', 'addTag', 'removeTag'])
    .withMessage('Operation must be one of: delete, updateStatus, updatePriority, addTag, removeTag'),

  // Conditional validation based on operation
  body('status')
    .if(body('operation').equals('updateStatus'))
    .notEmpty()
    .withMessage('Status is required for updateStatus operation')
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),

  body('priority')
    .if(body('operation').equals('updatePriority'))
    .notEmpty()
    .withMessage('Priority is required for updatePriority operation')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  body('tag')
    .if(body('operation').isIn(['addTag', 'removeTag']))
    .notEmpty()
    .withMessage('Tag is required for tag operations')
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters')
    .trim()
    .escape(),
];

/**
 * Task Assignment Validation
 *
 * Validates task assignment operations
 */
const validateTaskAssignment = [
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned user ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format for assignedTo');
      }
      return true;
    }),

  body('reassignMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reassignment message cannot exceed 500 characters')
    .trim()
    .escape(),
];

/**
 * Overdue Tasks by Status Query Validation Rules
 *
 * Validates query parameters specifically for the getOverdueTasksByStatus endpoint
 * where status is a required parameter for retrieving overdue tasks within a specific status.
 * 
 * This validator is optimized for status-specific overdue task queries with comprehensive
 * filtering options, useful for Kanban board overdue indicators and status-specific
 * overdue task management.
 *
 * Required Parameters:
 * @param {string} status - Task status (todo, in_progress) - REQUIRED (done tasks cannot be overdue)
 *
 * Optional Parameters:
 * @param {string} [priority] - Filter by priority (low, medium, high)
 * @param {string} [role] - User role filter ('assignee', 'assignor', 'both')
 * @param {string} [category] - Category filter (case-insensitive partial match)
 * @param {string} [tags] - Comma-separated tags for filtering
 * @param {string} [search] - Search term for multiple fields
 * @param {number} [page] - Page number for pagination (min: 1)
 * @param {number} [limit] - Items per page (min: 1, max: 100)
 * @param {string} [sortBy] - Sort field
 * @param {string} [sortOrder] - Sort direction (asc, desc)
 * @param {number} [daysPast] - Only include tasks overdue by X days or more
 * @param {string} [severity] - Filter by overdue severity (critical, high, medium, low)
 *
 * Use Cases:
 * - Kanban board overdue task indicators
 * - Status-specific overdue task management
 * - Overdue task severity analysis
 * - Deadline management and escalation
 */
const validateOverdueTasksByStatusQuery = [
  // Status validation - REQUIRED for this endpoint (done tasks cannot be overdue)
  query('status')
    .notEmpty()
    .withMessage('Status parameter is required for overdue tasks')
    .isIn(['todo', 'in_progress'])
    .withMessage('Status must be todo or in_progress (done tasks cannot be overdue)'),

  // Priority filter validation
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  // Role filter validation
  query('role')
    .optional()
    .isIn(['assignee', 'assignor', 'both'])
    .withMessage('Role must be one of: assignee, assignor, both'),

  // Category filter validation
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),

  // Tags filter validation (comma-separated string)
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
    .isLength({ max: 200 })
    .withMessage('Tags string cannot exceed 200 characters'),

  // Search functionality validation
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
    .escape(),

  // Days past validation - filter tasks overdue by specific number of days
  query('daysPast')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Days past must be an integer between 0 and 365'),

  // Severity filter validation - categorizes overdue tasks by severity
  query('severity')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low'])
    .withMessage('Severity must be one of: critical, high, medium, low'),

  // Pagination validation - optimized for overdue task management
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  // Enhanced sorting validation for overdue-specific queries
  query('sortBy')
    .optional()
    .isIn(['dueDate', 'createdAt', 'updatedAt', 'priority', 'title', 'daysPastDue'])
    .withMessage('Sort by must be one of: dueDate, createdAt, updatedAt, priority, title, daysPastDue'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

module.exports = {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskStatusUpdate,
  validateTaskId,
  validateTaskQuery,
  validateTaskStatusQuery,
  validateTaskSearch,
  validateBulkTaskOperation,
  validateTaskAssignment,
  validateOverdueTasksByStatusQuery,
};
