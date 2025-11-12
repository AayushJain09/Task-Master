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

const today = new Date();

export const stubReminders: ReminderStub[] = [
  {
    id: '1',
    title: 'Sprint review sync',
    date: formatDateKey(today),
    time: '10:00',
    category: 'work',
  },
  {
    id: '2',
    title: 'Submit design mock',
    date: formatDateKey(addDays(today, 1)),
    time: '16:30',
    category: 'deadline',
  },
  {
    id: '3',
    title: 'Morning run',
    date: formatDateKey(today),
    time: '06:00',
    category: 'health',
  },
  {
    id: '4',
    title: 'Coffee with Priya',
    date: formatDateKey(addDays(today, 2)),
    time: '15:00',
    category: 'personal',
  },
  {
    id: '5',
    title: 'QA sync',
    date: formatDateKey(addDays(today, -1)),
    time: '13:00',
    category: 'work',
  },
  {
    id: '6',
    title: 'Send invoice draft',
    date: formatDateKey(addDays(today, 3)),
    time: '11:30',
    category: 'deadline',
  },
  {
    id: '7',
    title: 'Therapy session',
    date: formatDateKey(today),
    time: '09:00',
    category: 'personal',
  },
  {
    id: '8',
    title: 'Yoga cooldown',
    date: formatDateKey(today),
    time: '07:15',
    category: 'health',
  },
  {
    id: '9',
    title: 'Project status blast',
    date: formatDateKey(today),
    time: '17:00',
    category: 'work',
  },
  {
    id: '10',
    title: 'Teammate birthday ping',
    date: formatDateKey(addDays(today, 6)),
    time: '08:30',
    category: 'personal',
  },
];
