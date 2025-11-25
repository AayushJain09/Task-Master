import React from 'react';
import { Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { LinearGradient } from 'expo-linear-gradient';

interface CalendarCardProps {
  isDark: boolean;
  markedDates: MarkedDates;
  onDayPress: (day: DateData) => void;
  onMonthChange?: (month: DateData) => void;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ isDark, markedDates, onDayPress, onMonthChange }) => (
  <LinearGradient
    colors={isDark ? ['#0B1220', '#050B15'] : ['#FFFFFF', '#EDF2FF']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: 28,
      borderWidth: 1,
      borderColor: isDark ? '#1F2937' : '#E0E7FF',
      padding: 18,
    }}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: '700',
        color: isDark ? '#F8FAFC' : '#0F172A',
        marginBottom: 12,
      }}
    >
      Reminder calendar
    </Text>
    <Calendar
      markingType="multi-dot"
      markedDates={markedDates}
      onDayPress={onDayPress}
      onMonthChange={onMonthChange}
      enableSwipeMonths
      hideExtraDays={false}
      theme={{
        calendarBackground: 'transparent',
        backgroundColor: 'transparent',
        dayTextColor: isDark ? '#E2E8F0' : '#1F2937',
        textDisabledColor: isDark ? '#374151' : '#CBD5F5',
        monthTextColor: isDark ? '#F8FAFC' : '#0F172A',
        selectedDayBackgroundColor: '#1D4ED8',
        todayTextColor: '#34D399',
        textSectionTitleColor: isDark ? '#94A3B8' : '#94A3B8',
        arrowColor: isDark ? '#F8FAFC' : '#0F172A',
      }}
      style={{ borderRadius: 24 }}
    />
  </LinearGradient>
);
