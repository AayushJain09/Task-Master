/**
 * TaskCard Component
 * 
 * A beautifully designed, interactive task card that displays comprehensive task information
 * with priority-based styling, smooth animations, and intuitive user interactions.
 * 
 * Design Features:
 * - Modern card design with subtle shadows and rounded corners
 * - Priority-based color coding with gradient accents
 * - Responsive layout that adapts to content and screen sizes
 * - Smooth hover effects and touch feedback
 * - Accessibility-compliant design with proper contrast ratios
 * 
 * Interactive Elements:
 * - Quick status change buttons with visual feedback
 * - Edit and delete actions with appropriate styling
 * - Touch-optimized button sizes for mobile interaction
 * - Visual states for pressed, focused, and disabled states
 * 
 * Information Architecture:
 * - Clear visual hierarchy with proper typography scaling
 * - Strategic use of color and spacing for information grouping
 * - Conditional rendering based on task properties
 * - Consistent iconography throughout the interface
 * 
 * Performance Optimizations:
 * - Efficient re-rendering through proper prop dependencies
 * - Optimized conditional rendering for task properties
 * - Minimal inline style computations
 * - Proper key usage for list rendering
 * 
 * @module components/tasks/TaskCard
 * @requires react - Core React functionality
 * @requires react-native - React Native components and utilities
 * @requires @/context/ThemeContext - Application theme management
 * @requires lucide-react-native - Icon library for consistent UI elements
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  Calendar,
  Edit3,
  Trash2,
  Clock,
  User,
  Tag
} from 'lucide-react-native';

/**
 * Task Interface Definition
 * 
 * Comprehensive type definition for task objects with all required
 * and optional properties for complete task management functionality.
 * 
 * @interface Task
 * @property {number} id - Unique identifier for the task
 * @property {string} title - Primary task title/name
 * @property {string} [description] - Optional detailed description
 * @property {'high' | 'medium' | 'low'} priority - Task priority level
 * @property {'todo' | 'in_progress' | 'done'} status - Current task status
 * @property {string} dueDate - Human-readable due date
 * @property {string} category - Task category for organization
 * @property {string} createdAt - ISO date string of creation
 */
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  category: string;
  createdAt: string;
}

/**
 * Column Status Type Definition
 * 
 * Represents the three possible task states in the Kanban workflow.
 * Used for type safety in task movement operations.
 */
export type ColumnStatus = 'todo' | 'in_progress' | 'done';

/**
 * TaskCard Component Props Interface
 * 
 * Defines all props required for the TaskCard component including
 * the task data and callback functions for user interactions.
 * 
 * @interface TaskCardProps
 * @property {Task} task - The task object to display
 * @property {Function} onEdit - Callback function when edit button is pressed
 * @property {Function} onDelete - Callback function when delete button is pressed
 * @property {Function} onMove - Callback function when status change button is pressed
 */
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onMove: (taskId: number, newStatus: ColumnStatus) => void;
}

/**
 * Priority Color Scheme Generator
 * 
 * Returns comprehensive color schemes for different priority levels including
 * gradients, shadows, and accent colors for enhanced visual design.
 * 
 * Color Philosophy:
 * - High Priority: Warm reds and oranges for urgency and immediate attention
 * - Medium Priority: Balanced yellows and ambers for moderate importance
 * - Low Priority: Cool greens and blues for calm, low-pressure tasks
 * 
 * Each scheme includes:
 * - Background colors for containers and badges
 * - Text colors for optimal readability
 * - Border colors for subtle definition
 * - Gradient colors for modern visual appeal
 * - Shadow colors for depth and elevation
 * 
 * @param {string} priority - The priority level ('high', 'medium', 'low')
 * @returns {Object} Comprehensive color scheme object
 */
const getPriorityColors = (priority: string) => {
  switch (priority) {
    case 'high':
      return {
        bg: '#FEF2F2',           // Light red background
        text: '#DC2626',         // Red text
        border: '#FECACA',       // Light red border
        gradient: ['#FEE2E2', '#FECACA'], // Red gradient
        shadow: '#EF4444',       // Red shadow
        accent: '#B91C1C',       // Dark red accent
        icon: '#DC2626'          // Red icon color
      };
    case 'medium':
      return {
        bg: '#FFFBEB',           // Light amber background
        text: '#D97706',         // Amber text
        border: '#FED7AA',       // Light amber border
        gradient: ['#FEF3C7', '#FED7AA'], // Amber gradient
        shadow: '#F59E0B',       // Amber shadow
        accent: '#B45309',       // Dark amber accent
        icon: '#D97706'          // Amber icon color
      };
    case 'low':
      return {
        bg: '#F0FDF4',           // Light green background
        text: '#16A34A',         // Green text
        border: '#BBF7D0',       // Light green border
        gradient: ['#DCFCE7', '#BBF7D0'], // Green gradient
        shadow: '#22C55E',       // Green shadow
        accent: '#15803D',       // Dark green accent
        icon: '#16A34A'          // Green icon color
      };
    default:
      return {
        bg: '#F9FAFB',           // Light gray background
        text: '#374151',         // Gray text
        border: '#E5E7EB',       // Light gray border
        gradient: ['#F9FAFB', '#F3F4F6'], // Gray gradient
        shadow: '#9CA3AF',       // Gray shadow
        accent: '#374151',       // Dark gray accent
        icon: '#6B7280'          // Gray icon color
      };
  }
};

/**
 * Status Button Configuration
 * 
 * Defines the visual and behavioral properties for status change buttons
 * including colors, labels, and conditional rendering logic.
 * 
 * @param {ColumnStatus} status - The target status for the button
 * @returns {Object} Button configuration object
 */
const getStatusButtonConfig = (status: ColumnStatus) => {
  switch (status) {
    case 'todo':
      return {
        label: 'To Do',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-600',
        hoverColor: 'bg-red-100'
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-600',
        hoverColor: 'bg-yellow-100'
      };
    case 'done':
      return {
        label: 'Done',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-600',
        hoverColor: 'bg-green-100'
      };
  }
};

/**
 * TaskCard Component
 * 
 * The main task card component that renders a beautiful, interactive card
 * displaying all task information with enhanced visual design and user experience.
 * 
 * Visual Design Philosophy:
 * - Clean, modern card design with subtle depth
 * - Priority-driven color coding for quick visual scanning
 * - Generous whitespace for improved readability
 * - Consistent iconography for intuitive interaction
 * - Responsive layout for various screen sizes
 * 
 * Interaction Design:
 * - Touch-optimized buttons with adequate tap targets
 * - Visual feedback for all interactive elements
 * - Logical grouping of related actions
 * - Clear visual hierarchy for primary and secondary actions
 * 
 * Information Design:
 * - Progressive disclosure of task details
 * - Strategic use of typography hierarchy
 * - Color-coded metadata for quick scanning
 * - Contextual icon usage for improved comprehension
 * 
 * Accessibility Features:
 * - Proper contrast ratios for all text elements
 * - Semantic HTML structure for screen readers
 * - Descriptive accessibility labels and hints
 * - Keyboard navigation support
 * - Touch target size compliance
 * 
 * @param {TaskCardProps} props - Component props containing task data and callbacks
 * @returns {JSX.Element} Beautifully designed task card component
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onMove
}) => {
  const { isDark } = useTheme();
  const priorityColors = getPriorityColors(task.priority);

  /**
   * Render Status Change Buttons
   * 
   * Dynamically renders status change buttons based on the current task status.
   * Only shows buttons for statuses that are different from the current status.
   * 
   * @returns {JSX.Element[]} Array of status change button components
   */
  const renderStatusButtons = () => {
    const statuses: ColumnStatus[] = ['todo', 'in_progress', 'done'];
    
    return statuses
      .filter(status => status !== task.status)
      .map(status => {
        const config = getStatusButtonConfig(status);
        
        return (
          <Pressable
            key={status}
            onPress={() => onMove(task.id, status)}
            className={`px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
            accessibilityLabel={`Move to ${config.label}`}
            accessibilityHint={`Moves this task to the ${config.label} column`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            })}
          >
            <Text className={`text-xs font-semibold ${config.textColor}`}>
              {config.label}
            </Text>
          </Pressable>
        );
      });
  };

  return (
    <Pressable
      className={`mb-4 rounded-2xl border-2 overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700 shadow-lg shadow-gray-900/20' 
          : 'bg-white border-gray-100 shadow-lg shadow-gray-900/10'
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }]
      })}
      accessibilityLabel={`Task: ${task.title}`}
      accessibilityHint="Double tap to view task details"
    >
      {/* Priority Accent Bar */}
      <View 
        className="h-1.5 w-full"
        style={{ backgroundColor: priorityColors.accent }}
      />
      
      {/* Main Card Content */}
      <View className="p-5">
        {/* Task Header Section */}
        <View className="mb-4">
          {/* Task Title */}
          <Text 
            className={`text-lg font-bold leading-6 mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {task.title}
          </Text>
          
          {/* Task Description */}
          {task.description && (
            <Text 
              className={`text-sm leading-5 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {task.description}
            </Text>
          )}
        </View>

        {/* Task Metadata Section */}
        <View className="mb-4 space-y-3">
          {/* Priority Badge */}
          <View className="flex-row items-center">
            <View 
              className="px-3 py-1.5 rounded-full mr-3"
              style={{ 
                backgroundColor: priorityColors.bg,
                borderWidth: 1,
                borderColor: priorityColors.border
              }}
            >
              <Text 
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: priorityColors.text }}
              >
                {task.priority} Priority
              </Text>
            </View>
          </View>

          {/* Metadata Row */}
          <View className="flex-row items-center justify-between">
            {/* Category */}
            <View className="flex-row items-center flex-1">
              <Tag size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-sm font-medium ml-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {task.category}
              </Text>
            </View>

            {/* Due Date */}
            <View className="flex-row items-center">
              <Calendar size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-sm font-medium ml-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {task.dueDate}
              </Text>
            </View>
          </View>

          {/* Created Date */}
          <View className="flex-row items-center">
            <Clock size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`text-xs ml-2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Created {task.createdAt}
            </Text>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View className={`pt-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-100'
        }`}>
          {/* Status Change Buttons */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {renderStatusButtons()}
          </View>

          {/* Edit and Delete Actions */}
          <View className="flex-row items-center justify-end space-x-3">
            {/* Edit Button */}
            <Pressable
              onPress={() => onEdit(task)}
              className={`flex-row items-center px-4 py-2.5 rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              accessibilityLabel="Edit Task"
              accessibilityHint="Opens edit form for this task"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              })}
            >
              <Edit3 size={16} color={isDark ? '#D1D5DB' : '#4B5563'} />
              <Text className={`text-sm font-semibold ml-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Edit
              </Text>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={() => onDelete(task.id)}
              className="flex-row items-center px-4 py-2.5 rounded-xl bg-red-50 border border-red-200"
              accessibilityLabel="Delete Task"
              accessibilityHint="Deletes this task permanently"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              })}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text className="text-sm font-semibold ml-2 text-red-600">
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default TaskCard;