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
import { Calendar as CalendarIcon, Clock, Tag as TagIcon, MapPin, X } from 'lucide-react-native';
import type { Reminder, ReminderCategory } from '@/types/reminder.types';
import { palette } from './data';
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

  const scheduledDate = new Date(reminder.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const categoryValue = (reminder.category || 'personal') as ReminderCategory;

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
              <InfoCard
                icon={<CalendarIcon size={16} color={isDark ? '#CBD5F5' : '#475569'} />}
                label="Scheduled for"
                value={`${formattedDate} at ${timeLabel}`}
                isDark={isDark}
              />
              <InfoCard
                icon={<Clock size={16} color={isDark ? '#CBD5F5' : '#475569'} />}
                label="Priority"
                value={reminder.priority}
                pillColor={getPriorityAccent(reminder.priority)}
                isDark={isDark}
              />
              <InfoCard
                icon={<MapPin size={16} color={isDark ? '#CBD5F5' : '#475569'} />}
                label="Timezone"
                value={reminder.timezone}
                isDark={isDark}
              />
              <InfoCard
                icon={<TagIcon size={16} color={isDark ? '#CBD5F5' : '#475569'} />}
                label="Category"
                value={categoryValue}
                pillColor={palette[categoryValue] || '#818CF8'}
                isDark={isDark}
              />

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
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const InfoCard = ({
  icon,
  label,
  value,
  isDark,
  pillColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
  pillColor?: string;
}) => (
  <View
    style={[
      styles.infoCard,
      {
        borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.08)',
        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
      },
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <Text style={{ color: isDark ? '#CBD5F5' : '#64748B', fontSize: 13 }}>{label}</Text>
    </View>
    <Text
      style={[
        styles.infoValue,
        {
          color: isDark ? '#F8FAFC' : '#0F172A',
          backgroundColor: pillColor ? `${pillColor}22` : 'transparent',
          borderColor: pillColor ? `${pillColor}55` : 'transparent',
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

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
});

export default ReminderDetailsModal;
