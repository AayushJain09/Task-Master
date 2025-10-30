import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useRouter } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { biometricService } from '@/services/biometric.service';
import { useTheme } from '@/context/ThemeContext';
import LoginForm from '@/components/forms/LoginForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LoginCredentials } from '@/types/auth.types';
import { APP_CONFIG } from '@/config/constants';

export default function LoginScreen() {
  const { login, loginWithBiometric, biometricEnabled, setupBiometric } = useAuth();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [canUseBiometric, setCanUseBiometric] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const capabilities = await biometricService.checkBiometricCapabilities();
      setCanUseBiometric(capabilities.hasHardware && capabilities.isEnrolled);
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCanUseBiometric(false);
    }
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      await login(credentials);
      
      // Check if user should be prompted for biometric setup
      if (canUseBiometric && !biometricEnabled) {
        setShowBiometricPrompt(true);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
      setShowBiometricPrompt(false);
      router.replace('/(tabs)/home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    router.replace('/(tabs)/home');
  };

  if (showBiometricPrompt) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 justify-center px-6">
          <Card variant="elevated" padding="lg">
            <View className="items-center">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                <Fingerprint size={40} color="#3B82F6" />
              </View>
              
              <Text className={`text-2xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Enable Biometric Login
              </Text>
              
              <Text className={`text-base text-center mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Set up biometric authentication for faster and more secure login on this device.
              </Text>
              
              <View className="w-full space-y-3">
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {APP_CONFIG.NAME.charAt(0)}
              </Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Sign in to your account to continue
            </Text>
          </View>

          {/* Biometric Login Option */}
          {biometricEnabled && canUseBiometric && (
            <Card variant="elevated" padding="lg" className="mb-4">
              <View className="items-center">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
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

          {/* Login Form */}
          <Card variant="elevated" padding="lg">
            <LoginForm onSubmit={handleLogin} loading={isLoading} />
          </Card>

          {/* Register Link */}
          <View className="items-center mt-6">
            <Text className="text-base text-gray-600">
              Don't have an account?{' '}
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Sign up</Text>
                </TouchableOpacity>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
