/**
 * Tasks Screen Component
 * 
 * A focused, intuitive Kanban board interface designed for optimal task management
 * workflow with emphasis on visual clarity, responsive design, and seamless
 * task organization across different status columns.
 * 
 * Core Focus:
 * - Pure Kanban board experience without distractions
 * - Responsive, touch-optimized column layout for all devices
 * - Intuitive task management with visual drag-and-drop feel
 * - Clean, minimalist interface that prioritizes task visibility
 * - Fast, efficient task creation and editing workflows
 * 
 * Key Features:
 * - Full-width responsive Kanban columns with optimal spacing
 * - Beautiful task cards with priority-based visual indicators
 * - Quick task creation with floating action button
 * - Seamless task editing with advanced form modal
 * - Smooth scrolling and touch interactions for mobile-first experience
 * 
 * Design Principles:
 * - Kanban board is the primary focus and takes full screen space
 * - Minimal header for maximum content visibility
 * - Consistent visual hierarchy with clear task status distinctions
 * - Touch-friendly interface optimized for mobile and tablet use
 * - Performance-optimized for smooth scrolling with many tasks
 * 
 * Layout Strategy:
 * - Responsive columns that adapt to screen width
 * - Optimal column sizing for readability and usability
 * - Efficient space utilization with horizontal scrolling when needed
 * - Visual balance between task density and readability
 * 
 * @module components/screens/Tasks
 * @requires react - Core React functionality and hooks
 * @requires react-native - React Native components and utilities
 * @requires @/context/ThemeContext - Application theme management
 * @requires lucide-react-native - Icon library for visual elements
 * @requires ../tasks/KanbanColumn - Enhanced kanban column component
 * @requires ../tasks/TaskCard - Beautiful task card component
 * @requires ../tasks/TaskFormModal - Advanced form modal component
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Plus, AlertCircle, Filter } from 'lucide-react-native';

// Import focused task management components
import KanbanColumn from '../tasks/KanbanColumn';
import TaskFormModal from '../tasks/TaskFormModal';
import TaskDetailsModal from '../tasks/TaskDetailsModal';
import { Task as TaskCardType, ColumnStatus } from '../tasks/TaskCard';

// Import API types and service
import { Task, TasksListResponse, TaskError, TaskQueryParams, EnhancedOverdueMetadata, StatusMetadata, TaskStatistics } from '@/types/task.types';
import { tasksService } from '@/services/tasks.service';
import { formatDateForAPI } from '@/utils/dateUtils';

// Import validation utilities
import { InputSanitizer, ErrorRecovery } from '@/utils/validation';

// Get device dimensions for responsive layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const severitySummaryTheme: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#FEE2E2', text: '#B91C1C' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#FFFBEB', text: '#92400E' },
  low: { bg: '#ECFCCB', text: '#3F6212' },
};
const ERROR_CARD_WIDTH = Math.min(280, SCREEN_WIDTH * 0.85);

/**
 * Form Data Interface for Task Creation/Editing
 * 
 * Defines the structure for form data used in the task modal
 * with validation-friendly properties and clear field definitions.
 */
interface FormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
  tags: string[];
  estimatedHours: number;
  assignedTo: string;
};

/**
 * Extended Task Interface for Editing
 * 
 * Includes all fields needed for task editing in the modal
 */
interface EditableTaskData extends TaskCardType {
  tags?: string[];
  estimatedHours?: number;
}

/**
 * Column Status Type for enhanced type safety
 */
type KanbanColumnStatus = 'todo' | 'in_progress' | 'done';

/**
 * Props shared by the Home screen so Tasks can consume global statistics
 */
interface TasksScreenProps {
  taskStatistics?: TaskStatistics | null;
  statisticsLoading?: boolean;
  onRefreshStatistics?: () => Promise<void> | void;
}

/**
 * Column-Specific State Interface
 * 
 * Manages state for individual Kanban columns with independent
 * pagination, loading, and error handling capabilities.
 */
interface ColumnState {
  tasks: Task[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  statusMetadata: StatusMetadata | null;
  overdueMetadata: EnhancedOverdueMetadata | null;
}

/**
 * Global Loading State Interface
 * 
 * Tracks global operations that affect multiple columns
 */
interface GlobalLoadingState {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

/**
 * Global Error State Interface
 * 
 * Manages global error states for operations affecting multiple columns
 */
interface GlobalErrorState {
  create: string | null;
  update: string | null;
  delete: string | null;
}

/**
 * Focused Kanban Tasks Component
 * 
 * A streamlined, intuitive task management interface that prioritizes the
 * Kanban board experience with responsive design, clean layout, and
 * efficient task organization workflows.
 * 
 * Design Focus:
 * - Maximum screen space dedicated to Kanban columns
 * - Clean, minimal header that doesn't compete with task content
 * - Responsive column layout that adapts to screen size
 * - Optimal task density and readability balance
 * - Touch-optimized interactions for mobile and tablet use
 * 
 * Layout Strategy:
 * - Responsive column widths based on screen size
 * - Efficient horizontal scrolling for smaller screens
 * - Optimal spacing between columns for visual clarity
 * - Full-height columns for maximum task visibility
 * - Floating action button for quick task creation
 * 
 * User Experience:
 * - Immediate focus on task management without distractions
 * - Quick task creation with streamlined form
 * - Intuitive task editing and status management
 * - Smooth scrolling and responsive interactions
 * - Clear visual hierarchy and status distinctions
 * 
 * Performance Features:
 * - Efficient task filtering and rendering
 * - Optimized scroll performance for large task lists
 * - Memoized callbacks for smooth interactions
 * - Responsive layout calculations for different screen sizes
 * 
 * @returns {JSX.Element} Focused Kanban board interface
 */
const Tasks: React.FC<TasksScreenProps> = ({
  taskStatistics = null,
  statisticsLoading = false,
  onRefreshStatistics,
}) => {
  const { isDark } = useTheme();

  /**
   * Column-Specific State Management
   * 
   * Each Kanban column has independent state for tasks, pagination,
   * loading, and error handling to provide optimal user experience.
   */
  const createInitialColumnState = (): ColumnState => ({
    tasks: [],
    loading: true,
    refreshing: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalTasks: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10, // Smaller page size for mobile optimization
    },
    statusMetadata: null,
    overdueMetadata: null,
  });

  const [columnStates, setColumnStates] = useState<Record<KanbanColumnStatus, ColumnState>>({
    todo: createInitialColumnState(),
    in_progress: createInitialColumnState(),
    done: createInitialColumnState(),
  });

  /**
   * Global Operation State Management
   * 
   * Tracks operations that affect multiple columns (create, update, delete)
   */
  const [globalLoading, setGlobalLoading] = useState<GlobalLoadingState>({
    creating: false,
    updating: false,
    deleting: false,
  });

  const [globalErrors, setGlobalErrors] = useState<GlobalErrorState>({
    create: null,
    update: null,
    delete: null,
  });

  /**
   * Enhanced Modal State Management
   * 
   * Streamlined modal management with unified form handling
   * for both creation and editing workflows.
   */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<EditableTaskData | null>(null);
  const [modalTitle, setModalTitle] = useState('Create New Task');

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardType | null>(null);

  /**
   * Overdue Filter State Management
   * 
   * Manages the overdue filter toggle and overdue task counts
   * for enhanced task prioritization and deadline management.
   */
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [overdueCounts, setOverdueCounts] = useState<{ todo: number; in_progress: number }>({ todo: 0, in_progress: 0 });
  const [localStatistics, setLocalStatistics] = useState<TaskStatistics | null>(null);
  const [localStatsLoading, setLocalStatsLoading] = useState(false);
  const effectiveStatistics = taskStatistics ?? localStatistics;
  const effectiveStatsLoading = statisticsLoading || localStatsLoading;
  const [activeErrorIndex, setActiveErrorIndex] = useState(0);
  const overdueSwitchAnim = useRef(new Animated.Value(showOverdueOnly ? 1 : 0)).current;
  const handleToggleOverdue = useCallback(() => {
    setShowOverdueOnly(prev => !prev);
  }, []);

  const overdueSummary = useMemo(() => {
    const total = overdueCounts.todo + overdueCounts.in_progress;
    const severities = { critical: 0, high: 0, medium: 0, low: 0 };
    (['todo', 'in_progress'] as KanbanColumnStatus[]).forEach(status => {
      const breakdown = columnStates[status].overdueMetadata?.severityBreakdown;
      if (breakdown) {
        (Object.keys(severities) as Array<keyof typeof severities>).forEach(key => {
          severities[key] += breakdown[key] || 0;
        });
      }
    });
    return { total, severities };
  }, [overdueCounts, columnStates]);

  useEffect(() => {
    Animated.timing(overdueSwitchAnim, {
      toValue: showOverdueOnly ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [showOverdueOnly, overdueSwitchAnim]);

  useEffect(() => {
    if (effectiveStatistics) {
      setOverdueCounts({
        todo: effectiveStatistics.overdueBreakdown.active.todo,
        in_progress: effectiveStatistics.overdueBreakdown.active.in_progress,
      });
    }
  }, [effectiveStatistics]);

  const overdueTrackBackground = overdueSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? '#374151' : '#E5E7EB', isDark ? '#991B1B' : '#DC2626'],
  });

  const overdueKnobTranslate = overdueSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 14],
  });

  /**
   * Column-Specific API Integration Functions
   * 
   * Functions for fetching and managing tasks from the backend API
   * with column-specific state management and error handling.
   */

  /**
   * Fetch Tasks for Specific Column
   * 
   * Retrieves tasks for a specific status column with enhanced filtering and pagination
   * 
   * @param status - Column status to fetch tasks for
   * @param params - Additional query parameters
   * @param isRefresh - Whether this is a refresh operation
   * @param loadMore - Whether this is loading more pages (pagination)
   */
  const fetchColumnTasks = useCallback(async (
    status: KanbanColumnStatus,
    params: Omit<TaskQueryParams, 'status'> = {},
    isRefresh = false,
    loadMore = false
  ) => {
    try {
      // Update loading state for the specific column
      setColumnStates(prev => ({
        ...prev,
        [status]: {
          ...prev[status],
          loading: !isRefresh && !loadMore,
          refreshing: isRefresh,
          error: null,
        }
      }));

      let response;

      // Use overdue endpoint if showing overdue only, regular endpoint otherwise
      if (showOverdueOnly && (status === 'todo' || status === 'in_progress')) {
        response = await tasksService.getOverdueTasksByStatus(status, {
          sortBy: 'daysPastDue',
          sortOrder: 'desc',
          limit: 10,
          ...params,
        });
      } else {
        // Use the optimized status-specific API
        response = await tasksService.getTasksByStatusOptimized(status, {
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 10, // Smaller page size for mobile optimization
          ...params,
        });
      }

      const statusMetadata = response.statusMetadata || null;
      const overdueMetadata = response.overdueMetadata || null;

      setColumnStates(prev => ({
        ...prev,
        [status]: {
          ...prev[status],
          tasks: isRefresh || !loadMore
            ? response.tasks
            : [...prev[status].tasks, ...response.tasks],
          pagination: response.pagination,
          statusMetadata,
          overdueMetadata,
          loading: false,
          refreshing: false,
          error: null,
        }
      }));

    } catch (error) {
      const taskError = error as TaskError;
      console.error(`Error fetching ${status} tasks:`, taskError);

      setColumnStates(prev => ({
        ...prev,
        [status]: {
          ...prev[status],
          loading: false,
          refreshing: false,
          error: taskError.message || `Failed to load ${status.replace('_', ' ')} tasks. Please try again.`,
          // Preserve the last known metadata so the UI doesn't flicker
          statusMetadata: prev[status].statusMetadata,
          overdueMetadata: prev[status].overdueMetadata,
        }
      }));
    }
  }, [showOverdueOnly]);

  /**
   * Refresh Task Statistics Snapshot
   * 
   * Pulls analytics either via the parent-provided callback or, when unavailable,
   * falls back to a local API call so this screen keeps working in isolation.
   */
  const refreshStatisticsSnapshot = useCallback(async () => {
    if (onRefreshStatistics) {
      await onRefreshStatistics();
      return;
    }

    try {
      setLocalStatsLoading(true);
      const response = await tasksService.getTaskStatistics();
      setLocalStatistics(response.statistics);
    } catch (error) {
      console.error('Error fetching task statistics locally:', error);
    } finally {
      setLocalStatsLoading(false);
    }
  }, [onRefreshStatistics]);

  /**
   * Fetch All Columns
   * 
   * Fetches tasks for all columns simultaneously for initial load
   */
  const fetchAllColumns = useCallback(async (isRefresh = false) => {
    const statuses: KanbanColumnStatus[] = ['todo', 'in_progress', 'done'];

    // Fetch all columns in parallel for better performance
    await Promise.allSettled(
      statuses.map(status => fetchColumnTasks(status, {}, isRefresh))
    );
  }, [fetchColumnTasks]);

  /**
   * Refresh Specific Column
   * 
   * Refreshes tasks for a specific column
   */
  const refreshColumn = useCallback(async (status: KanbanColumnStatus) => {
    await fetchColumnTasks(status, {}, true);
  }, [fetchColumnTasks]);

  /**
   * Load More Tasks for Column
   * 
   * Loads the next page of tasks for a specific column
   */
  const loadMoreColumnTasks = useCallback(async (status: KanbanColumnStatus) => {
    const currentState = columnStates[status];
    if (currentState.loading || !currentState.pagination.hasNextPage) {
      return;
    }

    await fetchColumnTasks(status, {
      page: currentState.pagination.currentPage + 1,
    }, false, true);
  }, [columnStates, fetchColumnTasks]);

  /**
   * Initial Data Load
   * 
   * Load tasks for all columns and overdue counts when component mounts
   */
  useEffect(() => {
    fetchAllColumns();
    refreshStatisticsSnapshot();
  }, [fetchAllColumns, refreshStatisticsSnapshot]);

  /**
   * Handle Overdue Filter Toggle
   * 
   * Reload all columns when overdue filter is toggled
   */
  useEffect(() => {
    if (showOverdueOnly) {
      // When switching to overdue mode, refresh all columns
      fetchAllColumns(true);
    } else {
      // When switching back to normal mode, refresh all columns
      fetchAllColumns(true);
    }
  }, [showOverdueOnly, fetchAllColumns]);

  useEffect(() => {
    if (showOverdueOnly) {
      refreshStatisticsSnapshot();
    }
  }, [showOverdueOnly, refreshStatisticsSnapshot]);

  /**
   * Auto-refresh tasks periodically
   * 
   * Refresh all columns every 5 minutes to keep data current
   * Only refresh if no columns are currently loading
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const anyColumnLoading = Object.values(columnStates).some(
        column => column.loading || column.refreshing
      );

      if (!anyColumnLoading && !globalLoading.creating && !globalLoading.updating && !globalLoading.deleting) {
        fetchAllColumns(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchAllColumns, columnStates, globalLoading]);

  /**
   * Utility Functions for Column-Specific Task Management
   * 
   * Efficient helper functions for working with column-specific state
   * and transforming data for TaskCard components.
   */

  /**
   * Transform backend Task to TaskCard format
   * 
   * Converts API Task format to the format expected by TaskCard component
   */
  const transformTaskForCard = useCallback((apiTask: Task): TaskCardType => {
    // Helper function to extract user details if populated
    const extractUserDetails = (userRef: string | { _id: string; firstName: string; lastName: string; email: string; fullName?: string; }) => {
      if (typeof userRef === 'object' && userRef !== null) {
        return {
          _id: userRef._id,
          firstName: userRef.firstName,
          lastName: userRef.lastName,
          email: userRef.email,
          fullName: userRef.fullName || `${userRef.firstName} ${userRef.lastName}`.trim(),
        };
      }
      return undefined;
    };

    return {
      id: apiTask._id, // Use the full ObjectId as string to avoid duplicate keys
      title: apiTask.title,
      description: apiTask.description || '',
      priority: apiTask.priority,
      status: apiTask.status,
      dueDate: apiTask.dueDate || '',
      category: apiTask.category,
      createdAt: new Date(apiTask.createdAt).toLocaleDateString(),
      tags: apiTask.tags || [],
      assignedTo: extractUserDetails(apiTask.assignedTo),
      assignedBy: extractUserDetails(apiTask.assignedBy),
      isOverdue: apiTask.overdueMetadata?.isOverdue ?? apiTask.isOverdue ?? false,
      overdueMetadata: apiTask.overdueMetadata,
    };
  }, []);

  /**
   * Get transformed tasks for a specific column
   * 
   * Gets tasks from column state and transforms them for TaskCard components
   */
  const getColumnTasks = useCallback((status: KanbanColumnStatus): TaskCardType[] => {
    return columnStates[status].tasks.map(transformTaskForCard);
  }, [columnStates, transformTaskForCard]);

  /**
   * Update Task in Column State
   * 
   * Updates a specific task in the appropriate column state after operations
   */
  const updateTaskInColumnState = useCallback((updatedTask: Task) => {
    const status = updatedTask.status as KanbanColumnStatus;

    setColumnStates(prev => {
      const newStates = { ...prev };

      // Find and update the task in its current status column
      Object.keys(newStates).forEach(columnStatus => {
        const column = newStates[columnStatus as KanbanColumnStatus];
        const taskIndex = column.tasks.findIndex(task => task._id === updatedTask._id);

        if (taskIndex !== -1) {
          if (columnStatus === status) {
            // Update task in same column
            column.tasks[taskIndex] = updatedTask;
          } else {
            // Remove task from old column
            column.tasks = column.tasks.filter(task => task._id !== updatedTask._id);
          }
        }
      });

      // Add task to new column if it moved
      const targetColumn = newStates[status];
      const existsInTargetColumn = targetColumn.tasks.some(task => task._id === updatedTask._id);
      if (!existsInTargetColumn) {
        targetColumn.tasks = [updatedTask, ...targetColumn.tasks];
      }

      return newStates;
    });
  }, []);

  /**
   * Remove Task from Column State
   * 
   * Removes a task from all column states after deletion
   */
  const removeTaskFromColumnState = useCallback((taskId: string) => {
    setColumnStates(prev => {
      const newStates = { ...prev };

      Object.keys(newStates).forEach(status => {
        newStates[status as KanbanColumnStatus].tasks =
          newStates[status as KanbanColumnStatus].tasks.filter(task => task._id !== taskId);
      });

      return newStates;
    });
  }, []);

  /**
   * Add Task to Column State
   * 
   * Adds a new task to the appropriate column state after creation
   */
  const addTaskToColumnState = useCallback((newTask: Task) => {
    const status = newTask.status as KanbanColumnStatus;

    setColumnStates(prev => ({
      ...prev,
      [status]: {
        ...prev[status],
        tasks: [newTask, ...prev[status].tasks], // Add to beginning for recency
      }
    }));
  }, []);

  /**
   * Enhanced Task Management Functions
   * 
   * Comprehensive callback functions for handling all task-related
   * operations with proper validation and user feedback.
   */


  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setModalTitle('Create New Task');
    setShowTaskModal(true);
  }, []);

  const handleEditTask = useCallback((task: TaskCardType) => {
    // Find the original Task from column state data - task.id is the ObjectId string
    let originalTask: Task | undefined;

    // Search through all column states to find the task
    Object.values(columnStates).forEach(column => {
      const found = column.tasks.find(t => t._id === task.id);
      if (found) {
        originalTask = found;
      }
    });

    if (originalTask) {
      // Transform API Task to the format expected by TaskFormModal
      const editingTaskData: EditableTaskData = {
        id: originalTask._id, // Keep as string ObjectId
        title: originalTask.title,
        description: originalTask.description || '',
        priority: originalTask.priority,
        status: originalTask.status,
        dueDate: originalTask.dueDate || '',
        category: originalTask.category || '',
        tags: originalTask.tags || [], // Include tags from API
        estimatedHours: originalTask.estimatedHours || 0, // Include estimated hours from API
        createdAt: new Date(originalTask.createdAt).toLocaleDateString()
      };

      setEditingTask(editingTaskData);
      setModalTitle('Edit Task');
      setShowTaskModal(true);
    } else {
      console.error('Could not find original task for editing. Task ID:', task.id);
      Alert.alert('Error', 'Could not find the task to edit. Please try refreshing.');
    }
  }, [columnStates]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setGlobalLoading(prev => ({ ...prev, deleting: true }));
              setGlobalErrors(prev => ({ ...prev, delete: null }));

              // Delete task via API
              await tasksService.deleteTask(taskId);

              // Remove from column states
              removeTaskFromColumnState(taskId);
              await refreshStatisticsSnapshot();

              // Optional: Show success message
              // Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              const taskError = error as TaskError;
              setGlobalErrors(prev => ({
                ...prev,
                delete: taskError.message || 'Failed to delete task. Please try again.'
              }));
              console.error('Error deleting task:', taskError);
            } finally {
              setGlobalLoading(prev => ({ ...prev, deleting: false }));
            }
          }
        }
      ]
    );
  }, [removeTaskFromColumnState, refreshStatisticsSnapshot]);

  const handleMoveTask = useCallback(async (taskId: string, newStatus: ColumnStatus) => {
    try {
      setGlobalLoading(prev => ({ ...prev, updating: true }));
      setGlobalErrors(prev => ({ ...prev, update: null }));

      // Update task status via API
      const response = await tasksService.updateTaskStatus(taskId, newStatus);

      // Update column states with the updated task
      updateTaskInColumnState(response.task);
      await refreshStatisticsSnapshot();

    } catch (error) {
      const taskError = error as TaskError;
      setGlobalErrors(prev => ({
        ...prev,
        update: taskError.message || 'Failed to update task status. Please try again.'
      }));
      console.error('Error updating task:', taskError);
    } finally {
      setGlobalLoading(prev => ({ ...prev, updating: false }));
    }
  }, [updateTaskInColumnState, refreshStatisticsSnapshot]);

  const handleTaskPress = useCallback((task: TaskCardType) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedTask(null);
  }, []);

  const handleFormSubmit = useCallback(async (formData: FormData) => {
    try {
      if (editingTask) {
        setGlobalLoading(prev => ({ ...prev, updating: true }));
        setGlobalErrors(prev => ({ ...prev, update: null }));

        console.log('Updating task:', editingTask.id, 'with data:', formData);

        const updateData = {
          title: formData.title?.trim() || '',
          description: formData.description?.trim() || undefined,
          priority: formData.priority,
          category: formData.category?.trim() || undefined,
          dueDate: formData.dueDate ? formatDateForAPI(formData.dueDate) : undefined,
          tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
          estimatedHours: formData.estimatedHours && formData.estimatedHours > 0 ? formData.estimatedHours : undefined,
          assignedTo: formData.assignedTo?.trim() || undefined
        };

        const response = await tasksService.updateTask(editingTask.id, updateData);
        console.log('Update response:', response);

        // Update column states with the updated task
        updateTaskInColumnState(response.task);
        await refreshStatisticsSnapshot();

        Alert.alert('Success', 'Task updated successfully!');
      } else {
        setGlobalLoading(prev => ({ ...prev, creating: true }));
        setGlobalErrors(prev => ({ ...prev, create: null }));

        // Create new task
        const createData = {
          title: formData.title?.trim() || '',
          description: formData.description?.trim() || undefined,
          priority: formData.priority,
          category: formData.category?.trim() || undefined,
          dueDate: formData.dueDate ? formatDateForAPI(formData.dueDate) : undefined,
          tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
          estimatedHours: formData.estimatedHours && formData.estimatedHours > 0 ? formData.estimatedHours : undefined,
          assignedTo: formData.assignedTo?.trim() || undefined
        };

        const response = await tasksService.createTask(createData);
        // console.log('Create response:', response);

        // Add to column states
        addTaskToColumnState(response.task);
        await refreshStatisticsSnapshot();

        Alert.alert('Success', 'Task created successfully!');
      }

      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      const taskError = error as TaskError;
      const errorKey = editingTask ? 'update' : 'create';
      setGlobalErrors(prev => ({
        ...prev,
        [errorKey]: taskError.message || `Failed to ${editingTask ? 'update' : 'create'} task. Please try again.`
      }));
      console.error(`Error ${editingTask ? 'updating' : 'creating'} task:`, taskError);
    } finally {
      const loadingKey = editingTask ? 'updating' : 'creating';
      setGlobalLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [editingTask, updateTaskInColumnState, addTaskToColumnState, refreshStatisticsSnapshot]);

  const handleCloseModal = useCallback(() => {
    setShowTaskModal(false);
    setEditingTask(null);
    // Clear any create/update errors when closing modal
    setGlobalErrors(prev => ({ ...prev, create: null, update: null }));
  }, []);

  /**
   * Column-Specific Refresh Handler
   * 
   * Refreshes tasks for a specific column when user pulls down
   */
  const handleColumnRefresh = useCallback((status: KanbanColumnStatus) => {
    return () => refreshColumn(status);
  }, [refreshColumn]);

  /**
   * Global Refresh Handler
   * 
   * Refreshes all columns simultaneously
   */
  const handleGlobalRefresh = useCallback(() => {
    fetchAllColumns(true);
  }, [fetchAllColumns]);

  /**
   * Column Load More Handler
   * 
   * Creates a load more handler for a specific column
   */
  const handleColumnLoadMore = useCallback((status: KanbanColumnStatus) => {
    return () => loadMoreColumnTasks(status);
  }, [loadMoreColumnTasks]);

  /**
   * Error Dismissal Handlers
   * 
   * Allows users to dismiss error messages for both global and column-specific errors
   */
  const dismissGlobalError = useCallback((errorType: keyof GlobalErrorState) => {
    setGlobalErrors(prev => ({ ...prev, [errorType]: null }));
  }, []);

  const dismissColumnError = useCallback((status: KanbanColumnStatus) => {
    setColumnStates(prev => ({
      ...prev,
      [status]: {
        ...prev[status],
        error: null,
      }
    }));
  }, []);

  // Calculate responsive column width with enhanced breakpoints
  const getColumnWidth = () => {
    if (SCREEN_WIDTH >= 1200) return 380; // Large desktop
    if (SCREEN_WIDTH >= 1024) return 350; // Desktop
    if (SCREEN_WIDTH >= 768) return 320;  // Tablet landscape
    if (SCREEN_WIDTH >= 640) return 300;  // Tablet portrait
    return Math.max(280, SCREEN_WIDTH * 0.88); // Mobile - maximize screen usage
  };

  const errorCards = useMemo(() => {
    const cards: Array<{
      id: string;
      title: string;
      message: string;
      tone: 'warning' | 'danger';
      onDismiss: () => void;
    }> = [];

    if (globalErrors.create) {
      cards.push({
        id: 'global-create',
        title: 'Create issue',
        message: globalErrors.create,
        tone: 'warning',
        onDismiss: () => dismissGlobalError('create'),
      });
    }
    if (globalErrors.update) {
      cards.push({
        id: 'global-update',
        title: 'Update issue',
        message: globalErrors.update,
        tone: 'warning',
        onDismiss: () => dismissGlobalError('update'),
      });
    }
    if (globalErrors.delete) {
      cards.push({
        id: 'global-delete',
        title: 'Delete issue',
        message: globalErrors.delete,
        tone: 'warning',
        onDismiss: () => dismissGlobalError('delete'),
      });
    }

    Object.entries(columnStates).forEach(([status, col]) => {
      if (col.error) {
        cards.push({
          id: `column-${status}`,
          title: `${status.replace('_', ' ')} column`,
          message: col.error,
          tone: 'danger',
          onDismiss: () => dismissColumnError(status as KanbanColumnStatus),
        });
      }
    });

    return cards;
  }, [globalErrors, columnStates, dismissGlobalError, dismissColumnError]);

  const handleErrorScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!errorCards.length) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / (ERROR_CARD_WIDTH + 16));
      setActiveErrorIndex(Math.min(errorCards.length - 1, Math.max(0, index)));
    },
    [errorCards.length]
  );

  useEffect(() => {
    if (activeErrorIndex >= errorCards.length) {
      setActiveErrorIndex(errorCards.length > 0 ? errorCards.length - 1 : 0);
    }
  }, [activeErrorIndex, errorCards.length]);

  /**
   * Focused Kanban Board Render
   * 
   * Clean, distraction-free interface that maximizes space for task management
   * with responsive column layout and intuitive interactions.
   */
  return (
    <View className="flex-1">
      {/* Minimal Header - Maximum space for content */}
      <View className={`px-4 py-3 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
            }`}>
            Tasks
          </Text>
          {/* Loader */}
          {(Object.values(columnStates).some(col => col.loading || col.refreshing) ||
            globalLoading.creating || globalLoading.updating || globalLoading.deleting ||
            effectiveStatsLoading) && (
              <ActivityIndicator
                size="small"
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
            )}

          {/* Overdue Filter Toggle & Task Statistics */}
          <View className="flex-row items-center gap-x-4">
            <Pressable
              onPress={handleToggleOverdue}
              accessibilityRole="switch"
              accessibilityState={{ checked: showOverdueOnly }}
              accessibilityLabel="Toggle overdue filter"
              className={`flex-row items-center px-3 py-1 rounded-2xl border ${showOverdueOnly
                  ? isDark
                    ? 'bg-red-600/20 border-red-600/40'
                    : 'bg-red-50 border-red-200'
                  : isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
            >
              <Animated.View
                style={[
                  {
                    width: 40,
                    height: 24,
                    borderRadius: 999,
                    padding: 2,
                    justifyContent: 'center',
                  },
                  { backgroundColor: overdueTrackBackground },
                ]}
              >
                <Animated.View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: overdueKnobTranslate }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 1.5,
                    elevation: 2,
                  }}
                />
              </Animated.View>
              <View className="ml-3">
                <Text
                  className={`text-sm font-semibold ${showOverdueOnly
                      ? isDark
                        ? 'text-red-200'
                        : 'text-red-700'
                      : isDark
                        ? 'text-gray-200'
                        : 'text-gray-800'
                    }`}
                >
                  {showOverdueOnly ? 'Overdue only' : 'All tasks'}
                </Text>
                {effectiveStatistics && (
                  <Text
                    className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    {effectiveStatistics.overdueBreakdown.active.total} overdue ·{' '}
                    {effectiveStatistics.normalBreakdown.total} on track
                  </Text>
                )}
              </View>
            </Pressable>

            {/* <Text className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {(() => {
                const totalTasks = Object.values(columnStates).reduce((sum, col) => sum + col.tasks.length, 0);
                const totalFromAPI = Object.values(columnStates).reduce((sum, col) => sum + col.pagination.totalTasks, 0);
                
                return totalFromAPI > totalTasks 
                  ? `${totalTasks} of ${totalFromAPI}` 
                  : `${totalTasks} total`;
              })()}
            </Text> */}
            {Object.values(columnStates).some(col => col.pagination.hasNextPage) && (
              <Text className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                More available
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* {overdueSummary.total > 0 && (
        <View className="px-4 py-3">
          <View className={`rounded-2xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'
            }`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Overdue overview
                </Text>
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  {overdueSummary.total} task{overdueSummary.total !== 1 ? 's' : ''} behind schedule
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-3">
                {(Object.keys(overdueSummary.severities) as Array<keyof typeof overdueSummary.severities>).map((severity) => {
                  const count = overdueSummary.severities[severity];
                  if (!count) return null;
                  const palette = severitySummaryTheme[severity];
                  return (
                    <View
                      key={`summary-${severity}`}
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: palette.bg }}
                    >
                      <Text
                        className="text-xs font-semibold uppercase"
                        style={{ color: palette.text }}
                      >
                        {severity} · {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {!showOverdueOnly && (
              <TouchableOpacity
                onPress={() => setShowOverdueOnly(true)}
                className="px-3 py-1.5 rounded-full bg-red-600 w-28 mt-1"
              >
                <Text className="text-xs font-semibold text-white">
                  Review overdue
                </Text>
              </TouchableOpacity>
            )}
            </View>
            
          </View>
        </View>
      )} */}

      {/* Error Display */}
      {errorCards.length > 0 && (
        <View className="px-4 mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={ERROR_CARD_WIDTH + 16}
            decelerationRate="fast"
            onScroll={handleErrorScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {errorCards.map((card, index) => {
              const isWarning = card.tone === 'warning';
              const containerClasses = isWarning
                ? isDark
                  ? 'bg-orange-900/30 border border-orange-800/60'
                  : 'bg-orange-50 border border-orange-200'
                : isDark
                  ? 'bg-red-900/30 border border-red-800/60'
                  : 'bg-red-50 border border-red-200';
              const textColor = isWarning
                ? isDark ? 'text-orange-200' : 'text-orange-700'
                : isDark ? 'text-red-200' : 'text-red-700';

              return (
                <View
                  key={card.id}
                  style={{
                    width: ERROR_CARD_WIDTH,
                    marginRight: index === errorCards.length - 1 ? 0 : 16,
                  }}
                  className={`rounded-2xl px-4 py-3 ${containerClasses}`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <AlertCircle
                        size={18}
                        color={isWarning ? (isDark ? '#FDBA74' : '#EA580C') : (isDark ? '#F87171' : '#B91C1C')}
                      />
                      <Text className={`ml-2 text-xs font-semibold uppercase ${textColor}`}>
                        {card.title}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={card.onDismiss}>
                      <Text className={textColor}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {card.message}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          <View className="flex-row justify-center mt-2">
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {activeErrorIndex + 1} / {errorCards.length}
            </Text>
          </View>
        </View>
      )}

      {/* Full-Screen Kanban Board */}
      <View className="flex-1">
        {Object.values(columnStates).every(col => col.loading) ? (
          // Initial Loading State - All columns loading
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator
              size="large"
              color={isDark ? '#60A5FA' : '#3B82F6'}
            />
            <Text className={`mt-4 text-base ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Loading tasks...
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_WIDTH >= 768 ? 24 : 16,
              paddingVertical: SCREEN_WIDTH >= 768 ? 24 : 16,
              minWidth: SCREEN_WIDTH
            }}
            style={{ flex: 1 }}
            bounces={true}
            decelerationRate="fast"
            pagingEnabled={SCREEN_WIDTH < 768} // Enable paging on mobile for better UX
            snapToInterval={SCREEN_WIDTH < 768 ? getColumnWidth() + 16 : undefined}
            snapToAlignment="start"
          >
            <View
              className="flex-row h-full"
              style={{
                maxHeight: 700,
                minHeight: 450,
                gap: SCREEN_WIDTH >= 768 ? 20 : 16, // Larger gaps on tablets/desktop
                minWidth: SCREEN_WIDTH - (SCREEN_WIDTH >= 768 ? 48 : 32),
                width: getColumnWidth() * (showOverdueOnly ? 2 : 3) + (SCREEN_WIDTH >= 768 ? (showOverdueOnly ? 20 : 40) : (showOverdueOnly ? 16 : 32)) // Adjust for 2 or 3 columns
              }}
            >
              {/* To Do Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn
                  status="todo"
                  title={showOverdueOnly ? "Overdue To Do" : "To Do"}
                  color="#EF4444"
                  tasks={getColumnTasks('todo')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleColumnRefresh('todo')}
                  refreshing={columnStates.todo.refreshing}
                  statusMetadata={columnStates.todo.statusMetadata}
                  overdueMetadata={columnStates.todo.overdueMetadata}
                  showOverdueDetails={showOverdueOnly}
                />
              </View>

              {/* In Progress Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn
                  status="in_progress"
                  title={showOverdueOnly ? "Overdue In Progress" : "In Progress"}
                  color="#F59E0B"
                  tasks={getColumnTasks('in_progress')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleColumnRefresh('in_progress')}
                  refreshing={columnStates.in_progress.refreshing}
                  statusMetadata={columnStates.in_progress.statusMetadata}
                  overdueMetadata={columnStates.in_progress.overdueMetadata}
                  showOverdueDetails={showOverdueOnly}
                />
              </View>

              {/* Done Column - Hidden when showing overdue only */}
              {!showOverdueOnly && (
                <View style={{ width: getColumnWidth() }}>
                  <KanbanColumn
                    status="done"
                    title="Done"
                    color="#10B981"
                    tasks={getColumnTasks('done')}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onMoveTask={handleMoveTask}
                    onPressTask={handleTaskPress}
                    onRefresh={handleColumnRefresh('done')}
                    refreshing={columnStates.done.refreshing}
                    statusMetadata={columnStates.done.statusMetadata}
                    overdueMetadata={columnStates.done.overdueMetadata}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Enhanced Floating Action Button for Task Creation */}
      <Pressable
        onPress={handleCreateTask}
        disabled={globalLoading.creating}
        className={`absolute ${SCREEN_WIDTH >= 768 ? 'bottom-8 right-8 w-16 h-16' : 'bottom-6 right-6 w-14 h-14'
          } rounded-full items-center justify-center bg-green-500 border-[0.3px] elevation-xl ${isDark ? 'border-white' : 'border-gray-300'
          }`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        })}
        accessibilityLabel="Create New Task"
        accessibilityHint="Opens form to create a new task"
        accessibilityRole="button"
      >
        {globalLoading.creating ? (
          <ActivityIndicator size={SCREEN_WIDTH >= 768 ? 28 : 24} color="#FFFFFF" />
        ) : (
          <Plus size={SCREEN_WIDTH >= 768 ? 32 : 28} color="#FFFFFF" strokeWidth={3} />
        )}
      </Pressable>

      {/* Task Form Modal with Column-Aware Loading State */}
      <TaskFormModal
        visible={showTaskModal}
        title={modalTitle}
        editingTask={editingTask}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={globalLoading.creating || globalLoading.updating}
        error={globalErrors.create || globalErrors.update}
      />

      <TaskDetailsModal
        visible={showDetailsModal}
        task={selectedTask}
        onClose={handleCloseDetailsModal}
      />
    </View>
  );
}

export default Tasks;
