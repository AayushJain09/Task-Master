import { useEffect, memo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../global.css';

import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

SplashScreen.preventAutoHideAsync();
// Theme-aware wrapper component
const ThemedSafeAreaView = memo(({ children }: { children: React.ReactNode }) => {
  const { isDark, isLoading: themeLoading } = useTheme();
  
  // Show loading state while theme is initializing
  if (themeLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        {children}
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className={`flex-1 border ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {children}
    </SafeAreaView>
  );
});

ThemedSafeAreaView.displayName = 'ThemedSafeAreaView';

// Theme-aware status bar component
const ThemedStatusBar = memo(() => {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
});

ThemedStatusBar.displayName = 'ThemedStatusBar';

// Splash screen handler
const SplashScreenHandler = memo(() => {
  const { isLoading: authLoading } = useAuth();
  const { isLoading: themeLoading } = useTheme();
  
  useEffect(() => {
    // Wait for both auth and theme to finish loading
    if (!authLoading && !themeLoading) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 1000);
    }
  }, [authLoading, themeLoading]);
  
  return null;
});

SplashScreenHandler.displayName = 'SplashScreenHandler';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ThemedSafeAreaView>
              <SplashScreenHandler />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <ThemedStatusBar />
            </ThemedSafeAreaView>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
