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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Save,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  Clock,
  User,
  Hash
} from 'lucide-react-native';
import { Task as TaskCardType } from './TaskCard';
import UserAssignmentDropdown from '@/components/ui/UserAssignmentDropdown';

// Import API types and service
import { 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskPriority,
  TaskFormValidation,
  TaskError 
} from '@/types/task.types';
import { tasksService } from '@/services/tasks.service';

// Import validation and error handling utilities
import { 
  FormValidator, 
  InputSanitizer, 
  ErrorRecovery, 
  FormPersistence 
} from '@/utils/validation';
import { debounce } from '@/utils/debounce';

/**
 * Enhanced Form Data Interface
 * 
 * Defines the comprehensive structure for form data used in task creation and editing.
 * Aligned with backend API requirements and includes all task properties.
 * 
 * @interface FormData
 * @property {string} title - Task title (required)
 * @property {string} description - Task description (optional)
 * @property {TaskPriority} priority - Task priority level
 * @property {string} category - Task category for organization
 * @property {string} dueDate - Due date in ISO format
 * @property {string[]} tags - Task tags for better organization
 * @property {number} estimatedHours - Estimated hours to complete
 * @property {string} assignedTo - User ID to assign task to
 */
interface FormData {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  tags: string[];
  estimatedHours: number;
  assignedTo: string;
}

/**
 * Extended Task Interface for Form Editing
 * 
 * Extends the basic TaskCard interface to include additional fields
 * needed for comprehensive task editing in the form modal.
 */
interface EditableTask extends TaskCardType {
  tags?: string[];
  estimatedHours?: number;
}

/**
 * Enhanced TaskFormModal Component Props Interface
 * 
 * Defines all props required for the TaskFormModal component including
 * visibility state, form mode, loading states, and callback functions.
 * 
 * @interface TaskFormModalProps
 * @property {boolean} visible - Controls modal visibility
 * @property {string} title - Modal title (Create vs Edit mode)
 * @property {EditableTask | null} editingTask - Task being edited (null for create mode)
 * @property {Function} onClose - Callback when modal is closed
 * @property {Function} onSubmit - Callback when form is submitted
 * @property {boolean} isLoading - Loading state for form submission
 * @property {string} error - Error message to display
 */
interface TaskFormModalProps {
  visible: boolean;
  title: string;
  editingTask: EditableTask | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isLoading?: boolean;
  error?: string | null;
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
      label: 'High',
      description: 'Urgent tasks that need immediate attention',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      textColor: '#DC2626',
      selectedBg: '#FEE2E2',
      selectedBorder: '#F87171',
      icon: '🔥'
    },
    medium: {
      label: 'Medium',
      description: 'Important tasks with moderate urgency',
      bgColor: '#FFFBEB',
      borderColor: '#FED7AA',
      textColor: '#D97706',
      selectedBg: '#FEF3C7',
      selectedBorder: '#FBBF24',
      icon: '⚡'
    },
    low: {
      label: 'Low',
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
  onSubmit,
  isLoading = false,
  error = null
}) => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Enhanced form state management
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: new Date().toISOString().split('T')[0],
    tags: [],
    estimatedHours: 0,
    assignedTo: currentUser?.id || ''
  });

  // Enhanced validation and error handling state
  const [errors, setErrors] = useState<TaskFormValidation>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastValidFormData, setLastValidFormData] = useState<FormData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * Initialize Form Data
   * 
   * Sets up the form with either empty values for creation or
   * pre-populated values for editing an existing task.
   */
  /**
   * Enhanced Form Initialization with Error Recovery
   * 
   * Initializes form data with comprehensive error handling, 
   * data recovery, and draft loading capabilities.
   */
  useEffect(() => {
    const initializeForm = async () => {
      if (!visible) return;
      
      try {
        let initialData: FormData;
        
        if (editingTask) {
          // Populate form with existing task data for editing
          let formattedDueDate = '';
          if (editingTask.dueDate) {
            try {
              // Handle different date formats
              const date = new Date(editingTask.dueDate);
              if (!isNaN(date.getTime())) {
                formattedDueDate = date.toISOString().split('T')[0];
              } else {
                formattedDueDate = new Date().toISOString().split('T')[0];
              }
            } catch (error) {
              console.warn('Error parsing due date:', error);
              formattedDueDate = new Date().toISOString().split('T')[0];
            }
          } else {
            formattedDueDate = new Date().toISOString().split('T')[0];
          }
          
          initialData = {
            title: editingTask.title || '',
            description: editingTask.description || '',
            priority: editingTask.priority || 'medium',
            category: editingTask.category || '',
            dueDate: formattedDueDate,
            tags: editingTask.tags || [], // Use tags from editing task
            estimatedHours: editingTask.estimatedHours || 0, // Use estimated hours from editing task
            assignedTo: currentUser?.id || '' // Will be set by backend to current user
          };
        } else {
          // Try to load draft for new task creation
          const draftData = await FormPersistence.loadFormDraft('create');
          const today = new Date().toISOString().split('T')[0];
          
          if (draftData) {
            // Validate and sanitize draft data
            const validation = FormValidator.validateForm(draftData);
            initialData = validation.isValid ? validation.sanitizedData : {
              title: '',
              description: '',
              priority: 'medium',
              category: '',
              dueDate: today,
              tags: [],
              estimatedHours: 0,
              assignedTo: currentUser?.id || ''
            };
          } else {
            initialData = {
              title: '',
              description: '',
              priority: 'medium',
              category: '',
              dueDate: today,
              tags: [],
              estimatedHours: 0,
              assignedTo: currentUser?.id || ''
            };
          }
        }
        
        // Sanitize initial data
        const sanitizedData = FormValidator.validateForm(initialData).sanitizedData;
        setFormData(sanitizedData);
        setLastValidFormData(sanitizedData);
        
        // Reset state
        setErrors({});
        setIsSubmitting(false);
        setCurrentTag('');
        setRetryAttempt(0);
        setHasUnsavedChanges(false);
        setSecurityWarning(null);
        
      } catch (error) {
        console.error('Error initializing form:', error);
        // Fallback to empty form
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          dueDate: today,
          tags: [],
          estimatedHours: 0,
          assignedTo: currentUser?.id || ''
        });
      }
    };
    
    initializeForm();
  }, [visible, editingTask]);

  /**
   * Form Validation
   * 
   * Validates form data and returns any validation errors.
   * Implements comprehensive validation rules for all form fields.
   * 
   * @returns {Object} Validation errors object
   */
  /**
   * Comprehensive Form Validation with Security Checks
   * 
   * Validates form data using robust validation rules,
   * sanitization, and security threat detection.
   */
  const validateForm = (): {
    isValid: boolean;
    errors: TaskFormValidation;
    sanitizedData: FormData;
    hasSecurityIssues: boolean;
  } => {
    try {
      // Use comprehensive validator
      const validation = FormValidator.validateForm(formData);
      
      // Additional business rule validations
      const additionalErrors: TaskFormValidation = {};
      
      // Check for duplicate tags
      const uniqueTags = new Set(formData.tags);
      if (uniqueTags.size !== formData.tags.length) {
        additionalErrors.tags = 'Duplicate tags are not allowed';
      }
      
      // Validate estimated hours business rules
      if (formData.estimatedHours > 0 && formData.estimatedHours < 0.1) {
        additionalErrors.estimatedHours = 'Minimum estimated time is 0.1 hours (6 minutes)';
      }
      
      // Merge validation errors
      const allErrors = { ...validation.errors, ...additionalErrors };
      const isValid = Object.keys(allErrors).length === 0;
      
      // Set security warning if detected
      if (validation.hasSecurityIssues) {
        setSecurityWarning('Some characters have been removed for security reasons');
      } else {
        setSecurityWarning(null);
      }
      
      return {
        isValid,
        errors: allErrors,
        sanitizedData: validation.sanitizedData,
        hasSecurityIssues: validation.hasSecurityIssues
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: { title: 'Validation failed. Please try again.' },
        sanitizedData: formData,
        hasSecurityIssues: false
      };
    }
  };

  /**
   * Handle Form Submission
   * 
   * Validates the form, handles submission state, and calls the
   * onSubmit callback with validated form data.
   */
  /**
   * Enhanced Form Submission with Retry Logic and Error Recovery
   * 
   * Handles form submission with comprehensive error handling,
   * retry mechanisms, and data recovery.
   */
  const handleSubmit = async () => {
    try {
      // Comprehensive validation
      const validation = validateForm();
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        
        // Show detailed error message
        const errorMessages = Object.values(validation.errors).filter(Boolean);
        const errorText = errorMessages.length > 0 
          ? errorMessages.join('\n') 
          : 'Please fix the errors in the form';
          
        Alert.alert('Validation Error', errorText);
        return;
      }
      
      // Use sanitized data for submission
      const sanitizedFormData = validation.sanitizedData;
      
      setIsSubmitting(true);
      setErrors({});
      
      // Save current valid form data for recovery
      setLastValidFormData(sanitizedFormData);
      
      try {
        // Prepare data for API submission with additional sanitization
        const apiData = {
          title: InputSanitizer.sanitizeText(sanitizedFormData.title, { maxLength: 200 }),
          description: sanitizedFormData.description 
            ? InputSanitizer.sanitizeText(sanitizedFormData.description, { maxLength: 2000 })
            : undefined,
          priority: sanitizedFormData.priority,
          category: sanitizedFormData.category 
            ? InputSanitizer.sanitizeCategory(sanitizedFormData.category)
            : undefined,
          dueDate: sanitizedFormData.dueDate 
            ? new Date(sanitizedFormData.dueDate).toISOString() 
            : undefined,
          tags: sanitizedFormData.tags.length > 0 
            ? sanitizedFormData.tags.map(tag => InputSanitizer.sanitizeTag(tag)).filter(Boolean)
            : undefined,
          estimatedHours: sanitizedFormData.estimatedHours > 0 
            ? sanitizedFormData.estimatedHours 
            : undefined
        };
        
        // Submit form
        await onSubmit(apiData as any);
        
        // Clear draft on successful submission
        await FormPersistence.clearFormDraft();
        setHasUnsavedChanges(false);
        setRetryAttempt(0);
        
      } catch (submitError: any) {
        console.error('Form submission error:', submitError);
        
        // Handle specific error types
        if (ErrorRecovery.isRetryableError(submitError)) {
          // Implement retry logic
          const nextAttempt = retryAttempt + 1;
          const maxRetries = 3;
          
          if (nextAttempt <= maxRetries) {
            setRetryAttempt(nextAttempt);
            
            const retryDelay = ErrorRecovery.getRetryDelay(nextAttempt);
            
            Alert.alert(
              'Connection Error',
              `Failed to save task. Retrying in ${Math.ceil(retryDelay / 1000)} seconds... (Attempt ${nextAttempt}/${maxRetries})`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Retry Now',
                  onPress: () => {
                    setTimeout(() => handleSubmit(), 500);
                  }
                }
              ]
            );
            
            // Auto-retry after delay
            setTimeout(() => {
              if (retryAttempt === nextAttempt - 1) { // Check if still the same attempt
                handleSubmit();
              }
            }, retryDelay);
            
            return;
          }
        }
        
        // Handle validation errors from backend
        if (submitError.status === 400 && submitError.details) {
          const backendErrors: TaskFormValidation = {};
          
          // Map backend errors to form fields
          if (submitError.details.title) backendErrors.title = submitError.details.title;
          if (submitError.details.description) backendErrors.description = submitError.details.description;
          if (submitError.details.category) backendErrors.category = submitError.details.category;
          if (submitError.details.dueDate) backendErrors.dueDate = submitError.details.dueDate;
          if (submitError.details.tags) backendErrors.tags = submitError.details.tags;
          if (submitError.details.estimatedHours) backendErrors.estimatedHours = submitError.details.estimatedHours;
          
          if (Object.keys(backendErrors).length > 0) {
            setErrors(backendErrors);
            Alert.alert('Validation Error', 'Please correct the highlighted fields and try again.');
            return;
          }
        }
        
        // Generic error handling
        const errorMessage = submitError.message || 'Failed to save task. Please try again.';
        
        Alert.alert(
          'Error',
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save Draft',
              onPress: async () => {
                await FormPersistence.saveFormDraft(sanitizedFormData, editingTask ? 'edit' : 'create');
                Alert.alert('Draft Saved', 'Your changes have been saved as a draft.');
              }
            },
            {
              text: 'Retry',
              onPress: () => handleSubmit()
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Critical form submission error:', error);
      
      // Recover form data if possible
      if (lastValidFormData) {
        const recoveredData = ErrorRecovery.recoverFormData(formData, lastValidFormData);
        setFormData(recoveredData);
      }
      
      Alert.alert(
        'Critical Error',
        'An unexpected error occurred. Your data has been recovered where possible.',
        [
          { text: 'OK' },
          {
            text: 'Save Draft',
            onPress: async () => {
              await FormPersistence.saveFormDraft(formData, editingTask ? 'edit' : 'create');
            }
          }
        ]
      );
      
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
  /**
   * Enhanced Form Field Update with Real-time Validation and Sanitization
   * 
   * Updates form fields with comprehensive validation, sanitization,
   * and auto-save functionality.
   */
  const updateFormField = useCallback((field: keyof FormData, value: any) => {
    try {
      let sanitizedValue = value;
      
      // Real-time sanitization based on field type
      switch (field) {
        case 'title':
          sanitizedValue = InputSanitizer.sanitizeText(value, {
            maxLength: 200,
            allowSpecialChars: true,
            trim: false, // Don't trim while typing
            normalizeSpaces: false
          });
          break;
          
        case 'description':
          sanitizedValue = InputSanitizer.sanitizeText(value, {
            maxLength: 2000,
            allowSpecialChars: true,
            trim: false,
            normalizeSpaces: false
          });
          break;
          
        case 'category':
          sanitizedValue = InputSanitizer.sanitizeText(value, {
            maxLength: 50,
            allowSpecialChars: false,
            trim: false,
            normalizeSpaces: false
          });
          break;
          
        case 'estimatedHours':
          sanitizedValue = InputSanitizer.sanitizeNumber(value, 0, 1000) || 0;
          break;
          
        default:
          break;
      }
      
      // Update form data
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
      setHasUnsavedChanges(true);
      
      // Clear error for this field when user starts typing
      if (errors[field as keyof TaskFormValidation]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
      
      // Clear security warning when user makes changes
      if (securityWarning) {
        setSecurityWarning(null);
      }
      
      // Auto-save draft periodically (debounced)
      debouncedSaveDraft(field, sanitizedValue);
      
    } catch (error) {
      console.error('Error updating form field:', error);
    }
  }, [errors, securityWarning]);
  
  // Debounced auto-save function
  const debouncedSaveDraft = useCallback(
    debounce(async () => {
      if (hasUnsavedChanges && !editingTask) {
        try {
          await FormPersistence.saveFormDraft(formData, 'create');
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 2000), // Save every 2 seconds when user stops typing
    [formData, hasUnsavedChanges, editingTask]
  );

  /**
   * Enhanced Tag Management with Validation and Sanitization
   */
  const addTag = useCallback(() => {
    try {
      const sanitizedTag = InputSanitizer.sanitizeTag(currentTag);
      
      if (!sanitizedTag) {
        Alert.alert('Invalid Tag', 'Tags must be at least 2 characters and contain only letters, numbers, hyphens, and underscores.');
        return;
      }
      
      if (formData.tags.includes(sanitizedTag)) {
        Alert.alert('Duplicate Tag', 'This tag has already been added.');
        return;
      }
      
      if (formData.tags.length >= 10) {
        Alert.alert('Too Many Tags', 'You can only have up to 10 tags per task.');
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, sanitizedTag] 
      }));
      setCurrentTag('');
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('Error adding tag:', error);
      Alert.alert('Error', 'Failed to add tag. Please try again.');
    }
  }, [currentTag, formData.tags]);

  /**
   * Safe Tag Removal
   */
  const removeTag = useCallback((tagToRemove: string) => {
    try {
      setFormData(prev => ({ 
        ...prev, 
        tags: prev.tags.filter(tag => tag !== tagToRemove) 
      }));
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  }, []);

  /**
   * Handle Date Picker Change
   */
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(formData.dueDate);
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      updateFormField('dueDate', dateString);
    }
  }, [formData.dueDate]);
  
  /**
   * Enhanced Modal Close with Unsaved Changes Detection
   */
  const handleModalClose = useCallback(() => {
    if (hasUnsavedChanges && !isSubmitting) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => {
            FormPersistence.clearFormDraft();
            onClose();
          }},
          { text: 'Save Draft', onPress: async () => {
            await FormPersistence.saveFormDraft(formData, editingTask ? 'edit' : 'create');
            onClose();
          }},
          { text: 'Continue Editing', style: 'cancel' }
        ]
      );
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, isSubmitting, formData, editingTask, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleModalClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalContainer}>
        {/* Simple Backdrop */}
        <Pressable 
          style={styles.backdrop}
          onPress={handleModalClose}
        />
        
        {/* Modal Content */}
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              height: SCREEN_HEIGHT * 0.7,
              width: SCREEN_WIDTH >= 768 ? Math.min(SCREEN_WIDTH * 0.8, 600) : SCREEN_WIDTH - 32,
            }
          ]}
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          {/* Enhanced Modal Header */}
          <View 
            className={`px-6 py-4 border-b  ${
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
            {/* Error Display */}
            {error && (
              <View className={`mb-4 p-3 rounded-lg border ${
                isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              }`}>
                <View className="flex-row items-center">
                  <AlertCircle size={18} color={isDark ? '#F87171' : '#EF4444'} />
                  <Text className={`ml-2 flex-1 text-sm ${
                    isDark ? 'text-red-300' : 'text-red-700'
                  }`}>
                    {error}
                  </Text>
                </View>
              </View>
            )}
            <View className="flex-row items-center justify-between">
              {/* Enhanced Modal Title */}
              <View className="flex-1">
                <Text className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {title}
                </Text>
                <Text className={`text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {editingTask ? 'Modify task details below' : 'Fill in the details to create a new task'}
                </Text>
              </View>

              {/* Enhanced Close Button */}
              <Pressable
                onPress={handleModalClose}
                disabled={isLoading || isSubmitting}
                className={`p-1 rounded-full ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                style={({ pressed }) => ({
                  opacity: (pressed || isLoading || isSubmitting) ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }]
                })}
              >
                <X size={22} color={isDark ? '#D1D5DB' : '#4B5563'} />
                {hasUnsavedChanges && (
                  <View className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Enhanced Form Content */}
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ 
              padding: SCREEN_WIDTH >= 768 ? 24 : 20,
              paddingBottom: 120 // Extra space for bottom controls
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
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
              
              <View className="gap-x-3 flex-row justify-center">
                {(['high', 'medium', 'low'] as const).map((priority) => {
                  const config = getPriorityConfig(priority);
                  const isSelected = formData.priority === priority;
                  
                  return (
                    <Pressable
                      key={priority}
                      onPress={() => updateFormField('priority', priority)}
                      className={`border-2 rounded-xl p-1 min-w-28 ${
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
                      <View className="flex-row items-center justify-center">
                        <View className="flex-1">
                          <Text className='text-sm text-center'>{config.icon}</Text>
                          <Text 
                            className={`text-base font-semibold text-center ${
                              isSelected 
                                ? 'text-blue-800' 
                                : isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {config.label}
                          </Text>
                          {/* <Text 
                            className={`text-sm mt-1 text-center ${
                              isSelected 
                                ? 'text-blue-600' 
                                : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {config.description}
                          </Text> */}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Field */}
            <View className="mb-6">
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
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                contentContainerStyle={{ paddingHorizontal: 0 }}
              >
                <View className="flex-row gap-x-2">
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

            {/* Tags Field */}
            <View className="mb-2">
              <View className="flex-row items-center mb-3">
                <Hash size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Tags
                </Text>
                <Text className={`text-sm ml-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ({formData.tags.length}/10)
                </Text>
              </View>
              
              {/* Tag Input */}
              <View className="flex-row items-center gap-x-2 mb-3">
                <TextInput
                  value={currentTag}
                  onChangeText={setCurrentTag}
                  placeholder="Add a tag..."
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  className={`flex-1 border-2 rounded-xl px-4 py-3 text-base ${
                    errors.tags 
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
                  maxLength={20}
                  onSubmitEditing={addTag}
                />
                <Pressable
                  onPress={addTag}
                  disabled={!currentTag.trim() || formData.tags.length >= 10}
                  className={`px-4 py-3 rounded-xl ${
                    !currentTag.trim() || formData.tags.length >= 10
                      ? isDark ? 'bg-gray-700' : 'bg-gray-200'
                      : isDark ? 'bg-blue-500' : 'bg-blue-500'
                  }`}
                  style={({ pressed }) => ({
                    shadowColor: !currentTag.trim() || formData.tags.length >= 10 
                      ? 'transparent' 
                      : '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: pressed ? 0.1 : 0.2,
                    shadowRadius: 4,
                    elevation: pressed ? 1 : 3,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Text className={`font-medium ${
                    !currentTag.trim() || formData.tags.length >= 10
                      ? isDark ? 'text-gray-500' : 'text-gray-400'
                      : 'text-white'
                  }`}>
                    Add
                  </Text>
                </Pressable>
              </View>
              
              {/* Tag Display */}
              {formData.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <View 
                      key={index}
                      className={`flex-row items-center px-3 py-2 rounded-full border ${
                        isDark ? 'border-blue-600 bg-blue-900/30' : 'border-blue-300 bg-blue-50'
                      }`}
                    >
                      <Text className={`text-sm mr-2 ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        {tag}
                      </Text>
                      <Pressable onPress={() => removeTag(tag)}>
                        <Text className={isDark ? 'text-blue-400' : 'text-blue-600'}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              
              {errors.tags && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.tags}</Text>
                </View>
              )}
            </View>

            {/* User Assignment Field */}
            <View className="mb-4">
              <UserAssignmentDropdown
                selectedUserId={formData.assignedTo}
                onUserSelect={(userId, userName) => {
                  updateFormField('assignedTo', userId);
                }}
                placeholder="Select user to assign task"
                showLabel={true}
                required={false}
              />
              
              {errors.assignedTo && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.assignedTo}</Text>
                </View>
              )}
            </View>

            {/* Estimated Hours Field */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Clock size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Estimated Hours
                </Text>
                <Text className={`text-sm ml-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  (Optional)
                </Text>
              </View>
              
              <TextInput
                value={formData.estimatedHours.toString()}
                onChangeText={(text) => {
                  const hours = parseFloat(text) || 0;
                  updateFormField('estimatedHours', hours);
                }}
                placeholder="0"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                className={`border-2 rounded-xl px-4 py-3 text-base ${
                  errors.estimatedHours 
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
              />
              
              {errors.estimatedHours && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.estimatedHours}</Text>
                </View>
              )}
            </View>

            {/* Due Date Selection */}
            <View className="">
              <View className="flex-row items-center mb-4">
                <Calendar size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-base font-semibold ml-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Due Date
                </Text>
                <Text className={`text-sm ml-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  (Optional)
                </Text>
              </View>
              
              {/* Date Picker Button */}
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className={`border-2 rounded-xl p-3 flex-row items-center justify-between ${
                  errors.dueDate 
                    ? 'border-red-400 bg-red-50' 
                    : isDark 
                      ? 'border-gray-500 bg-gray-700' 
                      : 'border-gray-300 bg-white'
                }`}
                style={({ pressed }) => ({
                  shadowColor: isDark ? '#000000' : '#000000',
                  shadowOffset: { width: 0, height: pressed ? 1 : 4 },
                  shadowOpacity: isDark ? 0.4 : 0.15,
                  shadowRadius: pressed ? 2 : 8,
                  elevation: pressed ? 2 : 6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <View className="flex-row items-center flex-1">
                  <Calendar size={22} color={
                    errors.dueDate 
                      ? '#EF4444' 
                      : isDark ? '#60A5FA' : '#3B82F6'
                  } />
                  <Text className={`ml-3 text-base font-medium ${
                    formData.dueDate 
                      ? (isDark ? 'text-white' : 'text-gray-900')
                      : (isDark ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'Select due date'}
                  </Text>
                </View>
                <View className={`w-2 h-2 rounded-full ${
                  formData.dueDate 
                    ? (isDark ? 'bg-blue-400' : 'bg-blue-500')
                    : (isDark ? 'bg-gray-600' : 'bg-gray-300')
                }`} />
              </Pressable>
              
              {errors.dueDate && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.dueDate}</Text>
                </View>
              )}
              
              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={formData.dueDate ? new Date(formData.dueDate) : new Date()}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </ScrollView>

          {/* Enhanced Fixed Form Actions */}
          <View 
            className={`absolute bottom-0 left-0 right-0 px-6 py-4 border-t ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              paddingBottom: Platform.OS === 'ios' ? 34 : 20 // Account for home indicator
            }}
          >
            <View className="flex-row gap-x-4">
              {/* Enhanced Cancel Button */}
              <Pressable
                onPress={handleModalClose}
                className={`flex-1 py-2 rounded-xl border-2 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-300 bg-gray-100'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
                disabled={isSubmitting || isLoading}
              >
                <Text className={`text-center font-bold text-base ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </Pressable>

              {/* Enhanced Submit Button */}
              <Pressable
                onPress={handleSubmit}
                className={`flex-1 py-4 rounded-xl ${
                  (isSubmitting || isLoading)
                    ? 'bg-blue-400' 
                    : 'bg-blue-500'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed && !(isSubmitting || isLoading) ? 0.9 : 1,
                  transform: [{ scale: pressed && !(isSubmitting || isLoading) ? 0.98 : 1 }],
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                })}
                disabled={isSubmitting || isLoading}
              >
                <View className="flex-row items-center justify-center">
                  {(isSubmitting || isLoading) ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Save size={20} color="#FFFFFF" />
                  )}
                  <Text className="text-white font-bold ml-2 text-base">
                    {(isSubmitting || isLoading)
                      ? 'Saving...' 
                      : editingTask ? 'Update Task' : 'Create Task'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

// Styles for the modal
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
});

export default TaskFormModal;