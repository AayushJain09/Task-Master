import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Animated, ScrollView } from 'react-native';
import { DateObject, MarkedDates } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';
import { CalendarCard } from './reminders/CalendarCard';
import { ReminderSheet } from './reminders/ReminderSheet';
import { QuickActions } from './reminders/QuickActions';
import { ReminderStub, palette, stubReminders } from './reminders/data';
import { formatDateKey } from './reminders/utils';
import { reminderQuickActions } from './reminders/quickActions.data';
import type { QuickActionConfig } from './reminders/QuickActions';

export default function Reminders() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const remindersByDate = useMemo(() => {
    return stubReminders.reduce<Record<string, ReminderStub[]>>((acc, reminder) => {
      if (!acc[reminder.date]) {
        acc[reminder.date] = [];
      }
      acc[reminder.date].push(reminder);
      return acc;
    }, {});
  }, []);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    Object.entries(remindersByDate).forEach(([key, reminders]) => {
      marks[key] = {
        dots: reminders.slice(0, 3).map(reminder => ({
          key: `${key}-${reminder.id}`,
          color: palette[reminder.category],
        })),
      };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: isDark ? '#1D4ED8' : '#DBEAFE',
      selectedTextColor: isDark ? '#F8FAFC' : '#0F172A',
    };
    return marks;
  }, [remindersByDate, selectedDate, isDark]);

  const remindersForSelected = remindersByDate[selectedDate] || [];

  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: sheetOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 160,
    }).start();
  }, [sheetOpen, sheetAnim]);

  const handleDayPress = (day: DateObject) => {
    setSelectedDate(day.dateString);
    setSheetOpen(true);
  };

  /**
   * Centralized handler for the quick action grid.
   * For now we optimistically log the user intent and expand the sheet when relevant,
   * but the branching structure keeps future integrations (modal navigation, API calls)
   * localized.
   */
  const handleQuickActionPress = useCallback(
    (action: QuickActionConfig) => {
      console.log(`[Reminders] quick action tapped: ${action.id}`);

      if (action.id === 'new-reminder' && !sheetOpen) {
        setSheetOpen(true);
      }
    },
    [sheetOpen, setSheetOpen]
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#030711' : '#F8FAFF' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}
      >
        <CalendarCard isDark={isDark} markedDates={markedDates} onDayPress={handleDayPress} />
        <QuickActions
          isDark={isDark}
          actions={reminderQuickActions}
          onActionPress={handleQuickActionPress}
        />
      </ScrollView>
      <ReminderSheet
        isDark={isDark}
        reminders={remindersForSelected}
        selectedDate={selectedDate}
        open={sheetOpen}
        animationValue={sheetAnim}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
