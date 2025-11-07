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
 * Loading State Interface
 * 
 * Tracks different loading states for various operations
 */
interface LoadingState {
  fetching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  refreshing: boolean;
}

/**
 * Error State Interface
 * 
 * Manages error states and messages for user feedback
 */
interface ErrorState {
  fetch: string | null;
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
   * API-Integrated Task Data State
   * 
   * Task data fetched from backend API with proper TypeScript support
   * and comprehensive state management for loading, error handling.
   */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  /**
   * Loading State Management
   * 
   * Tracks different loading states for comprehensive user feedback
   */
  const [loading, setLoading] = useState<LoadingState>({
    fetching: true,
    creating: false,
    updating: false,
    deleting: false,
    refreshing: false
  });
  
  /**
   * Error State Management
   * 
   * Manages error states with user-friendly messages
   */
  const [errors, setErrors] = useState<ErrorState>({
    fetch: null,
    create: null,
    update: null,
    delete: null
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
   * API Integration Functions
   * 
   * Functions for fetching and managing tasks from the backend API
   * with proper error handling and loading states.
   */
  
  /**
   * Fetch Tasks from API
   * 
   * Retrieves tasks from backend with optional filtering and pagination
   */
  const fetchTasks = useCallback(async (params: TaskQueryParams = {}, isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(prev => ({ ...prev, refreshing: true }));
      } else {
        setLoading(prev => ({ ...prev, fetching: true }));
      }
      
      setErrors(prev => ({ ...prev, fetch: null }));
      
      const response: TasksListResponse = await tasksService.getAllTasks({
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        ...params
      });
      
      if (isRefresh || params.page === 1) {
        // Replace tasks for refresh or first page
        setTasks(response.tasks);
      } else {
        // Append tasks for pagination
        setTasks(prev => [...prev, ...response.tasks]);
      }
      
      setPagination(response.pagination);
      
    } catch (error) {
      const taskError = error as TaskError;
      setErrors(prev => ({ 
        ...prev, 
        fetch: taskError.message || 'Failed to load tasks. Please try again.' 
      }));
      console.error('Error fetching tasks:', taskError);
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        fetching: false, 
        refreshing: false 
      }));
    }
  }, []);
  
  /**
   * Initial Data Load
   * 
   * Load tasks when component mounts with pagination
   */
  useEffect(() => {
    fetchTasks({ page: 1, limit: 20 });
  }, [fetchTasks]);
  
  /**
   * Auto-refresh tasks periodically
   * 
   * Refresh tasks every 5 minutes to keep data current
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading.fetching && !loading.refreshing) {
        fetchTasks({ page: 1, limit: tasks.length || 20 }, true);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [fetchTasks, loading.fetching, loading.refreshing, tasks.length]);
  
  /**
   * Utility Functions for Task Management
   * 
   * Efficient helper functions for task filtering and data processing
   * used by modular components throughout the interface.
   */
  const getTasksByStatus = useCallback((status: ColumnStatus) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);
  
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
   * Get transformed tasks by status for TaskCard components
   */
  const getTransformedTasksByStatus = useCallback((status: ColumnStatus) => {
    return getTasksByStatus(status).map(transformTaskForCard);
  }, [getTasksByStatus, transformTaskForCard]);

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
    // Find the original Task from API data - now task.id is the ObjectId string
    const originalTask = tasks.find(t => t._id === task.id);
    
    if (originalTask) {
      // console.log('Found original task for editing:', originalTask);
      
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
      
      // console.log('Setting editing task data:', editingTaskData);
      setEditingTask(editingTaskData);
      setModalTitle('Edit Task');
      setShowTaskModal(true);
    } else {
      console.error('Could not find original task for editing. Task ID:', task.id, 'Available tasks:', tasks.map(t => ({ id: t._id, title: t.title })));
      Alert.alert('Error', 'Could not find the task to edit. Please try refreshing the page.');
    }
  }, [tasks]);

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
              setLoading(prev => ({ ...prev, deleting: true }));
              setErrors(prev => ({ ...prev, delete: null }));
              
              // Now taskId is the actual ObjectId string
              await tasksService.deleteTask(taskId);
              
              // Remove from local state
              setTasks(prev => prev.filter(task => task._id !== taskId));
            } catch (error) {
              const taskError = error as TaskError;
              setErrors(prev => ({ 
                ...prev, 
                delete: taskError.message || 'Failed to delete task. Please try again.' 
              }));
              console.error('Error deleting task:', taskError);
            } finally {
              setLoading(prev => ({ ...prev, deleting: false }));
            }
          }
        }
      ]
    );
  }, []);

  const handleMoveTask = useCallback(async (taskId: string, newStatus: ColumnStatus) => {
    try {
      setLoading(prev => ({ ...prev, updating: true }));
      setErrors(prev => ({ ...prev, update: null }));
      
      // Now taskId is the actual ObjectId string
      await tasksService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task._id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
    } catch (error) {
      const taskError = error as TaskError;
      setErrors(prev => ({ 
        ...prev, 
        update: taskError.message || 'Failed to update task status. Please try again.' 
      }));
      console.error('Error updating task:', taskError);
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  }, []);

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
        setLoading(prev => ({ ...prev, updating: true }));
        setErrors(prev => ({ ...prev, update: null }));
        
        // Find the original task using the editing task's ID (now already a string)
        const originalTask = tasks.find(t => t._id === editingTask.id);
        if (originalTask) {
          console.log('Updating task:', originalTask._id, 'with data:', formData);
          
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
          
          const response = await tasksService.updateTask(originalTask._id, updateData);
          console.log('Update response:', response);
          
          // Update local state
          setTasks(prev => prev.map(task => 
            task._id === originalTask._id ? response.task : task
          ));
          
          Alert.alert('Success', 'Task updated successfully!');
        } else {
          console.error('Original task not found for update. Editing task ID:', editingTask.id);
          throw new Error('Could not find the task to update');
        }
      } else {
        setLoading(prev => ({ ...prev, creating: true }));
        setErrors(prev => ({ ...prev, create: null }));
        
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
        
        // Add to local state
        setTasks(prev => [...prev, response.task]);
        
        Alert.alert('Success', 'Task created successfully!');
      }
      
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      const taskError = error as TaskError;
      const errorKey = editingTask ? 'update' : 'create';
      setErrors(prev => ({ 
        ...prev, 
        [errorKey]: taskError.message || `Failed to ${editingTask ? 'update' : 'create'} task. Please try again.` 
      }));
      console.error(`Error ${editingTask ? 'updating' : 'creating'} task:`, taskError);
    } finally {
      const loadingKey = editingTask ? 'updating' : 'creating';
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [editingTask, tasks]);

  const handleCloseModal = useCallback(() => {
    setShowTaskModal(false);
    setEditingTask(null);
    // Clear any create/update errors when closing modal
    setErrors(prev => ({ ...prev, create: null, update: null }));
  }, []);
  
  /**
   * Pull to Refresh Handler
   * 
   * Refreshes task data when user pulls down
   */
  const handleRefresh = useCallback(() => {
    fetchTasks({ page: 1, limit: 50 }, true);
  }, [fetchTasks]);
  
  /**
   * Load More Tasks (Pagination)
   * 
   * Loads additional tasks when user scrolls to bottom
   */
  const loadMoreTasks = useCallback(async () => {
    if (loading.fetching || loading.refreshing || !pagination.hasNextPage) {
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, fetching: true }));
      
      const nextPage = pagination.currentPage + 1;
      const response: TasksListResponse = await tasksService.getAllTasks({
        page: nextPage,
        limit: 20
      });
      
      // Append new tasks to existing ones
      setTasks(prev => [...prev, ...response.tasks]);
      setPagination(response.pagination);
      
    } catch (error) {
      const taskError = error as TaskError;
      setErrors(prev => ({ 
        ...prev, 
        fetch: taskError.message || 'Failed to load more tasks.' 
      }));
      console.error('Error loading more tasks:', taskError);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  }, [loading.fetching, loading.refreshing, pagination.hasNextPage, pagination.currentPage]);
  
  /**
   * Error Dismissal Handler
   * 
   * Allows users to dismiss error messages
   */
  const dismissError = useCallback((errorType: keyof ErrorState) => {
    setErrors(prev => ({ ...prev, [errorType]: null }));
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
            {loading.fetching && tasks.length > 0 && (
              <ActivityIndicator 
                size="small" 
                color={isDark ? '#60A5FA' : '#3B82F6'} 
              />
            )}
            <Text className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {pagination.totalTasks > 0 ? (
                `${tasks.length} of ${pagination.totalTasks}`
              ) : (
                `${tasks.length} total`
              )}
            </Text>
            {pagination.hasNextPage && (
              <Text className={`text-xs ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Scroll for more
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Error Display */}
      {(errors.fetch || errors.create || errors.update || errors.delete) && (
        <View className={`mx-4 mb-4 gap-y-2`}>
          {/* Fetch Error */}
          {errors.fetch && (
            <View className={`p-4 rounded-lg border ${
              isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
            }`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <AlertCircle size={20} color={isDark ? '#F87171' : '#EF4444'} />
                  <Text className={`ml-2 flex-1 ${
                    isDark ? 'text-red-300' : 'text-red-700'
                  }`}>
                    {errors.fetch}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => dismissError('fetch')}
                  className="ml-2 p-1"
                >
                  <Text className={isDark ? 'text-red-400' : 'text-red-600'}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Create/Update/Delete Errors */}
          {(errors.create || errors.update || errors.delete) && (
            <View className={`p-3 rounded-lg border ${
              isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
            }`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <AlertCircle size={18} color={isDark ? '#FB923C' : '#EA580C'} />
                  <Text className={`ml-2 flex-1 text-sm ${
                    isDark ? 'text-orange-300' : 'text-orange-700'
                  }`}>
                    {errors.create || errors.update || errors.delete}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    if (errors.create) dismissError('create');
                    if (errors.update) dismissError('update');
                    if (errors.delete) dismissError('delete');
                  }}
                  className="ml-2 p-1"
                >
                  <Text className={isDark ? 'text-orange-400' : 'text-orange-600'}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Full-Screen Kanban Board */}
      <View className="flex-1">
        {loading.fetching ? (
          // Loading State
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
                  tasks={getTransformedTasksByStatus('todo')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleRefresh}
                  refreshing={loading.refreshing}
                />
              </View>
              
              {/* In Progress Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn 
                  status="in_progress" 
                  title="In Progress" 
                  color="#F59E0B"
                  tasks={getTransformedTasksByStatus('in_progress')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleRefresh}
                  refreshing={loading.refreshing}
                />
              </View>
              
              {/* Done Column */}
              <View style={{ width: getColumnWidth() }}>
                <KanbanColumn 
                  status="done" 
                  title="Done" 
                  color="#10B981"
                  tasks={getTransformedTasksByStatus('done')}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onMoveTask={handleMoveTask}
                  onPressTask={handleTaskPress}
                  onRefresh={handleRefresh}
                  refreshing={loading.refreshing}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Enhanced Floating Action Button for Task Creation */}
      <Pressable
        onPress={handleCreateTask}
        disabled={loading.creating}
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
        {loading.creating ? (
          <ActivityIndicator size={SCREEN_WIDTH >= 768 ? 28 : 24} color="#FFFFFF" />
        ) : (
          <Plus size={SCREEN_WIDTH >= 768 ? 32 : 28} color="#FFFFFF" strokeWidth={3} />
        )}
      </Pressable>

      {/* Task Form Modal with Loading State */}
      <TaskFormModal
        visible={showTaskModal}
        title={modalTitle}
        editingTask={editingTask}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={loading.creating || loading.updating}
        error={errors.create || errors.update}
      />

      <TaskDetailsModal
        visible={showDetailsModal}
        task={selectedTask}
        onClose={handleCloseDetailsModal}
      />
    </View>
  );
}


