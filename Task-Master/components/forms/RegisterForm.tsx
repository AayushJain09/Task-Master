/**
 * Register Form Component
 * 
 * This component provides a comprehensive user registration form with the following features:
 * - Complete form validation using Zod schema validation
 * - Real-time password strength indicator with visual feedback
 * - Dark/light mode theme support with proper contrast
 * - Accessible form controls with proper labeling
 * - Error handling and display for both field and global errors
 * - Responsive design with keyboard avoidance
 * - Auto-completion support for better UX
 * 
 * Form Fields:
 * - First Name: Required, alphabetic characters only
 * - Last Name: Required, alphabetic characters only  
 * - Email: Required, valid email format with regex validation
 * - Password: Required, minimum 8 chars with complexity requirements
 * - Confirm Password: Required, must match password exactly
 * 
 * Validation Rules:
 * - Names: 2-50 characters, letters only
 * - Email: Valid email format with comprehensive regex
 * - Password: Min 8 chars, uppercase, lowercase, number required
 * - Confirm: Must exactly match password field
 * 
 * @component
 * @example
 * <RegisterForm 
 *   onSubmit={handleRegister}
 *   loading={isLoading}
 *   error={errorMessage}
 * />
 */

import React, { useState, useMemo } from 'react';
import { View, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Lock,
  CircleCheck as CheckCircle,
} from 'lucide-react-native';

// Context and components
import { useTheme } from '@/context/ThemeContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import KeyboardAvoidingWrapper from '../ui/KeyboardAvoidingWrapper';

// Types and configuration
import { RegisterCredentials } from '@/types/auth.types';
import { VALIDATION_RULES } from '@/config/constants';

/**
 * Zod Schema for Registration Form Validation
 * 
 * Comprehensive validation schema that enforces:
 * - Name fields: Length constraints and alphabetic characters only
 * - Email: Proper email format with regex validation
 * - Password: Security requirements (length, case, numbers)
 * - Password confirmation: Exact match validation
 */
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(
        VALIDATION_RULES.NAME_MIN_LENGTH,
        `First name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`
      )
      .max(
        VALIDATION_RULES.NAME_MAX_LENGTH,
        `First name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
      )
      .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters'),
    lastName: z
      .string()
      .min(
        VALIDATION_RULES.NAME_MIN_LENGTH,
        `Last name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`
      )
      .max(
        VALIDATION_RULES.NAME_MAX_LENGTH,
        `Last name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
      )
      .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .regex(VALIDATION_RULES.EMAIL_REGEX, 'Please enter a valid email')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(
        VALIDATION_RULES.PASSWORD_MIN_LENGTH,
        `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`
      )
      .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Props interface for RegisterForm component
 */
interface RegisterFormProps {
  /** Function called when form is submitted with valid data */
  onSubmit: (data: RegisterCredentials) => Promise<void>;
  /** Loading state to show during form submission */
  loading?: boolean;
  /** Global error message to display above the form */
  error?: string | null;
}

/**
 * Register Form Component
 * 
 * Comprehensive registration form with validation, theming, and accessibility features.
 * Integrates with react-hook-form for form state management and Zod for validation.
 * 
 * @param {RegisterFormProps} props - Component props
 */
const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
}) => {
  // ================================
  // HOOKS AND STATE
  // ================================
  
  /** Theme context for dark/light mode styling */
  const { isDark } = useTheme();
  
  /** React Hook Form setup with Zod validation */
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Validate on every change for immediate feedback
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  /** Watch password field for strength calculation */
  const password = watch('password');

  // ================================
  // PASSWORD STRENGTH CALCULATION
  // ================================
  
  /**
   * Calculate password strength based on various criteria
   * 
   * Scoring system:
   * - Length >= 8 characters: +1 point
   * - Contains lowercase letter: +1 point  
   * - Contains uppercase letter: +1 point
   * - Contains number: +1 point
   * - Contains special character: +1 point
   * 
   * Score mapping:
   * - 0: No password entered
   * - 1: Very Weak (red)
   * - 2: Weak (orange) 
   * - 3: Fair (yellow)
   * - 4: Good (blue)
   * - 5: Strong (green)
   * 
   * @returns {Object} Password strength score, label, and theme-aware color
   */
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    
    // Character type checks
    if (/[a-z]/.test(password)) score++; // Lowercase
    if (/[A-Z]/.test(password)) score++; // Uppercase  
    if (/\d/.test(password)) score++;    // Numbers
    if (/[^a-zA-Z\d]/.test(password)) score++; // Special characters

    // Map score to label and theme-aware colors
    const strengthMap = {
      0: { label: '', color: '' },
      1: { label: 'Very Weak', color: isDark ? 'text-red-400' : 'text-red-600' },
      2: { label: 'Weak', color: isDark ? 'text-orange-400' : 'text-orange-600' },
      3: { label: 'Fair', color: isDark ? 'text-yellow-400' : 'text-yellow-600' },
      4: { label: 'Good', color: isDark ? 'text-blue-400' : 'text-blue-600' },
      5: { label: 'Strong', color: isDark ? 'text-green-400' : 'text-green-600' },
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  }, [password, isDark]);

  // ================================
  // EVENT HANDLERS
  // ================================
  
  /**
   * Handles form submission
   * 
   * Process:
   * 1. Call parent onSubmit function with form data
   * 2. Reset form on successful submission  
   * 3. Let parent handle errors (displayed via error prop)
   * 
   * @param {RegisterCredentials} data - Validated form data
   */
  const handleFormSubmit = async (data: RegisterCredentials) => {
    try {
      await onSubmit(data);
      reset(); // Clear form on success
    } catch (error: any) {
      // Error handling is done by parent component via error prop
      console.error('Registration form error:', error);
    }
  };

  // ================================
  // THEME-AWARE STYLING HELPERS
  // ================================
  
  /**
   * Get theme-appropriate icon color for form fields
   * @returns {string} Hex color for icons
   */
  const getIconColor = () => isDark ? '#9CA3AF' : '#6B7280';

  /**
   * Get theme-appropriate background color for password strength bars
   * @param {number} level - Strength level (1-5)
   * @param {number} currentScore - Current password score
   * @returns {string} Tailwind CSS class for background color
   */
  const getStrengthBarColor = (level: number, currentScore: number) => {
    if (level > currentScore) {
      return isDark ? 'bg-gray-600' : 'bg-gray-200';
    }
    
    // Active bar colors based on strength level
    const colors = {
      1: isDark ? 'bg-red-500' : 'bg-red-500',
      2: isDark ? 'bg-orange-500' : 'bg-orange-500', 
      3: isDark ? 'bg-yellow-500' : 'bg-yellow-500',
      4: isDark ? 'bg-blue-500' : 'bg-blue-500',
      5: isDark ? 'bg-green-500' : 'bg-green-500',
    };
    
    return colors[currentScore as keyof typeof colors] || (isDark ? 'bg-gray-600' : 'bg-gray-200');
  };

  // ================================
  // COMPONENT RENDER
  // ================================
  
  return (
    <KeyboardAvoidingWrapper className="p-4 w-full flex-1">
      <View className="w-full gap-y-4">
        
        {/* Global Error Display */}
        {/* Shows registration errors from parent component */}
        {error && (
          <View className={`border rounded-lg p-4 mb-4 ${
            isDark 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-red-50 border-red-200'
          }`}>
            <Text className={`text-sm font-medium ${
              isDark ? 'text-red-300' : 'text-red-800'
            }`}>
              Registration Failed
            </Text>
            <Text className={`text-sm mt-1 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`}>
              {error}
            </Text>
          </View>
        )}

        {/* First Name Field */}
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
              leftIcon={<User size={20} color={getIconColor()} />}
              autoCapitalize="words"
              autoComplete="given-name"
            />
          )}
        />

        {/* Last Name Field */}
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
              leftIcon={<User size={20} color={getIconColor()} />}
              autoCapitalize="words"
              autoComplete="family-name"
            />
          )}
        />

        {/* Email Field */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail size={20} color={getIconColor()} />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />

        {/* Password Field with Strength Indicator */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={20} color={getIconColor()} />}
                secureTextEntry
                autoComplete="password-new"
              />
              
              {/* Password Strength Indicator */}
              {/* Only show when user has started typing a password */}
              {password && password.length > 0 && (
                <View className="mt-2">
                  {/* Strength Bars */}
                  <View className="flex-row gap-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        className={`flex-1 h-1 rounded-full ${getStrengthBarColor(level, passwordStrength.score)}`}
                      />
                    ))}
                  </View>
                  
                  {/* Strength Label */}
                  {passwordStrength.label && (
                    <Text className={`text-xs ${passwordStrength.color}`}>
                      Password strength: {passwordStrength.label}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        />

        {/* Confirm Password Field */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<CheckCircle size={20} color={getIconColor()} />}
              secureTextEntry
              autoComplete="password-new"
            />
          )}
        />

        {/* Submit Button */}
        <View className="pt-2">
          <Button
            title="Create Account"
            onPress={handleSubmit(handleFormSubmit)}
            loading={loading}
            disabled={!isValid} // Only enable when all validations pass
            fullWidth
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

export default RegisterForm;