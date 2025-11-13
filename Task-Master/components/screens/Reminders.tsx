/**
 * Reminders Screen
 *
 * A focused planning canvas dedicated to personal + work reminders. This screen carries
 * the same design language as the rest of the Task Master experience:
 * - Vector-inspired hero summary with subtle parallax animation
 * - Category filters + quick actions living below the hero card
 * - Calendar surface for date picking + dots referencing reminder categories
 * - Timeline preview + interactive bottom sheet for focused detail review
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Animated } from 'react-native';
import { DateObject, MarkedDates } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';
import { CalendarCard } from './reminders/CalendarCard';
import { ReminderSheet } from './reminders/ReminderSheet';
import { QuickActions } from './reminders/QuickActions';
import { ReminderHero } from './reminders/ReminderHero';
import { ReminderFilters } from './reminders/ReminderFilters';
import type { ReminderFilterOption } from './reminders/ReminderFilters';
import { UpcomingList } from './reminders/UpcomingList';
import type { UpcomingListItem } from './reminders/UpcomingList';
import type { QuickActionConfig } from './reminders/QuickActions';
import { ReminderFormModal, ReminderFormValues } from './reminders/ReminderFormModal';
import {
  ReminderStub,
  ReminderCategory,
  palette,
  stubReminders,
} from './reminders/data';
import {
  formatDateKey,
  sortReminders,
  getReminderDate,
  formatRelativeLabel,
  formatDayLabel,
} from './reminders/utils';
import { reminderQuickActions } from './reminders/quickActions.data';

export default function Reminders() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | ReminderCategory>('all');
  const [reminders, setReminders] = useState<ReminderStub[]>(stubReminders);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialValues, setFormInitialValues] = useState<Partial<ReminderFormValues> | undefined>();
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const remindersByDate = useMemo(() => {
    return reminders.reduce<Record<string, ReminderStub[]>>((acc, reminder) => {
      if (!acc[reminder.date]) {
        acc[reminder.date] = [];
      }
      acc[reminder.date].push(reminder);
      return acc;
    }, {});
  }, [reminders]);

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
  const filteredReminders = useMemo(() => {
    if (activeFilter === 'all') {
      return reminders;
    }
    return reminders.filter(reminder => reminder.category === activeFilter);
  }, [activeFilter, reminders]);

  const upcomingTimeline = useMemo<UpcomingListItem[]>(() => {
    return sortReminders(filteredReminders)
      .slice(0, 4)
      .map(reminder => {
        const date = getReminderDate(reminder);
        return {
          reminder,
          timeLabel: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          relativeLabel: formatRelativeLabel(date),
        };
      });
  }, [filteredReminders]);

  const heroNextReminder = useMemo(() => {
    const [next] = sortReminders(reminders);
    if (!next) {
      return undefined;
    }
    const date = getReminderDate(next);
    return {
      title: next.title,
      timeLabel: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      relativeLabel: formatRelativeLabel(date),
      accentColor: palette[next.category],
    };
  }, [reminders]);

  const filterOptions = useMemo<ReminderFilterOption[]>(() => {
    const counts: Record<'all' | ReminderCategory, number> = {
      all: 0,
      work: 0,
      personal: 0,
      health: 0,
      deadline: 0,
    };
    reminders.forEach(reminder => {
      counts.all += 1;
      counts[reminder.category] += 1;
    });

    const paletteMap: Record<'all' | ReminderCategory, string> = {
      all: '#6366F1',
      work: palette.work,
      personal: palette.personal,
      health: palette.health,
      deadline: palette.deadline,
    };

    const labels: Record<'all' | ReminderCategory, string> = {
      all: 'All',
      work: 'Work',
      personal: 'Personal',
      health: 'Health',
      deadline: 'Deadlines',
    };

    return (Object.keys(labels) as Array<'all' | ReminderCategory>).map(id => ({
      id,
      label: labels[id],
      count: counts[id],
      accent: paletteMap[id],
    }));
  }, [reminders]);

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
  const openFormModal = useCallback((mode: 'create' | 'edit', initial?: Partial<ReminderFormValues>) => {
    setFormMode(mode);
    setFormInitialValues(initial);
    setFormVisible(true);
  }, []);

  const handleQuickActionPress = useCallback(
    (action: QuickActionConfig) => {
      const derivedCategory = activeFilter === 'all' ? 'work' : activeFilter;
      const baseInitial: Partial<ReminderFormValues> = {
        date: selectedDate,
        time: '09:00',
        category: derivedCategory,
      };

      if (action.id === 'create-reminder') {
        openFormModal('create', baseInitial);
        return;
      }

      if (action.id === 'task-reminder') {
        openFormModal('create', {
          ...baseInitial,
          relatedTask: '',
        });
        return;
      }

      console.log('[Reminders] Unsupported action tapped:', action.id);
    },
    [openFormModal, selectedDate, activeFilter]
  );

  const handleFilterChange = useCallback((optionId: string) => {
    setActiveFilter(optionId as 'all' | ReminderCategory);
  }, []);

  const handleReminderPreviewPress = useCallback(
    (reminder: ReminderStub) => {
      openFormModal('edit', {
        id: reminder.id,
        title: reminder.title,
        date: reminder.date,
        time: reminder.time,
        category: reminder.category,
      });
    },
    [openFormModal]
  );

  const selectedDateLabel = useMemo(() => formatDayLabel(selectedDate), [selectedDate]);

  const handleReminderSubmit = useCallback(
    (values: ReminderFormValues) => {
      setReminders(prev => {
        if (values.id) {
          return prev.map(reminder =>
            reminder.id === values.id
              ? {
                  ...reminder,
                  title: values.title,
                  date: values.date,
                  time: values.time,
                  category: values.category,
                }
              : reminder
          );
        }

        const newReminder: ReminderStub = {
          id: `${Date.now()}`,
          title: values.title,
          date: values.date,
          time: values.time,
          category: values.category,
        };
        return [...prev, newReminder];
      });

      setSelectedDate(values.date);
      setSheetOpen(true);
    },
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#030711' : '#F8FAFF' }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <ReminderHero
          isDark={isDark}
          dateLabel={selectedDateLabel}
          totalCount={reminders.length}
          nextReminder={heroNextReminder}
          scrollY={scrollY}
        />
        <QuickActions
          isDark={isDark}
          actions={reminderQuickActions}
          onActionPress={handleQuickActionPress}
        />
        <CalendarCard isDark={isDark} markedDates={markedDates} onDayPress={handleDayPress} />
        <ReminderFilters
          isDark={isDark}
          options={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <UpcomingList
          isDark={isDark}
          items={upcomingTimeline}
          onReminderPress={handleReminderPreviewPress}
        />
      </Animated.ScrollView>
      <ReminderSheet
        isDark={isDark}
        reminders={remindersForSelected}
        selectedDate={selectedDate}
        open={sheetOpen}
        animationValue={sheetAnim}
        onClose={() => setSheetOpen(false)}
      />
      <ReminderFormModal
        visible={formVisible}
        isDark={isDark}
        mode={formMode}
        initialValues={formInitialValues}
        onClose={() => setFormVisible(false)}
        onSubmit={handleReminderSubmit}
      />
    </View>
  );
}
