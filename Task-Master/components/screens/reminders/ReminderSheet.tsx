import React from 'react';
import { View, Text, Animated, PanResponder, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ReminderStub, palette } from './data';

interface ReminderSheetProps {
  isDark: boolean;
  reminders: ReminderStub[];
  selectedDate: string;
  open: boolean;
  animationValue: Animated.Value;
  onClose: () => void;
}

export const ReminderSheet: React.FC<ReminderSheetProps> = ({
  isDark,
  reminders,
  selectedDate,
  open,
  animationValue,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0,
      onPanResponderMove: (_, gestureState) => {
        const progress = Math.max(0, 1 - gestureState.dy / 320);
        animationValue.setValue(progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          onClose();
        } else {
          Animated.spring(animationValue, {
            toValue: 1,
            useNativeDriver: true,
            damping: 18,
            stiffness: 160,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        transform: [{ translateY }],
        maxHeight: '50%',
      }}
    >
      <LinearGradient
        colors={isDark ? ['#050B15', '#050B15'] : ['#FFFFFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#E2E8F0',
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <View {...panResponder.panHandlers} style={{ marginBottom: 12 }}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: isDark ? '#1f2a37' : '#e2e8f0' }} />
            <Text style={{ marginTop: 6, fontSize: 11, color: isDark ? '#94A3B8' : '#94A3B8' }}>
              Drag down to close
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          >
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        {reminders.length === 0 ? (
          <Text style={{ marginTop: 12, color: isDark ? '#94A3B8' : '#475569' }}>No reminders scheduled.</Text>
        ) : (
          <ScrollView
            style={{ marginTop: 12 }}
            contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 12) }}
            showsVerticalScrollIndicator={false}
          >
            {reminders.map(reminder => (
              <View
                key={reminder.id}
                style={{
                  marginBottom: 12,
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(226,232,240,0.9)',
                }}
              >
                <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '700' }}>{reminder.title}</Text>
                <Text style={{ color: palette[reminder.category], marginTop: 4, fontSize: 12 }}>
                  {reminder.time} · {reminder.category.toUpperCase()}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </LinearGradient>
    </Animated.View>
  );
};
