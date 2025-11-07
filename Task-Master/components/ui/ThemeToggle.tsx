import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, isDark, isLoading, setTheme } = useTheme();

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const containerSize = size === 'sm' ? 'p-2' : size === 'md' ? 'p-3' : 'p-4';

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    {
      mode: 'light',
      icon: <Sun size={iconSize} color={isDark ? '#F59E0B' : '#F59E0B'} />,
      label: 'Light',
    },
    {
      mode: 'dark',
      icon: <Moon size={iconSize} color={isDark ? '#3B82F6' : '#3B82F6'} />,
      label: 'Dark',
    },
  ];

  const currentThemeIndex = themeOptions.findIndex(option => option.mode === theme);

  const handleThemeChange = useCallback(() => {
    if (isLoading) return;
    
    try {
      const nextIndex = (currentThemeIndex + 1) % themeOptions.length;
      setTheme(themeOptions[nextIndex].mode);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  }, [isLoading, currentThemeIndex, themeOptions, setTheme]);

  const currentOption = themeOptions[currentThemeIndex];

  return (
    <Pressable
      onPress={handleThemeChange}
      disabled={isLoading}
      className={`
        ${containerSize}
        rounded-lg
        ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
        ${isDark ? 'border-gray-600' : 'border-gray-200'}
        border
        ${showLabel ? 'flex-row items-center gap-x-3' : 'items-center justify-center'}
        ${isLoading ? 'opacity-50' : ''}
      `}
    >
      <View className="items-center justify-center">
        {currentOption.icon}
      </View>
      
      {showLabel && (
        <View className="flex-1">
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Theme
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentOption.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Alternative segmented control style theme selector
interface ThemeSegmentedControlProps {
  className?: string;
}

export function ThemeSegmentedControl({ className = '' }: ThemeSegmentedControlProps) {
  const { theme, isDark, isLoading, setTheme } = useTheme();
  const lastChangeTime = useRef<number>(0);
  
  // Debounced theme setter to prevent rapid consecutive changes
  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    if (isLoading) return;
    
    const now = Date.now();
    
    // Prevent rapid changes (minimum 200ms between changes)
    if (now - lastChangeTime.current < 200) {
      return;
    }
    
    lastChangeTime.current = now;
    
    try {
      setTheme(newTheme);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  }, [setTheme, isLoading]);

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    {
      mode: 'light',
      icon: <Sun size={16} />,
      label: 'Light',
    },
    {
      mode: 'dark',
      icon: <Moon size={16} />,
      label: 'Dark',
    },
  ];

  return (
    <View className={`
      flex-row
      ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
      rounded-lg
      p-1
      ${className}
      ${isLoading ? 'opacity-60' : ''}
    `}>
      {themeOptions.map((option) => {
        const isSelected = theme === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => handleThemeChange(option.mode)}
            disabled={isLoading}
            className={`
              flex-1
              flex-row
              items-center
              justify-center
              py-2
              px-3
              rounded-md
              gap-x-2
              ${isSelected 
                ? isDark 
                  ? 'bg-gray-600' 
                  : 'bg-white shadow-sm' 
                : ''
              }
            `}
          >
            <View className={isSelected 
              ? isDark 
                ? 'text-white' 
                : 'text-gray-900'
              : isDark 
                ? 'text-gray-400' 
                : 'text-gray-500'
            }>
              {option.icon}
            </View>
            <Text className={`
              text-lg
              font-medium
              ${isSelected 
                ? isDark 
                  ? 'text-white' 
                  : 'text-gray-900'
                : isDark 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }
            `}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}