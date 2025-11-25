import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReminderStub, palette } from './data';
import { Pencil, Trash2 } from 'lucide-react-native';

export interface UpcomingListItem {
  reminder: ReminderStub;
  timeLabel: string;
  relativeLabel: string;
}

interface UpcomingListProps {
  isDark: boolean;
  items: UpcomingListItem[];
  onReminderPress?: (reminder: ReminderStub) => void;
  onEditPress?: (reminder: ReminderStub) => void;
  onDeletePress?: (reminder: ReminderStub) => void;
  deletingReminderId?: string | null;
}

/**
 * UpcomingList
 *
 * Compact stacked cards that preview the next few reminders. Each card surfaces
 * the scheduled time, contextual relative label, and inherits the palette color
 * for the reminder category so it matches the dots in the calendar.
 */
export const UpcomingList: React.FC<UpcomingListProps> = ({
  isDark,
  items,
  onReminderPress,
  onEditPress,
  onDeletePress,
  deletingReminderId,
}) => {
  if (items.length === 0) {
    return (
      <View
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#E2E8F0',
          backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : '#FFFFFF',
        }}
      >
        <Text style={{ color: isDark ? '#94A3B8' : '#475569', fontSize: 13 }}>
          Nothing queued in this filter. Tap the calendar to schedule something new.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 12, gap: 12 }}>
      {items.map(item => (
        <Pressable key={item.reminder.occurrenceKey} onPress={() => onReminderPress?.(item.reminder)}>
          <LinearGradient
            colors={isDark ? ['#0B1220', '#050B15'] : ['#FFFFFF', '#F8FBFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: `${palette[item.reminder.category]}33`,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                >
                  {item.reminder.title}
                </Text>
                <Text style={{ marginTop: 4, color: isDark ? '#94A3B8' : '#475569', fontSize: 12 }}>
                  {item.relativeLabel}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '700', color: isDark ? '#F8FAFC' : '#0F172A' }}>{item.timeLabel}</Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: isDark ? '#94A3B8' : '#64748B',
                  }}
                >
                  {item.reminder.category}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
                  <Pressable
                    onPress={event => {
                      event.stopPropagation();
                      onEditPress?.(item.reminder);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Pencil size={16} color={isDark ? '#E2E8F0' : '#0F172A'} />
                  </Pressable>
                  <Pressable
                    onPress={event => {
                      event.stopPropagation();
                      onDeletePress?.(item.reminder);
                    }}
                    style={{ padding: 4, opacity: deletingReminderId === item.reminder.id ? 0.4 : 1 }}
                    disabled={deletingReminderId === item.reminder.id}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
};
