/**
 * Timezone Utilities (Frontend)
 *
 * Mirrors backend timezone helpers so the mobile/desktop clients can resolve
 * user-preferred timezones, convert local date parts into UTC ISO strings for
 * API payloads, and format UTC timestamps for a specific timezone when
 * rendering. Keeping the logic centralized prevents subtle drift between
 * clients and backend validation rules.
 */

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
};

let cachedDeviceTimezone: string | null = null;

/**
 * Validates a timezone identifier. Falls back to UTC when the identifier is
 * missing or not supported by the running JS engine.
 */
export const ensureTimeZone = (timeZone?: string): string => {
  const candidate = (timeZone || '').trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch (error) {
    console.warn(`Invalid timezone "${candidate}", defaulting to UTC.`, error);
    return 'UTC';
  }
};

/**
 * Returns the device/browser timezone once and memoizes the value to avoid
 * repeated Intl lookups.
 */
export const getDeviceTimezone = (): string => {
  if (cachedDeviceTimezone) {
    return cachedDeviceTimezone;
  }
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    cachedDeviceTimezone = ensureTimeZone(resolved);
  } catch (error) {
    console.warn('Unable to resolve device timezone, falling back to UTC.', error);
    cachedDeviceTimezone = 'UTC';
  }
  return cachedDeviceTimezone;
};

/**
 * Resolves the timezone for outbound requests. Prefers the provided value
 * but gracefully falls back to the current device timezone.
 */
export const resolveTimezone = (preferred?: string): string => {
  if (preferred?.trim()) {
    return ensureTimeZone(preferred.trim());
  }
  return getDeviceTimezone();
};

const getTimeZoneOffset = (timeZone: string, date: Date): number => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date).reduce<Record<string, number>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});

  const asUTC = Date.UTC(
    parts.year,
    (parts.month || 1) - 1,
    parts.day || 1,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0
  );

  return (asUTC - date.getTime()) / 60000;
};

const convertLocalPartsToUTC = (parts: DateParts, timeZone: string): Date => {
  const local = new Date(
    Date.UTC(
      parts.year,
      (parts.month || 1) - 1,
      parts.day || 1,
      parts.hour || 0,
      parts.minute || 0,
      parts.second || 0,
      parts.millisecond || 0
    )
  );
  const offsetMinutes = getTimeZoneOffset(timeZone, local);
  return new Date(local.getTime() - offsetMinutes * 60000);
};

/**
 * Converts a YYYY-MM-DD + HH:mm representation (expressed in the specified
 * timezone) into a UTC ISO string for API payloads.
 */
export const convertLocalDateTimeToISO = (
  dateKey: string,
  timeValue: string,
  timeZone?: string
): string => {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error('Date must be provided in YYYY-MM-DD format.');
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour = 0, minute = 0] = (timeValue || '00:00').split(':').map(Number);
  const safeZone = resolveTimezone(timeZone);

  const utcDate = convertLocalPartsToUTC(
    {
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
      millisecond: 0,
    },
    safeZone
  );

  return utcDate.toISOString();
};

/**
 * Formats a UTC timestamp for a specific timezone using Intl.DateTimeFormat.
 */
export const formatDateTimeInTimeZone = (
  dateValue: Date | string | number,
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const safeZone = resolveTimezone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    ...options,
  }).format(date);
};

/**
 * Parses a YYYY-MM-DD key into a Date anchored to local noon to avoid DST
 * rollbacks when formatting.
 */
export const parseDateKey = (dateKey: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  const [, year, month, day] = match;
  const parsed = new Date();
  parsed.setFullYear(Number(year), Number(month) - 1, Number(day));
  parsed.setHours(12, 0, 0, 0);
  return parsed;
};

/**
 * Generates a friendly label (e.g., "Thursday, April 18") for a YYYY-MM-DD key.
 */
export const formatDateKeyForDisplay = (dateKey: string, locale = 'en-US'): string => {
  try {
    const parsed = parseDateKey(dateKey);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(parsed);
  } catch (error) {
    console.warn('Failed to format date key for display:', error);
    return dateKey;
  }
};
