/**
 * Input Component
 * 
 * A comprehensive input component with the following features:
 * - Dark/light mode theme support with proper contrast
 * - Multiple variants (outlined, filled, default)
 * - Built-in password visibility toggle
 * - Left and right icon support
 * - Error and hint message display
 * - Focus state management with visual feedback
 * - Accessibility features and proper labeling
 * - Responsive design with customizable width
 * 
 * Variants:
 * - outlined: Border-focused design with theme-aware colors
 * - filled: Filled background with subtle borders
 * - default: Simple border with background
 * 
 * States:
 * - Default: Normal state with theme colors
 * - Focused: Enhanced border/background for active state
 * - Error: Red accent colors for validation errors
 * - Disabled: Muted colors for disabled inputs
 * 
 * @component
 * @example
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   leftIcon={<Mail size={20} />}
 *   error={errors.email}
 *   variant="outlined"
 * />
 */

import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props interface for Input component
 * Extends React Native TextInputProps with additional features
 */
interface InputProps extends TextInputProps {
  /** Label text displayed above the input field */
  label?: string;
  /** Error message displayed below the input (overrides hint) */
  error?: string;
  /** Hint text displayed below the input when no error */
  hint?: string;
  /** Icon component displayed on the left side */
  leftIcon?: React.ReactNode;
  /** Icon component displayed on the right side (when not password field) */
  rightIcon?: React.ReactNode;
  /** Whether input should take full width of container */
  fullWidth?: boolean;
  /** Visual variant of the input component */
  variant?: 'default' | 'outlined' | 'filled';
}

/**
 * Input Component
 * 
 * Comprehensive input field with theming, validation, and accessibility features.
 * Supports multiple variants and includes built-in password visibility toggle.
 * 
 * @param {InputProps} props - Component props
 * @param {React.Ref<TextInput>} ref - Forwarded ref to TextInput
 */
const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = 'outlined',
      secureTextEntry,
      className,
      ...props
    },
    ref
  ) => {
    // ================================
    // HOOKS AND STATE
    // ================================
    
    /** Theme context for dark/light mode styling */
    const { isDark } = useTheme();
    
    /** Password visibility state for secure text entries */
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    
    /** Focus state for enhanced visual feedback */
    const [isFocused, setIsFocused] = useState(false);

    // ================================
    // STYLING HELPERS
    // ================================
    
    /**
     * Get variant-specific styles with theme support
     * 
     * Handles different input variants and applies appropriate
     * theme-aware colors for backgrounds, borders, and states.
     * 
     * @returns {string} Tailwind CSS classes for the input container
     */
    const getVariantStyles = (): string => {
      const baseStyles = 'rounded-lg';

      switch (variant) {
        case 'outlined':
          return `${baseStyles} border-2 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } ${
            error
              ? isDark ? 'border-red-400' : 'border-red-500'
              : isFocused
              ? isDark ? 'border-blue-400' : 'border-blue-500'
              : isDark ? 'border-gray-600' : 'border-gray-300'
          }`;
        case 'filled':
          return `${baseStyles} ${
            isDark 
              ? 'bg-gray-700 border border-gray-600' 
              : 'bg-gray-100 border border-gray-200'
          }`;
        default:
          return `${baseStyles} border ${
            isDark 
              ? 'border-gray-600 bg-gray-800' 
              : 'border-gray-300 bg-white'
          }`;
      }
    };

    /**
     * Get theme-appropriate text color for labels
     * @returns {string} Tailwind CSS color class
     */
    const getLabelColor = (): string => {
      return isDark ? 'text-gray-200' : 'text-gray-700';
    };

    /**
     * Get theme-appropriate text color for input text
     * @returns {string} Tailwind CSS color class
     */
    const getTextColor = (): string => {
      return isDark ? 'text-gray-100' : 'text-gray-900';
    };

    /**
     * Get theme-appropriate placeholder color
     * @returns {string} Hex color for placeholder text
     */
    const getPlaceholderColor = (): string => {
      return isDark ? '#6B7280' : '#9CA3AF';
    };

    /**
     * Get theme-appropriate color for hint text
     * @returns {string} Tailwind CSS color class
     */
    const getHintColor = (): string => {
      return isDark ? 'text-gray-400' : 'text-gray-500';
    };

    /**
     * Get theme-appropriate color for error text
     * @returns {string} Tailwind CSS color class
     */
    const getErrorColor = (): string => {
      return isDark ? 'text-red-400' : 'text-red-500';
    };

    /**
     * Get theme-appropriate color for password toggle icons
     * @returns {string} Hex color for eye icons
     */
    const getEyeIconColor = (): string => {
      return isDark ? '#9CA3AF' : '#6B7280';
    };

    // ================================
    // EVENT HANDLERS
    // ================================
    
    /**
     * Toggle password visibility for secure text entries
     * Switches between showing and hiding password characters
     */
    const togglePasswordVisibility = () => {
      setIsSecure(!isSecure);
    };

    /**
     * Handle focus event
     * Updates focus state for visual feedback
     */
    const handleFocus = () => {
      setIsFocused(true);
      props.onFocus?.();
    };

    /**
     * Handle blur event  
     * Updates focus state when input loses focus
     */
    const handleBlur = () => {
      setIsFocused(false);
      props.onBlur?.();
    };

    // ================================
    // COMPONENT RENDER
    // ================================
    
    return (
      <View className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Input Label */}
        {label && (
          <Text className={`text-sm font-medium mb-2 ${getLabelColor()}`}>
            {label}
          </Text>
        )}

        {/* Input Container */}
        <View
          className={`
          ${getVariantStyles()}
          flex-row items-center px-3 py-3
          ${className || ''}
        `}
        >
          {/* Left Icon */}
          {leftIcon && <View className="mr-3">{leftIcon}</View>}

          {/* Text Input Field */}
          <TextInput
            ref={ref}
            className={`flex-1 text-base ${getTextColor()}`}
            secureTextEntry={isSecure}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={getPlaceholderColor()}
            {...props}
          />

          {/* Password Visibility Toggle */}
          {secureTextEntry && (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              className="ml-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={isSecure ? "Show password" : "Hide password"}
              accessibilityRole="button"
            >
              {isSecure ? (
                <EyeOff size={20} color={getEyeIconColor()} />
              ) : (
                <Eye size={20} color={getEyeIconColor()} />
              )}
            </TouchableOpacity>
          )}

          {/* Right Icon (only when not password field) */}
          {rightIcon && !secureTextEntry && (
            <View className="ml-3">{rightIcon}</View>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <Text className={`text-sm mt-1 ${getErrorColor()}`}>
            {error}
          </Text>
        )}

        {/* Hint Message (only shown when no error) */}
        {hint && !error && (
          <Text className={`text-sm mt-1 ${getHintColor()}`}>
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;