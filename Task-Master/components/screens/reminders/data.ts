import type { ReminderCategory } from '@/types/reminder.types';

export type ReminderStub = {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  time: string;
  category: ReminderCategory;
};

export const palette: Record<ReminderCategory, string> = {
  work: '#60A5FA',
  personal: '#F472B6',
  health: '#34D399',
  deadline: '#F87171',
};
