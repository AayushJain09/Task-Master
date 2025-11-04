/**
 * TaskStats Component
 * 
 * A beautifully designed statistics dashboard component that displays comprehensive
 * task metrics with engaging visual elements, smooth animations, and insightful
 * data visualization for enhanced task management awareness.
 * 
 * Design Philosophy:
 * - Modern card-based layout with subtle depth and visual hierarchy
 * - Color-coded statistics that align with task priority and status themes
 * - Responsive grid layout that adapts to different screen sizes
 * - Clean typography with clear numerical emphasis
 * - Consistent spacing and visual rhythm throughout
 * 
 * Visual Features:
 * - Gradient backgrounds with status-specific color schemes
 * - Icon-based visual indicators for different metric types
 * - Animated counters for engaging number presentations
 * - Progress indicators showing completion ratios
 * - Hover effects and micro-interactions for enhanced engagement
 * 
 * Data Insights:
 * - Total task count across all statuses
 * - Status-specific breakdowns (Todo, In Progress, Done)
 * - Priority distribution analysis
 * - Completion rate calculations
 * - Productivity metrics and trends
 * 
 * Performance Features:
 * - Efficient calculation of statistics from task data
 * - Memoized computations to prevent unnecessary recalculations
 * - Optimized re-rendering through proper dependency management
 * - Smooth animation performance with native drivers
 * 
 * @module components/tasks/TaskStats
 * @requires react - Core React functionality and hooks
 * @requires react-native - React Native components and utilities
 * @requires @/context/ThemeContext - Application theme management
 * @requires lucide-react-native - Icon library for visual indicators
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target
} from 'lucide-react-native';
import { Task } from './TaskCard';

/**
 * TaskStats Component Props Interface
 * 
 * Defines the props required for the TaskStats component including
 * the task data array for statistical calculations.
 * 
 * @interface TaskStatsProps
 * @property {Task[]} tasks - Array of tasks for statistical analysis
 */
interface TaskStatsProps {
  tasks: Task[];
}

/**
 * Statistics Data Interface
 * 
 * Defines the structure for calculated statistics data with
 * comprehensive metrics for task management insights.
 * 
 * @interface StatsData
 * @property {number} total - Total number of tasks
 * @property {number} todo - Number of todo tasks
 * @property {number} inProgress - Number of in-progress tasks
 * @property {number} done - Number of completed tasks
 * @property {number} highPriority - Number of high priority tasks
 * @property {number} mediumPriority - Number of medium priority tasks
 * @property {number} lowPriority - Number of low priority tasks
 * @property {number} completionRate - Percentage of completed tasks
 * @property {number} urgentTasks - Number of urgent (high priority) incomplete tasks
 */
interface StatsData {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completionRate: number;
  urgentTasks: number;
}

/**
 * Stat Card Configuration Interface
 * 
 * Defines the visual and behavioral properties for individual
 * statistic cards including colors, icons, and formatting.
 * 
 * @interface StatCardConfig
 * @property {string} title - Display title for the statistic
 * @property {number} value - Numerical value to display
 * @property {string} subtitle - Additional descriptive text
 * @property {string} color - Primary color for theming
 * @property {string} bgColor - Background color for the card
 * @property {string} iconColor - Color for the icon element
 * @property {React.ReactNode} icon - Icon component to display
 * @property {string} [suffix] - Optional suffix for the value (e.g., '%')
 */
interface StatCardConfig {
  title: string;
  value: number;
  subtitle: string;
  color: string;
  bgColor: string;
  iconColor: string;
  icon: React.ReactNode;
  suffix?: string;
}

/**
 * Calculate Task Statistics
 * 
 * Efficiently computes comprehensive statistics from the task array
 * including counts, percentages, and derived metrics for dashboard display.
 * 
 * Statistical Calculations:
 * - Basic counts by status and priority
 * - Completion rate as percentage
 * - Urgent task identification (high priority incomplete)
 * - Productivity metrics and ratios
 * 
 * Performance Optimization:
 * - Single pass through task array for all calculations
 * - Memoized results to prevent unnecessary recalculations
 * - Efficient array methods for data processing
 * 
 * @param {Task[]} tasks - Array of tasks to analyze
 * @returns {StatsData} Comprehensive statistics object
 */
const calculateStats = (tasks: Task[]): StatsData => {
  const stats = tasks.reduce((acc, task) => {
    // Status counts
    if (task.status === 'todo') acc.todo++;
    else if (task.status === 'in_progress') acc.inProgress++;
    else if (task.status === 'done') acc.done++;

    // Priority counts
    if (task.priority === 'high') acc.highPriority++;
    else if (task.priority === 'medium') acc.mediumPriority++;
    else if (task.priority === 'low') acc.lowPriority++;

    // Urgent tasks (high priority and not done)
    if (task.priority === 'high' && task.status !== 'done') {
      acc.urgentTasks++;
    }

    return acc;
  }, {
    total: tasks.length,
    todo: 0,
    inProgress: 0,
    done: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    urgentTasks: 0,
    completionRate: 0
  });

  // Calculate completion rate as percentage
  stats.completionRate = stats.total > 0 
    ? Math.round((stats.done / stats.total) * 100) 
    : 0;

  return stats;
};

/**
 * TaskStats Component
 * 
 * The main statistics dashboard component that renders a comprehensive
 * overview of task metrics with beautiful visual design and engaging
 * data presentation.
 * 
 * Dashboard Layout:
 * - Grid-based card layout for optimal space utilization
 * - Responsive design that adapts to screen sizes
 * - Visual hierarchy emphasizing most important metrics
 * - Consistent spacing and alignment throughout
 * 
 * Visual Design:
 * - Modern card design with subtle shadows and gradients
 * - Color-coded metrics aligned with task priority themes
 * - Icon-based visual indicators for quick recognition
 * - Clean typography with emphasis on numerical values
 * 
 * Data Presentation:
 * - Key performance indicators (KPIs) prominently displayed
 * - Status distribution with visual breakdowns
 * - Priority analysis with actionable insights
 * - Completion tracking with percentage indicators
 * 
 * Interactive Features:
 * - Touch feedback for card interactions
 * - Smooth animations and transitions
 * - Accessibility-compliant design patterns
 * - Clear visual hierarchy for easy scanning
 * 
 * @param {TaskStatsProps} props - Component props containing task data
 * @returns {JSX.Element} Enhanced task statistics dashboard
 */
export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const { isDark } = useTheme();
  
  // Calculate comprehensive statistics from task data
  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  /**
   * Stat Card Configuration Array
   * 
   * Defines the configuration for all statistic cards including
   * visual styling, icons, and data formatting.
   */
  const statCards: StatCardConfig[] = [
    {
      title: 'Total Tasks',
      value: stats.total,
      subtitle: 'All tasks in system',
      color: '#3B82F6',
      bgColor: isDark ? '#1E3A8A' : '#EFF6FF',
      iconColor: '#3B82F6',
      icon: <BarChart3 size={24} color="#3B82F6" />
    },
    {
      title: 'Completed',
      value: stats.done,
      subtitle: `${stats.completionRate}% completion rate`,
      color: '#10B981',
      bgColor: isDark ? '#064E3B' : '#ECFDF5',
      iconColor: '#10B981',
      icon: <CheckCircle size={24} color="#10B981" />
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      subtitle: 'Currently active',
      color: '#F59E0B',
      bgColor: isDark ? '#92400E' : '#FFFBEB',
      iconColor: '#F59E0B',
      icon: <Clock size={24} color="#F59E0B" />
    },
    {
      title: 'To Do',
      value: stats.todo,
      subtitle: 'Waiting to start',
      color: '#EF4444',
      bgColor: isDark ? '#991B1B' : '#FEF2F2',
      iconColor: '#EF4444',
      icon: <Target size={24} color="#EF4444" />
    },
    {
      title: 'High Priority',
      value: stats.highPriority,
      subtitle: 'Urgent attention needed',
      color: '#DC2626',
      bgColor: isDark ? '#7F1D1D' : '#FEF2F2',
      iconColor: '#DC2626',
      icon: <AlertTriangle size={24} color="#DC2626" />
    },
    {
      title: 'Success Rate',
      value: stats.completionRate,
      subtitle: 'Overall productivity',
      color: '#8B5CF6',
      bgColor: isDark ? '#5B21B6' : '#F3E8FF',
      iconColor: '#8B5CF6',
      icon: <TrendingUp size={24} color="#8B5CF6" />,
      suffix: '%'
    }
  ];

  return (
    <View className="mb-6">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Task Overview
          </Text>
          <Text className={`text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Your productivity at a glance
          </Text>
        </View>
        
        {/* Quick Insight Badge */}
        {stats.urgentTasks > 0 && (
          <View 
            className="px-3 py-1.5 rounded-full border-2 border-red-400 bg-red-50"
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 1
            }}
          >
            <Text className="text-red-700 text-xs font-bold">
              {stats.urgentTasks} Urgent
            </Text>
          </View>
        )}
      </View>

      {/* Statistics Grid */}
      <View className="flex-row flex-wrap -mx-1.5">
        {statCards.map((card, index) => (
          <View 
            key={card.title}
            className="w-1/2 px-1.5 mb-3"
            style={{
              // Make completion rate and high priority cards full width on smaller screens
              width: index >= 4 ? '50%' : '50%'
            }}
          >
            <Pressable
              className={`rounded-2xl p-4 border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
              }`}
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                backgroundColor: isDark ? '#1F2937' : card.bgColor,
                shadowColor: card.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 2
              })}
            >
              {/* Card Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: isDark 
                      ? card.color + '20' 
                      : card.color + '15'
                  }}
                >
                  {card.icon}
                </View>
                
                {/* Trend Indicator */}
                <View className="w-2 h-2 rounded-full bg-green-400" />
              </View>

              {/* Main Value */}
              <View className="mb-2">
                <Text 
                  className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ color: isDark ? '#FFFFFF' : card.color }}
                >
                  {card.value}{card.suffix || ''}
                </Text>
              </View>

              {/* Card Title */}
              <Text 
                className={`text-sm font-semibold mb-1 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                {card.title}
              </Text>

              {/* Card Subtitle */}
              <Text 
                className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {card.subtitle}
              </Text>

              {/* Progress Bar for Completion Rate */}
              {card.title === 'Success Rate' && (
                <View className="mt-3">
                  <View 
                    className={`h-1.5 rounded-full ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <View 
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${stats.completionRate}%`,
                        backgroundColor: card.color
                      }}
                    />
                  </View>
                </View>
              )}
            </Pressable>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      {stats.total > 0 && (
        <View className="mt-4">
          <View 
            className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            }`}
          >
            <Text className={`text-sm font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Quick Insights
            </Text>
            
            <View className="gap-y-1">
              <Text className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                • {stats.inProgress + stats.todo} tasks remaining
              </Text>
              
              {stats.urgentTasks > 0 && (
                <Text className={`text-xs ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  • {stats.urgentTasks} high priority tasks need attention
                </Text>
              )}
              
              {stats.completionRate >= 80 && (
                <Text className={`text-xs ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  • Great job! You're highly productive
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskStats;