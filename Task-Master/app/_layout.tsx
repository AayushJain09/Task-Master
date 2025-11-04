import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();
export const MainLayout = () => {
  const { isLoading } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 1000);
    }
  }, [isLoading]);

  return (
    <>
      <SafeAreaView className={`flex-1 border ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Stack screenOptions={{headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaView>
    </>
  );
};

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
          <MainLayout />
          </GestureHandlerRootView>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
