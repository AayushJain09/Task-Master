/**
 * Swagger/OpenAPI Configuration
 *
 * This module configures Swagger UI and OpenAPI documentation
 * for the Task Master API.
 *
 * @module config/swagger
 */

const swaggerJsDoc = require('swagger-jsdoc');
const appConfig = require('./app');

/**
 * Swagger Definition
 *
 * OpenAPI 3.0 specification for the Task Master API
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Master API',
    version: '1.0.0',
    description: 'A robust Node.js Express.js backend with JWT authentication, comprehensive validation, and security features.',
    contact: {
      name: 'API Support',
      email: 'support@taskmaster.com',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: `http://localhost:${appConfig.server.port}${appConfig.server.apiPrefix}`,
      description: 'Development server',
    },
    {
      url: `https://api.taskmaster.com${appConfig.server.apiPrefix}`,
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Biometric',
      description: 'Biometric authentication endpoints',
    },
    {
      name: 'Profile',
      description: 'User profile management endpoints',
    },
    {
      name: 'User Management',
      description: 'Admin-only user management endpoints',
    },
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
    {
      name: 'Tasks',
      description: 'Task management endpoints including CRUD operations, assignment, filtering, and analytics',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          fullName: {
            type: 'string',
            description: 'User full name (virtual field)',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'moderator'],
            description: 'User role',
            example: 'user',
          },
          isActive: {
            type: 'boolean',
            description: 'Account active status',
            example: true,
          },
          isEmailVerified: {
            type: 'boolean',
            description: 'Email verification status',
            example: false,
          },
          biometricEnabled: {
            type: 'boolean',
            description: 'Biometric authentication status',
            example: false,
          },
          lastLogin: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
            example: '2024-01-01T00:00:00.000Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      BiometricCredentials: {
        type: 'object',
        required: ['email', 'biometricToken'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          biometricToken: {
            type: 'string',
            description: 'Biometric authentication token',
            example: 'biometric_token_123',
          },
        },
      },
      BiometricSetupResponse: {
        type: 'object',
        properties: {
          biometricToken: {
            type: 'string',
            description: 'Generated biometric token',
            example: 'biometric_token_123',
          },
          biometricEnabled: {
            type: 'boolean',
            description: 'Biometric status after setup',
            example: true,
          },
          setupTimestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Setup completion timestamp',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      BiometricStatusResponse: {
        type: 'object',
        properties: {
          biometricEnabled: {
            type: 'boolean',
            description: 'Current biometric status',
            example: false,
          },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (15 minutes)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (7 days)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 128,
            description: 'User password (min 8 chars, must contain letters and numbers)',
            example: 'Password123',
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            description: 'Password confirmation (must match password)',
            example: 'Password123',
          },
          firstName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User last name',
            example: 'Doe',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password',
            example: 'Password123',
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'Updated first name',
            example: 'Jane',
          },
          lastName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'Updated last name',
            example: 'Smith',
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            description: 'Current password',
            example: 'OldPassword123',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 128,
            description: 'New password (must be different from current)',
            example: 'NewPassword123',
          },
          confirmNewPassword: {
            type: 'string',
            format: 'password',
            description: 'New password confirmation',
            example: 'NewPassword123',
          },
        },
      },
      Task: {
        type: 'object',
        required: ['title', 'assignedBy', 'assignedTo'],
        properties: {
          _id: {
            type: 'string',
            description: 'Task ID (MongoDB ObjectId)',
            example: '507f1f77bcf86cd799439011',
          },
          title: {
            type: 'string',
            minLength: 3,
            maxLength: 200,
            description: 'Task title',
            example: 'Design new landing page',
          },
          description: {
            type: 'string',
            maxLength: 2000,
            description: 'Detailed task description',
            example: 'Create wireframes and mockups for the new landing page with modern design principles and responsive layouts',
          },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'done'],
            description: 'Current task status',
            example: 'todo',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Task priority level',
            example: 'high',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: 30,
            },
            maxItems: 10,
            description: 'Task tags for categorization',
            example: ['design', 'ui', 'landing', 'urgent'],
          },
          assignedBy: {
            oneOf: [
              {
                type: 'string',
                description: 'User ID who assigned the task',
                example: '507f1f77bcf86cd799439012',
              },
              {
                $ref: '#/components/schemas/User',
              },
            ],
            description: 'User who assigned the task (can be populated)',
          },
          assignedTo: {
            oneOf: [
              {
                type: 'string',
                description: 'User ID assigned to complete the task',
                example: '507f1f77bcf86cd799439013',
              },
              {
                $ref: '#/components/schemas/User',
              },
            ],
            description: 'User assigned to complete the task (can be populated)',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Task due date (optional)',
            example: '2024-12-31T23:59:59.000Z',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Task completion timestamp (automatically set when status becomes done)',
            example: '2024-11-01T14:30:00.000Z',
          },
          estimatedHours: {
            type: 'number',
            minimum: 0.1,
            maximum: 1000,
            description: 'Estimated hours to complete the task',
            example: 8.5,
          },
          actualHours: {
            type: 'number',
            minimum: 0,
            maximum: 1000,
            description: 'Actual hours spent on the task',
            example: 6.25,
          },
          category: {
            type: 'string',
            maxLength: 50,
            description: 'Task category for organization',
            example: 'Design',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the task is active (not soft deleted)',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Task creation timestamp',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Task last update timestamp',
            example: '2024-01-16T14:45:00.000Z',
          },
          isOverdue: {
            type: 'boolean',
            description: 'Virtual field indicating if task is overdue',
            example: false,
          },
          daysUntilDue: {
            type: 'number',
            description: 'Virtual field showing days until due (negative if overdue)',
            example: 15,
          },
          timeVariance: {
            type: 'number',
            description: 'Virtual field showing difference between estimated and actual hours',
            example: -2.25,
          },
        },
      },
      TaskStatistics: {
        type: 'object',
        properties: {
          todo: {
            type: 'integer',
            description: 'Number of tasks with todo status',
            example: 5,
          },
          in_progress: {
            type: 'integer',
            description: 'Number of tasks with in_progress status',
            example: 3,
          },
          done: {
            type: 'integer',
            description: 'Number of tasks with done status',
            example: 12,
          },
          total: {
            type: 'integer',
            description: 'Total number of active tasks',
            example: 20,
          },
          overdue: {
            type: 'integer',
            description: 'Number of overdue tasks',
            example: 2,
          },
          completionRate: {
            type: 'integer',
            description: 'Completion rate as percentage',
            example: 60,
          },
          avgHours: {
            type: 'number',
            description: 'Average hours per task',
            example: 6.5,
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Operation success status',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Operation successful',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Operation success status',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'An error occurred',
          },
          errors: {
            type: 'array',
            description: 'Detailed error information',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field name',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  description: 'Error message for the field',
                  example: 'Email is required',
                },
              },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Access denied. No token provided.',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access denied due to insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Account is deactivated.',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'User not found.',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Validation Error',
              errors: [
                {
                  field: 'email',
                  message: 'Please provide a valid email address',
                },
              ],
            },
          },
        },
      },
      ConflictError: {
        description: 'Resource conflict (duplicate)',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Email already registered',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Too many requests from this IP, please try again later.',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Internal server error',
            },
          },
        },
      },
    },
  },
};

/**
 * Swagger Options
 *
 * Configuration for swagger-jsdoc
 */
const swaggerOptions = {
  swaggerDefinition,
  // Path to API docs (where JSDoc comments are)
  apis: [
    './src/routes/swaggerDocs.js', // Swagger annotations
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js',
  ],
};

/**
 * Generate Swagger Specification
 */
const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;
