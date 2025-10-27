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
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

/**
 * Add more route modules here as your application grows
 * Examples:
 * router.use('/tasks', taskRoutes);
 * router.use('/projects', projectRoutes);
 */

module.exports = router;
