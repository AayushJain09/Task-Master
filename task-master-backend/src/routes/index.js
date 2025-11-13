/**
 * Routes Index
 *
 * This module aggregates and exports all API routes.
 * It serves as the central routing configuration for the application.
 *
 * @module routes/index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const reminderRoutes = require('./reminderRoutes');
const dashboardRoutes = require('./dashboardRoutes');

/**
 * Health Check Endpoint
 *
 * Simple endpoint to check if the API is running.
 * Useful for monitoring and load balancer health checks.
 *
 * @route   GET /api/v1/health
 * @access  Public
 *
 * Response:
 * {
 *   success: true,
 *   message: "API is running",
 *   timestamp: "2024-01-01T00:00:00.000Z",
 *   uptime: 123.456
 * }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Favicon placeholder
 *
 * Prevents noisy 404 logs from browsers requesting /favicon.ico.
 */
router.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

/**
 * API Information Endpoint
 *
 * Provides basic information about the API including version,
 * available endpoints, and documentation links.
 *
 * @route   GET /api/v1
 * @access  Public
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     name: "Task Master API",
 *     version: "1.0.0",
 *     description: "...",
 *     endpoints: {...}
 *   }
 * }
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Task Master API',
      version: '1.0.0',
      description: 'RESTful API for Task Master application with JWT authentication',
      endpoints: {
        health: '/health',
        auth: '/auth',
        users: '/users',
        tasks: '/tasks',
        reminders: '/reminders',
        dashboard: '/dashboard',
      },
      documentation: 'See README.md for detailed API documentation',
    },
  });
});

/**
 * Mount route modules
 *
 * All authentication-related routes are prefixed with /auth
 * Example: POST /api/v1/auth/register
 *
 * All user management routes are prefixed with /users
 * Example: GET /api/v1/users
 *
 * All task management routes are prefixed with /tasks
 * Example: GET /api/v1/tasks
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/reminders', reminderRoutes);
router.use('/dashboard', dashboardRoutes);

/**
 * Add more route modules here as your application grows
 * Examples:
 * router.use('/projects', projectRoutes);
 * router.use('/teams', teamRoutes);
 */

module.exports = router;
