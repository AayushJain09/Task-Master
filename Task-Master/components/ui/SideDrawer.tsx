import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Easing,
  ScrollView,
  type ColorValue,
} from 'react-native';
import {
  Home,
  FileText,
  Bell,
  Menu,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

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
    id: 'tasks',
    title: 'Tasks',
    icon: FileText,
    color: '#F59E0B',
  },
  {
    id: 'reminders',
    title: 'Reminders',
    icon: Bell,
    color: '#10B981',
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
  const { user } = useAuth();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const drawerGradient: readonly [ColorValue, ColorValue, ...ColorValue[]] = isDark
    ? (['#020617', '#0F172A', '#111827'] as const)
    : (['#F8FAFC', '#FFFFFF'] as const);
  const userAccents = isDark ? ['#312E81', '#1E3A8A'] : ['#DBEAFE', '#BFDBFE'];

  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.fullName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

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
    } else if (!isOpen) {
      setIsAnimating(true);
      
      // EXACT REVERSE of opening animation
      Animated.parallel([
        // Slide drawer out (reverse of slide in)
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 350, // Same as opening
          easing: Easing.bezier(0.55, 0.055, 0.675, 0.19), // Reverse easing curve
          useNativeDriver: true,
        }),
        // Fade overlay (reverse)
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 350, // Same as opening
          easing: Easing.in(Easing.quad), // Reverse of Easing.out
          useNativeDriver: true,
        }),
        // Fade content (exact reverse timing)
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400, // Same as opening
          delay: 0, // No delay for reverse (opening had 100ms delay)
          easing: Easing.in(Easing.quad), // Reverse of Easing.out
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
          backgroundColor: 'transparent',
          transform: [{ translateX: slideAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 18,
        }}
      >
        <LinearGradient colors={drawerGradient} style={{ flex: 1, paddingTop: 48 }}>
          <DrawerAccent color={isDark ? '#1D4ED8' : '#BFDBFE'} size={220} style={{ right: -60, top: -80 }} />
          <DrawerAccent color={isDark ? '#0EA5E9' : '#A5F3FC'} size={160} style={{ left: -40, bottom: -120 }} />

          {/* Header */}
          <Animated.View
            style={{
              paddingHorizontal: 24,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.4)',
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: userAccents[0],
                    borderWidth: 1,
                    borderColor: userAccents[1],
                  }}
                >
                  <Text className="text-white text-2xl font-bold">{initials}</Text>
                </View>
                <View className="ml-3">
                  <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.fullName || 'User'}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email || 'No email available'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  padding: 10,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.9)',
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['45deg', '0deg'],
                        }),
                      },
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <X size={20} color={isDark ? '#FFFFFF' : '#1F2937'} />
                </Animated.View>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Role', value: user?.role ?? 'Member' },
                { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
              ].map(meta => (
                <View
                  key={meta.label}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.4)',
                  }}
                >
                  <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {meta.label}: <Text style={{ fontWeight: '700' }}>{meta.value}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Options */}
          <Animated.View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingTop: 12,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
              {options.map(option => {
                const IconComponent = option.icon;
                const isActive = activeOption === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleOptionPress(option.id)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 14,
                      padding: 16,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isActive
                        ? option.color
                          ? `${option.color}66`
                          : 'rgba(59,130,246,0.4)'
                        : isDark
                        ? 'rgba(148,163,184,0.2)'
                        : 'rgba(148,163,184,0.4)',
                      backgroundColor: isActive
                        ? option.color
                          ? `${option.color}33`
                          : 'rgba(59,130,246,0.15)'
                        : isDark
                        ? 'rgba(15,23,42,0.7)'
                        : 'rgba(248,250,252,0.9)',
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16,
                        backgroundColor: isActive
                          ? option.color || '#3B82F6'
                          : isDark
                          ? 'rgba(15,23,42,0.9)'
                          : 'rgba(226,232,240,0.9)',
                      }}
                    >
                      <IconComponent
                        size={20}
                        color={
                          isActive
                            ? '#FFFFFF'
                            : option.color || (isDark ? '#E2E8F0' : '#475569')
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {option.title}
                      </Text>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isActive ? 'Currently viewing' : 'Jump to section'}
                      </Text>
                    </View>
                    {isActive && (
                      <Animated.View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          backgroundColor: '#3B82F6',
                          marginLeft: 8,
                          transform: [
                            {
                              scale: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }),
                            },
                          ],
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.4)',
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <Text className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Task Master v1.0 · Stay in flow
            </Text>
          </Animated.View>
        </LinearGradient>
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
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <LinearGradient
          colors={isDark ? ['#1F2937', '#0F172A'] : ['#FFFFFF', '#E0E7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: isDark ? '#1F2937' : '#E0E7FF',
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Menu size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const DrawerAccent = ({
  color,
  size = 140,
  style,
}: {
  color: string;
  size?: number;
  style?: object;
}) => (
  <View
    pointerEvents="none"
    style={[
      {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: 0.25,
      },
      style,
    ]}
  />
);
