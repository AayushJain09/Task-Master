import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { LoginCredentials } from '@/types/auth.types';
import { VALIDATION_RULES } from '@/config/constants';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(VALIDATION_RULES.EMAIL_REGEX, 'Please enter a valid email'),
  password: z
    .string()
    .min(
      VALIDATION_RULES.PASSWORD_MIN_LENGTH,
      `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`
    ),
});

interface LoginFormProps {
  onSubmit: (data: LoginCredentials) => Promise<void>;
  loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading = false }) => {
  const { isDark } = useTheme();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFormSubmit = async (data: LoginCredentials) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getIconColor = () => isDark ? '#9CA3AF' : '#6B7280';

  return (
    <View className="w-full gap-y-4">
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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            leftIcon={<Lock size={20} color={getIconColor()} />}
            secureTextEntry
            autoComplete="password"
          />
        )}
      />

      <View className="pt-2 mt-5">
        <Button
          title="Sign In"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          disabled={!isValid}
          fullWidth
          size="lg"
          variant="secondary"
        />
      </View>

    </View>
  );
};

export default LoginForm;
