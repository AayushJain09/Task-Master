/**
 * Reminders Screen
 *
 * A focused planning canvas dedicated to personal + work reminders. This screen carries
 * the same design language as the rest of the Task Master experience:
 * - Vector-inspired hero summary with subtle parallax animation
 * - Category filters that surface context directly under the hero card
 * - Calendar surface for date picking + dots referencing reminder categories
 * - Timeline preview + interactive bottom sheet for focused detail review
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Animated, Text, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { DateObject, MarkedDates } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';
import { CalendarCard } from './reminders/CalendarCard';
import { ReminderSheet } from './reminders/ReminderSheet';
import { ReminderHero } from './reminders/ReminderHero';
import { ReminderFilters } from './reminders/ReminderFilters';
import type { ReminderFilterOption } from './reminders/ReminderFilters';
import { UpcomingList } from './reminders/UpcomingList';
import type { UpcomingListItem } from './reminders/UpcomingList';
import { ReminderFormModal, ReminderFormValues } from './reminders/ReminderFormModal';
import ReminderDetailsModal from './reminders/ReminderDetailsModal';
import { ReminderStub, palette } from './reminders/data';
import {
  formatDateKey,
  sortReminders,
  getReminderDate,
  formatRelativeLabel,
} from './reminders/utils';
import { remindersService } from '@/services/reminders.service';
import type { Reminder, ReminderCategory, ReminderOccurrence } from '@/types/reminder.types';
import {
  convertLocalDateTimeToISO,
  getDeviceTimezone,
  formatDateKeyForDisplay,
  formatDateTimeInTimeZone,
} from '@/utils/timezone';

export default function Reminders() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | ReminderCategory>('all');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [occurrences, setOccurrences] = useState<ReminderOccurrence[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState<boolean>(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialValues, setFormInitialValues] = useState<Partial<ReminderFormValues> | undefined>();
  const [isSubmittingReminder, setIsSubmittingReminder] = useState<boolean>(false);
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsReminder, setDetailsReminder] = useState<Reminder | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const deviceTimeZone = useMemo(() => getDeviceTimezone(), []);

  const buildWindowForDate = (dateISO: string) => {
    const candidate = new Date(`${dateISO}T00:00:00Z`);
    const base = Number.isNaN(candidate.getTime()) ? new Date() : candidate;
    const from = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    const to = new Date(Date.UTC(base.getUTCFullYear() + 1, base.getUTCMonth(), 1));
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const [occurrenceWindow, setOccurrenceWindow] = useState(() => buildWindowForDate(formatDateKey(new Date())));

  const fetchReminders = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoadingReminders(true);
      }
      setRemindersError(null);
      const response = await remindersService.getReminders({ limit: 100 });
      setReminders(response.items);
    } catch (error) {
      const message = (error as Error)?.message || 'Unable to load reminders.';
      setRemindersError(message);
    } finally {
      if (!options?.silent) {
        setIsLoadingReminders(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  const fetchOccurrences = useCallback(async () => {
    try {
      const data = await remindersService.getOccurrences(occurrenceWindow.from, occurrenceWindow.to);
      setOccurrences(data);
    } catch (error) {
      console.warn('Failed to load reminder occurrences', error);
    }
  }, [occurrenceWindow]);

  const reminderStubs = useMemo(
    () => occurrences.map(occ => mapOccurrenceToStub(occ, deviceTimeZone)),
    [occurrences, deviceTimeZone]
  );

  const defaultReminderSeed = useMemo<Partial<ReminderFormValues>>(() => {
    const derivedCategory: ReminderCategory = activeFilter === 'all' ? 'work' : activeFilter;
    return {
      date: selectedDate,
      time: '09:00',
      category: derivedCategory,
      priority: 'medium',
      timezone: deviceTimeZone,
      tags: [],
      recurrence: { cadence: 'none', interval: 1, daysOfWeek: [], anchorDate: null },
    };
  }, [activeFilter, selectedDate, deviceTimeZone]);

  const remindersByDate = useMemo(() => {
    return reminderStubs.reduce<Record<string, ReminderStub[]>>((acc, reminder) => {
      if (!acc[reminder.date]) {
        acc[reminder.date] = [];
      }
      acc[reminder.date].push(reminder);
      return acc;
    }, {});
  }, [reminderStubs]);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    Object.entries(remindersByDate).forEach(([key, reminders]) => {
      marks[key] = {
        dots: reminders.slice(0, 3).map(reminder => ({
          key: `${key}-${reminder.occurrenceKey}`,
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
  const filteredReminderStubs = useMemo(() => {
    if (activeFilter === 'all') {
      return reminderStubs;
    }
    return reminderStubs.filter(reminder => reminder.category === activeFilter);
  }, [activeFilter, reminderStubs]);

  const upcomingTimeline = useMemo<UpcomingListItem[]>(() => {
    return sortReminders(filteredReminderStubs)
      .slice(0, 4)
      .map(reminder => {
        const date = getReminderDate(reminder);
        const timeLabel =
          reminder.timeDisplay ||
          formatDateTimeInTimeZone(reminder.scheduledAtUtc, reminder.timezone, {
            hour: 'numeric',
            minute: '2-digit',
          }) ||
          reminder.time;
        return {
          reminder,
          timeLabel,
          relativeLabel: formatRelativeLabel(date),
        };
      });
  }, [filteredReminderStubs]);

  const heroNextReminder = useMemo(() => {
    const [next] = sortReminders(reminderStubs);
    if (!next) {
      return undefined;
    }
    const date = getReminderDate(next);
    const timeLabel =
      next.timeDisplay ||
      formatDateTimeInTimeZone(next.scheduledAtUtc, next.timezone, {
        hour: 'numeric',
        minute: '2-digit',
      }) ||
      next.time;
    return {
      title: next.title,
      timeLabel,
      relativeLabel: formatRelativeLabel(date),
      accentColor: palette[next.category],
    };
  }, [reminderStubs]);

  const filterOptions = useMemo<ReminderFilterOption[]>(() => {
    const counts: Record<'all' | ReminderCategory, number> = {
      all: 0,
      work: 0,
      personal: 0,
      health: 0,
      deadline: 0,
    };
    reminderStubs.forEach(reminder => {
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
  }, [reminderStubs]);

  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: sheetOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 160,
    }).start();
  }, [sheetOpen, sheetAnim]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    fetchOccurrences();
  }, [fetchOccurrences]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReminders({ silent: true });
    fetchOccurrences();
  }, [fetchReminders, fetchOccurrences]);

  const handleDayPress = (day: DateObject) => {
    const dayISO = day.dateString;
    const windowStart = new Date(occurrenceWindow.from);
    const windowEnd = new Date(occurrenceWindow.to);
    const selected = new Date(`${dayISO}T00:00:00Z`);
    if (selected < windowStart || selected > windowEnd) {
      const nextWindow = buildWindowForDate(dayISO);
      setOccurrenceWindow(nextWindow);
    }
    setSelectedDate(day.dateString);
    setSheetOpen(true);
  };

  const handleMonthChange = useCallback(
    (month: DateObject) => {
      const iso = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
      const monthStart = new Date(`${iso}T00:00:00Z`);
      if (monthStart < new Date(occurrenceWindow.from) || monthStart > new Date(occurrenceWindow.to)) {
        setOccurrenceWindow(buildWindowForDate(iso));
      }
    },
    [occurrenceWindow]
  );

  const openFormModal = useCallback(
    (mode: 'create' | 'edit', initial?: Partial<ReminderFormValues>) => {
      setFormMode(mode);
      setFormInitialValues({
        timezone: deviceTimeZone,
        priority: 'medium',
        tags: [],
        recurrence: { cadence: 'none', interval: 1, daysOfWeek: [], anchorDate: null },
        ...initial,
      });
      setFormVisible(true);
    },
    [deviceTimeZone]
  );

  const handleCreateReminderPress = useCallback(() => {
    openFormModal('create', defaultReminderSeed);
  }, [defaultReminderSeed, openFormModal]);

  const handleFilterChange = useCallback((optionId: string) => {
    setActiveFilter(optionId as 'all' | ReminderCategory);
  }, []);

  const handleReminderCardPress = useCallback(
    (reminder: ReminderStub) => {
      const entity = reminders.find(r => r.id === reminder.id);
      if (!entity) {
        return;
      }
      setDetailsReminder(entity);
      setDetailsVisible(true);
    },
    [reminders]
  );

  const handleEditReminderRequest = useCallback(
    (reminder: ReminderStub) => {
      const entity = reminders.find(r => r.id === reminder.id);
      if (!entity) {
        return;
      }
      openFormModal('edit', mapReminderToFormValues(entity, deviceTimeZone));
    },
    [openFormModal, reminders, deviceTimeZone]
  );

  const performDeleteReminder = useCallback(
    async (reminderId: string) => {
      try {
        setDeletingReminderId(reminderId);
        await remindersService.deleteReminder(reminderId);
        setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
        if (detailsReminder?.id === reminderId) {
          setDetailsVisible(false);
          setDetailsReminder(null);
        }
        fetchOccurrences();
      } catch (error) {
        const message =
          (error as { message?: string })?.message || 'Unable to delete reminder. Please try again.';
        Alert.alert('Reminders', message);
      } finally {
        setDeletingReminderId(null);
      }
    },
    [detailsReminder, fetchOccurrences]
  );

  const handleDeleteReminderRequest = useCallback(
    (reminder: ReminderStub) => {
      Alert.alert(
        'Delete reminder',
        `Remove "${reminder.title}" permanently?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => performDeleteReminder(reminder.id) },
        ],
        { cancelable: true }
      );
    },
    [performDeleteReminder]
  );

  const selectedDateLabel = useMemo(
    () => formatDateKeyForDisplay(selectedDate),
    [selectedDate]
  );

  const handleModalClose = useCallback(() => {
    setFormVisible(false);
    setFormInitialValues(undefined);
  }, []);

  const handleReminderSubmit = useCallback(
    async (values: ReminderFormValues) => {
      const timezone = values.timezone || deviceTimeZone;
      const scheduledAt = buildScheduledAtISO(values.date, values.time, timezone);
      const recurrencePayload =
        values.recurrence && values.recurrence.cadence !== 'none'
          ? {
              cadence: values.recurrence.cadence,
              interval: values.recurrence.interval || 1,
              daysOfWeek:
                values.recurrence.cadence === 'weekly'
                  ? values.recurrence.daysOfWeek || []
                  : undefined,
              anchorDate: scheduledAt,
            }
          : undefined;
      try {
        setIsSubmittingReminder(true);
        let savedReminder: Reminder;

        if (values.id) {
          savedReminder = await remindersService.updateReminder(values.id, {
            title: values.title,
            scheduledAt,
            timezone,
            category: values.category,
            notes: values.notes,
            priority: values.priority,
            tags: values.tags,
            recurrence: recurrencePayload,
          });
        } else {
          savedReminder = await remindersService.createReminder({
            title: values.title,
            scheduledAt,
            timezone,
            category: values.category,
            notes: values.notes,
            priority: values.priority,
            tags: values.tags,
            recurrence: recurrencePayload,
          });
        }

        setReminders(prev =>
          values.id
            ? prev.map(reminder => (reminder.id === savedReminder.id ? savedReminder : reminder))
            : [...prev, savedReminder]
        );
        const targetDate =
          savedReminder.localScheduledDate || formatDateKey(new Date(savedReminder.scheduledAt));
    const windowCoversTarget =
      new Date(`${targetDate}T00:00:00Z`) >= new Date(occurrenceWindow.from) &&
      new Date(`${targetDate}T00:00:00Z`) <= new Date(occurrenceWindow.to);
    if (!windowCoversTarget) {
      setOccurrenceWindow(buildWindowForDate(targetDate));
    } else {
      fetchOccurrences();
    }
        setSelectedDate(targetDate);
        setSheetOpen(true);
        handleModalClose();
      } catch (error) {
        const message =
          (error as { message?: string })?.message || 'Unable to save reminder. Please try again.';
        throw new Error(message);
      } finally {
        setIsSubmittingReminder(false);
      }
    },
    [deviceTimeZone, handleModalClose, fetchOccurrences, occurrenceWindow]
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }>
        {isLoadingReminders ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={isDark ? '#93C5FD' : '#4338CA'} />
            <Text style={{ marginTop: 12, color: isDark ? '#BBD0FF' : '#475569' }}>
              Loading reminders...
            </Text>
          </View>
        ) : (
          <>
            <ReminderHero
              isDark={isDark}
              dateLabel={selectedDateLabel}
              totalCount={reminders.length}
              nextReminder={heroNextReminder}
              scrollY={scrollY}
            />
            <TouchableOpacity
              onPress={handleCreateReminderPress}
              activeOpacity={0.9}
              style={{
                marginVertical: 10,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(96,165,250,0.4)' : 'rgba(37,99,235,0.25)',
                backgroundColor: isDark ? 'rgba(30,64,175,0.35)' : 'rgba(219,234,254,0.85)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: isDark ? '#E0F2FE' : '#1E3A8A' }}>
                  Add reminder
                </Text>
                <Text style={{ color: isDark ? '#93C5FD' : '#1D4ED8', marginTop: 2, fontSize: 13 }}>
                  Capture a new touchpoint with today’s focus
                </Text>
              </View>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#1E3A8A' : '#2563EB',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>+</Text>
              </View>
            </TouchableOpacity>
            <CalendarCard
              isDark={isDark}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
            />
            <ReminderFilters
              isDark={isDark}
              options={filterOptions}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
            <UpcomingList
              isDark={isDark}
              items={upcomingTimeline}
              onReminderPress={handleReminderCardPress}
              onEditPress={handleEditReminderRequest}
              onDeletePress={handleDeleteReminderRequest}
              deletingReminderId={deletingReminderId}
            />
            {remindersError ? (
              <Text style={{ marginTop: 16, color: isDark ? '#F87171' : '#B91C1C' }}>
                {remindersError}
              </Text>
            ) : null}
          </>
        )}
      </Animated.ScrollView>
      <ReminderSheet
        isDark={isDark}
        reminders={remindersForSelected}
        selectedDate={selectedDate}
        open={sheetOpen}
        animationValue={sheetAnim}
        onClose={() => setSheetOpen(false)}
        onReminderPress={handleReminderCardPress}
        onEditPress={handleEditReminderRequest}
        onDeletePress={handleDeleteReminderRequest}
        deletingReminderId={deletingReminderId}
      />
      <ReminderFormModal
        visible={formVisible}
        isDark={isDark}
        mode={formMode}
        initialValues={formInitialValues}
        defaultTimezone={deviceTimeZone}
        submitting={isSubmittingReminder}
        onClose={handleModalClose}
        onSubmit={handleReminderSubmit}
      />
      <ReminderDetailsModal
        visible={detailsVisible}
        reminder={detailsReminder}
        isDark={isDark}
        onClose={() => {
          setDetailsVisible(false);
          setDetailsReminder(null);
        }}
      />
    </View>
  );
}

function buildScheduledAtISO(date: string, time: string, timezone: string): string {
  try {
    return convertLocalDateTimeToISO(date, time, timezone);
  } catch (error) {
    console.warn('Failed to build timezone-aware reminder payload, using device ISO fallback.', error);
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = (time || '00:00').split(':').map(Number);
    const composed = new Date();
    composed.setFullYear(year || composed.getFullYear(), (month || 1) - 1, day || composed.getDate());
    composed.setHours(hour ?? 0, minute ?? 0, 0, 0);
    return composed.toISOString();
  }
}

function formatTimeKeyFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function mapOccurrenceToStub(occurrence: ReminderOccurrence, fallbackTimezone: string): ReminderStub {
  const timezone = occurrence.timezone || fallbackTimezone;
  const scheduledUtc = occurrence.occurrenceDate;
  const scheduledDate = occurrence.localDate || formatDateKey(new Date(scheduledUtc));
  const scheduledTime = occurrence.localTime || formatTimeKeyFromDate(new Date(scheduledUtc));
  const timeDisplay =
    occurrence.localDateTimeDisplay ||
    formatDateTimeInTimeZone(scheduledUtc, timezone, {
      hour: 'numeric',
      minute: '2-digit',
    }) ||
    scheduledTime;

  return {
    id: occurrence.reminderId,
    occurrenceKey: occurrence.occurrenceKey,
    title: occurrence.title,
    date: scheduledDate,
    time: scheduledTime,
    timeDisplay,
    timezone,
    scheduledAtUtc: scheduledUtc,
    localDisplay: occurrence.localDateTimeDisplay,
    category: occurrence.category as ReminderCategory,
  };
}

function mapReminderToFormValues(reminder: Reminder, fallbackTimezone: string): ReminderFormValues {
  const scheduledUtc = reminder.scheduledAt;
  const timezone = reminder.localTimezone || reminder.timezone || fallbackTimezone;
  const scheduledDate = reminder.localScheduledDate || formatDateKey(new Date(scheduledUtc));
  const scheduledTime = reminder.localScheduledTime || formatTimeKeyFromDate(new Date(scheduledUtc));

  return {
    id: reminder.id,
    title: reminder.title,
    date: scheduledDate,
    time: scheduledTime,
    category: (reminder.category || 'personal') as ReminderCategory,
    priority: reminder.priority || 'medium',
    timezone,
    notes: reminder.notes || reminder.description || '',
    tags: reminder.tags || [],
    recurrence:
      reminder.recurrence || {
        cadence: 'none',
        interval: 1,
        daysOfWeek: [],
        anchorDate: null,
      },
  };
}
