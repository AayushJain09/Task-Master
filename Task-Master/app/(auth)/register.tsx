/**
 * Register Screen Component
 * 
 * This component provides the user registration interface with the following features:
 * - User account creation with email, password, and personal information
 * - Password confirmation validation
 * - Dark/light mode theme support
 * - Comprehensive error handling and loading states
 * - Responsive design with keyboard avoidance
 * - Automatic login and navigation after successful registration
 * 
 * Registration Flow:
 * 1. User fills out registration form with required fields
 * 2. Client-side validation ensures password confirmation matches
 * 3. Registration request is processed through AuthContext
 * 4. On success, user is automatically logged in and redirected to home
 * 5. Errors are displayed with specific validation messages
 * 
 * @component
 * @example
 * // Used in auth routing - typically at /(auth)/register
 * <RegisterScreen />
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';

// Context and components
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import RegisterForm from '@/components/forms/RegisterForm';
import Card from '@/components/ui/Card';

// Types and configuration
import { RegisterCredentials } from '@/types/auth.types';
import { APP_CONFIG } from '@/config/constants';

/**
 * Register Screen Component
 * 
 * Handles user account creation with comprehensive validation and error handling.
 * Integrates with AuthContext for registration and automatic authentication.
 */
export default function RegisterScreen() {
  // Authentication context and theme
  const { register } = useAuth();
  const { isDark } = useTheme();
  
  // Component state management
  const [isLoading, setIsLoading] = useState(false); // Loading state for registration operation
  const [error, setError] = useState<string | null>(null); // Global error state for registration

  /**
   * Handles user registration
   * Processes registration form data and handles success/error scenarios
   * 
   * @param {RegisterCredentials} credentials - User registration data including email, password, names
   * @throws {Error} Registration errors from auth service (handled internally)
   */
  const handleRegister = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      // Process registration through auth context
      await register(credentials);
      
      // Navigate to home on successful registration (user is automatically logged in)
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Registration error:', error);
      // Set error message for display to user
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Main Registration Screen
   * Displays registration form with theme-aware styling and proper keyboard handling
   */
  return (
    <View className={`flex-1 ${
      isDark ? 'bg-gray-900' : 'bg-green-50'
    }`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            paddingHorizontal: 24, 
            paddingVertical: 32, 
            paddingBottom: 20 
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* App Header Section */}
          <View className="items-center mb-8">
            {/* App Logo/Icon */}
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDark ? 'bg-green-600' : 'bg-green-600'
            }`}>
              <Text className="text-white text-2xl font-bold">
                {APP_CONFIG.NAME.charAt(0)}
              </Text>
            </View>
            
            {/* Registration Title */}
            <Text className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Account
            </Text>
            
            {/* Subtitle */}
            <Text className={`text-base text-center ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join us to get started with your journey
            </Text>
          </View>

          {/* Registration Form Section */}
          <Card variant="elevated" padding="lg">
            <RegisterForm 
              onSubmit={handleRegister} 
              loading={isLoading} 
              error={error} 
            />
          </Card>

          {/* Login Link Section */}
          <View className="flex-row justify-center gap-1 items-center mt-6">
            <Text className={`text-base ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Already have an account?{' '}
            </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className={`font-semibold ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`}>
                    Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}