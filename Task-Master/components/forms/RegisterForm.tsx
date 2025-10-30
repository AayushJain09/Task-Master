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

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { RegisterCredentials } from '@/types/auth.types';
import { VALIDATION_RULES } from '@/config/constants';
import KeyboardAvoidingWrapper from '../ui/KeyboardAvoidingWrapper';

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

interface RegisterFormProps {
  onSubmit: (data: RegisterCredentials) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const strengthMap = {
      0: { label: '', color: '' },
      1: { label: 'Very Weak', color: 'text-red-600' },
      2: { label: 'Weak', color: 'text-orange-600' },
      3: { label: 'Fair', color: 'text-yellow-600' },
      4: { label: 'Good', color: 'text-blue-600' },
      5: { label: 'Strong', color: 'text-green-600' },
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  }, [password]);

  const handleFormSubmit = async (data: RegisterCredentials) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error: any) {
      // Error handling is now done by parent component
      console.error('Registration form error:', error);
    }
  };

  return (
    <KeyboardAvoidingWrapper className="p-4 w-full flex-1">
      <View className="w-full space-y-4">
        {/* Error Display */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 text-sm font-medium">
              Registration Failed
            </Text>
            <Text className="text-red-600 text-sm mt-1">{error}</Text>
          </View>
        )}
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
              leftIcon={<User size={20} color="#6B7280" />}
              autoCapitalize="words"
              autoComplete="given-name"
            />
          )}
        />

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
              leftIcon={<User size={20} color="#6B7280" />}
              autoCapitalize="words"
              autoComplete="family-name"
            />
          )}
        />

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
              leftIcon={<Mail size={20} color="#6B7280" />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />

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
                leftIcon={<Lock size={20} color="#6B7280" />}
                secureTextEntry
                autoComplete="password-new"
              />
              {/* Password Strength Indicator */}
              {password && password.length > 0 && (
                <View className="mt-2">
                  <View className="flex-row space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        className={`flex-1 h-1 rounded-full ${
                          level <= passwordStrength.score
                            ? passwordStrength.score === 1
                              ? 'bg-red-500'
                              : passwordStrength.score === 2
                              ? 'bg-orange-500'
                              : passwordStrength.score === 3
                              ? 'bg-yellow-500'
                              : passwordStrength.score === 4
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </View>
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
              leftIcon={<CheckCircle size={20} color="#6B7280" />}
              secureTextEntry
              autoComplete="password-new"
            />
          )}
        />

        <View className="pt-2">
          <Button
            title="Create Account"
            onPress={handleSubmit(handleFormSubmit)}
            loading={loading}
            disabled={!isValid}
            fullWidth
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

export default RegisterForm;
