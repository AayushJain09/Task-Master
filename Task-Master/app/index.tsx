import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

/**
 * Root Index Component
 * 
 * This is the entry point of the app that handles initial navigation
 * based on the user's authentication status. It acts as a router
 * that directs users to the appropriate screens.
 * 
 * Navigation Logic:
 * - If loading: Show loading spinner
 * - If authenticated: Redirect to main app (tabs)
 * - If not authenticated: Redirect to login
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator 
          size="large" 
          color={isDark ? '#3B82F6' : '#1D4ED8'} 
        />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    // User is logged in, redirect to main app
    return <Redirect href="/(tabs)/home" />;
  } else {
    // User is not logged in, redirect to login
    return <Redirect href="/(auth)/login" />;
  }
}