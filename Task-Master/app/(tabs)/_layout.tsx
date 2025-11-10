import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chrome as Home, User, Settings } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const TabIcon = ({
  icon: Icon,
  color,
  focused,
}: {
  icon: typeof Home;
  color: string;
  focused: boolean;
}) => (
  <View
    style={{
      padding: focused ? 10 : 8,
      borderRadius: 18,
      backgroundColor: focused ? '#acd9ff' : 'transparent',
    }}
  >
    <Icon size={20} color={focused ? '#FFFFFF' : color} />
  </View>
);

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#E0E7FF' : '#1D4ED8',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          height: 30 ,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          // paddingHorizontal: 10,
          paddingBottom: Math.max(bottomInset, 12),
          paddingTop: 1,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={isDark ? ['#0F172A', '#111827'] : ['#FFFFFF', '#E0E7FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? '#1F2937' : '#D1D5DB',
            }}
          />
        ),
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
