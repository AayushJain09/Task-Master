import type { ReminderStub } from './data';

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

/**
 * Creates a concrete Date instance from a reminder's date + time strings.
 */
export function getReminderDate(reminder: ReminderStub) {
  const [hours, minutes] = reminder.time.split(':').map(Number);
  const date = new Date(reminder.date);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

/**
 * Sorts reminders in ascending chronological order.
 */
export function sortReminders(reminders: ReminderStub[]) {
  return [...reminders].sort((a, b) => getReminderDate(a).getTime() - getReminderDate(b).getTime());
}

/**
 * Generates a short relative label (e.g., "in 2h", "Fri") for timeline cards.
 */
export function formatRelativeLabel(date: Date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 0) {
    return 'Starting soon';
  }
  if (diffMinutes < 60) {
    return `in ${diffMinutes}m`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `in ${diffHours}h`;
  }
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatDayLabel(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
