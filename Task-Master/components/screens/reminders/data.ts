import { formatDateKey, addDays } from './utils';

export type ReminderCategory = 'work' | 'personal' | 'health' | 'deadline';

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

export const stubReminders: ReminderStub[] = [
  {
    id: '1',
    title: 'Sprint review sync',
    date: formatDateKey(new Date()),
    time: '10:00',
    category: 'work',
  },
  {
    id: '2',
    title: 'Submit design mock',
    date: formatDateKey(addDays(new Date(), 1)),
    time: '16:30',
    category: 'deadline',
  },
  {
    id: '3',
    title: 'Morning run',
    date: formatDateKey(new Date()),
    time: '06:00',
    category: 'health',
  },
  {
    id: '4',
    title: 'Coffee with Priya',
    date: formatDateKey(addDays(new Date(), 2)),
    time: '15:00',
    category: 'personal',
  },
];
