/**
 * Task Routes
 *
 * This module defines all the routes for task management operations.
 * It includes CRUD operations, filtering, statistics, and bulk operations.
 * 
 * Swagger documentation for these endpoints is located in swaggerDocs.js
 *
 * @module routes/taskRoutes
 */

const express = require('express');
const {
  getAllTasks,
  getTasksByStatus,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStatistics,
  getOverdueTasks,
} = require('../controllers/taskController');

const {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskStatusUpdate,
  validateTaskId,
  validateTaskQuery,
  validateTaskStatusQuery,
} = require('../validators/taskValidator');

const { authenticate } = require('../middleware/auth');
const { rateLimitStrict, rateLimitModerate } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/tasks - Get all tasks (documented in swaggerDocs.js)
router.get('/', authenticate, rateLimitModerate, validateTaskQuery, getAllTasks);

// GET /api/tasks/status - Get tasks by specific status with enhanced filtering (documented in swaggerDocs.js)
router.get('/status', authenticate, rateLimitModerate, validateTaskStatusQuery, getTasksByStatus);

// GET /api/tasks/statistics - Get task statistics (documented in swaggerDocs.js)
router.get('/statistics', authenticate, rateLimitModerate, getTaskStatistics);

// GET /api/tasks/overdue - Get overdue tasks (documented in swaggerDocs.js)
router.get('/overdue', authenticate, rateLimitModerate, getOverdueTasks);

// GET /api/tasks/:taskId - Get specific task (documented in swaggerDocs.js)
router.get('/:taskId', authenticate, rateLimitModerate, validateTaskId, getTaskById);

// POST /api/tasks - Create new task (documented in swaggerDocs.js)
router.post('/', authenticate, rateLimitStrict, validateTaskCreation, createTask);

// PUT /api/tasks/:taskId - Update task (documented in swaggerDocs.js)
router.put('/:taskId', authenticate, rateLimitStrict, validateTaskId, validateTaskUpdate, updateTask);

// PATCH /api/tasks/:taskId/status - Update task status (documented in swaggerDocs.js)
router.patch('/:taskId/status', authenticate, rateLimitStrict, validateTaskId, validateTaskStatusUpdate, updateTaskStatus);

// DELETE /api/tasks/:taskId - Delete task (documented in swaggerDocs.js)
router.delete('/:taskId', authenticate, rateLimitStrict, validateTaskId, deleteTask);

module.exports = router;