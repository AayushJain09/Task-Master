import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const { isDark } = useTheme();

  const getVariantStyles = (): string => {
    const baseStyles = isDark ? 'bg-gray-800' : 'bg-white';
    
    switch (variant) {
      case 'elevated':
        return `${baseStyles} rounded-xl ${isDark ? 'border border-gray-700' : 'shadow-lg'}`;
      case 'outlined':
        return `${baseStyles} rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`;
      default:
        return `${baseStyles} rounded-lg ${isDark ? 'border border-gray-700' : 'shadow-sm'}`;
    }
  };

  const getPaddingStyles = (): string => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  return (
    <View
      className={`
        ${getVariantStyles()}
        ${getPaddingStyles()}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;