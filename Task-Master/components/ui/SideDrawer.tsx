import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import {
  Home,
  BarChart3,
  Settings,
  User,
  FileText,
  Menu,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

export interface DrawerOption {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color?: string;
}

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeOption: string;
  onOptionSelect: (optionId: string) => void;
  options?: DrawerOption[];
}

const defaultOptions: DrawerOption[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    color: '#3B82F6',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    color: '#10B981',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: FileText,
    color: '#F59E0B',
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    color: '#8B5CF6',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    color: '#6B7280',
  },
];

export default function SideDrawer({
  isOpen,
  onClose,
  activeOption,
  onOptionSelect,
  options = defaultOptions,
}: SideDrawerProps) {
  const { isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      
      // Reset all animations to starting position immediately
      slideAnim.setValue(-DRAWER_WIDTH);
      overlayOpacity.setValue(0);
      fadeAnim.setValue(0);
      
      // Start animations with a small delay to ensure reset is complete
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0.6,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start((finished) => {
          if (finished) {
            setIsAnimating(false);
          }
        });
      });
    } else if (isAnimating || slideAnim._value !== -DRAWER_WIDTH) {
      setIsAnimating(true);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 280,
          easing: Easing.bezier(0.55, 0.055, 0.675, 0.19),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start((finished) => {
        if (finished) {
          setIsAnimating(false);
        }
      });
    }
  }, [isOpen]);

  const handleOptionPress = (optionId: string) => {
    onOptionSelect(optionId);
    onClose();
  };

  // Don't render if completely closed
  if (!isOpen && !isAnimating) {
    return null;
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: overlayOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          transform: [{ translateX: slideAnim }],
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: isDark ? 0.5 : 0.3,
          shadowRadius: 20,
          elevation: 16,
        }}
      >
        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-6 py-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
          style={{ paddingTop: 60 }} // Account for status bar
        >
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Menu
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <X size={20} color={isDark ? '#FFFFFF' : '#374151'} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <Animated.View 
          className="flex-1 px-2 py-4"
          style={{
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }}
        >
          {options.map((option, index) => {
            const IconComponent = option.icon;
            const isActive = activeOption === option.id;

            return (
              <Animated.View
                key={option.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  onPress={() => handleOptionPress(option.id)}
                  className={`flex-row items-center px-4 py-4 mx-2 rounded-xl mb-2 ${
                    isActive
                      ? isDark
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-blue-50 border border-blue-200'
                      : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                      isActive
                        ? 'bg-blue-600'
                        : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                    }`}
                  >
                    <IconComponent
                      size={20}
                      color={
                        isActive
                          ? '#FFFFFF'
                          : option.color || (isDark ? '#9CA3AF' : '#6B7280')
                      }
                    />
                  </View>
                  <Text
                    className={`text-base font-medium ${
                      isActive
                        ? isDark
                          ? 'text-blue-400'
                          : 'text-blue-600'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.title}
                  </Text>
                  {isActive && (
                    <View className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Footer */}
        <View
          className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <Text
            className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
          >
            Task Master v1.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// Toggle Button Component
interface DrawerToggleProps {
  onToggle: () => void;
  isOpen: boolean;
}

export function DrawerToggle({ onToggle, isOpen }: DrawerToggleProps) {
  const { isDark } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth rotation with spring effect
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handlePress = () => {
    // Add a subtle scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      activeOpacity={0.8}
    >
      <Animated.View 
        style={{ 
          transform: [
            { rotate: rotation },
            { scale: scaleAnim }
          ] 
        }}
      >
        <Menu size={24} color={isDark ? '#FFFFFF' : '#374151'} />
      </Animated.View>
    </TouchableOpacity>
  );
}