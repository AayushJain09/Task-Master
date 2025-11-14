/**
 * Task Types
 * 
 * Type definitions for task management system including task models,
 * API request/response types, and component interfaces.
 * 
 * @fileoverview Comprehensive TypeScript types for task operations
 */

/**
 * Task Priority Levels
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task Status Types
 */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/**
 * User Role in Task Context
 */
export type TaskUserRole = 'assignee' | 'assignor' | 'both';

/**
 * Task Sort Fields
 */
export type TaskSortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title' | 'daysPastDue' | 'completedAt';

/**
 * Sort Order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Overdue Severity Levels
 */
export type OverdueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Overdue Task Metadata
 * 
 * Additional metadata for overdue tasks including severity analysis
 */
export interface OverdueMetadata {
  daysPastDue: number;
  severity: OverdueSeverity;
  isOverdue: boolean;
}

/**
 * User Reference - Can be populated or just ID
 */
export interface UserReference {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName?: string;
}

/**
 * Work timer metadata mirrors backend auto-tracking state.
 */
export interface WorkTimerState {
  isRunning: boolean;
  lastStartedAt?: string | null;
  totalSeconds: number;
}

/**
 * Core Task Interface
 * 
 * Represents a task entity with all its properties including
 * virtual fields and populated references.
 */
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assignedBy: string | UserReference;
  assignedTo: string | UserReference;
  dueDate?: string; // ISO 8601 date string
  completedAt?: string; // ISO 8601 date string
  estimatedHours?: number;
  actualHours: number; // Persisted (paused) effort tracked on the server
  category: string;
  isActive: boolean;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  workTimer?: WorkTimerState; // Raw timer state for UI overlays
  trackedActualHours?: number; // Live hours including a running timer session
  
  // Virtual fields (computed by backend)
  isOverdue?: boolean;
  daysUntilDue?: number | null;
  timeVariance?: number | null;
  
  // Overdue-specific metadata (from overdue endpoints)
  overdueMetadata?: OverdueMetadata;
}

/**
 * Task Creation Request
 * 
 * Data structure for creating a new task
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: string; // User ID, defaults to current user
  dueDate?: string; // ISO 8601 date string
  tags?: string[];
  category?: string;
  estimatedHours?: number;
}

/**
 * Task Update Request
 * 
 * Data structure for updating an existing task
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string; // User ID
  dueDate?: string | null; // ISO 8601 date string or null to remove
  tags?: string[];
  category?: string;
  estimatedHours?: number | null;
}

/**
 * Task Status Update Request
 * 
 * Simplified request for updating only task status
 */
export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

/**
 * Task Query Parameters
 * 
 * Parameters for filtering, sorting, and paginating tasks
 */
export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  role?: TaskUserRole;
  category?: string;
  tags?: string; // Comma-separated tags
  dueDate?: string; // ISO 8601 date string
  overdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: TaskSortField;
  sortOrder?: SortOrder;
}

/**
 * Task Statistics
 * 
 * Analytics data for task metrics and productivity insights
 */
export interface TaskStatistics {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
  overdue: number;
  completionRate: number; // Percentage
  avgHours: number;
  overdueBreakdown: OverdueBreakdown;
  normalBreakdown: NormalStatusBreakdown;
}

/**
 * Overdue Active Breakdown
 * 
 * Fine-grained counts for tasks that are currently overdue.
 */
export interface OverdueActiveBreakdown {
  total: number;
  todo: number;
  in_progress: number;
}

/**
 * Overdue Resolved Breakdown
 * 
 * Tracks tasks that slipped into overdue but were eventually completed.
 */
export interface OverdueResolvedBreakdown {
  total: number;
  done: number;
}

/**
 * Overdue Breakdown
 * 
 * Combined structure for active overdue work and resolved overdue completions.
 */
export interface OverdueBreakdown {
  active: OverdueActiveBreakdown;
  resolved: OverdueResolvedBreakdown;
}

/**
 * Normal Status Breakdown
 * 
 * Counts for tasks that are still on track (not overdue).
 */
export interface NormalStatusBreakdown {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

/**
 * Pagination Metadata
 * 
 * Information about paginated task results
 */
export interface TaskPagination {
  currentPage: number;
  totalPages: number;
  totalTasks: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Task Filters
 * 
 * Applied filters for reference in responses
 */
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  role?: TaskUserRole;
  category?: string;
  tags?: string;
  dueDate?: string;
  overdue?: boolean;
}

/**
 * Status Metadata
 *
 * Additional metadata returned with status-specific queries to help
 * the UI understand how many tasks exist within a status and whether
 * that slice currently contains overdue work.
 */
export interface StatusMetadata {
  status: TaskStatus;
  totalInStatus: number;
  currentPageCount: number;
  hasOverdue: boolean;
}

/**
 * Tasks List Response
 * 
 * Response structure for getting multiple tasks
 */
export interface TasksListResponse {
  tasks: Task[];
  pagination: TaskPagination;
  filters: TaskFilters;
  // Optional status metadata returned by status-specific endpoints
  statusMetadata?: StatusMetadata;
  // Enhanced metadata for overdue-specific queries
  overdueMetadata?: EnhancedOverdueMetadata;
}

/**
 * Single Task Response
 * 
 * Response structure for getting a single task
 */
export interface TaskResponse {
  task: Task;
}

/**
 * Task Statistics Response
 * 
 * Response structure for task analytics
 */
export interface TaskStatisticsResponse {
  statistics: TaskStatistics;
}

/**
 * Overdue Tasks Response
 * 
 * Response structure for overdue tasks
 */
export interface OverdueTasksResponse {
  tasks: Task[];
  count: number;
}

/**
 * Overdue Severity Breakdown
 * 
 * Count of tasks by severity level for overdue analysis
 */
export interface OverdueSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Enhanced Overdue Metadata
 * 
 * Comprehensive overdue analysis for status-specific queries
 */
export interface EnhancedOverdueMetadata {
  status: TaskStatus;
  totalOverdueInStatus: number;
  currentPageCount: number;
  severityBreakdown: OverdueSeverityBreakdown;
  averageDaysPastDue: number;
  criticalTasksCount: number;
  oldestOverdueTask: number;
}

/**
 * Task Delete Response
 * 
 * Response structure for task deletion
 */
export interface TaskDeleteResponse {
  taskId: string;
}

/**
 * Task Service Error Types
 * 
 * Specific error codes for task operations
 */
export type TaskErrorCode = 
  | 'TASK_NOT_FOUND'
  | 'TASK_ACCESS_DENIED'
  | 'TASK_VALIDATION_ERROR'
  | 'ASSIGNED_USER_NOT_FOUND'
  | 'TASK_PERMISSION_DENIED'
  | 'TASK_ALREADY_COMPLETED'
  | 'INVALID_TASK_STATUS'
  | 'INVALID_TASK_PRIORITY'
  | 'DUE_DATE_IN_PAST'
  | 'TASK_LIMIT_EXCEEDED';

/**
 * Task Service Error
 * 
 * Error structure for task-related operations
 */
export interface TaskError {
  message: string;
  code: TaskErrorCode;
  field?: string;
  details?: any;
}

/**
 * Task Form Validation
 * 
 * Client-side validation state for task forms
 */
export interface TaskFormValidation {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: string;
  tags?: string;
  category?: string;
  assignedTo?: string;
}

/**
 * Task Form Data
 * 
 * Form state for task creation/editing
 */
export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedTo: string;
  dueDate?: string;
  tags: string[];
  category: string;
  estimatedHours?: number;
}

/**
 * Task Filter Options
 * 
 * Available options for task filtering UI
 */
export interface TaskFilterOptions {
  statuses: { value: TaskStatus; label: string }[];
  priorities: { value: TaskPriority; label: string }[];
  roles: { value: TaskUserRole; label: string }[];
  categories: string[];
  tags: string[];
}

/**
 * Task Bulk Operations
 * 
 * Types for bulk task operations
 */
export type TaskBulkOperation = 'delete' | 'updateStatus' | 'updatePriority' | 'addTag' | 'removeTag';

export interface TaskBulkRequest {
  taskIds: string[];
  operation: TaskBulkOperation;
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
}

/**
 * Task Search Parameters
 * 
 * Parameters for searching tasks
 */
export interface TaskSearchParams {
  query: string;
  fields?: ('title' | 'description' | 'tags' | 'category')[];
  filters?: TaskQueryParams;
}

/**
 * Task Export Options
 * 
 * Options for exporting task data
 */
export interface TaskExportOptions {
  format: 'csv' | 'json' | 'pdf';
  fields: string[];
  filters?: TaskQueryParams;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Task Notification Types
 * 
 * Types of task-related notifications
 */
export type TaskNotificationType = 
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_UPDATED'
  | 'TASK_COMMENT';

/**
 * Task Notification
 * 
 * Structure for task-related notifications
 */
export interface TaskNotification {
  id: string;
  type: TaskNotificationType;
  taskId: string;
  taskTitle: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Task Activity Log Entry
 * 
 * Record of task changes for audit trail
 */
export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

/**
 * Task Time Tracking
 * 
 * Time tracking entry for a task
 */
export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  createdAt: string;
}

/**
 * Task Dependencies
 * 
 * Task dependency relationships
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocks' | 'depends_on';
  createdAt: string;
}

/**
 * Task Template
 * 
 * Reusable task template
 */
export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  tags: string[];
  category: string;
  estimatedHours?: number;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
