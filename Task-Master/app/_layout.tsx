import { useEffect, memo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
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

  if (themeLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        {children}
      </SafeAreaView>
    );
  }

  const gradientColors = isDark ? ['#020617', '#0B1120', '#111827'] : ['#F8FAFC', '#EEF2FF', '#FFFFFF'];

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 4 }}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
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
