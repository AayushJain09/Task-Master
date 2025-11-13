import React from 'react';
import { Animated, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

interface HeroNextReminder {
  title: string;
  timeLabel: string;
  relativeLabel: string;
  accentColor: string;
}

interface ReminderHeroProps {
  isDark: boolean;
  dateLabel: string;
  totalCount: number;
  nextReminder?: HeroNextReminder;
  scrollY?: Animated.Value;
}

/**
 * ReminderHero
 *
 * Animated hero block that anchors the reminders experience with contextual copy,
 * high-level stats, and the next actionable reminder. The component reacts to
 * the parent scroll position, providing subtle parallax + opacity changes so
 * the header feels dynamic without overwhelming the content stack.
 */
export const ReminderHero: React.FC<ReminderHeroProps> = ({
  isDark,
  dateLabel,
  totalCount,
  nextReminder,
  scrollY,
}) => {
  const translateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -20],
        extrapolate: 'clamp',
      })
    : 0;

  const heroOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity: heroOpacity,
      }}
    >
      <LinearGradient
        colors={isDark ? ['#0F172A', '#0B1120'] : ['#EEF2FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 30,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.35)',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={16} color={isDark ? '#FDE047' : '#D97706'} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: isDark ? '#FDE68A' : '#D97706',
                }}
              >
                Rhythm
              </Text>
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '800',
                marginTop: 6,
                color: isDark ? '#F8FAFC' : '#0F172A',
              }}
            >
              {dateLabel}
            </Text>
            <Text style={{ marginTop: 6, color: isDark ? '#CBD5F5' : '#475569', fontSize: 14 }}>
              {totalCount} scheduled touchpoints · Keep momentum steady.
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.08)',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {totalCount}
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase' }}>
              reminders
            </Text>
          </View>
        </View>

        {nextReminder ? (
          <View
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 22,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: `${nextReminder.accentColor}33`,
            }}
          >
            <Text style={{ fontSize: 12, color: isDark ? '#CBD5F5' : '#475569', marginBottom: 4 }}>
              Next up
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isDark ? '#F8FAFC' : '#0F172A',
              }}
            >
              {nextReminder.title}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
              <Text style={{ color: nextReminder.accentColor, fontWeight: '600', marginRight: 12 }}>
                {nextReminder.timeLabel}
              </Text>
              <Text style={{ color: isDark ? '#94A3B8' : '#475569' }}>{nextReminder.relativeLabel}</Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
};
