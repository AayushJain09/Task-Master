import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function Reminders() {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      }}
      accessibilityRole="summary"
      accessibilityLabel="Reminders screen placeholder"
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDark ? '#e2e8f0' : '#0f172a',
            textAlign: 'center',
          }}
        >
          Reminders calendar coming soon.
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: isDark ? '#94a3b8' : '#475569',
            textAlign: 'center',
          }}
        >
          Use the drawer menu to navigate to other sections while we finish this experience.
        </Text>
      </View>
    </View>
  );
}
