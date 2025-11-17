/**
 * Timezone Utilities
 *
 * Provides helper functions to safely interpret, convert, and format dates
 * using IANA timezone identifiers. These helpers mirror the reminder module's
 * behavior so that tasks, dashboards, and analytics can consistently work with
 * user-specific local times while persisting UTC timestamps in MongoDB.
 *
 * @module utils/timezone
 */

/**
 * Validates timezone identifiers. Falls back to UTC when the provided timezone
 * is invalid or not supported by the current Node runtime.
 *
 * @param {string} timeZone - Candidate IANA timezone identifier
 * @returns {string} Safe timezone identifier
 */
const ensureTimeZone = (timeZone = 'UTC') => {
  const zone = timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch (error) {
    console.warn(`Invalid timezone "${zone}", falling back to UTC.`);
    return 'UTC';
  }
};

/**
 * Computes the timezone offset (in minutes) for a specific timezone at a
 * specific moment in time.
 *
 * @param {string} timeZone - IANA timezone
 * @param {Date} [date=new Date()] - Date instance
 * @returns {number} Offset in minutes between UTC and the timezone
 */
const getTimeZoneOffset = (timeZone, date = new Date()) => {
  const safeZone = ensureTimeZone(timeZone);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const values = {};
  for (const { type, value } of parts) {
    if (type !== 'literal') {
      values[type] = value;
    }
  }

  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return (asUTC - date.getTime()) / 60000;
};

/**
 * Converts a set of local date parts (year, month, day, etc.) defined in a
 * specific timezone into a UTC Date instance for storage.
 *
 * @param {Object} parts
 * @param {number} parts.year
 * @param {number} parts.month - 1-based
 * @param {number} parts.day
 * @param {number} [parts.hour=0]
 * @param {number} [parts.minute=0]
 * @param {number} [parts.second=0]
 * @param {number} [parts.millisecond=0]
 * @param {string} [timeZone='UTC']
 * @returns {Date}
 */
const convertLocalPartsToUTC = (parts, timeZone = 'UTC') => {
  const safeZone = ensureTimeZone(timeZone);
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = parts;

  const local = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const offsetMinutes = getTimeZoneOffset(safeZone, local);
  return new Date(local.getTime() - offsetMinutes * 60000);
};

/**
 * Determines whether a string resembles a date-only value (YYYY-MM-DD).
 *
 * @param {string} input
 * @returns {boolean}
 */
const isDateOnlyString = (input) => /^\d{4}-\d{2}-\d{2}$/.test(input?.trim());

/**
 * Attempts to convert arbitrary input (Date, timestamp, ISO string, or date-only
 * string) into a UTC Date. Date-only strings are interpreted relative to the
 * provided timezone (start of day unless overrideParts is provided).
 *
 * @param {Date|string|number} input
 * @param {Object} [options]
 * @param {string} [options.timeZone='UTC']
 * @param {Object} [options.overrideParts] - Optional hour/min/sec overrides
 * @returns {Date}
 */
const parseDateInputToUTC = (input, options = {}) => {
  const { timeZone = 'UTC', overrideParts } = options;
  if (input === null || input === undefined) {
    throw new Error('Date value is required.');
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('Invalid Date instance received.');
    }
    return new Date(input.getTime());
  }

  if (typeof input === 'number') {
    const asDate = new Date(input);
    if (Number.isNaN(asDate.getTime())) {
      throw new Error('Invalid timestamp provided.');
    }
    return asDate;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (isDateOnlyString(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      const baseParts = { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 };
      const merged = overrideParts ? { ...baseParts, ...overrideParts } : baseParts;
      return convertLocalPartsToUTC(merged, timeZone);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Unable to parse date string.');
    }
    return parsed;
  }

  throw new Error(`Unsupported date input type: ${typeof input}`);
};

/**
 * Returns the start-of-day (00:00:00.000) for the provided reference moment
 * expressed in a particular timezone, converted to UTC for storage/comparison.
 *
 * @param {string} timeZone
 * @param {Date} [referenceDate=new Date()]
 * @returns {Date}
 */
const formatPartsToDateOnly = (parts) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const getStartOfDayUTC = (timeZone, referenceDate = new Date()) => {
  const safeZone = ensureTimeZone(timeZone);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(referenceDate).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});

  return parseDateInputToUTC(formatPartsToDateOnly(parts), { timeZone: safeZone });
};

/**
 * Returns the end-of-day (23:59:59.999) for the provided reference moment
 * expressed in a particular timezone, converted to UTC for storage/comparison.
 *
 * @param {string} timeZone
 * @param {Date} [referenceDate=new Date()]
 * @returns {Date}
 */
const getEndOfDayUTC = (timeZone, referenceDate = new Date()) => {
  const safeZone = ensureTimeZone(timeZone);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(referenceDate).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});

  return parseDateInputToUTC(formatPartsToDateOnly(parts), {
    timeZone: safeZone,
    overrideParts: { hour: 23, minute: 59, second: 59, millisecond: 999 },
  });
};

/**
 * Returns plain object components representing "now" in the specified timezone.
 * Useful for building user-facing displays or for reuse in analytics logic.
 *
 * @param {string} timeZone
 * @returns {{ date: Date, parts: { year:number, month:number, day:number, hour:number, minute:number, second:number } }}
 */
const getNowInTimeZone = (timeZone = 'UTC') => {
  const safeZone = ensureTimeZone(timeZone);
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});

  const zonedDate = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  ));

  return {
    date: zonedDate,
    parts,
  };
};

/**
 * Resolves a timezone identifier from a request object by inspecting common
 * locations (body, query, headers, user profile). Falls back to UTC when
 * unspecified or invalid. Stores the normalized timezone on the request for
 * downstream reuse.
 *
 * @param {Object} req - Express request object
 * @param {string} [fallback='UTC'] - Fallback timezone when none provided
 * @returns {string} Normalized timezone identifier
 */
const resolveTimezoneFromRequest = (req = {}, fallback = 'UTC') => {
  const candidate =
    req?.body?.timezone ||
    req?.query?.timezone ||
    req?.headers?.['x-user-timezone'] ||
    req?.user?.preferredTimezone ||
    req?.user?.timezone ||
    req?.userDoc?.timezone;

  const timezone = ensureTimeZone(candidate || fallback);
  if (req) {
    req.requestedTimezone = timezone;
  }
  return timezone;
};

/**
 * Builds localized date/time metadata for a given value relative to the provided timezone.
 *
 * @param {Date|string|number} dateValue
 * @param {string} timeZone
 * @returns {Object|null}
 */
const buildLocalizedDateTimeMetadata = (dateValue, timeZone = 'UTC') => {
  if (!dateValue) return null;
  const dateObj =
    dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(dateObj.getTime())) {
    return null;
  }

  const safeZone = ensureTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(dateObj)
    .reduce((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const localDate = `${parts.year}-${parts.month}-${parts.day}`;
  const localTime = `${parts.hour}:${parts.minute}`;
  const localIso = `${localDate}T${parts.hour}:${parts.minute}:${parts.second}`;
  const display = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dateObj);

  return {
    localTimezone: safeZone,
    localDate,
    localTime,
    localDateTimeISO: localIso,
    localDateTimeDisplay: display,
  };
};

module.exports = {
  ensureTimeZone,
  getTimeZoneOffset,
  convertLocalPartsToUTC,
  parseDateInputToUTC,
  getStartOfDayUTC,
  getEndOfDayUTC,
  getNowInTimeZone,
  isDateOnlyString,
  resolveTimezoneFromRequest,
  buildLocalizedDateTimeMetadata,
};
