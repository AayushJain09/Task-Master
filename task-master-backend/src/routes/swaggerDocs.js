/** 
 * Swagger API Documentation
 *
 * This file contains all OpenAPI/Swagger annotations for the API endpoints.
 * These annotations are used by swagger-jsdoc to generate the API documentation.
 *
 * @module routes/swaggerDocs
 */

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: List reminders with advanced filtering
 *     description: |
 *       Retrieves reminders for the authenticated user with filters for date range, category,
 *       priority, and status. Supports tag-based filtering, free-text search, and pagination so the
 *       client can build grouped day views or analytic widgets.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Inclusive lower bound for scheduledAt filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Inclusive upper bound for scheduledAt filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug (e.g., work, personal)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to match (case-insensitive)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search across title, description, tags, and notes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Reminders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Reminder'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a reminder
 *     description: Creates a reminder with explicit scheduling data. Use this when the user fills a structured form.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reminder'
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /reminders/quick-add:
 *   post:
 *     summary: Quick add reminder via natural language input
 *     description: Parses natural language text (e.g., "call Alex next Tue 3p") and creates a reminder.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input]
 *             properties:
 *               input:
 *                 type: string
 *                 example: "Send sprint recap next Mon 9a"
 *               timezone:
 *                 type: string
 *                 example: "America/Chicago"
 *               defaults:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     example: work
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high, critical]
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   clientReference:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       device:
 *                         type: string
 *     responses:
 *       201:
 *         description: Reminder created from quick-add text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /reminders/{reminderId}:
 *   patch:
 *     summary: Update a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reminder'
 *     responses:
 *       200:
 *         description: Reminder updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Soft delete a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Reminder deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /reminders/sync:
 *   post:
 *     summary: Synchronize offline reminders
 *     description: |
 *       Applies offline changes captured on the client and returns the set of reminders that
 *       changed server-side since the provided lastSyncAt timestamp. Enables offline-first storage and
 *       conflict resolution workflows.
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId]
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: Device identifier sending the sync request
 *               lastSyncAt:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of the last successful sync
 *               changes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReminderSyncChange'
 *     responses:
 *       200:
 *         description: Sync finished
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ReminderSyncResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with email and password. Returns JWT tokens upon successful registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates user with email and password. Returns JWT tokens upon successful login.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid login credentials
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid refresh token
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user (single device)
 *     description: Invalidates the provided refresh token, logging the user out from the current device.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Invalidates all refresh tokens for the user, logging them out from all devices.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information (first name and/or last name only).
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Changes the authenticated user's password. Requires current password verification. Invalidates all refresh tokens.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully. Please login again.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Current password is incorrect
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     description: Returns the health status of the API, including uptime and timestamp.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-01T00:00:00.000Z
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 123.456
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Fetches all users with pagination, filtering, and search. Admin only.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *                         totalItems:
 *                           type: integer
 *                           example: 50
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Access denied. Insufficient permissions.
 */

/**
 * @swagger
 * /users/assignable:
 *   get:
 *     summary: Get assignable users
 *     description: Fetches users that can be assigned to tasks. Returns limited user information for task assignment purposes. Available to all authenticated users.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search by name or email
 *         example: "john doe"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of results to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip for pagination
 *       - in: query
 *         name: excludeCurrentUser
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Exclude current user from results
 *     responses:
 *       200:
 *         description: Assignable users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssignableUser'
 *                     total:
 *                       type: integer
 *                       description: Total number of matching users
 *                       example: 25
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more results available
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Access denied. Insufficient permissions.
 */

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns statistics about users in the system. Admin only.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 100
 *                     activeUsers:
 *                       type: integer
 *                       example: 85
 *                     inactiveUsers:
 *                       type: integer
 *                       example: 15
 *                     usersByRole:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: integer
 *                           example: 90
 *                         admin:
 *                           type: integer
 *                           example: 5
 *                         moderator:
 *                           type: integer
 *                           example: 5
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Fetches a specific user by ID. Admin can view any user, users can view their own profile.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Can only view own profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Access denied. You can only view your own profile.
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Activate or deactivate a user account. Admin only.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status
 *                 example: false
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: You cannot deactivate your own account
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     description: Changes a user's role in the system. Admin only.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, moderator]
 *                 description: New role
 *                 example: moderator
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: You cannot change your own role
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Permanently deletes a user from the system. Admin only.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: You cannot delete your own account
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /auth/biometric/login:
 *   post:
 *     summary: Login with biometric authentication
 *     description: Authenticates user using biometric credentials. Returns JWT tokens upon successful authentication.
 *     tags: [Biometric]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BiometricCredentials'
 *     responses:
 *       200:
 *         description: Biometric login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Invalid biometric credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid biometric credentials
 *       403:
 *         description: Biometric authentication disabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Biometric authentication is disabled for this account
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Account not found
 */

/**
 * @swagger
 * /auth/biometric/setup:
 *   post:
 *     summary: Setup biometric authentication
 *     description: Enables biometric authentication for the authenticated user and returns biometric token.
 *     tags: [Biometric]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biometric setup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BiometricSetupResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication required
 *       409:
 *         description: Biometric already enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Biometric authentication is already enabled
 */

/**
 * @swagger
 * /auth/biometric/disable:
 *   post:
 *     summary: Disable biometric authentication
 *     description: Disables biometric authentication for the authenticated user.
 *     tags: [Biometric]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biometric authentication disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Biometric authentication disabled successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication required
 *       404:
 *         description: Biometric not enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Biometric authentication is not enabled
 */

/**
 * @swagger
 * /auth/biometric/status:
 *   get:
 *     summary: Get biometric authentication status
 *     description: Returns the current biometric authentication status for the authenticated user.
 *     tags: [Biometric]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biometric status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BiometricStatusResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication required
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     description: Retrieves all tasks assigned to or created by the authenticated user with advanced filtering, pagination, and sorting capabilities.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Filter tasks by status
 *         example: todo
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter tasks by priority level
 *         example: high
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [assignee, assignor, both]
 *           default: both
 *         description: Filter by user role in task relationship
 *         example: assignee
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter tasks by category
 *         example: Development
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated list)
 *         example: "bug,frontend,urgent"
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks by specific due date
 *         example: "2024-12-31"
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filter to show only overdue tasks
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of tasks per page
 *         example: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, status, title]
 *           default: createdAt
 *         description: Field to sort by
 *         example: dueDate
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: asc
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tasks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalTasks:
 *                           type: integer
 *                           example: 87
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     filters:
 *                       type: object
 *                       description: Applied filters for reference
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: todo
 *                         priority:
 *                           type: string
 *                           example: high
 *                         role:
 *                           type: string
 *                           example: assignee
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task with comprehensive validation and automatic assignment handling.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Task title (required)
 *                 example: "Design new landing page"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Detailed task description
 *                 example: "Create wireframes and mockups for the new landing page with modern design principles"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Task priority level
 *                 example: high
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign task to (defaults to current user if not specified)
 *                 example: "507f1f77bcf86cd799439013"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date (must be in the future)
 *                 example: "2024-12-31T23:59:59.000Z"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 30
 *                 maxItems: 10
 *                 description: Tags for task categorization
 *                 example: ["design", "ui", "landing", "urgent"]
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 default: "General"
 *                 description: Task category
 *                 example: "Design"
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: Estimated hours to complete the task
 *                 example: 8.5
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Assigned user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Assigned user not found"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tasks/status:
 *   get:
 *     summary: Get tasks by specific status with enhanced filtering and pagination
 *     description: |
 *       Retrieves tasks for a specific status (todo, in_progress, or done) with comprehensive
 *       filtering, sorting, and pagination support. This endpoint is optimized for Kanban board
 *       columns where each status requires independent pagination and filtering capabilities.
 *       
 *       **Key Features:**
 *       - Status-specific task retrieval (required parameter)
 *       - Independent pagination per status column
 *       - Enhanced filtering by priority, category, tags, due date
 *       - Role-based filtering (assignee, assignor, both)
 *       - Overdue task detection (for non-done status)
 *       - Full-text search across title, description, tags, and category
 *       - Flexible sorting with multiple field options
 *       - Status-specific metadata including overdue detection
 *       
 *       **Use Cases:**
 *       - Kanban board column data loading
 *       - Status-specific task management interfaces
 *       - Column-independent pagination and filtering
 *       - Real-time status-based updates
 *       - Mobile-optimized smaller page sizes
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Task status to filter by (REQUIRED)
 *         example: todo
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter tasks by priority level
 *         example: high
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [assignee, assignor, both]
 *           default: both
 *         description: Filter by user role in task relationship
 *         example: assignee
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter tasks by category (case-insensitive partial match)
 *         example: Development
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Filter by tags (comma-separated list)
 *         example: "bug,frontend,urgent"
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks by specific due date (ISO 8601 format)
 *         example: "2024-12-31"
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filter to show only overdue tasks (ignored for done status)
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for title, description, tags, and category
 *         example: "project deadline"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page (smaller default for column optimization)
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, title, completedAt]
 *           default: updatedAt
 *         description: Field to sort by (default to most recently updated)
 *         example: dueDate
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: asc
 *     responses:
 *       200:
 *         description: Status-specific tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "todo tasks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                       description: Array of tasks for the specified status
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalTasks:
 *                           type: integer
 *                           example: 25
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                         startIndex:
 *                           type: integer
 *                           example: 1
 *                           description: 1-based start index for display
 *                         endIndex:
 *                           type: integer
 *                           example: 10
 *                           description: 1-based end index for display
 *                       description: Comprehensive pagination metadata for column display
 *                     filters:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "todo"
 *                         priority:
 *                           type: string
 *                           example: "high"
 *                         role:
 *                           type: string
 *                           example: "both"
 *                         category:
 *                           type: string
 *                           example: "Development"
 *                         tags:
 *                           type: string
 *                           example: "bug,urgent"
 *                         dueDate:
 *                           type: string
 *                           example: "2024-12-31"
 *                         overdue:
 *                           type: string
 *                           example: "true"
 *                         search:
 *                           type: string
 *                           example: "project"
 *                         sortBy:
 *                           type: string
 *                           example: "updatedAt"
 *                         sortOrder:
 *                           type: string
 *                           example: "desc"
 *                       description: Summary of applied filters for debugging
 *                     statusMetadata:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "todo"
 *                           description: The requested status
 *                         totalInStatus:
 *                           type: integer
 *                           example: 25
 *                           description: Total tasks matching all filters for this status
 *                         currentPageCount:
 *                           type: integer
 *                           example: 10
 *                           description: Number of tasks in current page
 *                         hasOverdue:
 *                           type: boolean
 *                           example: true
 *                           description: Whether current page contains overdue tasks
 *                       description: Status-specific metadata for enhanced UI display
 *       400:
 *         description: Bad request - Missing or invalid status parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Status parameter is required"
 *                 error:
 *                   type: string
 *                   example: "Please specify one of: todo, in_progress, done"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     examples:
 *       get_todo_tasks:
 *         summary: Get todo tasks with pagination
 *         value:
 *           url: "/api/tasks/status?status=todo&page=1&limit=10"
 *           description: "Get the first 10 todo tasks for the user"
 *       get_high_priority_in_progress:
 *         summary: Get high priority in-progress tasks
 *         value:
 *           url: "/api/tasks/status?status=in_progress&priority=high&sortBy=dueDate"
 *           description: "Get high priority in-progress tasks sorted by due date"
 *       search_done_tasks:
 *         summary: Search within completed tasks
 *         value:
 *           url: "/api/tasks/status?status=done&search=project&sortBy=completedAt&sortOrder=desc"
 *           description: "Search for 'project' within completed tasks, sorted by completion date"
 *       overdue_todo_tasks:
 *         summary: Get overdue todo tasks
 *         value:
 *           url: "/api/tasks/status?status=todo&overdue=true&sortBy=dueDate&sortOrder=asc"
 *           description: "Get overdue todo tasks sorted by due date (earliest first)"
 */

/**
 * @swagger
 * /tasks/statistics:
 *   get:
 *     summary: Get task statistics for the authenticated user
 *     description: Retrieves comprehensive task statistics including counts by status, completion rates, and productivity metrics.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       $ref: '#/components/schemas/TaskStatistics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /dashboard/analytics:
 *   get:
 *     summary: Get advanced dashboard analytics for the authenticated user
 *     description: Provides datasets used for analytics charts, including weekly progress, velocity trends, and cycle time stats.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard analytics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userContext:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65fe20dd54a5d5a3171f54f8'
 *                         role:
 *                           type: string
 *                           example: 'user'
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalTasks:
 *                               type: integer
 *                             openTasks:
 *                               type: integer
 *                             completedTasks:
 *                               type: integer
 *                             overdueTasks:
 *                               type: integer
 *                             upcomingTasks:
 *                               type: integer
 *                         statusDistribution:
 *                           type: object
 *                         priorityDistribution:
 *                           type: object
 *                         weeklyProgress:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 example: '2024-04-02'
 *                               label:
 *                                 type: string
 *                                 example: 'Tue'
 *                               created:
 *                                 type: integer
 *                               completed:
 *                                 type: integer
 *                         velocityTrend:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               week:
 *                                 type: integer
 *                               year:
 *                                 type: integer
 *                               completed:
 *                                 type: integer
 *                         cycleTime:
 *                           type: object
 *                           properties:
 *                             averageDays:
 *                               type: number
 *                               example: 2.5
 *                             fastestDays:
 *                               type: number
 *                               example: 0.5
 *                             slowestDays:
 *                               type: number
 *                               example: 6
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     summary: Get overdue tasks for the authenticated user
 *     description: Retrieves all tasks that are past their due date and not yet completed.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Overdue tasks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     count:
 *                       type: integer
 *                       description: Number of overdue tasks
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get a specific task by ID
 *     description: Retrieves detailed information about a specific task. User must have access to the task (either assigned to them or created by them).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid task ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid task ID format"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Task not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Task not found or access denied"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Update a task
 *     description: Updates an existing task with comprehensive validation. Users can update tasks assigned to them or created by them.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Updated task title
 *                 example: "Updated task title"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Updated task description
 *                 example: "Updated detailed description of the task"
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *                 description: Task status
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Task priority level
 *                 example: high
 *               assignedTo:
 *                 type: string
 *                 description: User ID to reassign task to (only assignor can reassign)
 *                 example: "507f1f77bcf86cd799439013"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated due date (can be null to remove due date)
 *                 example: "2024-12-31T23:59:59.000Z"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 30
 *                 maxItems: 10
 *                 description: Updated tags array
 *                 example: ["design", "ui", "responsive"]
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 description: Updated category
 *                 example: "Frontend"
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: Updated estimated hours
 *                 example: 12.5
 *               actualHours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *                 description: Actual hours spent on the task
 *                 example: 8.25
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Task not found, access denied, or assigned user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               taskNotFound:
 *                 value:
 *                   success: false
 *                   message: "Task not found or access denied"
 *               userNotFound:
 *                 value:
 *                   success: false
 *                   message: "Assigned user not found"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Delete a task (soft delete)
 *     description: Soft deletes a task by setting isActive to false. Only the task creator (assignor) can delete tasks.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: ID of the deleted task
 *                       example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Invalid task ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid task ID format"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Task not found or permission denied (only creator can delete)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Task not found or permission denied"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tasks/{taskId}/status:
 *   patch:
 *     summary: Update task status only
 *     description: Updates only the status of a task with automatic completion timestamp handling. More efficient than full task update.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *                 description: New task status
 *                 example: done
 *           examples:
 *             markComplete:
 *               summary: Mark task as completed
 *               value:
 *                 status: done
 *             startWork:
 *               summary: Start working on task
 *               value:
 *                 status: in_progress
 *             moveToBacklog:
 *               summary: Move back to todo
 *               value:
 *                 status: todo
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Task not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Task not found or access denied"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/tasks/overdue/status:
 *   get:
 *     summary: Get overdue tasks filtered by specific status
 *     description: |
 *       Retrieves overdue tasks filtered by a specific status (todo or in_progress) with comprehensive 
 *       filtering, sorting, and pagination support. This endpoint is specifically designed for 
 *       status-specific overdue task management and Kanban board overdue indicators.
 *       
 *       **Key Features:**
 *       - Status-specific overdue task retrieval (todo, in_progress only)
 *       - Overdue severity categorization (critical, high, medium, low)
 *       - Days past due filtering for escalation management
 *       - Enhanced filtering by priority, category, tags, and search
 *       - Role-based filtering (assignee, assignor, both)
 *       - Flexible sorting with overdue-specific options
 *       - Independent pagination for status-based overdue management
 *       - Detailed overdue metadata including severity analysis
 *       
 *       **Overdue Severity Categories:**
 *       - **Critical**: 7+ days overdue OR high priority tasks 3+ days overdue
 *       - **High**: 3-6 days overdue OR medium/high priority tasks 1-2 days overdue
 *       - **Medium**: 1-2 days overdue for low priority tasks
 *       - **Low**: Just overdue (same day)
 *       
 *       **Use Cases:**
 *       - Kanban board overdue task indicators
 *       - Status-specific overdue task management
 *       - Overdue task severity analysis
 *       - Deadline management and escalation
 *     tags: [Tasks - Overdue Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [todo, in_progress]
 *         description: Task status (done tasks cannot be overdue)
 *         example: todo
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *         example: high
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [assignee, assignor, both]
 *           default: both
 *         description: Filter by user role in relation to the task
 *         example: assignee
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by category (case-insensitive partial match)
 *         example: Development
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Comma-separated list of tags to filter by
 *         example: urgent,bug,frontend
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for title, description, and tags
 *         example: login issue
 *       - in: query
 *         name: daysPast
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 365
 *         description: Filter tasks overdue by X days or more
 *         example: 3
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *         description: Filter by overdue severity level
 *         example: critical
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *         example: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [dueDate, daysPastDue, priority, title, createdAt, updatedAt]
 *           default: dueDate
 *         description: Field to sort by
 *         example: daysPastDue
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (asc = most overdue first for dueDate)
 *         example: desc
 *     responses:
 *       200:
 *         description: Overdue tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Overdue todo tasks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Task'
 *                           - type: object
 *                             properties:
 *                               overdueMetadata:
 *                                 type: object
 *                                 properties:
 *                                   daysPastDue:
 *                                     type: integer
 *                                     description: Number of days past the due date
 *                                     example: 5
 *                                   severity:
 *                                     type: string
 *                                     enum: [critical, high, medium, low]
 *                                     description: Calculated overdue severity
 *                                     example: high
 *                                   isOverdue:
 *                                     type: boolean
 *                                     example: true
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *                     filters:
 *                       type: object
 *                       description: Applied filters for debugging
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: todo
 *                         priority:
 *                           type: string
 *                           example: high
 *                         role:
 *                           type: string
 *                           example: assignee
 *                         category:
 *                           type: string
 *                           example: Development
 *                         tags:
 *                           type: string
 *                           example: urgent,bug
 *                         search:
 *                           type: string
 *                           example: login
 *                         daysPast:
 *                           type: integer
 *                           example: 3
 *                         severity:
 *                           type: string
 *                           example: critical
 *                         sortBy:
 *                           type: string
 *                           example: daysPastDue
 *                         sortOrder:
 *                           type: string
 *                           example: desc
 *                     overdueMetadata:
 *                       type: object
 *                       description: Comprehensive overdue analysis for the current page and status
 *                       properties:
 *                         status:
 *                           type: string
 *                           description: The queried task status
 *                           example: todo
 *                         totalOverdueInStatus:
 *                           type: integer
 *                           description: Total number of overdue tasks in this status
 *                           example: 15
 *                         currentPageCount:
 *                           type: integer
 *                           description: Number of tasks in current page
 *                           example: 10
 *                         severityBreakdown:
 *                           type: object
 *                           description: Count of tasks by severity level
 *                           properties:
 *                             critical:
 *                               type: integer
 *                               example: 2
 *                             high:
 *                               type: integer
 *                               example: 5
 *                             medium:
 *                               type: integer
 *                               example: 6
 *                             low:
 *                               type: integer
 *                               example: 2
 *                         averageDaysPastDue:
 *                           type: integer
 *                           description: Average number of days past due for all overdue tasks
 *                           example: 4
 *                         criticalTasksCount:
 *                           type: integer
 *                           description: Number of critical severity tasks
 *                           example: 2
 *                         oldestOverdueTask:
 *                           type: integer
 *                           description: Days past due for the oldest overdue task
 *                           example: 14
 *             examples:
 *               critical_overdue_todos:
 *                 summary: Critical overdue todo tasks
 *                 description: Get all critical overdue todo tasks sorted by days past due
 *                 value:
 *                   success: true
 *                   message: "Overdue todo tasks retrieved successfully"
 *                   data:
 *                     tasks:
 *                       - id: "507f1f77bcf86cd799439011"
 *                         title: "Fix critical login bug"
 *                         description: "Users cannot login after password reset"
 *                         status: "todo"
 *                         priority: "high"
 *                         dueDate: "2024-11-01T23:59:59.999Z"
 *                         overdueMetadata:
 *                           daysPastDue: 6
 *                           severity: "critical"
 *                           isOverdue: true
 *                         assignedTo:
 *                           id: "507f1f77bcf86cd799439012"
 *                           firstName: "John"
 *                           lastName: "Doe"
 *                           email: "john@example.com"
 *                         assignedBy:
 *                           id: "507f1f77bcf86cd799439013"
 *                           firstName: "Jane"
 *                           lastName: "Smith"
 *                           email: "jane@example.com"
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 2
 *                       totalTasks: 15
 *                       tasksPerPage: 10
 *                       hasNextPage: true
 *                       hasPrevPage: false
 *                       startIndex: 1
 *                       endIndex: 10
 *                     overdueMetadata:
 *                       status: "todo"
 *                       totalOverdueInStatus: 15
 *                       currentPageCount: 10
 *                       severityBreakdown:
 *                         critical: 3
 *                         high: 5
 *                         medium: 4
 *                         low: 3
 *                       averageDaysPastDue: 5
 *                       criticalTasksCount: 3
 *                       oldestOverdueTask: 12
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_status:
 *                 summary: Invalid status parameter
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "status"
 *                       message: "Status must be todo or in_progress (done tasks cannot be overdue)"
 *               missing_status:
 *                 summary: Missing required status parameter
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "status"
 *                       message: "Status parameter is required for overdue tasks"
 *               invalid_severity:
 *                 summary: Invalid severity filter
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "severity"
 *                       message: "Severity must be one of: critical, high, medium, low"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     examples:
 *       get_critical_overdue_todos:
 *         summary: Get critical overdue todo tasks
 *         value:
 *           url: "/api/tasks/overdue/status?status=todo&severity=critical&sortBy=daysPastDue&sortOrder=desc"
 *           description: "Get critical overdue todo tasks, sorted by days past due (oldest first)"
 *       get_overdue_high_priority_in_progress:
 *         summary: Get overdue high priority in-progress tasks
 *         value:
 *           url: "/api/tasks/overdue/status?status=in_progress&priority=high&daysPast=2"
 *           description: "Get high priority in-progress tasks that are 2+ days overdue"
 *       search_overdue_dev_tasks:
 *         summary: Search overdue development tasks
 *         value:
 *           url: "/api/tasks/overdue/status?status=todo&category=Development&search=bug&sortBy=dueDate"
 *           description: "Search for overdue development tasks containing 'bug', sorted by due date"
 *       escalated_overdue_tasks:
 *         summary: Get tasks requiring escalation
 *         value:
 *           url: "/api/tasks/overdue/status?status=todo&daysPast=7&sortBy=daysPastDue&sortOrder=desc"
 *           description: "Get todo tasks that are 7+ days overdue for escalation"
 */

module.exports = {};
/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Get recent activity feed for the authenticated user
 *     description: Returns the latest actions (task creation, updates, status changes, etc.) visible to the current user for dashboard timelines.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *           maximum: 100
 *         description: Maximum number of activity entries to return
 *       - in: query
 *         name: actions
 *         schema:
 *           type: string
 *         description: Comma-separated list of action verbs to filter by (e.g., task_created,task_completed)
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recent activity retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userContext:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65fe20dd54a5d5a3171f54f8'
 *                         role:
 *                           type: string
 *                           example: 'user'
 *                     activities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActivityLogEntry'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                           example: 15
 *                         returned:
 *                           type: integer
 *                           example: 12
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics for the authenticated user
 *     description: Provides task breakdowns, overdue counts, and short-term productivity trends powering the home dashboard.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard metrics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userContext:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: 'user'
 *                     metrics:
 *                       $ref: '#/components/schemas/DashboardMetrics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
