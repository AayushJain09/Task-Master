/**
 * TaskDetailsModal Component
 * 
 * A comprehensive modal that displays all task details in a beautifully organized layout
 * with smooth animations and a responsive design. Provides complete task information
 * including metadata, status, priority, and timestamps.
 * 
 * Features:
 * - Smooth slide-up animation with backdrop fade
 * - Comprehensive task information display
 * - Priority-based color theming
 * - Responsive layout that adapts to content
 * - Dark/light theme support
 * - Accessibility compliance
 * - Touch-optimized close actions
 * 
 * @module components/tasks/TaskDetailsModal
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Pressable
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  User,
  FileText,
  Star,
  Hash,
  Podcast
} from 'lucide-react-native';
import { Task } from './TaskCard';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

/**
 * Priority Configuration with Enhanced Visual Design
 */
const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high':
      return {
        bg: '#FEE2E2',
        text: '#DC2626',
        border: '#F87171',
        icon: '#DC2626',
        label: 'High',
        iconComponent: AlertCircle,
        shadow: '#DC262620'
      };
    case 'medium':
      return {
        bg: '#FEF3C7',
        text: '#D97706',
        border: '#FBBF24',
        icon: '#D97706',
        label: 'Medium',
        iconComponent: Star,
        shadow: '#D9770620'
      };
    case 'low':
      return {
        bg: '#DCFCE7',
        text: '#059669',
        border: '#34D399',
        icon: '#10B981',
        label: 'Low',
        iconComponent: CheckCircle2,
        shadow: '#05966920'
      };
    default:
      return {
        bg: '#F9FAFB',
        text: '#374151',
        border: '#9CA3AF',
        icon: '#6B7280',
        label: 'Normal',
        iconComponent: Hash,
        shadow: '#37415120'
      };
  }
};

/**
 * Status Configuration with Visual Indicators
 */
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'todo':
      return {
        bg: '#FEF3F2',
        text: '#DC2626',
        border: '#F87171',
        icon: '#EF4444',
        label: 'TODO',
        iconComponent: Hash,
        shadow: '#EF444420'
      };
    case 'in_progress':
      return {
        bg: '#FFFBEB',
        text: '#D97706',
        border: '#FBBF24',
        icon: '#F59E0B',
        label: 'InProgress',
        iconComponent: PlayCircle,
        shadow: '#F59E0B20'
      };
    case 'done':
      return {
        bg: '#F0FDF4',
        text: '#059669',
        border: '#34D399',
        icon: '#10B981',
        label: 'Done',
        iconComponent: CheckCircle2,
        shadow: '#10B98120'
      };
    default:
      return {
        bg: '#F9FAFB',
        text: '#374151',
        border: '#9CA3AF',
        icon: '#6B7280',
        label: 'Unknown',
        iconComponent: Hash,
        shadow: '#6B728020'
      };
  }
};

/**
 * TaskDetailsModal Component
 */
export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible,
  task,
  onClose
}) => {
  const { isDark } = useTheme();

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Reset animation values to starting position
      scaleAnim.setValue(0.8);
      translateYAnim.setValue(50);
      backdropOpacity.setValue(0);

      // Opening animation with slight delay for better visual effect
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }, 50);
    } else if (!visible && (backdropOpacity._value > 0 || scaleAnim._value > 0.8)) {
      // Only animate close if modal was actually open
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, backdropOpacity, scaleAnim, translateYAnim]);

  if (!task) return null;

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const PriorityIcon = priorityConfig.iconComponent;
  const StatusIcon = statusConfig.iconComponent;

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      if (!dateString) return 'Not set';

      // If it's already a readable format, return as is
      if (dateString.includes('/') || dateString.includes('-')) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }
      }

      // If it's a relative format like "Today", "Tomorrow", return as is
      return dateString;
    } catch {
      return dateString || 'Not set';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      {/* Animated Backdrop with Content */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: backdropOpacity,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={onClose}
        />

        <Animated.View
          style={{
            transform: [
              { translateY: translateYAnim },
              { scale: scaleAnim }
            ],
            width: '100%',
            maxWidth: 500,
            maxHeight: SCREEN_HEIGHT * 0.75,
            borderRadius: 24,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Header Section */}
          <View className={`px-6 pt-6 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <View className="flex-row items-center justify-center mb-4">
              <Text className={`text-md font-bold ${isDark ? 'text-gray-400' : 'text-gray-900'
                }`}>
                Task Details
              </Text>

              <TouchableOpacity
                onPress={onClose}
                className={`p-2 rounded-full absolute right-0 `}
                accessibilityLabel="Close task details"
              >
                <X size={24} color={isDark ? '#9ca3af' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1
            }}
          >
            {task.title && (
              <View className="px-6 pt-6">
                <View className="flex-row items-center ">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    }`}>
                    <Podcast size={20} color={isDark ? '#f8ec82' : '#6366F1'} />
                  </View>
                  <Text className={`text-xl font-bold ml-3  ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>

                    {task.title}
                  </Text>
                </View>
              </View>
            )}
            {/* Description Section */}
            {task.description && (
              <View className="px-6 pt-6">
                <View className="flex-row items-center mb-4">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    }`}>
                    <FileText size={20} color={isDark ? '#818CF8' : '#6366F1'} />
                  </View>
                  <Text className={`text-xl font-bold ml-3 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    Description
                  </Text>
                </View>
                <View className={`p-4 rounded-xl border ${isDark
                  ? 'bg-gray-800/30 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <Text className={`text-base leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {task.description}
                  </Text>
                </View>
              </View>
            )}

            {/* Compact Status and Priority Row */}
            <View className="px-6 pt-6">
              <View className="flex-row justify-around gap-3 mb-6">
                {/* Status Badge */}
                <View className='flex-row justify-center items-center gap-x-1'>
                  <Text className='text-gray-400 text-xs p-1 font-semibold '>Status :</Text>
                  <View
                    className="flex-row items-center px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: statusConfig.bg,
                      borderWidth: 1.5,
                      borderColor: statusConfig.border
                    }}
                  >
                    <StatusIcon size={14} color={statusConfig.icon} />
                    <Text
                      className="text-sm font-bold ml-2"
                      style={{ color: statusConfig.text }}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Priority Badge */}
                <View className='flex-row justify-center items-center gap-x-1'>
                  <Text className='text-gray-400 text-xs p-1 font-semibold '>Priority :</Text>
                  <View
                    className="flex-row items-center px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: priorityConfig.bg,
                      borderWidth: 1.5,
                      borderColor: priorityConfig.border
                    }}
                  >
                    <PriorityIcon size={11} color={priorityConfig.icon} />
                    <Text
                      className="text-sm font-bold ml-2"
                      style={{ color: priorityConfig.text }}
                    >
                      {priorityConfig.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Task Details Grid */}
            <View className="px-6">
              <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                Task Information
              </Text>

              {/* Row 1: Category and Task ID */}
              <View className="flex-row gap-3 mb-4">
                {/* Category */}
                <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-blue-50'
                  }`}>
                  <View className="flex-row items-center mb-1">
                    <Tag size={14} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-blue-600'
                      }`}>
                      Category
                    </Text>
                  </View>
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {task.category}
                  </Text>
                </View>

                {/* Task ID */}
                <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}>
                  <View className="flex-row items-center mb-1">
                    <Hash size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      Task ID
                    </Text>
                  </View>
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    #{task.id}
                  </Text>
                </View>
              </View>

              {/* Row 2: Due Date and Created Date */}
              <View className="flex-row gap-3 mb-4">
                {/* Due Date */}
                <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-purple-50'
                  }`}>
                  <View className="flex-row items-center mb-1">
                    <Calendar size={14} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                    <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-purple-600'
                      }`}>
                      Due Date
                    </Text>
                  </View>
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {formatDate(task.dueDate)}
                  </Text>
                </View>

                {/* Created Date */}
                <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-green-50'
                  }`}>
                  <View className="flex-row items-center mb-1">
                    <Clock size={14} color={isDark ? '#34D399' : '#10B981'} />
                    <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-green-600'
                      }`}>
                      Created
                    </Text>
                  </View>
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {formatDate(task.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Row 3: Assigned By and Assigned To */}
              <View className="flex-row gap-3 mb-4">
                {/* Assigned By */}
                {task.assignedBy && (
                  <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'
                    }`}>
                    <View className="flex-row items-center mb-1">
                      <User size={14} color={isDark ? '#FB923C' : '#EA580C'} />
                      <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-orange-600'
                        }`}>
                        Assigned By
                      </Text>
                    </View>
                    <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      {task.assignedBy.fullName || `${task.assignedBy.firstName} ${task.assignedBy.lastName}`.trim()}
                    </Text>
                  </View>
                )}

                {/* Assigned To */}
                {task.assignedTo && (
                  <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-blue-50'
                    }`}>
                    <View className="flex-row items-center mb-1">
                      <User size={14} color={isDark ? '#60A5FA' : '#3B82F6'} />
                      <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                        Assigned To
                      </Text>
                    </View>
                    <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      {task.assignedTo.fullName || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()}
                    </Text>
                  </View>
                )}

                {/* Fill empty space if only one assignment exists */}
                {(task.assignedBy && !task.assignedTo) || (!task.assignedBy && task.assignedTo) ? (
                  <View className="flex-1" />
                ) : null}
              </View>

              {/* Row 4: Tags (if available) */}
              {task.tags && task.tags.length > 0 && (
                <View className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-gray-800/50' : 'bg-indigo-50'
                  }`}>
                  <View className="flex-row items-center mb-2">
                    <Tag size={14} color={isDark ? '#A5B4FC' : '#6366F1'} />
                    <Text className={`text-xs font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-indigo-600'
                      }`}>
                      Tags
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <View
                        key={index}
                        className={`px-2 py-1 rounded-full ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                          }`}
                      >
                        <Text className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'
                          }`}>
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default TaskDetailsModal;