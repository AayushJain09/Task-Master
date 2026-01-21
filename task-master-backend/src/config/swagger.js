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
    {
      name: 'Reminders',
      description: 'Reminder management endpoints including scheduling, snoozing, and offline sync',
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
      AssignableUser: {
        type: 'object',
        description: 'Limited user information for task assignment purposes',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
            example: '507f1f77bcf86cd799439011',
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
            description: 'User full name (computed field)',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
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
        },
        required: ['id', 'firstName', 'lastName', 'fullName', 'email', 'role', 'isActive'],
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
        required: ['title', 'assignedBy'],
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
            type: 'array',
            description: 'One or more users assigned to complete the task (can be populated)',
            items: {
              oneOf: [
                {
                  type: 'string',
                  description: 'User ID assigned to the task',
                  example: '507f1f77bcf86cd799439013',
                },
                { $ref: '#/components/schemas/User' },
              ],
            },
            minItems: 1,
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
            readOnly: true,
            description: 'Actual hours accumulated via automatic work-timer tracking',
            example: 6.25,
          },
          trackedActualHours: {
            type: 'number',
            description: 'Live actual hours including any currently running timer session',
            example: 6.75,
            readOnly: true,
          },
          workTimer: {
            type: 'object',
            description: 'Internal timer metadata used to derive automatic actual hours',
            readOnly: true,
            properties: {
              isRunning: {
                type: 'boolean',
                example: true,
              },
              lastStartedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                example: '2024-01-16T14:45:00.000Z',
              },
              totalSeconds: {
                type: 'integer',
                minimum: 0,
                example: 7200,
              },
            },
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
          localTimezone: {
            type: 'string',
            description: 'Timezone used to format local due date/time for the requester',
            example: 'America/New_York',
          },
          localDueDate: {
            type: 'string',
            description: 'Due date formatted for the requester\'s timezone (YYYY-MM-DD)',
            example: '2024-03-15',
          },
          localDueTime: {
            type: 'string',
            description: 'Due time formatted for the requester\'s timezone (HH:mm)',
            example: '18:30',
          },
          localDueDateTimeISO: {
            type: 'string',
            description: 'ISO-like timestamp for the due datetime in the requester\'s timezone',
            example: '2024-03-15T18:30:00',
          },
          localDueDateTimeDisplay: {
            type: 'string',
            description: 'Formatted due datetime suitable for UI display in the requester\'s timezone',
            example: 'Mar 15, 2024, 6:30 PM',
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
          overdueBreakdown: {
            type: 'object',
            description: 'Detailed counts for tasks that are overdue or were completed after becoming overdue',
            properties: {
              active: {
                type: 'object',
                description: 'Tasks that are currently overdue (due date passed and not done)',
                properties: {
                  total: {
                    type: 'integer',
                    description: 'Total number of currently overdue tasks',
                    example: 3,
                  },
                  todo: {
                    type: 'integer',
                    description: 'Todo tasks that are overdue',
                    example: 2,
                  },
                  in_progress: {
                    type: 'integer',
                    description: 'In-progress tasks that are overdue',
                    example: 1,
                  },
                },
              },
              resolved: {
                type: 'object',
                description: 'Tasks that became overdue but are now completed',
                properties: {
                  total: {
                    type: 'integer',
                    description: 'Total number of completed tasks that were overdue',
                    example: 4,
                  },
                  done: {
                    type: 'integer',
                    description: 'Alias for total to keep API consistent with status naming',
                    example: 4,
                  },
                },
              },
            },
          },
          normalBreakdown: {
            type: 'object',
            description: 'Status counts for tasks that are on track (not overdue)',
            properties: {
              total: {
                type: 'integer',
                description: 'Total number of non-overdue tasks',
                example: 12,
              },
              todo: {
                type: 'integer',
                description: 'Todo tasks that are still on track',
                example: 5,
              },
              in_progress: {
                type: 'integer',
                description: 'In-progress tasks that are still on track',
                example: 4,
              },
              done: {
                type: 'integer',
                description: 'Completed tasks that never went overdue',
                example: 3,
              },
            },
          },
        },
      },
      ActivityLogEntry: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Activity identifier',
            example: '660f1d25534f2c45b8c11e90',
          },
          action: {
            type: 'string',
            description: 'High-level action verb',
            example: 'task_completed',
          },
          description: {
            type: 'string',
            description: 'Human-readable summary for UI display',
            example: 'Completed task "Prepare weekly status"',
          },
          entityType: {
            type: 'string',
            example: 'task',
          },
          entityId: {
            type: 'string',
            example: '660f1b95534f2c45b8c11e8d',
          },
          metadata: {
            type: 'object',
            description: 'Arbitrary metadata bundle',
          },
          performedBy: {
            type: 'object',
            description: 'User who triggered the action',
            properties: {
              _id: { type: 'string', example: '65fe20dd54a5d5a3171f54f8' },
              firstName: { type: 'string', example: 'Alex' },
              lastName: { type: 'string', example: 'Morgan' },
              email: { type: 'string', example: 'alex@example.com' },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-04-04T09:45:12.000Z',
          },
        },
      },
      DashboardMetrics: {
        type: 'object',
        properties: {
          tasks: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 42 },
              todo: { type: 'integer', example: 12 },
              in_progress: { type: 'integer', example: 18 },
              done: { type: 'integer', example: 12 },
            },
          },
          overdue: {
            type: 'object',
            properties: {
              active: { type: 'integer', example: 3 },
              upcoming: { type: 'integer', example: 5 },
            },
          },
          weekly: {
            type: 'object',
            properties: {
              created: { type: 'integer', example: 14 },
              completed: { type: 'integer', example: 9 },
            },
          },
          priority: {
            type: 'object',
            properties: {
              high: { type: 'integer', example: 6 },
              medium: { type: 'integer', example: 21 },
              low: { type: 'integer', example: 15 },
            },
          },
          trends: {
            type: 'object',
            properties: {
              completedLast7Days: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', example: '2024-04-01' },
                    count: { type: 'integer', example: 3 },
                  },
                },
              },
            },
          },
          activitySummary: {
            type: 'object',
            nullable: true,
            properties: {
              lastAction: { type: 'string', example: 'task_created' },
              description: { type: 'string', example: 'Created task "Draft launch plan"' },
              occurredAt: { type: 'string', format: 'date-time' },
            },
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
      ReminderRecurrence: {
        type: 'object',
        properties: {
          cadence: {
            type: 'string',
            enum: ['none', 'daily', 'weekly', 'monthly'],
            example: 'weekly',
          },
          interval: {
            type: 'integer',
            minimum: 1,
            maximum: 365,
            example: 1,
          },
          daysOfWeek: {
            type: 'array',
            items: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
            },
            example: [1, 3, 5],
            description: 'Day indexes (0=Sunday ... 6=Saturday) when cadence=weekly',
          },
          anchorDate: {
            type: 'string',
            format: 'date-time',
            description: 'Reference date for recurrence calculations',
            example: '2024-12-01T09:00:00.000Z',
          },
        },
      },
      Reminder: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Reminder identifier',
            example: '6768f5c0b0409f124d3c1322',
          },
          title: {
            type: 'string',
            example: 'Send sprint update',
          },
          description: {
            type: 'string',
            example: 'Share highlights with the leadership channel',
          },
          notes: {
            type: 'string',
            example: 'Include burndown snapshot',
          },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            description: 'UTC timestamp representing when to notify',
            example: '2024-12-01T09:00:00.000Z',
          },
          timezone: {
            type: 'string',
            description: 'IANA timezone used when scheduling',
            example: 'America/Los_Angeles',
          },
          localTimezone: {
            type: 'string',
            description: 'Requester timezone used for localized scheduling metadata',
            example: 'Europe/Berlin',
          },
          localScheduledDate: {
            type: 'string',
            description: 'Localized scheduled date (YYYY-MM-DD)',
            example: '2024-03-15',
          },
          localScheduledTime: {
            type: 'string',
            description: 'Localized scheduled time (HH:mm)',
            example: '09:30',
          },
          localScheduledDateTimeISO: {
            type: 'string',
            description: 'Localized scheduled datetime in ISO-like format',
            example: '2024-03-15T09:30:00',
          },
          localScheduledDateTimeDisplay: {
            type: 'string',
            description: 'Localized scheduled datetime formatted for UI display',
            example: 'Mar 15, 2024, 9:30 AM',
          },
          category: {
            type: 'string',
            description: 'Categorization label',
            example: 'work',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['standup', 'weekly'],
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            example: 'high',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
            example: 'pending',
          },
          recurrence: {
            $ref: '#/components/schemas/ReminderRecurrence',
          },
          clientReference: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'local-temp-id' },
              device: { type: 'string', example: 'iphone-15' },
            },
          },
          clientUpdatedAt: {
            type: 'string',
            format: 'date-time',
          },
          syncStatus: {
            type: 'string',
            enum: ['pending', 'synced'],
            example: 'pending',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ReminderCreateRequest: {
        type: 'object',
        required: ['title', 'scheduledAt', 'timezone'],
        properties: {
          title: {
            type: 'string',
            description: 'Reminder title shown in the UI',
            example: 'Send sprint update',
          },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            description: 'Local date/time string or ISO timestamp representing when the reminder should fire',
            example: '2024-12-01T09:00:00.000',
          },
          timezone: {
            type: 'string',
            description: 'IANA timezone identifier to interpret scheduledAt if provided as local date/time',
            example: 'America/Los_Angeles',
          },
          category: {
            type: 'string',
            description: 'Optional category slug',
            example: 'work',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['ops', 'weekly'],
          },
          notes: {
            type: 'string',
            description: 'Private notes associated with the reminder',
          },
          description: {
            type: 'string',
            description: 'Optional long-form description shown in detail views',
          },
          recurrence: {
            $ref: '#/components/schemas/ReminderRecurrence',
            description: 'Optional recurrence rule. When provided, anchorDate defaults to the first scheduled occurrence.',
          },
        },
      },
      ReminderUpdateRequest: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            description: 'Updated schedule. Supply timezone if you want to reinterpret it relative to another locale.',
          },
          timezone: {
            type: 'string',
            description: 'IANA timezone identifier. When provided alongside scheduledAt the server recalculates UTC storage.',
          },
          category: {
            type: 'string',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          tags: {
            type: 'array',
            description: 'Full tag replacement. Provide the entire desired tag list.',
            items: { type: 'string' },
          },
          notes: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
            description: 'Status toggle for marking reminders complete or cancelled.',
          },
          recurrence: {
            $ref: '#/components/schemas/ReminderRecurrence',
            description: 'Update recurrence; omit to keep existing rule. Anchor recalculates from scheduledAt if omitted.',
          },
        },
      },
      ReminderSyncChange: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Client-side reference id for the reminder',
          },
          serverId: {
            type: 'string',
            description: 'Server id if the reminder already exists remotely',
          },
          operation: {
            type: 'string',
            enum: ['upsert', 'delete'],
            description: 'Type of change the client performed offline',
          },
          clientUpdatedAt: {
            type: 'string',
            format: 'date-time',
          },
          data: {
            $ref: '#/components/schemas/Reminder',
          },
        },
      },
      ReminderSyncResponse: {
        type: 'object',
        properties: {
          appliedChanges: {
            type: 'array',
            description: 'Changes accepted by the server',
            items: {
              type: 'object',
              properties: {
                clientId: { type: 'string' },
                serverId: { type: 'string' },
                operation: { type: 'string' },
              },
            },
          },
          conflicts: {
            type: 'array',
            description: 'Changes rejected due to conflicts',
            items: {
              type: 'object',
              properties: {
                clientId: { type: 'string' },
                serverId: { type: 'string' },
                reason: { type: 'string' },
                serverState: { $ref: '#/components/schemas/Reminder' },
              },
            },
          },
          serverChanges: {
            type: 'array',
            description: 'Reminders updated on the server since last sync',
            items: { $ref: '#/components/schemas/Reminder' },
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
