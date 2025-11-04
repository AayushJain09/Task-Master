/**
 * Tasks Service
 * 
 * Comprehensive service for task management operations including CRUD,
 * filtering, statistics, and error handling with proper TypeScript support.
 * 
 * @fileoverview Task management service with full backend API integration
 */

import { apiService } from './api.service';
import { ApiError } from '@/types/api.types';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  TaskQueryParams,
  TasksListResponse,
  TaskResponse,
  TaskStatisticsResponse,
  OverdueTasksResponse,
  TaskDeleteResponse,
  TaskError,
  TaskErrorCode,
  TaskBulkRequest,
  TaskSearchParams,
  TaskExportOptions,
} from '@/types/task.types';

/**
 * TasksService Class
 * 
 * Handles all task-related API operations with comprehensive error handling,
 * response transformation, and TypeScript support.
 */
class TasksService {
  private readonly baseEndpoint = '/tasks';

  /**
   * Transform API errors to task-specific errors
   * 
   * @private
   * @param error - Raw API error
   * @returns Transformed task error
   */
  private transformError(error: ApiError): TaskError {
    // Map common HTTP status codes to task error codes
    const errorCodeMap: Record<number, TaskErrorCode> = {
      400: 'TASK_VALIDATION_ERROR',
      401: 'TASK_ACCESS_DENIED',
      403: 'TASK_PERMISSION_DENIED',
      404: 'TASK_NOT_FOUND',
      409: 'TASK_ALREADY_COMPLETED',
      429: 'TASK_LIMIT_EXCEEDED',
    };

    // Check for specific backend error codes
    if (error.code) {
      switch (error.code) {
        case 'ASSIGNED_USER_NOT_FOUND':
          return {
            message: 'The user you\'re trying to assign this task to doesn\'t exist.',
            code: 'ASSIGNED_USER_NOT_FOUND',
            details: error.details,
          };
        case 'INVALID_TASK_STATUS':
          return {
            message: 'Invalid task status. Status must be todo, in_progress, or done.',
            code: 'INVALID_TASK_STATUS',
            details: error.details,
          };
        case 'INVALID_TASK_PRIORITY':
          return {
            message: 'Invalid task priority. Priority must be low, medium, or high.',
            code: 'INVALID_TASK_PRIORITY',
            details: error.details,
          };
        case 'DUE_DATE_IN_PAST':
          return {
            message: 'Due date cannot be in the past.',
            code: 'DUE_DATE_IN_PAST',
            details: error.details,
          };
      }
    }

    // Use status code mapping
    const code = errorCodeMap[error.status] || 'TASK_VALIDATION_ERROR';
    
    return {
      message: error.message || 'An error occurred while processing your task request.',
      code,
      details: error.details,
    };
  }

  /**
   * Validate task data before sending to API
   * 
   * @private
   * @param taskData - Task data to validate
   * @throws TaskError if validation fails
   */
  private validateTaskData(taskData: CreateTaskRequest | UpdateTaskRequest): void {
    if ('title' in taskData && taskData.title !== undefined) {
      if (!taskData.title.trim()) {
        throw {
          message: 'Task title is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
          field: 'title',
        } as TaskError;
      }
      
      if (taskData.title.length > 200) {
        throw {
          message: 'Task title cannot exceed 200 characters.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
          field: 'title',
        } as TaskError;
      }
    }

    if (taskData.description && taskData.description.length > 2000) {
      throw {
        message: 'Task description cannot exceed 2000 characters.',
        code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        field: 'description',
      } as TaskError;
    }

    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const now = new Date();
      
      if (isNaN(dueDate.getTime())) {
        throw {
          message: 'Invalid due date format.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
          field: 'dueDate',
        } as TaskError;
      }
      
      if (dueDate <= now) {
        throw {
          message: 'Due date must be in the future.',
          code: 'DUE_DATE_IN_PAST' as TaskErrorCode,
          field: 'dueDate',
        } as TaskError;
      }
    }

    if (taskData.estimatedHours !== undefined && taskData.estimatedHours !== null) {
      if (taskData.estimatedHours < 0.1 || taskData.estimatedHours > 1000) {
        throw {
          message: 'Estimated hours must be between 0.1 and 1000.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
          field: 'estimatedHours',
        } as TaskError;
      }
    }

    if ('actualHours' in taskData && taskData.actualHours !== undefined) {
      if (taskData.actualHours < 0 || taskData.actualHours > 1000) {
        throw {
          message: 'Actual hours must be between 0 and 1000.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
          field: 'actualHours',
        } as TaskError;
      }
    }

    if (taskData.tags && taskData.tags.length > 10) {
      throw {
        message: 'Cannot have more than 10 tags per task.',
        code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        field: 'tags',
      } as TaskError;
    }
  }

  /**
   * Build query string from task query parameters
   * 
   * @private
   * @param params - Query parameters
   * @returns URL search parameters string
   */
  private buildQueryString(params: TaskQueryParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Get All Tasks
   * 
   * Retrieves all tasks for the authenticated user with optional filtering,
   * sorting, and pagination.
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to tasks list with pagination info
   * @throws TaskError on failure
   * 
   * @example
   * ```typescript
   * // Get first page of high priority tasks
   * const response = await tasksService.getAllTasks({
   *   priority: 'high',
   *   status: 'todo',
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'dueDate',
   *   sortOrder: 'asc'
   * });
   * 
   * console.log(`Found ${response.pagination.totalTasks} tasks`);
   * response.tasks.forEach(task => console.log(task.title));
   * ```
   */
  async getAllTasks(params: TaskQueryParams = {}): Promise<TasksListResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;
      
      const response = await apiService.get<TasksListResponse>(url);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Get Task by ID
   * 
   * Retrieves a specific task by its ID with populated user references.
   * 
   * @param taskId - Task ID to retrieve
   * @returns Promise resolving to task details
   * @throws TaskError on failure
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await tasksService.getTaskById('507f1f77bcf86cd799439011');
   *   console.log(`Task: ${response.task.title}`);
   *   console.log(`Assigned to: ${response.task.assignedTo.fullName}`);
   * } catch (error) {
   *   if (error.code === 'TASK_NOT_FOUND') {
   *     console.log('Task does not exist');
   *   }
   * }
   * ```
   */
  async getTaskById(taskId: string): Promise<TaskResponse> {
    try {
      if (!taskId?.trim()) {
        throw {
          message: 'Task ID is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        } as TaskError;
      }

      const response = await apiService.get<TaskResponse>(`${this.baseEndpoint}/${taskId}`);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Create Task
   * 
   * Creates a new task with comprehensive validation and error handling.
   * 
   * @param taskData - Task creation data
   * @returns Promise resolving to created task
   * @throws TaskError on validation or creation failure
   * 
   * @example
   * ```typescript
   * const newTask = await tasksService.createTask({
   *   title: 'Design new landing page',
   *   description: 'Create wireframes and mockups',
   *   priority: 'high',
   *   dueDate: '2024-12-31T23:59:59.000Z',
   *   tags: ['design', 'ui', 'landing'],
   *   category: 'Design',
   *   estimatedHours: 8
   * });
   * 
   * console.log(`Created task: ${newTask.task.title}`);
   * ```
   */
  async createTask(taskData: CreateTaskRequest): Promise<TaskResponse> {
    try {
      // Validate task data before sending
      this.validateTaskData(taskData);

      // Clean up empty arrays and null values
      const cleanTaskData = { ...taskData };
      if (cleanTaskData.tags && cleanTaskData.tags.length === 0) {
        delete cleanTaskData.tags;
      }

      const response = await apiService.post<TaskResponse>(this.baseEndpoint, cleanTaskData);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Update Task
   * 
   * Updates an existing task with partial data and validation.
   * 
   * @param taskId - Task ID to update
   * @param taskData - Partial task update data
   * @returns Promise resolving to updated task
   * @throws TaskError on validation or update failure
   * 
   * @example
   * ```typescript
   * const updatedTask = await tasksService.updateTask('507f1f77bcf86cd799439011', {
   *   status: 'in_progress',
   *   actualHours: 2.5,
   *   tags: ['design', 'ui', 'responsive']
   * });
   * 
   * console.log(`Updated task status: ${updatedTask.task.status}`);
   * ```
   */
  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<TaskResponse> {
    try {
      if (!taskId?.trim()) {
        throw {
          message: 'Task ID is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        } as TaskError;
      }

      // Validate task data before sending
      this.validateTaskData(taskData);

      const response = await apiService.put<TaskResponse>(`${this.baseEndpoint}/${taskId}`, taskData);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Update Task Status
   * 
   * Updates only the status of a task - more efficient than full update.
   * 
   * @param taskId - Task ID to update
   * @param status - New task status
   * @returns Promise resolving to updated task
   * @throws TaskError on update failure
   * 
   * @example
   * ```typescript
   * // Mark task as completed
   * const completedTask = await tasksService.updateTaskStatus(
   *   '507f1f77bcf86cd799439011', 
   *   'done'
   * );
   * 
   * console.log(`Completed at: ${completedTask.task.completedAt}`);
   * ```
   */
  async updateTaskStatus(taskId: string, status: UpdateTaskStatusRequest['status']): Promise<TaskResponse> {
    try {
      if (!taskId?.trim()) {
        throw {
          message: 'Task ID is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        } as TaskError;
      }

      const validStatuses: UpdateTaskStatusRequest['status'][] = ['todo', 'in_progress', 'done'];
      if (!validStatuses.includes(status)) {
        throw {
          message: 'Invalid task status. Status must be todo, in_progress, or done.',
          code: 'INVALID_TASK_STATUS' as TaskErrorCode,
          field: 'status',
        } as TaskError;
      }

      const response = await apiService.patch<TaskResponse>(
        `${this.baseEndpoint}/${taskId}/status`,
        { status }
      );
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Delete Task
   * 
   * Soft deletes a task (sets isActive to false). Only the task creator can delete.
   * 
   * @param taskId - Task ID to delete
   * @returns Promise resolving to deletion confirmation
   * @throws TaskError on deletion failure
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await tasksService.deleteTask('507f1f77bcf86cd799439011');
   *   console.log(`Deleted task: ${result.taskId}`);
   * } catch (error) {
   *   if (error.code === 'TASK_PERMISSION_DENIED') {
   *     console.log('Only the task creator can delete this task');
   *   }
   * }
   * ```
   */
  async deleteTask(taskId: string): Promise<TaskDeleteResponse> {
    try {
      if (!taskId?.trim()) {
        throw {
          message: 'Task ID is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        } as TaskError;
      }

      const response = await apiService.delete<TaskDeleteResponse>(`${this.baseEndpoint}/${taskId}`);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Get Task Statistics
   * 
   * Retrieves comprehensive task analytics and productivity metrics.
   * 
   * @returns Promise resolving to task statistics
   * @throws TaskError on failure
   * 
   * @example
   * ```typescript
   * const stats = await tasksService.getTaskStatistics();
   * 
   * console.log(`Total tasks: ${stats.statistics.total}`);
   * console.log(`Completion rate: ${stats.statistics.completionRate}%`);
   * console.log(`Average hours per task: ${stats.statistics.avgHours}`);
   * console.log(`Overdue tasks: ${stats.statistics.overdue}`);
   * ```
   */
  async getTaskStatistics(): Promise<TaskStatisticsResponse> {
    try {
      const response = await apiService.get<TaskStatisticsResponse>(`${this.baseEndpoint}/statistics`);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Get Overdue Tasks
   * 
   * Retrieves all tasks that are past their due date and not completed.
   * 
   * @returns Promise resolving to overdue tasks
   * @throws TaskError on failure
   * 
   * @example
   * ```typescript
   * const overdueResponse = await tasksService.getOverdueTasks();
   * 
   * console.log(`${overdueResponse.count} overdue tasks found`);
   * overdueResponse.tasks.forEach(task => {
   *   console.log(`${task.title} - Due: ${task.dueDate}`);
   * });
   * ```
   */
  async getOverdueTasks(): Promise<OverdueTasksResponse> {
    try {
      const response = await apiService.get<OverdueTasksResponse>(`${this.baseEndpoint}/overdue`);
      return response;
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Search Tasks
   * 
   * Searches tasks by title, description, tags, or category.
   * 
   * @param searchParams - Search parameters
   * @returns Promise resolving to matching tasks
   * @throws TaskError on failure
   * 
   * @example
   * ```typescript
   * const results = await tasksService.searchTasks({
   *   query: 'landing page',
   *   fields: ['title', 'description'],
   *   filters: { priority: 'high', status: 'todo' }
   * });
   * ```
   */
  async searchTasks(searchParams: TaskSearchParams): Promise<TasksListResponse> {
    try {
      const { query, fields = ['title', 'description', 'tags'], filters = {} } = searchParams;
      
      if (!query?.trim()) {
        throw {
          message: 'Search query is required.',
          code: 'TASK_VALIDATION_ERROR' as TaskErrorCode,
        } as TaskError;
      }

      // For now, use the regular getAllTasks with a title filter
      // This could be enhanced with a dedicated search endpoint
      const searchFilters: TaskQueryParams = {
        ...filters,
        // Note: Backend would need to support text search
        // For now, we'll return all tasks and filter client-side
      };

      const response = await this.getAllTasks(searchFilters);
      
      // Client-side filtering (should ideally be done on backend)
      const filteredTasks = response.tasks.filter(task => {
        const searchLower = query.toLowerCase();
        return fields.some(field => {
          switch (field) {
            case 'title':
              return task.title.toLowerCase().includes(searchLower);
            case 'description':
              return task.description?.toLowerCase().includes(searchLower);
            case 'tags':
              return task.tags.some(tag => tag.toLowerCase().includes(searchLower));
            case 'category':
              return task.category.toLowerCase().includes(searchLower);
            default:
              return false;
          }
        });
      });

      return {
        ...response,
        tasks: filteredTasks,
        pagination: {
          ...response.pagination,
          totalTasks: filteredTasks.length,
        },
      };
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  /**
   * Get Tasks by Status
   * 
   * Convenience method to get tasks filtered by status.
   * 
   * @param status - Task status to filter by
   * @returns Promise resolving to filtered tasks
   * 
   * @example
   * ```typescript
   * const todoTasks = await tasksService.getTasksByStatus('todo');
   * const inProgressTasks = await tasksService.getTasksByStatus('in_progress');
   * const completedTasks = await tasksService.getTasksByStatus('done');
   * ```
   */
  async getTasksByStatus(status: Task['status']): Promise<TasksListResponse> {
    return this.getAllTasks({ status });
  }

  /**
   * Get Tasks by Priority
   * 
   * Convenience method to get tasks filtered by priority.
   * 
   * @param priority - Task priority to filter by
   * @returns Promise resolving to filtered tasks
   * 
   * @example
   * ```typescript
   * const highPriorityTasks = await tasksService.getTasksByPriority('high');
   * const urgentTasks = highPriorityTasks.tasks.filter(task => task.isOverdue);
   * ```
   */
  async getTasksByPriority(priority: Task['priority']): Promise<TasksListResponse> {
    return this.getAllTasks({ priority });
  }

  /**
   * Get My Tasks
   * 
   * Convenience method to get tasks assigned to the current user.
   * 
   * @returns Promise resolving to user's assigned tasks
   */
  async getMyTasks(): Promise<TasksListResponse> {
    return this.getAllTasks({ role: 'assignee' });
  }

  /**
   * Get Tasks I Created
   * 
   * Convenience method to get tasks created by the current user.
   * 
   * @returns Promise resolving to user's created tasks
   */
  async getTasksICreated(): Promise<TasksListResponse> {
    return this.getAllTasks({ role: 'assignor' });
  }

  /**
   * Get Recent Tasks
   * 
   * Gets recently created or updated tasks.
   * 
   * @param limit - Number of tasks to retrieve
   * @returns Promise resolving to recent tasks
   */
  async getRecentTasks(limit: number = 10): Promise<TasksListResponse> {
    return this.getAllTasks({
      limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Get Upcoming Tasks
   * 
   * Gets tasks due in the near future.
   * 
   * @param days - Number of days ahead to look
   * @returns Promise resolving to upcoming tasks
   */
  async getUpcomingTasks(days: number = 7): Promise<TasksListResponse> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.getAllTasks({
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });
  }

  /**
   * Validate Task Form Data
   * 
   * Client-side validation for task forms.
   * 
   * @param formData - Form data to validate
   * @returns Validation errors object
   * 
   * @example
   * ```typescript
   * const errors = tasksService.validateTaskForm(formData);
   * if (Object.keys(errors).length > 0) {
   *   console.log('Validation errors:', errors);
   *   return;
   * }
   * ```
   */
  validateTaskForm(formData: Partial<CreateTaskRequest>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.length > 200) {
      errors.title = 'Task title cannot exceed 200 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.dueDate = 'Invalid due date format';
      } else if (dueDate <= new Date()) {
        errors.dueDate = 'Due date must be in the future';
      }
    }

    if (formData.estimatedHours !== undefined && formData.estimatedHours !== null) {
      if (formData.estimatedHours < 0.1 || formData.estimatedHours > 1000) {
        errors.estimatedHours = 'Estimated hours must be between 0.1 and 1000';
      }
    }

    if (formData.tags && formData.tags.length > 10) {
      errors.tags = 'Cannot have more than 10 tags per task';
    }

    return errors;
  }
}

/**
 * Export singleton instance
 */
export const tasksService = new TasksService();

/**
 * Export class for testing purposes
 */
export { TasksService };