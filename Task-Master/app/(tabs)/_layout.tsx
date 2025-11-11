import React, { useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chrome as Home, User, Settings } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICONS: Record<string, typeof Home> = {
  home: Home,
  profile: User,
  settings: Settings,
};

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false,
        tabBarActiveBackgroundColor: 'transparent',
  tabBarInactiveBackgroundColor: 'transparent',
       }}
      tabBar={props => (
        <GradientTabBar {...props} isDark={isDark} bottomInset={insets.bottom || 0} />
      )}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

type GradientTabBarProps = BottomTabBarProps & {
  isDark: boolean;
  bottomInset: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const GradientTabBar: React.FC<GradientTabBarProps> = ({
  state,
  descriptors,
  navigation,
  isDark,
  bottomInset,
}) => {
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const horizontalPadding = 24;
  const [contentWidth, setContentWidth] = useState(SCREEN_WIDTH - horizontalPadding * 2);
  const [contentLeft, setContentLeft] = useState(horizontalPadding);
  const slotWidth = contentWidth / state.routes.length;
  const indicatorWidth = Math.min(Math.max(slotWidth * 0.7, 60), slotWidth);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      friction: 12,
      tension: 120,
    }).start();
  }, [state.index, indicatorAnim]);

  const translateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_, idx) => idx),
    outputRange: state.routes.map((_, idx) => {
      const start = contentLeft + slotWidth * idx;
      return start + (slotWidth - indicatorWidth) / 2;
    }),
  });

  return (
    <LinearGradient
      colors={isDark ? ['#050814', '#0F172A'] : ['#FFFFFF', '#EEF2FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#111827' : '#E2E8F0',
        paddingHorizontal: horizontalPadding,
        paddingTop: 6,
        }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 8,
          width: indicatorWidth,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDark ? 'rgba(148, 197, 253, 0.15)' : 'rgba(37, 99, 235, 0.12)',
          transform: [{ translateX }],
        }}
        pointerEvents="none"
      />

      <View
        style={{
          flexDirection: 'row',
          width: contentWidth,
          alignSelf: 'center',
          position: 'relative',
        }}
        onLayout={event => {
          setContentWidth(event.nativeEvent.layout.width);
          setContentLeft(event.nativeEvent.layout.x);
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel ??
            options.title ??
            route.name.charAt(0).toUpperCase() + route.name.slice(1);
          const isFocused = state.index === index;
          const IconComponent = ICONS[route.name] || Home;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              activeOpacity={0.85}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 2,
              }}
            >
              <View style={{ padding: 4, borderRadius: 18 }}>
                <IconComponent
                  size={22}
                  color={
                    isFocused
                      ? isDark
                        ? '#E0E7FF'
                        : '#1D4ED8'
                      : isDark
                      ? '#94A3B8'
                      : '#94A3B8'
                  }
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isFocused
                    ? isDark
                      ? '#E0E7FF'
                      : '#1E3A8A'
                    : isDark
                    ? '#6B7280'
                    : '#94A3B8',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
};
