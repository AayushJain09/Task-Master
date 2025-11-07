import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate if dark mode should be active
  const isDark = theme === 'dark';

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      setIsLoading(true);
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to default theme on error
      setThemeState('dark');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    // Prevent theme changes while loading or changing
    if (isChangingTheme || isLoading) return;
    
    // Validate theme value
    if (!['light', 'dark'].includes(newTheme)) {
      console.error('Invalid theme value:', newTheme);
      return;
    }
    
    try {
      setIsChangingTheme(true);
      
      // Set theme state immediately for UI responsiveness
      setThemeState(newTheme);
      
      // Save to storage asynchronously
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Revert theme state on save error
      setThemeState(theme);
    } finally {
      // Add a small delay to prevent rapid changes
      setTimeout(() => {
        setIsChangingTheme(false);
      }, 150);
    }
  }, [isChangingTheme, isLoading, theme]);

  const toggleTheme = useCallback(() => {
    // Don't toggle if still loading or changing
    if (isLoading || isChangingTheme) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme, isLoading, isChangingTheme]);

  const value: ThemeContextType = useMemo(() => ({
    theme,
    isDark,
    isLoading,
    setTheme,
    toggleTheme,
  }), [theme, isDark, isLoading, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Provide a fallback instead of throwing to prevent app crashes
    console.error('useTheme must be used within a ThemeProvider. Using fallback values.');
    return {
      theme: 'dark',
      isDark: true,
      isLoading: false,
      setTheme: () => {
        console.warn('setTheme called outside of ThemeProvider context');
      },
      toggleTheme: () => {
        console.warn('toggleTheme called outside of ThemeProvider context');
      },
    };
  }
  return context;
}

// Custom hook for theme-aware styles
export function useThemeStyles() {
  const { isDark } = useTheme();
  
  return {
    // Background colors
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      tertiary: isDark ? 'bg-gray-700' : 'bg-gray-100',
      card: isDark ? 'bg-gray-800' : 'bg-white',
    },
    // Text colors
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    // Border colors
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      secondary: isDark ? 'border-gray-600' : 'border-gray-300',
    },
    // Input colors
    input: {
      bg: isDark ? 'bg-gray-700' : 'bg-white',
      border: isDark ? 'border-gray-600' : 'border-gray-300',
      text: isDark ? 'text-white' : 'text-gray-900',
      placeholder: isDark ? 'placeholder-gray-400' : 'placeholder-gray-500',
    },
    // Button colors
    button: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      secondary: isDark ? 'bg-gray-600' : 'bg-gray-200',
      text: isDark ? 'text-white' : 'text-gray-900',
    },
  };
}