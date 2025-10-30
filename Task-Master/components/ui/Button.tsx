/**
 * Button Component
 * 
 * A comprehensive button component with the following features:
 * - Dark/light mode theme support with proper contrast
 * - Multiple variants (primary, secondary, outline, ghost)
 * - Multiple sizes (sm, md, lg) with appropriate spacing
 * - Built-in loading state with activity indicator
 * - Left and right icon support with proper spacing
 * - Full width option for responsive design
 * - Accessibility features and proper touch feedback
 * - Disabled state handling with visual feedback
 * 
 * Variants:
 * - primary: Main action button with brand colors
 * - secondary: Secondary action with muted colors
 * - outline: Bordered button with transparent background
 * - ghost: Minimal button with hover/press effects
 * 
 * States:
 * - Default: Normal interactive state
 * - Loading: Shows activity indicator, disables interaction
 * - Disabled: Muted appearance, no interaction
 * - Pressed: Visual feedback during touch
 * 
 * @component
 * @example
 * <Button
 *   title="Submit"
 *   variant="primary"
 *   loading={isLoading}
 *   leftIcon={<Check size={20} />}
 *   onPress={handleSubmit}
 * />
 */

import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props interface for Button component
 * Extends React Native TouchableOpacityProps with additional features
 */
interface ButtonProps extends TouchableOpacityProps {
  /** Button text content */
  title: string;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Size variant affecting padding and text size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state showing activity indicator */
  loading?: boolean;
  /** Icon displayed on the left side */
  leftIcon?: ReactNode;
  /** Icon displayed on the right side */
  rightIcon?: ReactNode;
  /** Whether button should take full width of container */
  fullWidth?: boolean;
}

/**
 * Button Component
 * 
 * Comprehensive button with theming, loading states, and accessibility features.
 * Supports multiple variants and sizes with proper theme-aware styling.
 * 
 * @param {ButtonProps} props - Component props
 */
const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  ...props
}) => {
  // ================================
  // HOOKS AND STATE
  // ================================
  
  /** Theme context for dark/light mode styling */
  const { isDark } = useTheme();
  
  /** Combined disabled state from prop and loading */
  const isDisabled = disabled || loading;

  // ================================
  // STYLING HELPERS
  // ================================
  
  /**
   * Get variant-specific styles with theme support
   * 
   * Handles different button variants and applies appropriate
   * theme-aware colors for backgrounds, borders, and states.
   * 
   * @returns {string} Tailwind CSS classes for button container
   */
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return isDark 
          ? 'bg-blue-600 active:bg-blue-700' 
          : 'bg-blue-600 active:bg-blue-700';
      case 'secondary':
        return isDark 
          ? 'bg-gray-600 active:bg-gray-700' 
          : 'bg-gray-600 active:bg-gray-700';
      case 'outline':
        return isDark 
          ? 'bg-transparent border-2 border-blue-400 active:bg-blue-900/20' 
          : 'bg-transparent border-2 border-blue-600 active:bg-blue-50';
      case 'ghost':
        return isDark 
          ? 'bg-transparent active:bg-gray-700' 
          : 'bg-transparent active:bg-gray-100';
      default:
        return isDark 
          ? 'bg-blue-600 active:bg-blue-700' 
          : 'bg-blue-600 active:bg-blue-700';
    }
  };

  /**
   * Get size-specific padding and border radius styles
   * @returns {string} Tailwind CSS classes for button sizing
   */
  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 rounded-md';
      case 'md':
        return 'px-4 py-3 rounded-lg';
      case 'lg':
        return 'px-6 py-4 rounded-xl';
      default:
        return 'px-4 py-3 rounded-lg';
    }
  };

  /**
   * Get variant-specific text colors with theme support
   * @returns {string} Tailwind CSS color classes for button text
   */
  const getTextVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white'; // Always white on colored backgrounds
      case 'outline':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'ghost':
        return isDark ? 'text-gray-200' : 'text-gray-700';
      default:
        return 'text-white';
    }
  };

  /**
   * Get size-specific text styles
   * @returns {string} Tailwind CSS classes for text sizing
   */
  const getTextSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-sm font-medium';
      case 'md':
        return 'text-base font-semibold';
      case 'lg':
        return 'text-lg font-semibold';
      default:
        return 'text-base font-semibold';
    }
  };

  /**
   * Get theme-appropriate loading indicator color
   * @returns {string} Hex color for ActivityIndicator
   */
  const getLoadingColor = (): string => {
    switch (variant) {
      case 'outline':
        return isDark ? '#60A5FA' : '#2563eb'; // Blue-400 / Blue-600
      case 'ghost':
        return isDark ? '#E5E7EB' : '#374151'; // Gray-200 / Gray-700
      case 'primary':
      case 'secondary':
      default:
        return '#ffffff'; // White for colored backgrounds
    }
  };

  // ================================
  // COMPONENT RENDER
  // ================================
  
  return (
    <TouchableOpacity
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        flex-row items-center justify-center
        ${className || ''}
      `}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={loading ? `${title} loading` : title}
      {...props}
    >
      {/* Loading Indicator */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
          className="mr-2"
        />
      )}
      
      {/* Left Icon (only when not loading) */}
      {!loading && leftIcon && <>{leftIcon}</>}
      
      {/* Button Text */}
      <Text
        className={`
          ${getTextVariantStyles()}
          ${getTextSizeStyles()}
          ${leftIcon || rightIcon || loading ? 'mx-1' : ''}
        `}
      >
        {title}
      </Text>
      
      {/* Right Icon (only when not loading) */}
      {!loading && rightIcon && <>{rightIcon}</>}
    </TouchableOpacity>
  );
};

export default Button;