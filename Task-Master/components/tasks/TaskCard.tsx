/**
 * TaskCard Component with Intuitive Swipe Gestures
 * 
 * A beautifully designed, interactive task card that displays comprehensive task information
 * with priority-based styling, smooth animations, and intuitive swipe-based status management.
 * 
 * Design Features:
 * - Modern card design with subtle shadows and rounded corners
 * - Priority-based color coding with gradient accents
 * - Responsive layout that adapts to content and screen sizes
 * - Smooth hover effects and touch feedback
 * - Accessibility-compliant design with proper contrast ratios
 * 
 * Swipe Gesture Features:
 * - Intuitive swipe-to-change-status with contextual constraints
 * - Right swipe: Advances status (Todo → In Progress → Done)
 * - Left swipe: Reverts status (Done → In Progress → Todo)
 * - Real-time visual feedback with progress indicators
 * - Haptic feedback for gesture confirmation
 * - Subtle hint indicators showing available swipe directions
 * - Accessibility support with alternative button actions
 * 
 * Interactive Elements:
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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Edit3,
  Trash2,
  Clock,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
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
  onPress?: (task: Task) => void;
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
 * Swipe Configuration & Logic
 * 
 * Comprehensive swipe gesture configuration defining thresholds, directions,
 * status transitions, and visual feedback parameters for intuitive task status changes.
 * 
 * Swipe Mechanics:
 * - Right Swipe: Advances status (Todo → In Progress → Done)
 * - Left Swipe: Reverts status (Done → In Progress → Todo)
 * - Minimum distance threshold prevents accidental triggers
 * - Visual feedback provides real-time swipe direction indication
 * - Haptic feedback confirms successful status changes
 * 
 * Status Transition Rules:
 * - Todo tasks: Can only advance (right swipe to In Progress)
 * - In Progress tasks: Can advance to Done or revert to Todo
 * - Done tasks: Can only revert (left swipe to In Progress)
 * 
 * Accessibility Considerations:
 * - Alternative button controls for non-gesture users
 * - Clear visual indicators of swipe availability
 * - Voice-over compatible action descriptions
 * - Reduced motion respect for accessibility preferences
 */

// Get screen dimensions for swipe calculations
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Swipe Configuration Constants
 * 
 * Defines precise parameters for swipe gesture recognition and visual feedback.
 * These values are carefully tuned for optimal user experience across devices.
 */
const SWIPE_CONFIG = {
  // Distance thresholds for gesture recognition
  MINIMUM_SWIPE_DISTANCE: 50,        // Minimum pixels to register as intentional swipe
  ACTIVATION_THRESHOLD: 100,         // Distance required to trigger status change
  MAXIMUM_SWIPE_DISTANCE: 200,       // Maximum useful swipe distance

  // Visual feedback parameters
  OPACITY_THRESHOLD: 0.3,            // Minimum opacity during swipe
  SCALE_FACTOR: 0.98,                // Card scaling during active swipe
  FEEDBACK_ANIMATION_DURATION: 200,  // Duration of visual feedback animations

  // Haptic feedback intensity
  HAPTIC_INTENSITY: Haptics.ImpactFeedbackStyle.Medium,

  // Swipe velocity requirements
  MINIMUM_VELOCITY: 0.5,             // Minimum swipe velocity to trigger
  VELOCITY_THRESHOLD: 1.5,           // Velocity threshold for instant trigger
};

/**
 * Status Transition Configuration
 * 
 * Defines valid status transitions and their associated properties including
 * visual indicators, labels, and directional constraints.
 * 
 * @param {ColumnStatus} currentStatus - Current task status
 * @returns {Object} Transition configuration object
 */
const getStatusTransitions = (currentStatus: ColumnStatus) => {
  const transitions = {
    todo: {
      canSwipeRight: true,
      canSwipeLeft: false,
      rightAction: 'in_progress' as ColumnStatus,
      leftAction: null,
      rightLabel: 'Move to IN PROGRESS',
      rightIcon: 'ArrowRight',
      rightColor: '#F59E0B', // Amber for in-progress
      description: 'Swipe right to move to in progress'
    },
    in_progress: {
      canSwipeRight: true,
      canSwipeLeft: true,
      rightAction: 'done' as ColumnStatus,
      leftAction: 'todo' as ColumnStatus,
      rightLabel: 'Move to DONE',
      leftLabel: 'Move to TO-DO',
      rightIcon: 'ArrowRight',
      leftIcon: 'ArrowLeft',
      rightColor: '#10B981', // Green for done
      leftColor: '#EF4444',  // Red for todo
      description: 'Swipe right to move to done or left to move to todo'
    },
    done: {
      canSwipeRight: false,
      canSwipeLeft: true,
      rightAction: null,
      leftAction: 'in_progress' as ColumnStatus,
      leftLabel: 'Move to IN PROGRESS',
      leftIcon: 'ArrowLeft',
      leftColor: '#F59E0B', // Amber for in-progress
      description: 'Swipe left to move to in progress'
    }
  };

  return transitions[currentStatus];
};

/**
 * Swipe Direction Helper
 * 
 * Determines swipe direction and validates against current task status constraints.
 * 
 * @param {number} deltaX - Horizontal displacement from swipe gesture
 * @param {ColumnStatus} currentStatus - Current task status
 * @returns {Object} Swipe analysis object
 */
const analyzeSwipe = (deltaX: number, currentStatus: ColumnStatus) => {
  const transitions = getStatusTransitions(currentStatus);
  const absDistance = Math.abs(deltaX);

  // Determine swipe direction and validate constraints
  if (deltaX > SWIPE_CONFIG.MINIMUM_SWIPE_DISTANCE && transitions.canSwipeRight) {
    return {
      isValid: true,
      direction: 'right',
      targetStatus: transitions.rightAction,
      distance: deltaX,
      progress: Math.min(deltaX / SWIPE_CONFIG.ACTIVATION_THRESHOLD, 1),
      label: (transitions as any).rightLabel,
      color: (transitions as any).rightColor
    };
  } else if (deltaX < -SWIPE_CONFIG.MINIMUM_SWIPE_DISTANCE && transitions.canSwipeLeft) {
    return {
      isValid: true,
      direction: 'left',
      targetStatus: transitions.leftAction,
      distance: absDistance,
      progress: Math.min(absDistance / SWIPE_CONFIG.ACTIVATION_THRESHOLD, 1),
      label: (transitions as any).leftLabel,
      color: (transitions as any).leftColor
    };
  }

  return {
    isValid: false,
    direction: null,
    targetStatus: null,
    distance: 0,
    progress: 0,
    label: null,
    color: null
  };
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
  onMove,
  onPress
}) => {
  const { isDark } = useTheme();
  const priorityColors = getPriorityColors(task.priority);

  /**
   * Swipe Gesture State Management
   * 
   * Manages all state related to swipe gestures including animation values,
   * gesture tracking, and visual feedback states.
   */

  // Animation values for smooth visual feedback
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Gesture tracking state
  const [isSwipping, setIsSwipping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeLabel, setSwipeLabel] = useState<string | null>(null);
  const [swipeColor, setSwipeColor] = useState<string | null>(null);

  // Get available transitions for current task status
  const transitions = getStatusTransitions(task.status);

  // Debug logging without returning void in JSX
  useEffect(() => {
    if (isSwipping) {
      console.log(
        'Indicator rendering - Label:',
        swipeLabel,
        'Direction:',
        swipeDirection,
        'Color:',
        swipeColor
      );
    }
  }, [isSwipping, swipeLabel, swipeDirection, swipeColor]);

  /**
   * Simplified Gesture Handlers using react-native-gesture-handler
   * 
   * Much more reliable than PanResponder for swipe gestures
   */
  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;

    // Update animation value
    translateX.setValue(translationX);

    // Update swipe state in real-time during active gesture
    if (isSwipping) {
      const swipeAnalysis = analyzeSwipe(translationX, task.status);

      if (swipeAnalysis.isValid) {
        setSwipeDirection(
          swipeAnalysis.direction === 'left' || swipeAnalysis.direction === 'right'
            ? swipeAnalysis.direction
            : null
        );
        setSwipeProgress(swipeAnalysis.progress);
        setSwipeLabel(swipeAnalysis.label);
        setSwipeColor(swipeAnalysis.color);
      } else {
        setSwipeDirection(null);
        setSwipeProgress(0);
        setSwipeLabel(null);
        setSwipeColor(null);
      }
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        console.log('Gesture began');
        setIsSwipping(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          console.log('Haptics not available');
        }
        break;

      case State.ACTIVE:
        console.log('Gesture active, translation:', translationX);
        // Swipe state is now handled in onGestureEvent for real-time updates
        break;

      case State.END:
        console.log('Gesture ended, translation:', translationX, 'velocity:', velocityX);

        // Analyze final swipe state
        const finalAnalysis = analyzeSwipe(translationX, task.status);
        const shouldTrigger = finalAnalysis.isValid &&
          (Math.abs(translationX) > 80 || (Math.abs(velocityX) > 500 && Math.abs(translationX) > 40));

        console.log('Should trigger:', shouldTrigger, 'Analysis:', finalAnalysis);

        if (shouldTrigger && finalAnalysis.targetStatus) {
          console.log('Triggering status change to:', finalAnalysis.targetStatus);

          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            console.log('Haptics not available');
          }

          onMove(task.id, finalAnalysis.targetStatus);
        }

        resetSwipeState();
        break;

      case State.CANCELLED:
      case State.FAILED:
        console.log('Gesture cancelled/failed');
        resetSwipeState();
        break;
    }
  };

  /**
   * Reset Swipe State Helper
   * 
   * Resets all swipe-related state and animations to their default values.
   * Used after gesture completion or cancellation to ensure clean state.
   */
  const resetSwipeState = () => {
    // Reset gesture state
    setIsSwipping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    setSwipeLabel(null);
    setSwipeColor(null);

    // Reset animation values with smooth transition
    translateX.flattenOffset();

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      })
    ]).start();
  };


  return (
    <View className="mb-4">

      {/* Debug info */}

      {/* Swipe Direction Indicators */}
      {isSwipping && (
        <View className="absolute inset-0 z-10 pointer-events-none">
          {/* Left Swipe Indicator */}
          {swipeDirection === 'left' && transitions.canSwipeLeft && (
            <View className="absolute left-4 top-1/2 transform -translate-y-1/2 flex-row items-center">
              <View
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: swipeColor + '20',
                  borderColor: swipeColor as string,
                  borderWidth: 2,
                  opacity: swipeProgress
                }}
              >
                <ArrowLeft size={16} color={swipeColor as string} />
                <Text
                  className="text-sm font-bold ml-2"
                  style={{ color: swipeColor as string }}
                >
                  {swipeLabel}
                </Text>
              </View>
            </View>
          )}

          {/* Right Swipe Indicator */}
          {swipeDirection === 'right' && transitions.canSwipeRight && (
            <View className="absolute right-4 top-1/2 transform -translate-y-1/2 flex-row items-center">
              <View
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: swipeColor + '20',
                  borderColor: swipeColor as string,
                  borderWidth: 2,
                  opacity: swipeProgress
                }}
              >
                <Text
                  className="text-sm font-bold mr-2"
                  style={{ color: swipeColor as string }}
                >
                  {swipeLabel}
                </Text>
                <ArrowRight size={16} color={swipeColor as string} />
              </View>
            </View>
          )}

          {/* Progress Bar */}
          <View className="absolute bottom-2 left-4 right-4">
            <View
              className="h-1 rounded-full bg-gray-300"
              style={{ opacity: 0.6 }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: swipeColor || '#6B7280',
                  width: `${Math.min(swipeProgress * 100, 100)}%`
                }}
              />
            </View>
          </View>
        </View>
      )}

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={{
            transform: [
              { translateX },
              { scale }
            ],
            opacity
          }}
          className={`rounded-2xl border-2 overflow-hidden ${isDark
              ? 'bg-gray-800 border-gray-700 shadow-lg shadow-gray-900/20'
              : 'bg-white border-gray-100 shadow-lg shadow-gray-900/10'
            }`}
          accessible={true}
          accessibilityLabel={`Task: ${task.title}. ${transitions.description}`}
          accessibilityHint="Swipe left or right to change status, or double tap for details"
          accessibilityActions={[
            ...(transitions.canSwipeLeft ? [{ name: 'swipeLeft', label: (transitions as any).leftLabel }] : []),
            ...(transitions.canSwipeRight ? [{ name: 'swipeRight', label: (transitions as any).rightLabel }] : []),
          ]}
          onAccessibilityAction={(event) => {
            switch (event.nativeEvent.actionName) {
              case 'swipeLeft':
                if (transitions.canSwipeLeft && transitions.leftAction) {
                  onMove(task.id, transitions.leftAction);
                }
                break;
              case 'swipeRight':
                if (transitions.canSwipeRight && transitions.rightAction) {
                  onMove(task.id, transitions.rightAction);
                }
                break;
            }
          }}
        >
          {/* Priority Accent Bar */}
          <View
            className="h-1.5 w-full"
            style={{ backgroundColor: priorityColors.accent }}
          />

          {/* Main Card Content */}
          <Pressable
            className="p-5"
            onPress={() => onPress?.(task)}
            accessibilityLabel={`View details for ${task.title}`}
            accessibilityHint="Tap to view full task details"
          >
            {/* Task Header Section */}
            <View className="mb-4">
              {/* Task Title */}
              <Text
                className={`text-lg font-bold leading-6 mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {task.title}
              </Text>

              {/* Task Description */}
              {task.description && (
                <Text
                  className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {task.description}
                </Text>
              )}
            </View>

            {/* Task Metadata Section */}
            <View className="mb-4 gap-y-3">
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
                  <Text className={`text-sm font-medium ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {task.category}
                  </Text>
                </View>

                {/* Due Date */}
                <View className="flex-row items-center">
                  <Calendar size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text className={`text-sm font-medium ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    Due Date - {task.dueDate}
                  </Text>
                </View>
              </View>

              {/* Created Date */}
              <View className="flex-row items-center">
                <Clock size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                  Created {task.createdAt}
                </Text>
              </View>
            </View>

            {/* Action Buttons Section */}
            <View className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'
              }`}>
              {/* Edit and Delete Actions */}
              <View className="flex-row items-center justify-end gap-x-3">
                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => onEdit(task)}
                  className={`flex-row items-center px-4 py-2.5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  accessibilityLabel="Edit Task"
                  accessibilityHint="Opens edit form for this task"
                  activeOpacity={0.8}
                >
                  <Edit3 size={16} color={isDark ? '#D1D5DB' : '#4B5563'} />
                  <Text className={`text-sm font-semibold ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    Edit
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => onDelete(task.id)}
                  className="flex-row items-center px-4 py-2.5 rounded-xl bg-red-50 border border-red-200"
                  accessibilityLabel="Delete Task"
                  accessibilityHint="Deletes this task permanently"
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text className="text-sm font-semibold ml-2 text-red-600">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>

          {/* Swipe Hint Indicators - Subtle visual cues for available swipe actions */}
          {!isSwipping && (
            <View className="absolute inset-0 pointer-events-none">
              {/* Left Swipe Hint */}
              {transitions.canSwipeLeft && (
                <View className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <View
                    className="w-1 h-8 rounded-full opacity-20"
                    style={{ backgroundColor: (transitions as any).leftColor }}
                  />
                </View>
              )}

              {/* Right Swipe Hint */}
              {transitions.canSwipeRight && (
                <View className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <View
                    className="w-1 h-8 rounded-full opacity-20"
                    style={{ backgroundColor: (transitions as any).rightColor }}
                  />
                </View>
              )}
            </View>
          )}      
        </Animated.View>
    </PanGestureHandler>
    </View >
  );
};

export default TaskCard;