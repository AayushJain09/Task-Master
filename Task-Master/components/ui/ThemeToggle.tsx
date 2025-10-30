import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, isDark, setTheme } = useTheme();

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
    {
      mode: 'system',
      icon: <Monitor size={iconSize} color={isDark ? '#6B7280' : '#6B7280'} />,
      label: 'System',
    },
  ];

  const currentThemeIndex = themeOptions.findIndex(option => option.mode === theme);

  const handleThemeChange = () => {
    const nextIndex = (currentThemeIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].mode);
  };

  const currentOption = themeOptions[currentThemeIndex];

  return (
    <TouchableOpacity
      onPress={handleThemeChange}
      className={`
        ${containerSize}
        rounded-lg
        ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
        ${isDark ? 'border-gray-600' : 'border-gray-200'}
        border
        ${showLabel ? 'flex-row items-center space-x-3' : 'items-center justify-center'}
      `}
      activeOpacity={0.7}
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
    </TouchableOpacity>
  );
}

// Alternative segmented control style theme selector
interface ThemeSegmentedControlProps {
  className?: string;
}

export function ThemeSegmentedControl({ className = '' }: ThemeSegmentedControlProps) {
  const { theme, isDark, setTheme } = useTheme();

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
    {
      mode: 'system',
      icon: <Monitor size={16} />,
      label: 'Auto',
    },
  ];

  return (
    <View className={`
      flex-row
      ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
      rounded-lg
      p-1
      ${className}
    `}>
      {themeOptions.map((option) => {
        const isSelected = theme === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            onPress={() => setTheme(option.mode)}
            className={`
              flex-1
              flex-row
              items-center
              justify-center
              py-2
              px-3
              rounded-md
              space-x-2
              ${isSelected 
                ? isDark 
                  ? 'bg-gray-600' 
                  : 'bg-white shadow-sm' 
                : ''
              }
            `}
            activeOpacity={0.7}
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
              text-sm
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
}