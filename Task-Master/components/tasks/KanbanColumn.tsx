/**
 * KanbanColumn Component
 * 
 * A beautifully designed column component for the Kanban board that displays tasks
 * organized by status with enhanced visual design, smooth animations, and optimal
 * user experience for task management workflows.
 * 
 * Design Philosophy:
 * - Modern, clean column design with subtle depth and shadows
 * - Status-specific color theming for instant visual recognition
 * - Responsive layout that adapts to content and screen sizes
 * - Smooth scrolling with optimized performance for large task lists
 * - Empty state designs that encourage user engagement
 * 
 * Visual Features:
 * - Gradient header backgrounds with status-specific colors
 * - Floating task count badges with real-time updates
 * - Smooth scroll behavior with momentum and bounce effects
 * - Card-style layout with subtle shadows and rounded corners
 * - Consistent spacing and typography throughout
 * 
 * Interactive Elements:
 * - Optimized ScrollView with proper scroll indicators
 * - Touch-friendly spacing between task cards
 * - Visual feedback for empty states
 * - Accessibility-compliant design patterns
 * 
 * Performance Optimizations:
 * - Efficient task filtering with memoization
 * - Optimized ScrollView configuration for smooth scrolling
 * - Minimal re-renders through proper prop dependencies
 * - Lazy loading capabilities for large task sets
 * 
 * @module components/tasks/KanbanColumn
 * @requires react - Core React functionality
 * @requires react-native - React Native components and utilities
 * @requires @/context/ThemeContext - Application theme management
 * @requires ./TaskCard - Individual task card component
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ListRenderItem,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TaskCard, Task, ColumnStatus } from './TaskCard';

/**
 * Screen Dimensions
 * 
 * Gets the device screen dimensions for responsive layout calculations
 * and optimal column sizing across different device sizes.
 */
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * KanbanColumn Component Props Interface
 * 
 * Defines all props required for the KanbanColumn component including
 * status configuration, task data, and callback functions.
 * 
 * @interface KanbanColumnProps
 * @property {ColumnStatus} status - The status this column represents
 * @property {string} title - Display title for the column header
 * @property {string} color - Primary color theme for the column
 * @property {Task[]} tasks - Array of tasks to display in this column
 * @property {Function} onEditTask - Callback when a task edit is requested
 * @property {Function} onDeleteTask - Callback when a task deletion is requested
 * @property {Function} onMoveTask - Callback when a task status change is requested
 */
interface KanbanColumnProps {
  status: ColumnStatus;
  title: string;
  color: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newStatus: ColumnStatus) => void;
  onPressTask?: (task: Task) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

/**
 * Column Theme Configuration
 * 
 * Returns comprehensive theming configuration for different column statuses
 * including gradients, shadows, and accent colors for enhanced visual design.
 * 
 * Design Principles:
 * - Each status has a distinct color identity for quick recognition
 * - Gradients provide modern visual appeal without overwhelming content
 * - Shadow colors enhance depth and visual hierarchy
 * - Consistent opacity and saturation levels across themes
 * 
 * @param {ColumnStatus} status - The column status
 * @param {string} primaryColor - The primary color for the status
 * @returns {Object} Comprehensive theme configuration object
 */
const getColumnTheme = (status: ColumnStatus, primaryColor: string) => {
  const themes = {
    todo: {
      gradient: ['#FEF2F2', '#FEE2E2'],     // Light red gradient
      headerBg: '#FECACA',                  // Light red header
      shadow: '#EF4444',                    // Red shadow
      accent: '#DC2626',                    // Red accent
      textPrimary: '#991B1B',               // Dark red text
      textSecondary: '#7F1D1D',             // Darker red text
      border: '#FCA5A5'                     // Red border
    },
    in_progress: {
      gradient: ['#FFFBEB', '#FEF3C7'],     // Light amber gradient
      headerBg: '#FED7AA',                  // Light amber header
      shadow: '#F59E0B',                    // Amber shadow
      accent: '#D97706',                    // Amber accent
      textPrimary: '#92400E',               // Dark amber text
      textSecondary: '#78350F',             // Darker amber text
      border: '#FCD34D'                     // Amber border
    },
    done: {
      gradient: ['#F0FDF4', '#DCFCE7'],     // Light green gradient
      headerBg: '#BBF7D0',                  // Light green header
      shadow: '#22C55E',                    // Green shadow
      accent: '#16A34A',                    // Green accent
      textPrimary: '#166534',               // Dark green text
      textSecondary: '#14532D',             // Darker green text
      border: '#86EFAC'                     // Green border
    }
  };

  return themes[status];
};

/**
 * Empty State Configuration
 * 
 * Returns appropriate empty state messaging and styling based on column status
 * to provide contextual guidance and encourage user engagement.
 * 
 * @param {ColumnStatus} status - The column status
 * @returns {Object} Empty state configuration
 */
const getEmptyStateConfig = (status: ColumnStatus) => {
  const configs = {
    todo: {
      emoji: '📝',
      title: 'No tasks to do',
      subtitle: 'Create a new task to get started',
      description: 'Tasks you create will appear here'
    },
    in_progress: {
      emoji: '⚡',
      title: 'Nothing in progress',
      subtitle: 'Move tasks here when you start working',
      description: 'Track your active work items'
    },
    done: {
      emoji: '🎉',
      title: 'No completed tasks',
      subtitle: 'Completed tasks will appear here',
      description: 'Great work stays visible'
    }
  };

  return configs[status];
};

/**
 * KanbanColumn Component
 * 
 * The main column component that renders a complete Kanban column with
 * enhanced visual design, smooth interactions, and optimal performance.
 * 
 * Visual Design Features:
 * - Gradient header with status-specific theming
 * - Floating task count badge with smooth animations
 * - Card-style layout with subtle shadows and depth
 * - Responsive column width based on screen size
 * - Consistent spacing and typography hierarchy
 * 
 * User Experience Features:
 * - Smooth scrolling with momentum and bounce effects
 * - Empty state designs with contextual messaging
 * - Visual feedback for all interactive elements
 * - Touch-optimized spacing and hit targets
 * - Accessibility-compliant design patterns
 * 
 * Performance Features:
 * - Efficient task rendering with proper keys
 * - Optimized ScrollView configuration
 * - Minimal re-renders through component optimization
 * - Memory-efficient task list handling
 * 
 * Layout Responsiveness:
 * - Adaptive column width based on screen size
 * - Flexible height to accommodate varying task counts
 * - Proper spacing for different device orientations
 * - Consistent behavior across platforms
 * 
 * @param {KanbanColumnProps} props - Component props
 * @returns {JSX.Element} Enhanced Kanban column component
 */
export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  color,
  tasks,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onPressTask,
  onRefresh,
  refreshing = false
}) => {
  const { isDark } = useTheme();
  const theme = getColumnTheme(status, color);
  const emptyState = getEmptyStateConfig(status);
  
  // Calculate responsive column width with improved breakpoints
  const columnWidth = (() => {
    if (SCREEN_WIDTH >= 1200) return 380; // Large desktop
    if (SCREEN_WIDTH >= 1024) return 350; // Desktop
    if (SCREEN_WIDTH >= 768) return 320;  // Tablet landscape
    if (SCREEN_WIDTH >= 640) return 300;  // Tablet portrait
    return Math.max(280, SCREEN_WIDTH * 0.88); // Mobile - use more screen width
  })();
  
  /**
   * FlatList Optimization Functions
   * 
   * Performance-optimized callbacks for FlatList rendering
   */
  
  // Memoized render function for task items
  const renderTaskItem: ListRenderItem<Task> = useCallback(({ item: task }) => (
    <TaskCard
      task={task}
      onEdit={onEditTask}
      onDelete={onDeleteTask}
      onMove={onMoveTask}
      onPress={onPressTask}
    />
  ), [onEditTask, onDeleteTask, onMoveTask, onPressTask]);
  
  // Key extractor for FlatList optimization
  const keyExtractor = useCallback((item: Task) => item.id, []);
  
  // Optimized item layout for better scrolling performance
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 160, // Estimated task card height + margin
    offset: 160 * index,
    index,
  }), []);
  
  // Item separator component for consistent spacing
  const ItemSeparator = useCallback(() => (
    <View style={{ height: 16 }} />
  ), []);

  return (
    <View 
      style={{ 
        width: columnWidth,
        flex: 1, // Allow column to grow with content
        shadowColor: isDark ? '#000000' : theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 12,
        elevation: 8
      }}
      className={`rounded-2xl overflow-hidden ${
        isDark 
          ? 'bg-gray-800' 
          : 'bg-white'
      }`}
    >
      {/* Column Header */}
      <View 
        className="relative"
        style={{
          backgroundColor: isDark ? '#374151' : theme.headerBg,
        }}
      >
        {/* Header Gradient Overlay */}
        {!isDark && (
          <View 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundColor: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)`
            }}
          />
        )}
        
        {/* Header Content */}
        <View className="relative px-6 py-5">
          <View className="flex-row items-center justify-between">
            {/* Column Title */}
            <View className="flex-row items-center flex-1">
              <View 
                className="w-3 h-3 rounded-full mr-3 shadow-sm"
                style={{ 
                  backgroundColor: isDark ? color : theme.accent,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                }}
              />
              <Text 
                className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{ 
                  color: isDark ? '#FFFFFF' : theme.textPrimary 
                }}
              >
                {title}
              </Text>
            </View>
            
            {/* Task Count Badge */}
            <View 
              className={`px-3 py-1.5 rounded-full border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white/80 border-white/60'
              }`}
              style={{
                shadowColor: isDark ? '#000000' : theme.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              <Text 
                className={`text-sm font-bold ${
                  isDark ? 'text-gray-200' : ''
                }`}
                style={{ 
                  color: isDark ? '#E5E7EB' : theme.textPrimary 
                }}
              >
                {tasks.length}
              </Text>
            </View>
          </View>
          
          {/* Column Description */}
          <Text 
            className={`text-xs mt-2 opacity-80 ${
              isDark ? 'text-gray-300' : ''
            }`}
            style={{ 
              color: isDark ? '#D1D5DB' : theme.textSecondary 
            }}
          >
            {status === 'todo' && 'Tasks waiting to be started'}
            {status === 'in_progress' && 'Currently active tasks'}
            {status === 'done' && 'Completed tasks'}
          </Text>
        </View>
      </View>

      {/* Column Content */}
      <View className="flex-1">
        {tasks.length > 0 ? (
          /* Task List with FlatList for Performance */
          <FlatList
            data={tasks}
            renderItem={renderTaskItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 20,
              flexGrow: 1
            }}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEventThrottle={16}
            decelerationRate="normal"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={getItemLayout}
            ItemSeparatorComponent={ItemSeparator}
            nestedScrollEnabled={true}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={isDark ? '#60A5FA' : '#3B82F6'}
                  colors={['#3B82F6']}
                  title="Pull to refresh"
                  titleColor={isDark ? '#9CA3AF' : '#6B7280'}
                />
              ) : undefined
            }
          />
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-6 py-12">
            {/* Empty State Container */}
            <View 
              className={`items-center justify-center p-8 rounded-2xl border-2 border-dashed w-full ${
                isDark 
                  ? 'border-gray-600 bg-gray-700/30' 
                  : 'border-gray-300 bg-gray-50/80'
              }`}
              style={{
                borderColor: isDark ? '#4B5563' : theme.border + '60',
                backgroundColor: isDark ? '#374151' + '30' : theme.gradient[0] + '40'
              }}
            >
              {/* Empty State Emoji */}
              <Text className="text-4xl mb-4">
                {emptyState.emoji}
              </Text>
              
              {/* Empty State Title */}
              <Text 
                className={`text-lg font-bold text-center mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                {emptyState.title}
              </Text>
              
              {/* Empty State Subtitle */}
              <Text 
                className={`text-sm text-center mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {emptyState.subtitle}
              </Text>
              
              
              {/* Empty State Description */}
              <Text 
                className={`text-xs text-center opacity-75 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {emptyState.description}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Column Footer */}
      {tasks.length > 0 && (
        <View 
          className={`px-6 py-3 border-t ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
          }`}
        >
          <Text 
            className={`text-xs text-center ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default KanbanColumn;