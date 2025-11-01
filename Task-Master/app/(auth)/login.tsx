/**
 * Login Screen Component
 * 
 * This component provides the user login interface with the following features:
 * - Standard email/password authentication
 * - Biometric authentication (fingerprint/face ID) when available
 * - Dark/light mode theme support
 * - Automatic biometric setup prompt after successful login
 * - Comprehensive error handling and loading states
 * - Responsive design with keyboard avoidance
 * 
 * Authentication Flow:
 * 1. User enters credentials OR uses biometric login
 * 2. Authentication is processed through AuthContext
 * 3. On success, user is either prompted for biometric setup or redirected to home
 * 4. Errors are displayed with user-friendly messages
 * 
 * @component
 * @example
 * // Used in auth routing - typically at /(auth)/login
 * <LoginScreen />
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router, } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';

// Context and services
import { useAuth } from '@/context/AuthContext';
import { biometricService } from '@/services/biometric.service';
import { useTheme } from '@/context/ThemeContext';

// Components
import LoginForm from '@/components/forms/LoginForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Types and configuration
import { LoginCredentials } from '@/types/auth.types';
import { APP_CONFIG } from '@/config/constants';

/**
 * Login Screen Component
 * 
 * Handles user authentication with email/password and biometric options.
 * Integrates with AuthContext for authentication state management.
 */
export default function LoginScreen() {
  // Authentication and theme context
  const { login, loginWithBiometric, biometricEnabled, setupBiometric } = useAuth();
  const { isDark } = useTheme();

  // Component state management
  const [isLoading, setIsLoading] = useState(false); // Loading state for authentication operations
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false); // Show biometric setup modal
  const [canUseBiometric, setCanUseBiometric] = useState(false); // Device biometric capability

  /**
   * Check device biometric capabilities on component mount
   * Determines if the device supports and has enrolled biometric authentication
   */
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  /**
   * Checks if biometric authentication is available on the device
   * Updates canUseBiometric state based on hardware and enrollment status
   */
  const checkBiometricAvailability = async () => {
    try {
      const capabilities = await biometricService.checkBiometricCapabilities();
      // Only enable if device has hardware AND user has enrolled biometrics
      setCanUseBiometric(capabilities.hasHardware && capabilities.isEnrolled);
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCanUseBiometric(false);
    }
  };

  /**
   * Handles standard email/password login
   * After successful login, prompts for biometric setup if device supports it
   * 
   * @param {LoginCredentials} credentials - User email and password
   * @throws {Error} Authentication errors from login service
   */
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      // Authenticate user through auth context
      await login(credentials);

      // Prompt for biometric setup if device supports it and user hasn't enabled it
      if (canUseBiometric && !biometricEnabled) {
        setShowBiometricPrompt(true);
      } else {
        // Direct navigation to home if biometrics not available or already enabled
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      // Re-throw error to be handled by LoginForm component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles biometric authentication login
   * Uses stored biometric token to authenticate user
   */
  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithBiometric();
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles biometric authentication setup
   * Prompts user to enable biometric login after successful credential login
   */
  const handleSetupBiometric = async () => {
    try {
      setIsLoading(true);
      await setupBiometric();

      Alert.alert(
        'Biometric Setup Complete',
        'You can now sign in using biometrics on future logins.',
        [
          {
            text: 'Continue',
            onPress: () => {
              setShowBiometricPrompt(false);
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Biometric Setup Failed', error.message);
      // Still navigate to home even if biometric setup fails
      setShowBiometricPrompt(false);
      router.replace('/(tabs)/home');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles skipping biometric setup
   * User chooses not to enable biometric authentication at this time
   */
  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    router.replace('/(tabs)/home');
  };

  /**
   * Biometric Setup Modal
   * Displayed after successful login if biometric is available but not enabled
   */
  if (showBiometricPrompt) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 justify-center px-6">
          <Card variant="elevated" padding="lg">
            <View className="items-center">
              {/* Biometric Icon */}
              <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                <Fingerprint size={40} color="#3B82F6" />
              </View>

              {/* Modal Title */}
              <Text className={`text-2xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                Enable Biometric Login
              </Text>

              {/* Modal Description */}
              <Text className={`text-base text-center mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                Set up biometric authentication for faster and more secure login on this device.
              </Text>

              {/* Action Buttons */}
              <View className="w-full gap-y-3">
                <Button
                  title="Enable Biometric Login"
                  onPress={handleSetupBiometric}
                  loading={isLoading}
                  variant="primary"
                  fullWidth
                />

                <Button
                  title="Skip for Now"
                  onPress={handleSkipBiometric}
                  variant="outline"
                  fullWidth
                />
              </View>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  /**
   * Main Login Screen
   * Displays login form with optional biometric login and theme-aware styling
   */
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-blue-50'
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
            paddingBottom: 100
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* App Header Section */}
          <View className="items-center mb-8">
            {/* App Logo/Icon */}
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-blue-600' : 'bg-blue-600'
              }`}>
              <Text className="text-white text-2xl font-bold">
                {APP_CONFIG.NAME.charAt(0)}
              </Text>
            </View>

            {/* Welcome Title */}
            <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              Welcome Back
            </Text>

            {/* Subtitle */}
            <Text className={`text-base text-center ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Sign in to your account to continue
            </Text>
          </View>

          {/* Biometric Login Section */}
          {/* Only show if user has biometric enabled AND device supports it */}
          {biometricEnabled && canUseBiometric && (
            <Card variant="elevated" padding="lg" className="mb-4">
              <View className="items-center">
                <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  Quick Sign In
                </Text>
                <Button
                  title="Sign in with Biometrics"
                  onPress={handleBiometricLogin}
                  loading={isLoading}
                  variant="outline"
                  leftIcon={<Fingerprint size={20} color="#3B82F6" />}
                  fullWidth
                />
              </View>
            </Card>
          )}

          {/* Login Form Section */}
          <Card variant="elevated" padding="lg">
            <LoginForm onSubmit={handleLogin} loading={isLoading} />
          </Card>

          {/* Registration Link Section */}
          <View className="flex-row items-center justify-center  gap-1 mt-6">
            <Text className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Don&apos;t have an account?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}