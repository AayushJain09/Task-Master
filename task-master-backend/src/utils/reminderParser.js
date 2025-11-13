/**
 * Reminder Date Parsing Utilities
 *
 * Provides natural language parsing helpers used by the reminder controller to
 * convert quick-add text such as "call Alex next Tue 3p" into structured data.
 *
 * The goal is not to be a full NLP engine, but to reliably cover the high-value
 * phrases we expect from a productivity workflow:
 * - Relative keywords (today, tomorrow, tonight)
 * - Weekday lookups with "next" modifiers
 * - Relative offsets ("in 45 minutes", "in 2 hours", "in 3 days")
 * - Explicit ISO-like dates (2024-12-01) and HH:mm / 3p style times
 *
 * All conversions are timezone-aware and return unified UTC timestamps so the
 * mobile/web clients can render the reminder correctly regardless of device.
 *
 * @module utils/reminderParser
 */

const WEEKDAY_MAP = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const DEFAULT_TIME = { hour: 9, minute: 0 };
const TONIGHT_FALLBACK_TIME = { hour: 20, minute: 0 };

/**
 * Validates timezone identifiers. Falls back to UTC when the provided timezone
 * is invalid or not supported by the current Node runtime.
 *
 * @param {string} timeZone - Candidate IANA timezone identifier
 * @returns {string} Safe timezone identifier
 */
const ensureTimeZone = (timeZone = 'UTC') => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch (error) {
    console.warn(`Invalid timezone "${timeZone}", falling back to UTC.`);
    return 'UTC';
  }
};

/**
 * Computes the timezone offset (in minutes) for a specific timezone at a
 * specific moment in time.
 *
 * @param {string} timeZone - IANA timezone
 * @param {Date} date - Date instance
 * @returns {number} Offset in minutes between UTC and the timezone
 */
const getTimeZoneOffset = (timeZone, date = new Date()) => {
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
 * Converts a local date constructed in a specific timezone into a UTC Date
 * instance so MongoDB can store it consistently.
 *
 * @param {Object} parts - Components representing the local datetime
 * @param {number} parts.year
 * @param {number} parts.month - 1-based
 * @param {number} parts.day
 * @param {number} parts.hour
 * @param {number} parts.minute
 * @param {string} timeZone - IANA timezone identifier
 * @returns {Date} UTC date
 */
const convertLocalPartsToUTC = (parts, timeZone = 'UTC') => {
  const safeZone = ensureTimeZone(timeZone);
  const utcDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  );
  const offsetMinutes = getTimeZoneOffset(safeZone, utcDate);
  return new Date(utcDate.getTime() - offsetMinutes * 60000);
};

/**
 * Finds the next occurrence of the requested weekday relative to the base date.
 *
 * @param {Date} baseDate - Starting date
 * @param {number} targetWeekday - Target weekday index (0-6)
 * @returns {Date} Date representing next weekday occurrence
 */
const getNextWeekday = (baseDate, targetWeekday) => {
  const result = new Date(baseDate);
  const currentDay = result.getDay();
  let delta = targetWeekday - currentDay;
  if (delta <= 0) {
    delta += 7;
  }
  result.setDate(result.getDate() + delta);
  return result;
};

/**
 * Extracts the first regex match from the input and removes it from the string.
 *
 * @param {RegExp} regex - Regular expression with global flag
 * @param {string} input - Input text
 * @returns {{ match: RegExpMatchArray|null, remainder: string }}
 */
const consumeMatch = (regex, input) => {
  const match = regex.exec(input);
  if (!match) {
    return { match: null, remainder: input };
  }
  const remainder =
    input.slice(0, match.index).trim() + ' ' + input.slice(match.index + match[0].length).trim();
  return { match, remainder: remainder.trim().replace(/\s{2,}/g, ' ') };
};

/**
 * Parses natural language quick-add text into a structured reminder payload.
 *
 * @param {string} rawInput - User provided quick-add text
 * @param {Object} options
 * @param {string} [options.timeZone='UTC'] - Timezone used for interpretation
 * @param {Date} [options.now=new Date()] - Base date
 * @returns {Object} Parsed payload containing title, scheduledAt, metadata
 */
const parseNaturalLanguageReminder = (rawInput, options = {}) => {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Quick-add text is required.');
  }

  const context = {
    original: rawInput,
    working: rawInput.trim(),
    detectedPhrases: [],
    now: options.now || new Date(),
    timeZone: ensureTimeZone(options.timeZone || 'UTC'),
    relativeTarget: null,
    time: { ...DEFAULT_TIME, explicit: false },
    dateParts: null,
  };

  // Time extraction (supports "at 14:30", "3pm", "3 p", "0930")
  const timeRegex = /(?:\b|^)(?:at\s+)?(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?\b/i;
  const { match: timeMatch, remainder: afterTime } = consumeMatch(timeRegex, context.working);
  if (timeMatch) {
    context.time.explicit = true;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (meridiem) {
      if (hour === 12) {
        hour = meridiem.startsWith('a') ? 0 : 12;
      } else if (meridiem.startsWith('p')) {
        hour += 12;
      }
    }

    if (!meridiem && hour <= 6) {
      // Interpret bare "3" as 3 PM since most reminders are afternoon
      hour += 12;
    }

    context.time.hour = hour;
    context.time.minute = minute;
    context.detectedPhrases.push(timeMatch[0].trim());
    context.working = afterTime.trim();
  }

  // Absolute ISO date e.g., 2024-12-31
  const isoDateRegex = /\b(20\d{2}|19\d{2})-(\d{1,2})-(\d{1,2})\b/;
  const { match: isoDateMatch, remainder: afterIso } = consumeMatch(isoDateRegex, context.working);
  if (isoDateMatch) {
    context.dateParts = {
      year: Number(isoDateMatch[1]),
      month: Number(isoDateMatch[2]),
      day: Number(isoDateMatch[3]),
    };
    context.detectedPhrases.push(isoDateMatch[0]);
    context.working = afterIso;
  }

  // Simple month/day formats like 12/31 or 31/12
  if (!context.dateParts) {
    const shortDateRegex = /\b(\d{1,2})\/(\d{1,2})\b/;
    const { match: shortDateMatch, remainder: afterShort } = consumeMatch(
      shortDateRegex,
      context.working
    );
    if (shortDateMatch) {
      const nowYear = context.now.getFullYear();
      context.dateParts = {
        year: nowYear,
        month: Number(shortDateMatch[1]),
        day: Number(shortDateMatch[2]),
      };
      context.detectedPhrases.push(shortDateMatch[0]);
      context.working = afterShort;
    }
  }

  // Weekday phrases: "next tue", "next monday"
  if (!context.dateParts) {
    const weekdayRegex = /\bnext\s+(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i;
    const { match: weekdayMatch, remainder: afterWeekday } = consumeMatch(
      weekdayRegex,
      context.working
    );
    if (weekdayMatch) {
      const weekday = WEEKDAY_MAP[weekdayMatch[1].toLowerCase()];
      const target = getNextWeekday(context.now, weekday);
      context.dateParts = {
        year: target.getFullYear(),
        month: target.getMonth() + 1,
        day: target.getDate(),
      };
      context.detectedPhrases.push(weekdayMatch[0]);
      context.working = afterWeekday;
    }
  }

  // Relative keywords: tomorrow, today, tonight
  if (!context.dateParts) {
    const keywordRegex = /\b(today|tomorrow|tonight)\b/i;
    const { match: keywordMatch, remainder: afterKeyword } = consumeMatch(
      keywordRegex,
      context.working
    );
    if (keywordMatch) {
      const keyword = keywordMatch[1].toLowerCase();
      const actingDate = new Date(context.now);
      if (keyword === 'tomorrow') {
        actingDate.setDate(actingDate.getDate() + 1);
      }
      context.dateParts = {
        year: actingDate.getFullYear(),
        month: actingDate.getMonth() + 1,
        day: actingDate.getDate(),
      };
      if (keyword === 'tonight' && !context.time.explicit) {
        context.time = { ...TONIGHT_FALLBACK_TIME, explicit: true };
      }
      context.detectedPhrases.push(keywordMatch[0]);
      context.working = afterKeyword;
    }
  }

  // Relative offsets: "in 2 hours", "in 30 minutes", "in 3 days"
  const relativeRegex = /\bin\s+(\d+)\s+(minutes?|minute|hours?|hour|days?|day)\b/i;
  const { match: relativeMatch, remainder: afterRelative } = consumeMatch(
    relativeRegex,
    context.working
  );
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const multiplier =
      unit.startsWith('minute') ? 60 * 1000 : unit.startsWith('hour') ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    context.relativeTarget = new Date(context.now.getTime() + amount * multiplier);
    context.detectedPhrases.push(relativeMatch[0]);
    context.working = afterRelative;
  }

  let scheduledAt;
  if (context.relativeTarget) {
    scheduledAt = context.relativeTarget;
  } else {
    const dateParts =
      context.dateParts || {
        year: context.now.getFullYear(),
        month: context.now.getMonth() + 1,
        day: context.now.getDate() + (context.time.explicit ? 0 : 0),
      };

    scheduledAt = convertLocalPartsToUTC(
      {
        year: dateParts.year,
        month: dateParts.month,
        day: dateParts.day,
        hour: context.time.hour,
        minute: context.time.minute,
      },
      context.timeZone
    );

    if (!context.dateParts && scheduledAt < context.now) {
      // Avoid scheduling in the past when only time was provided; bump to tomorrow.
      scheduledAt = convertLocalPartsToUTC(
        {
          year: dateParts.year,
          month: dateParts.month,
          day: dateParts.day + 1,
          hour: context.time.hour,
          minute: context.time.minute,
        },
        context.timeZone
      );
    }
  }

  const normalizedTitle = context.working.trim() || rawInput.trim();

  return {
    title: normalizedTitle,
    scheduledAt,
    timezone: context.timeZone,
    detectedPhrases: context.detectedPhrases,
    source: rawInput,
  };
};

module.exports = {
  parseNaturalLanguageReminder,
  convertLocalPartsToUTC,
  ensureTimeZone,
};
