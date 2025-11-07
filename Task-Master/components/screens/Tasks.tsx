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

import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Plus, AlertCircle } from 'lucide-react-native';

// Import focused task management components
import KanbanColumn from '../tasks/KanbanColumn';
import TaskFormModal from '../tasks/TaskFormModal';
import TaskDetailsModal from '../tasks/TaskDetailsModal';
import { Task as TaskCardType, ColumnStatus } from '../tasks/TaskCard';

// Import API types and service
import { Task, TasksListResponse, TaskError, TaskQueryParams } from '@/types/task.types';
import { tasksService } from '@/services/tasks.service';

// Import validation utilities
import { InputSanitizer, ErrorRecovery } from '@/utils/validation';

// Get device dimensions for responsive layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}

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
  statusMetadata: {
    status: string;
    totalInStatus: number;
    currentPageCount: number;
    hasOverdue: boolean;
  } | null;
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
export default function Tasks() {
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

      // Use the optimized status-specific API
      const response = await tasksService.getTasksByStatusOptimized(status, {
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: 10, // Smaller page size for mobile optimization
        ...params,
      });

      setColumnStates(prev => ({
        ...prev,
        [status]: {
          ...prev[status],
          tasks: isRefresh || !loadMore 
            ? response.tasks 
            : [...prev[status].tasks, ...response.tasks],
          pagination: response.pagination,
          statusMetadata: response.data?.statusMetadata || null,
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
        }
      }));
    }
  }, []);

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
   * Load tasks for all columns when component mounts
   */
  useEffect(() => {
    fetchAllColumns();
  }, [fetchAllColumns]);
  
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
    return {
      id: apiTask._id, // Use the full ObjectId as string to avoid duplicate keys
      title: apiTask.title,
      description: apiTask.description || '',
      priority: apiTask.priority,
      status: apiTask.status,
      dueDate: apiTask.dueDate ? new Date(apiTask.dueDate).toLocaleDateString() : 'No due date',
      category: apiTask.category,
      createdAt: new Date(apiTask.createdAt).toLocaleDateString()
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
  }, [removeTaskFromColumnState]);

  const handleMoveTask = useCallback(async (taskId: string, newStatus: ColumnStatus) => {
    try {
      setGlobalLoading(prev => ({ ...prev, updating: true }));
      setGlobalErrors(prev => ({ ...prev, update: null }));
      
      // Update task status via API
      const response = await tasksService.updateTaskStatus(taskId, newStatus);
      
      // Update column states with the updated task
      updateTaskInColumnState(response.task);
      
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
  }, [updateTaskInColumnState]);

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
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          category: formData.category.trim() || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          estimatedHours: formData.estimatedHours > 0 ? formData.estimatedHours : undefined,
          assignedTo: formData.assignedTo || undefined
        };
        
        const response = await tasksService.updateTask(editingTask.id, updateData);
        console.log('Update response:', response);
        
        // Update column states with the updated task
        updateTaskInColumnState(response.task);
        
        Alert.alert('Success', 'Task updated successfully!');
      } else {
        setGlobalLoading(prev => ({ ...prev, creating: true }));
        setGlobalErrors(prev => ({ ...prev, create: null }));
        
        // Create new task
        const createData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          category: formData.category.trim() || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          estimatedHours: formData.estimatedHours > 0 ? formData.estimatedHours : undefined,
          assignedTo: formData.assignedTo || undefined
        };
        
        const response = await tasksService.createTask(createData);
        console.log('Create response:', response);
        
        // Add to column states
        addTaskToColumnState(response.task);
        
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
  }, [editingTask, updateTaskInColumnState, addTaskToColumnState]);

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

  /**
   * Focused Kanban Board Render
   * 
   * Clean, distraction-free interface that maximizes space for task management
   * with responsive column layout and intuitive interactions.
   */
  return (
    <View className="flex-1">
      {/* Minimal Header - Maximum space for content */}
      <View className={`px-4 py-3 border-b ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
      }`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Tasks
          </Text>
          
          {/* Task Statistics */}
          <View className="flex-row items-center gap-x-4">
            {(Object.values(columnStates).some(col => col.loading || col.refreshing) || 
              globalLoading.creating || globalLoading.updating || globalLoading.deleting) && (
              <ActivityIndicator 
                size="small" 
                color={isDark ? '#60A5FA' : '#3B82F6'} 
              />
            )}
            <Text className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {(() => {
                const totalTasks = Object.values(columnStates).reduce((sum, col) => sum + col.tasks.length, 0);
                const totalFromAPI = Object.values(columnStates).reduce((sum, col) => sum + col.pagination.totalTasks, 0);
                
                return totalFromAPI > totalTasks 
                  ? `${totalTasks} of ${totalFromAPI}` 
                  : `${totalTasks} total`;
              })()}
            </Text>
            {Object.values(columnStates).some(col => col.pagination.hasNextPage) && (
              <Text className={`text-xs ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                More available
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Error Display */}
      {(() => {
        const hasGlobalErrors = globalErrors.create || globalErrors.update || globalErrors.delete;
        const columnErrors = Object.entries(columnStates)
          .filter(([_, col]) => col.error)
          .map(([status, col]) => ({ status, error: col.error }));
        
        return (hasGlobalErrors || columnErrors.length > 0) && (
          <View className={`mx-4 mb-4 gap-y-2`}>
            {/* Column-Specific Errors */}
            {columnErrors.map(({ status, error }) => (
              <View 
                key={status}
                className={`p-4 rounded-lg border ${
                  isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <AlertCircle size={20} color={isDark ? '#F87171' : '#EF4444'} />
                    <View className="ml-2 flex-1">
                      <Text className={`text-xs font-medium ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {status.replace('_', ' ').toUpperCase()} COLUMN
                      </Text>
                      <Text className={`${
                        isDark ? 'text-red-300' : 'text-red-700'
                      }`}>
                        {error}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => dismissColumnError(status as KanbanColumnStatus)}
                    className="ml-2 p-1"
                  >
                    <Text className={isDark ? 'text-red-400' : 'text-red-600'}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {/* Global Operation Errors */}
            {hasGlobalErrors && (
              <View className={`p-3 rounded-lg border ${
                isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
              }`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <AlertCircle size={18} color={isDark ? '#FB923C' : '#EA580C'} />
                    <Text className={`ml-2 flex-1 text-sm ${
                      isDark ? 'text-orange-300' : 'text-orange-700'
                    }`}>
                      {globalErrors.create || globalErrors.update || globalErrors.delete}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      if (globalErrors.create) dismissGlobalError('create');
                      if (globalErrors.update) dismissGlobalError('update');
                      if (globalErrors.delete) dismissGlobalError('delete');
                    }}
                    className="ml-2 p-1"
                  >
                    <Text className={isDark ? 'text-orange-400' : 'text-orange-600'}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })()}

      {/* Full-Screen Kanban Board */}
      <View className="flex-1">
        {Object.values(columnStates).every(col => col.loading) ? (
          // Initial Loading State - All columns loading
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator 
              size="large" 
              color={isDark ? '#60A5FA' : '#3B82F6'} 
            />
            <Text className={`mt-4 text-base ${
              isDark ? 'text-gray-300' : 'text-gray-600'
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
                gap: SCREEN_WIDTH >= 768 ? 20 : 16, // Larger gaps on tablets/desktop
                minWidth: SCREEN_WIDTH - (SCREEN_WIDTH >= 768 ? 48 : 32),
                width: getColumnWidth() * 3 + (SCREEN_WIDTH >= 768 ? 40 : 32) // 3 columns + responsive gaps
              }}
            >
              {/* To Do Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn 
                  status="todo" 
                  title="To Do" 
                  color="#EF4444"
                  tasks={getColumnTasks('todo')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleColumnRefresh('todo')}
                  refreshing={columnStates.todo.refreshing}
                />
              </View>
              
              {/* In Progress Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn 
                  status="in_progress" 
                  title="In Progress" 
                  color="#F59E0B"
                  tasks={getColumnTasks('in_progress')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleColumnRefresh('in_progress')}
                  refreshing={columnStates.in_progress.refreshing}
                />
              </View>
              
              {/* Done Column */}
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
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Enhanced Floating Action Button for Task Creation */}
      <Pressable
        onPress={handleCreateTask}
        disabled={globalLoading.creating}
        className={`absolute ${
          SCREEN_WIDTH >= 768 ? 'bottom-8 right-8 w-16 h-16' : 'bottom-6 right-6 w-14 h-14'
        } rounded-full items-center justify-center bg-green-500 border-[0.3px] elevation-xl ${
          isDark ? 'border-white' : 'border-gray-300'
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


