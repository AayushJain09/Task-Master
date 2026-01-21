import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Animated,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar as CalendarIcon, Clock, Tag as TagIcon, MapPin, X, RefreshCcw } from 'lucide-react-native';
import type { Reminder, ReminderCategory, ReminderStatus } from '@/types/reminder.types';
import { palette } from './data';
import { formatDateKeyForDisplay, formatDateTimeInTimeZone } from '@/utils/timezone';
interface ReminderDetailsModalProps {
  visible: boolean;
  reminder: Reminder | null;
  isDark: boolean;
  onClose: () => void;
}

const ReminderDetailsModal: React.FC<ReminderDetailsModalProps> = ({
  visible,
  reminder,
  isDark,
  onClose,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  if (!reminder) {
    return null;
  }

  const timezone = reminder.localTimezone || reminder.timezone || 'UTC';
  const formattedDate = reminder.localScheduledDate
    ? formatDateKeyForDisplay(reminder.localScheduledDate)
    : formatDateTimeInTimeZone(reminder.scheduledAt, timezone, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }) || '';
  const timeLabel =
    formatDateTimeInTimeZone(reminder.scheduledAt, timezone, {
      hour: 'numeric',
      minute: '2-digit',
    }) || reminder.localScheduledTime || '';
  const categoryValue = (reminder.category || 'personal') as ReminderCategory;
  const recurrenceSummary = buildRecurrenceSummary(reminder);
  const statusAccent = getStatusAccent(reminder.status as ReminderStatus);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <BlurView tint={isDark ? 'dark' : 'light'} intensity={70} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: isDark ? '#050B15' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E2E8F0' },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{reminder.title}</Text>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  {formattedDate} · {timeLabel}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={18} color={isDark ? '#94A3B8' : '#475569'} />
              </Pressable>
            </View>

            <ScrollView
              style={{ marginTop: 12 }}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : '#F8FAFF',
                    borderColor: isDark ? '#1F2937' : '#E2E8F0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: isDark ? '#0EA5E930' : '#DBEAFE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarIcon size={20} color={isDark ? '#93C5FD' : '#1D4ED8'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#E5E7EB' : '#0F172A', fontWeight: '700', fontSize: 16 }}>
                      Scheduled
                    </Text>
                    <Text style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                      {formattedDate} · {timeLabel}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <Chip label={`Priority: ${reminder.priority}`} color={getPriorityAccent(reminder.priority)} isDark={isDark} />
                  <Chip label={`Status: ${reminder.status}`} color={statusAccent} isDark={isDark} />
                  <Chip label={`Category: ${categoryValue}`} color={palette[categoryValue] || '#6366F1'} isDark={isDark} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <MiniCard
                  icon={<MapPin size={14} color={isDark ? '#CBD5F5' : '#475569'} />}
                  label="Timezone"
                  value={timezone}
                  isDark={isDark}
                />
                <MiniCard
                  icon={<RefreshCcw size={14} color={isDark ? '#CBD5F5' : '#475569'} />}
                  label="Recurrence"
                  value={recurrenceSummary}
                  isDark={isDark}
                />
              </View>

              {reminder.description ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Description
                  </Text>
                  <View
                    style={[
                      styles.notesBlock,
                      {
                        backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(226,232,240,0.4)',
                      },
                    ]}
                  >
                    <Text style={{ color: isDark ? '#E2E8F0' : '#0F172A', lineHeight: 20 }}>
                      {reminder.description}
                    </Text>
                  </View>
                </View>
              ) : null}

              {reminder.tags?.length ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Tags
                  </Text>
                  <View style={styles.tagsRow}>
                    {reminder.tags.map(tag => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={{ color: '#2563EB' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {reminder.notes ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Notes
                  </Text>
                  <View
                    style={[
                      styles.notesBlock,
                      {
                        backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(226,232,240,0.4)',
                      },
                    ]}
                  >
                    <Text style={{ color: isDark ? '#E2E8F0' : '#0F172A', lineHeight: 20 }}>
                      {reminder.notes}
                    </Text>
                  </View>
                </View>
              ) : null}

              {(reminder.clientReference?.id ||
                reminder.clientReference?.device ||
                reminder.clientUpdatedAt ||
                reminder.syncStatus) && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Sync
                  </Text>
                  <View
                    style={[
                      styles.infoCard,
                      {
                        borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.08)',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 6,
                      },
                    ]}
                  >
                    {reminder.syncStatus ? (
                      <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '700' }}>
                        Status: <Text style={{ color: isDark ? '#A5B4FC' : '#2563EB' }}>{reminder.syncStatus}</Text>
                      </Text>
                    ) : null}
                    {reminder.clientReference?.id ? (
                      <Text style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                        Client ID: {reminder.clientReference.id}
                      </Text>
                    ) : null}
                    {reminder.clientReference?.device ? (
                      <Text style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                        Device: {reminder.clientReference.device}
                      </Text>
                    ) : null}
                    {reminder.clientUpdatedAt ? (
                      <Text style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                        Updated: {formatDateTimeInTimeZone(reminder.clientUpdatedAt, timezone, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const getPriorityAccent = (priority: ReminderPriority = 'medium') => {
  switch (priority) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#F59E0B';
    case 'high':
      return '#F97316';
    case 'critical':
      return '#EF4444';
    default:
      return '#818CF8';
  }
};

const getStatusAccent = (status: ReminderStatus = 'pending') => {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    case 'pending':
    default:
      return '#F59E0B';
  }
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildRecurrenceSummary = (reminder: Reminder) => {
  const rec = reminder.recurrence;
  if (!rec || rec.cadence === 'none') return 'Does not repeat';

  const intervalText = rec.interval && rec.interval > 1 ? `every ${rec.interval}` : 'every';
  if (rec.cadence === 'daily') return `${intervalText} day${rec.interval && rec.interval > 1 ? 's' : ''}`;

  if (rec.cadence === 'weekly') {
    const days =
      rec.daysOfWeek && rec.daysOfWeek.length
        ? rec.daysOfWeek.map(d => dayNames[d] || '').filter(Boolean).join(', ')
        : 'day';
    return `${intervalText} week${rec.interval && rec.interval > 1 ? 's' : ''} on ${days}`;
  }

  if (rec.cadence === 'monthly') {
    return `${intervalText} month${rec.interval && rec.interval > 1 ? 's' : ''}`;
  }

  return 'Repeats';
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5,11,21,0.65)',
  },
  sheet: {
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoValue: {
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  notesBlock: {
    borderRadius: 18,
    padding: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  miniCard: {
    flexGrow: 1,
    minWidth: '48%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default ReminderDetailsModal;

const Chip = ({ label, color, isDark }: { label: string; color: string; isDark: boolean }) => (
  <View
    style={{
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: `${color}22`,
      borderWidth: 1,
      borderColor: `${color}55`,
    }}
  >
    <Text style={{ color: isDark ? '#E5E7EB' : '#0F172A', fontWeight: '700', fontSize: 12 }}>{label}</Text>
  </View>
);

const MiniCard = ({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}) => (
  <View
    style={[
      styles.miniCard,
      {
        borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.08)',
        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
      },
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      {icon}
      <Text style={{ color: isDark ? '#CBD5F5' : '#475569', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
    <Text style={{ color: isDark ? '#E5E7EB' : '#0F172A', fontWeight: '700' }}>{value}</Text>
  </View>
);
