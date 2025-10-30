import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
export const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 1000);
    }
  });

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaView className={`flex-1 border ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Stack screenOptions={{headerShown: false }}>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaView>
    </View>
  );
};

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
