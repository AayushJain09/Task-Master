import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Plus,
  Clock,
  MapPin,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlarmClock,
  Link2,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type ReminderStub = {
  id: string;
  title: string;
  date: string; // ISO date string yyyy-MM-dd
  time: string;
  category: 'work' | 'personal' | 'health' | 'deadline';
  linkedTask?: string;
  repeat?: 'none' | 'daily' | 'weekly';
};

const stubReminders: ReminderStub[] = [
  {
    id: '1',
    title: 'Sprint review sync',
    date: formatDateKey(new Date()),
    time: '10:00',
    category: 'work',
    linkedTask: 'Finalize sprint deck',
  },
  {
    id: '2',
    title: 'Submit design mock',
    date: formatDateKey(addDays(new Date(), 1)),
    time: '16:30',
    category: 'deadline',
    linkedTask: 'UI polish task',
  },
  {
    id: '3',
    title: 'Morning run',
    date: formatDateKey(new Date()),
    time: '06:00',
    category: 'health',
    repeat: 'daily',
  },
  {
    id: '4',
    title: 'Coffee with Priya',
    date: formatDateKey(addDays(new Date(), 3)),
    time: '15:00',
    category: 'personal',
  },
  {
    id: '5',
    title: 'Retro agenda prep',
    date: formatDateKey(addDays(new Date(), 5)),
    time: '11:30',
    category: 'work',
  },
  {
    id: '6',
    title: 'Vitamin reminder',
    date: formatDateKey(addDays(new Date(), -1)),
    time: '08:00',
    category: 'health',
    repeat: 'daily',
  },
];

const CATEGORY_PALETTE: Record<
  ReminderStub['category'],
  { dot: string; bg: string; text: string }
> = {
  work: { dot: '#93C5FD', bg: 'rgba(59,130,246,0.15)', text: '#93C5FD' },
  personal: { dot: '#FBCFE8', bg: 'rgba(236,72,153,0.1)', text: '#F472B6' },
  health: { dot: '#6EE7B7', bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
  deadline: { dot: '#FCA5A5', bg: 'rgba(239,68,68,0.12)', text: '#F87171' },
};
type GradientStops = readonly [ColorValue, ColorValue];

const QUICK_ACTIONS: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  colorsDark: GradientStops;
  colorsLight: GradientStops;
}> = [
  {
    id: 'personal',
    title: 'Personal reminder',
    subtitle: 'Keep personal rituals on-track.',
    icon: Sparkles,
    colorsDark: ['#1B183A', '#0F1025'],
    colorsLight: ['#F5F3FF', '#FFFFFF'],
  },
  {
    id: 'task',
    title: 'Link to task',
    subtitle: 'Attach reminders to open tasks.',
    icon: Link2,
    colorsDark: ['#0F1F33', '#0B1220'],
    colorsLight: ['#EFF6FF', '#FFFFFF'],
  },
  {
    id: 'timer',
    title: 'Quick timer',
    subtitle: 'Drop a lightweight ping.',
    icon: AlarmClock,
    colorsDark: ['#162C29', '#0B1C19'],
    colorsLight: ['#ECFDF5', '#FFFFFF'],
  },
];

export default function Reminders() {
  const { isDark } = useTheme();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));

  const remindersByDate = useMemo(() => {
    return stubReminders.reduce<Record<string, ReminderStub[]>>((map, reminder) => {
      if (!map[reminder.date]) {
        map[reminder.date] = [];
      }
      map[reminder.date].push(reminder);
      return map;
    }, {});
  }, []);

  const calendarDays = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);
  const selectedReminders = remindersByDate[selectedDate] || [];
  const dayStats = useMemo(() => {
    if (selectedReminders.length === 0) {
      return {
        total: 0,
        linked: 0,
        recurring: 0,
        nextTime: null as string | null,
      };
    }
    const linked = selectedReminders.filter(rem => Boolean(rem.linkedTask)).length;
    const recurring = selectedReminders.filter(rem => rem.repeat && rem.repeat !== 'none').length;
    const sortedTimes = [...selectedReminders]
      .map(rem => rem.time)
      .sort();
    return {
      total: selectedReminders.length,
      linked,
      recurring,
      nextTime: sortedTimes[0] || null,
    };
  }, [selectedReminders]);

  const handleMonthChange = (direction: 'prev' | 'next' | 'today') => {
    setVisibleMonth(prev => {
      if (direction === 'today') {
        const today = new Date();
        setSelectedDate(formatDateKey(today));
        return new Date(today.getFullYear(), today.getMonth(), 1);
      }

      const targetMonth = new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1);
      const referenceDay = new Date(selectedDate);
      const day = Math.min(referenceDay.getDate(), getDaysInMonth(targetMonth));
      setSelectedDate(formatDateKey(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day)));
      return targetMonth;
    });
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#0B1220'] : ['#F8FAFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          margin: 16,
          padding: 20,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#E0E7FF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AccentBlob color={isDark ? 'rgba(59,130,246,0.4)' : 'rgba(219,234,254,0.9)'} size={220} style={{ right: -70, top: -80 }} />
        <AccentBlob color={isDark ? 'rgba(16,185,129,0.3)' : 'rgba(167,243,208,0.8)'} size={160} style={{ left: -60, bottom: -90 }} />

        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-8">
            <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-emerald-200' : 'text-emerald-600'}`}>
              Reminder atlas
            </Text>
            <Text className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Keep commitments on radar.
            </Text>
            <Text className={`mt-2 text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Tap any day to inspect its reminders or log new nudges against tasks or personal goals.
            </Text>
          </View>
          <TouchableOpacity
            className="p-3 rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)',
            }}
          >
            <Plus size={20} color={isDark ? '#E5E7EB' : '#1F2937'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <QuickActionGrid isDark={isDark} />

      <MasterCalendar
        isDark={isDark}
        visibleMonth={visibleMonth}
        remindersByDate={remindersByDate}
        calendarDays={calendarDays}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onMonthChange={handleMonthChange}
      />

      {/* Selected date reminders */}
      <View className="mx-4 mb-6">
        <LinearGradient
          colors={isDark ? ['#0B1220', '#050B15'] : ['#FFFFFF', '#F8FAFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 26,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? '#1F2937' : '#E2E8F0',
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Focus</Text>
              <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatFriendlyDate(selectedDate)}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)',
              }}
              onPress={() => {
                setSelectedDate(formatDateKey(new Date()));
                handleMonthChange('today');
              }}
            >
              <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Jump to today</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3 mb-4">
            <SummaryChip label="Reminders" value={`${dayStats.total}`} accent="#60A5FA" isDark={isDark} />
            <SummaryChip label="Next ping" value={dayStats.nextTime ? dayStats.nextTime : '—'} accent="#FBBF24" isDark={isDark} />
            <SummaryChip label="Linked tasks" value={`${dayStats.linked}`} accent="#A78BFA" isDark={isDark} />
            <SummaryChip label="Repeating" value={`${dayStats.recurring}`} accent="#34D399" isDark={isDark} />
          </View>

          {selectedReminders.length === 0 ? (
            <View className="items-center py-8">
              <Bell size={28} color={isDark ? '#475569' : '#CBD5F5'} />
              <Text className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No reminders logged for this day.
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedReminders}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: isDark ? 'rgba(148,163,184,0.2)' : '#E5E7EB', marginVertical: 12 }} />
              )}
              renderItem={({ item, index }) => {
                const palette = CATEGORY_PALETTE[item.category];
                const isLast = index === selectedReminders.length - 1;
                return (
                  <View className="flex-row items-start">
                    <View style={{ width: 18, alignItems: 'center' }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: palette.dot,
                          borderWidth: 2,
                          borderColor: isDark ? '#0B1220' : '#FFFFFF',
                          marginTop: 6,
                        }}
                      />
                      {!isLast && (
                        <View
                          style={{
                            flex: 1,
                            width: 2,
                            backgroundColor: isDark ? 'rgba(148,163,184,0.2)' : '#E5E7EB',
                          }}
                        />
                      )}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 18,
                        backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.9)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(226,232,240,0.9)',
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Clock size={14} color={palette.text} />
                          <Text className="ml-2 text-sm font-semibold" style={{ color: palette.text }}>
                            {item.time}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                            backgroundColor: palette.bg,
                          }}
                        >
                          <Text className="text-[11px] font-semibold" style={{ color: palette.text }}>
                            {item.category}
                          </Text>
                        </View>
                      </View>
                      <Text className={`mt-2 font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                        {item.linkedTask && (
                          <View className="flex-row items-center">
                            <MapPin size={12} color={palette.text} />
                            <Text className="text-xs ml-1" style={{ color: palette.text }}>
                              Linked: {item.linkedTask}
                            </Text>
                          </View>
                        )}
                        {item.repeat && item.repeat !== 'none' && (
                          <View className="flex-row items-center">
                            <Repeat size={12} color={palette.text} />
                            <Text className="text-xs ml-1" style={{ color: palette.text }}>
                              {item.repeat === 'daily' ? 'Repeats daily' : 'Repeats weekly'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </LinearGradient>
      </View>

      {/* Legend */}
      <View className="mx-4 mb-12 rounded-3xl border" style={{ borderColor: isDark ? '#1F2937' : '#E2E8F0' }}>
        <View className="flex-row flex-wrap p-4 gap-3 items-center justify-between">
          {Object.entries(CATEGORY_PALETTE).map(([category, palette]) => (
            <View key={category} className="flex-row items-center gap-2">
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: palette.dot }} />
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const QuickActionGrid = ({ isDark }: { isDark: boolean }) => (
  <View className="mx-4 mb-6">
    <View className="flex-row items-center justify-between mb-3">
      <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick actions</Text>
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Speed up your flows</Text>
    </View>
    <View className="flex-row gap-1 mt-1">
      {QUICK_ACTIONS.map(action => {
        const IconComponent = action.icon;
        return (
          <TouchableOpacity key={action.id} style={{ flex: 1, marginHorizontal: 4 }} activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? action.colorsDark : action.colorsLight}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 16,
                height: 140,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              }}
            >
              <View className="w-10 h-10 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}>
                <IconComponent size={18} color={isDark ? '#F8FAFC' : '#1F2937'} />
              </View>
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{action.title}</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{action.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const MasterCalendar = ({
  isDark,
  visibleMonth,
  remindersByDate,
  calendarDays,
  selectedDate,
  onSelect,
  onMonthChange,
}: {
  isDark: boolean;
  visibleMonth: Date;
  remindersByDate: Record<string, ReminderStub[]>;
  calendarDays: ReturnType<typeof buildCalendarGrid>;
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  onMonthChange: (direction: 'prev' | 'next' | 'today') => void;
}) => {
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter(day => day.isCurrentMonth);
    const activeDays = currentMonthDays.filter(day => (remindersByDate[day.key]?.length || 0) > 0).length;
    const totalRems = currentMonthDays.reduce((sum, day) => sum + (remindersByDate[day.key]?.length || 0), 0);
    const upcoming = currentMonthDays.filter(day => {
      const dayDate = new Date(day.key);
      const now = new Date();
      dayDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return dayDate >= now && (remindersByDate[day.key]?.length || 0) > 0;
    }).length;
    return { activeDays, totalRems, upcoming };
  }, [calendarDays, remindersByDate]);

  return (
    <View className="mx-4 mb-6 rounded-3xl overflow-hidden border" style={{ borderColor: isDark ? '#1F2937' : '#E2E8F0' }}>
      <LinearGradient colors={isDark ? ['#050B15', '#0B1523'] : ['#FFFFFF', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'relative' }}>
        <AccentBlob color={isDark ? 'rgba(59,130,246,0.15)' : 'rgba(191,219,254,0.5)'} size={220} style={{ right: -80, top: -60 }} />
        <AccentBlob color={isDark ? 'rgba(16,185,129,0.12)' : 'rgba(187,247,208,0.6)'} size={160} style={{ left: -60, bottom: -90 }} />
        <View className="px-6 pt-5 pb-3">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Calendar</Text>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{monthLabel}</Text>
            </View>
            <View className="flex-row gap-3">
              <NavButton direction="prev" onPress={() => onMonthChange('prev')} isDark={isDark} />
              <NavButton direction="today" onPress={() => onMonthChange('today')} isDark={isDark} />
              <NavButton direction="next" onPress={() => onMonthChange('next')} isDark={isDark} />
            </View>
          </View>
          <View className="flex-row w-full gap-3 mb-4">
            <SummaryChip label="Active days" value={`${monthStats.activeDays}`} accent="#60A5FA" isDark={isDark} />
            <SummaryChip label="Total reminders" value={`${monthStats.totalRems}`} accent="#F472B6" isDark={isDark} />
            <SummaryChip label="Upcoming" value={`${monthStats.upcoming}`} accent="#34D399" isDark={isDark} />
          </View>
        </View>

        <View className="px-3 pb-5">
          <View className="flex-row justify-between mb-2 px-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
              <Text
                key={label}
                className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', }}>
            {calendarDays.map(day => {
              const dayReminders = remindersByDate[day.key] || [];
              const isSelected = selectedDate === day.key;
              const dotColors = dayReminders.slice(0, 3).map(rem => CATEGORY_PALETTE[rem.category].dot);
              const isActive = dayReminders.length > 0;

              return (
                <TouchableOpacity
                  key={day.key}
                  onPress={() => onSelect(day.key)}
                  style={{
                    flexBasis: '14.2857%',
                    maxWidth: '14.2857%',
                    paddingVertical: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    rowGap: 3,
                    marginHorizontal: 3
                  }}
                  activeOpacity={0.85}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(59,130,246,0.25)'
                          : 'rgba(59,130,246,0.12)'
                        : isActive
                        ? isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(226,232,240,0.7)'
                        : 'transparent',
                      borderWidth: isSelected ? 1.2 : 0,
                      borderColor: isSelected ? '#60A5FA' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: day.isCurrentMonth
                          ? isDark
                            ? '#F8FAFC'
                            : '#111827'
                          : isDark
                          ? '#475569'
                          : '#CBD5F5',
                      }}
                    >
                      {day.label}
                    </Text>
                  </View>
                  <View className="flex-row mt-1 gap-1">
                    {dotColors.map((color, idx) => (
                      <View key={`${day.key}-dot-${idx}`} style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: color }} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const NavButton = ({
  direction,
  onPress,
  isDark,
}: {
  direction: 'prev' | 'next' | 'today';
  onPress: () => void;
  isDark: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="p-2 rounded-full"
    style={{
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)',
    }}
  >
    {direction === 'prev' && <ChevronLeft size={18} color={isDark ? '#F8FAFC' : '#1F2937'} />}
    {direction === 'next' && <ChevronRight size={18} color={isDark ? '#F8FAFC' : '#1F2937'} />}
    {direction === 'today' && <CalendarIcon size={16} color={isDark ? '#F8FAFC' : '#1F2937'} />}
  </TouchableOpacity>
);

const AccentBlob = ({
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

const SummaryChip = ({
  label,
  value,
  accent,
  isDark,
}: {
  label: string;
  value: string;
  accent: string;
  isDark: boolean;
}) => (
  <View
    style={{
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${accent}33`,
      backgroundColor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(248,250,252,0.9)',
      maxWidth:'33.33%'
    }}
  >
    <Text className="text-[11px] uppercase tracking-[0.2em]" style={{ color: accent }}>
      {label}
    </Text>
    <Text className={`text-base font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</Text>
  </View>
);

function buildCalendarGrid(anchorDate: Date) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 sunday
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const current = addDays(gridStart, i);
    days.push({
      key: formatDateKey(current),
      label: current.getDate().toString(),
      isCurrentMonth: current.getMonth() === month,
      isToday: formatDateKey(current) === formatDateKey(new Date()),
    });
  }
  return days;
}

function formatDateKey(date: Date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

function formatFriendlyDate(dateKey: string) {
  const date = new Date(dateKey);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
