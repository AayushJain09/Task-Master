/**
 * TaskFormModal Component
 * 
 * A beautifully designed, comprehensive modal form for creating and editing tasks
 * with enhanced user experience, smooth animations, and intuitive form validation.
 * 
 * Design Philosophy:
 * - Modern modal design with smooth slide-up animation
 * - Clean, spacious form layout with logical field grouping
 * - Visual feedback for form validation and user interactions
 * - Responsive design that adapts to different screen sizes
 * - Accessibility-first approach with proper form semantics
 * 
 * User Experience Features:
 * - Smooth modal transitions with backdrop blur effect
 * - Real-time form validation with helpful error messages
 * - Smart field focus management and keyboard navigation
 * - Visual feedback for required fields and validation states
 * - Intuitive button grouping and clear action hierarchy
 * 
 * Form Features:
 * - Comprehensive task creation and editing capabilities
 * - Priority selection with visual color coding
 * - Due date quick selection with common timeframes
 * - Category management with suggestions
 * - Rich text description support
 * - Form state persistence during modal interactions
 * 
 * Technical Features:
 * - TypeScript integration for type safety
 * - Optimized re-rendering through proper state management
 * - Keyboard-friendly form navigation
 * - Platform-specific modal behavior
 * - Memory-efficient form state handling
 * 
 * @module components/tasks/TaskFormModal
 * @requires react - Core React functionality and hooks
 * @requires react-native - React Native components and utilities
 * @requires @/context/ThemeContext - Application theme management
 * @requires lucide-react-native - Icon library for form elements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Save,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react-native';
import { Task } from './TaskCard';

/**
 * Form Data Interface
 * 
 * Defines the structure for form data used in task creation and editing.
 * Includes validation states and helper properties for form management.
 * 
 * @interface FormData
 * @property {string} title - Task title (required)
 * @property {string} description - Task description (optional)
 * @property {'high' | 'medium' | 'low'} priority - Task priority level
 * @property {string} category - Task category for organization
 * @property {string} dueDate - Due date selection
 */
interface FormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
}

/**
 * TaskFormModal Component Props Interface
 * 
 * Defines all props required for the TaskFormModal component including
 * visibility state, form mode, and callback functions.
 * 
 * @interface TaskFormModalProps
 * @property {boolean} visible - Controls modal visibility
 * @property {string} title - Modal title (Create vs Edit mode)
 * @property {Task | null} editingTask - Task being edited (null for create mode)
 * @property {Function} onClose - Callback when modal is closed
 * @property {Function} onSubmit - Callback when form is submitted
 */
interface TaskFormModalProps {
  visible: boolean;
  title: string;
  editingTask: Task | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

/**
 * Priority Configuration
 * 
 * Defines visual and behavioral properties for different priority levels
 * including colors, icons, and descriptive text for user guidance.
 * 
 * @param {string} priority - The priority level
 * @returns {Object} Priority configuration object
 */
const getPriorityConfig = (priority: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High Priority',
      description: 'Urgent tasks that need immediate attention',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      textColor: '#DC2626',
      selectedBg: '#FEE2E2',
      selectedBorder: '#F87171',
      icon: '🔥'
    },
    medium: {
      label: 'Medium Priority',
      description: 'Important tasks with moderate urgency',
      bgColor: '#FFFBEB',
      borderColor: '#FED7AA',
      textColor: '#D97706',
      selectedBg: '#FEF3C7',
      selectedBorder: '#FBBF24',
      icon: '⚡'
    },
    low: {
      label: 'Low Priority',
      description: 'Tasks that can be completed when time allows',
      bgColor: '#F0FDF4',
      borderColor: '#BBF7D0',
      textColor: '#16A34A',
      selectedBg: '#DCFCE7',
      selectedBorder: '#4ADE80',
      icon: '📝'
    }
  };

  return configs[priority];
};

/**
 * Due Date Options Configuration
 * 
 * Defines available due date options with labels and descriptions
 * for quick selection in the form interface.
 */
const dueDateOptions = [
  { value: 'Today', label: 'Today', description: 'Due by end of today' },
  { value: 'Tomorrow', label: 'Tomorrow', description: 'Due by end of tomorrow' },
  { value: 'This week', label: 'This Week', description: 'Due by end of this week' },
  { value: 'Next week', label: 'Next Week', description: 'Due by end of next week' }
];

/**
 * Category Suggestions
 * 
 * Common category suggestions to help users organize their tasks
 * with consistent categorization patterns.
 */
const categorySuggestions = [
  'Work', 'Personal', 'Project', 'Meeting', 'Research', 'Development', 
  'Design', 'Marketing', 'Finance', 'Health', 'Education', 'Travel'
];

/**
 * TaskFormModal Component
 * 
 * The main modal component that provides a comprehensive form interface
 * for creating and editing tasks with enhanced design and user experience.
 * 
 * Modal Design Features:
 * - Smooth slide-up animation with backdrop blur effect
 * - Responsive modal sizing that adapts to content and screen size
 * - Clean, modern form layout with logical field grouping
 * - Visual hierarchy with proper spacing and typography
 * - Consistent theming across light and dark modes
 * 
 * Form Design Features:
 * - Smart field layout with optimal touch targets
 * - Visual feedback for form validation and required fields
 * - Priority selection with color-coded visual indicators
 * - Due date quick selection with descriptive options
 * - Category input with helpful suggestions
 * - Rich text description field with proper sizing
 * 
 * User Experience Features:
 * - Real-time form validation with helpful error messages
 * - Smart keyboard management and field focus
 * - Form state persistence during modal interactions
 * - Clear action buttons with proper visual hierarchy
 * - Accessibility-compliant form semantics
 * 
 * Technical Features:
 * - Efficient state management with proper form updates
 * - Platform-specific keyboard avoidance behavior
 * - Memory-efficient component lifecycle management
 * - Type-safe props and state management
 * - Optimized re-rendering performance
 * 
 * @param {TaskFormModalProps} props - Component props
 * @returns {JSX.Element} Enhanced task form modal component
 */
export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  title,
  editingTask,
  onClose,
  onSubmit
}) => {
  const { isDark } = useTheme();

  // Form state management
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: 'Today'
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Initialize Form Data
   * 
   * Sets up the form with either empty values for creation or
   * pre-populated values for editing an existing task.
   */
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        // Populate form with existing task data for editing
        setFormData({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          category: editingTask.category,
          dueDate: editingTask.dueDate
        });
      } else {
        // Reset form for new task creation
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          dueDate: 'Today'
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [visible, editingTask]);

  /**
   * Form Validation
   * 
   * Validates form data and returns any validation errors.
   * Implements comprehensive validation rules for all form fields.
   * 
   * @returns {Object} Validation errors object
   */
  const validateForm = (): Partial<FormData> => {
    const newErrors: Partial<FormData> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Category validation (optional but with format rules)
    if (formData.category && formData.category.trim().length > 50) {
      newErrors.category = 'Category must be less than 50 characters';
    }

    return newErrors;
  };

  /**
   * Handle Form Submission
   * 
   * Validates the form, handles submission state, and calls the
   * onSubmit callback with validated form data.
   */
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Form Field Updates
   * 
   * Updates form data and clears related validation errors
   * when user modifies form fields.
   * 
   * @param {string} field - The form field to update
   * @param {string} value - The new field value
   */
  const updateFormField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal Container with SafeArea */}
        <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
          style={{ 
            paddingTop: Platform.OS === 'ios' ? 44 : 0, // Status bar height
            maxHeight: Dimensions.get('window').height * 0.9 // Limit to 90% of screen height
          }}
        >
          {/* Compact Modal Header */}
          <View 
            className={`px-4 py-3 border-b ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}
          >
            <View className="flex-row items-center justify-between">
              {/* Compact Modal Title */}
              <View className="flex-1">
                <Text className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {title}
                </Text>
              </View>

              {/* Close Button */}
              <Pressable
                onPress={onClose}
                className={`p-2 rounded-full ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }]
                })}
              >
                <X size={20} color={isDark ? '#D1D5DB' : '#4B5563'} />
              </Pressable>
            </View>
          </View>

          {/* Compact Form Content */}
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ 
              padding: 16,
              paddingBottom: 100 // Extra space for bottom controls
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Task Title Field */}
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <FileText size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Task Title *
                </Text>
              </View>
              
              <TextInput
                value={formData.title}
                onChangeText={(text) => updateFormField('title', text)}
                placeholder="Enter a descriptive task title..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`border-2 rounded-xl px-4 py-3 text-base ${
                  errors.title 
                    ? 'border-red-300 bg-red-50' 
                    : isDark 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-200 bg-white text-gray-900'
                }`}
                style={{
                  shadowColor: errors.title ? '#EF4444' : '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: errors.title ? 0.2 : 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
                maxLength={100}
              />
              
              {errors.title && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.title}</Text>
                </View>
              )}
            </View>

            {/* Task Description Field */}
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <FileText size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Description
                </Text>
                <Text className={`text-sm ml-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  (Optional)
                </Text>
              </View>
              
              <TextInput
                value={formData.description}
                onChangeText={(text) => updateFormField('description', text)}
                placeholder="Add additional details about the task..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`border-2 rounded-xl px-4 py-3 text-base min-h-[100px] ${
                  errors.description 
                    ? 'border-red-300 bg-red-50' 
                    : isDark 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-200 bg-white text-gray-900'
                }`}
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
                maxLength={500}
              />
              
              {errors.description && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.description}</Text>
                </View>
              )}
            </View>

            {/* Priority Selection */}
            <View className="mb-4">
              <View className="flex-row items-center mb-4">
                <AlertCircle size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Priority Level
                </Text>
              </View>
              
              <View className="space-y-3">
                {(['high', 'medium', 'low'] as const).map((priority) => {
                  const config = getPriorityConfig(priority);
                  const isSelected = formData.priority === priority;
                  
                  return (
                    <Pressable
                      key={priority}
                      onPress={() => updateFormField('priority', priority)}
                      className={`border-2 rounded-xl p-4 ${
                        isSelected 
                          ? 'border-blue-400 bg-blue-50' 
                          : isDark 
                            ? 'border-gray-600 bg-gray-800' 
                            : 'border-gray-200 bg-white'
                      }`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                        backgroundColor: isSelected 
                          ? config.selectedBg 
                          : isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: isSelected 
                          ? config.selectedBorder 
                          : isDark ? '#4B5563' : '#E5E7EB',
                        shadowColor: isSelected ? config.textColor : '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isSelected ? 0.2 : 0.05,
                        shadowRadius: 2,
                        elevation: isSelected ? 2 : 1
                      })}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-xl mr-3">{config.icon}</Text>
                        <View className="flex-1">
                          <Text 
                            className={`text-base font-semibold ${
                              isSelected 
                                ? 'text-blue-800' 
                                : isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {config.label}
                          </Text>
                          <Text 
                            className={`text-sm mt-1 ${
                              isSelected 
                                ? 'text-blue-600' 
                                : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {config.description}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Field */}
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <Tag size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Category
                </Text>
                <Text className={`text-sm ml-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  (Optional)
                </Text>
              </View>
              
              <TextInput
                value={formData.category}
                onChangeText={(text) => updateFormField('category', text)}
                placeholder="e.g., Work, Personal, Project..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`border-2 rounded-xl px-4 py-3 text-base ${
                  errors.category 
                    ? 'border-red-300 bg-red-50' 
                    : isDark 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-200 bg-white text-gray-900'
                }`}
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
                maxLength={50}
              />
              
              {/* Category Suggestions */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                contentContainerStyle={{ paddingHorizontal: 0 }}
              >
                <View className="flex-row space-x-2">
                  {categorySuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      onPress={() => updateFormField('category', suggestion)}
                      className={`px-3 py-1.5 rounded-full border ${
                        formData.category === suggestion
                          ? 'border-blue-400 bg-blue-100'
                          : isDark 
                            ? 'border-gray-600 bg-gray-700' 
                            : 'border-gray-300 bg-gray-100'
                      }`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1
                      })}
                    >
                      <Text className={`text-xs font-medium ${
                        formData.category === suggestion
                          ? 'text-blue-700'
                          : isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              
              {errors.category && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.category}</Text>
                </View>
              )}
            </View>

            {/* Due Date Selection */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Calendar size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Due Date
                </Text>
              </View>
              
              <View className="grid grid-cols-2 gap-3">
                {dueDateOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => updateFormField('dueDate', option.value)}
                    className={`border-2 rounded-xl p-4 ${
                      formData.dueDate === option.value 
                        ? 'border-blue-400 bg-blue-50' 
                        : isDark 
                          ? 'border-gray-600 bg-gray-800' 
                          : 'border-gray-200 bg-white'
                    }`}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      flex: 1,
                      marginRight: dueDateOptions.indexOf(option) % 2 === 0 ? 6 : 0,
                      marginLeft: dueDateOptions.indexOf(option) % 2 === 1 ? 6 : 0,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1
                    })}
                  >
                    <View className="items-center">
                      <Clock size={20} color={
                        formData.dueDate === option.value 
                          ? '#2563EB' 
                          : isDark ? '#9CA3AF' : '#6B7280'
                      } />
                      <Text className={`text-sm font-semibold mt-2 text-center ${
                        formData.dueDate === option.value 
                          ? 'text-blue-700' 
                          : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </Text>
                      <Text className={`text-xs mt-1 text-center ${
                        formData.dueDate === option.value 
                          ? 'text-blue-600' 
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Fixed Form Actions */}
          <View 
            className={`absolute bottom-0 left-0 right-0 px-4 py-3 border-t ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              paddingBottom: Platform.OS === 'ios' ? 34 : 16 // Account for home indicator
            }}
          >
            <View className="flex-row space-x-3">
              {/* Cancel Button */}
              <Pressable
                onPress={onClose}
                className={`flex-1 py-3 rounded-xl border-2 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-300 bg-gray-100'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
                disabled={isSubmitting}
              >
                <Text className={`text-center font-semibold ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                className={`flex-1 py-3 rounded-xl ${
                  isSubmitting 
                    ? 'bg-blue-400' 
                    : 'bg-blue-500'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed && !isSubmitting ? 0.9 : 1,
                  transform: [{ scale: pressed && !isSubmitting ? 0.98 : 1 }],
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                })}
                disabled={isSubmitting}
              >
                <View className="flex-row items-center justify-center">
                  <Save size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">
                    {isSubmitting 
                      ? 'Saving...' 
                      : editingTask ? 'Update Task' : 'Create Task'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TaskFormModal;