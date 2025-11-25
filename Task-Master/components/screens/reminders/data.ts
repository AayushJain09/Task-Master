import type { ReminderCategory } from '@/types/reminder.types';

export type ReminderStub = {
  id: string;
  occurrenceKey: string;
  title: string;
  date: string; // Local YYYY-MM-DD
  time: string; // 24h HH:mm representation in local timezone
  timeDisplay: string; // Friendly label (e.g., "9:00 AM")
  timezone: string;
  scheduledAtUtc: string; // Original ISO timestamp returned by backend
  localDisplay?: string;
  category: ReminderCategory;
};

export const palette: Record<ReminderCategory, string> = {
  work: '#60A5FA',
  personal: '#F472B6',
  health: '#34D399',
  deadline: '#F87171',
};
