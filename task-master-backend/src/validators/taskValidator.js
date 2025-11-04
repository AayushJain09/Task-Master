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
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Due date must be in the future');
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
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, dueDate, priority, status, title'),

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

module.exports = {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskStatusUpdate,
  validateTaskId,
  validateTaskQuery,
  validateTaskSearch,
  validateBulkTaskOperation,
  validateTaskAssignment,
};