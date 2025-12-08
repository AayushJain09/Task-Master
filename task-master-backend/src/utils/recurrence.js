/**
 * Recurrence Utilities
 *
 * Expands reminder recurrence rules into concrete occurrences within a
 * provided window while respecting timezone and cadence semantics.
 */

const {
  ensureTimeZone,
  buildLocalizedDateTimeMetadata,
} = require("./timezone");

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const weekdayToIndex = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Given a UTC Date and Find the local weekday in the reminder's timezone
const getDayInTimeZone = (date, timeZone) => {
  const safeZone = ensureTimeZone(timeZone);
  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: safeZone,
  });
  return weekdayToIndex[label] ?? date.getUTCDay();
};

/**
 * Expands a reminder into occurrences between windowStart and windowEnd (inclusive).
 *
 * @param {Object} reminder - Reminder document
 * @param {Date} windowStart - Inclusive window start (UTC)
 * @param {Date} windowEnd - Inclusive window end (UTC)
 * @returns {Array<{ occurrenceDate: Date, localMeta: Object }>}
 */
const expandReminderOccurrences = (reminder, windowStart, windowEnd) => {
  const results = [];
  if (!reminder) return results;

  const recurrence = reminder.recurrence || {};
  const cadence = recurrence.cadence || "none";
  const timeZone = ensureTimeZone(reminder.timezone || "UTC");
  // This is the date when the reminder should start repeating.
  const anchor = recurrence.anchorDate
    ? new Date(recurrence.anchorDate)
    : new Date(reminder.scheduledAt);
  if (Number.isNaN(anchor.getTime())) return results;

  const clampWindowStart = windowStart || new Date();
  const clampWindowEnd =
    windowEnd || new Date(clampWindowStart.getTime() + 90 * MS_IN_DAY);

  const pushIfInWindow = (occurrenceDate) => {
    if (occurrenceDate < clampWindowStart || occurrenceDate > clampWindowEnd) return;
    const localMeta = buildLocalizedDateTimeMetadata(occurrenceDate, timeZone);
    results.push({
      occurrenceDate,
      localMeta,
    });
  };

  if (cadence === "none" || !recurrence.cadence) {
    pushIfInWindow(anchor);
    return results;
  }

  const maxOccurrences = 400;

  if (cadence === "daily") {
    const interval = Math.max(1, recurrence.interval || 1);
    const startOffset = Math.max(0, Math.floor((clampWindowStart - anchor) / MS_IN_DAY));
    let current = new Date(anchor.getTime() + startOffset * MS_IN_DAY);
    // Align to interval
    const offsetMod = startOffset % interval;
    if (offsetMod !== 0) {
      current = new Date(
        current.getTime() + (interval - offsetMod) * MS_IN_DAY
      );
    }
    while (current <= clampWindowEnd && results.length < maxOccurrences) {
      pushIfInWindow(current);
      current = new Date(current.getTime() + interval * MS_IN_DAY);
    }
    return results;
  }

  if (cadence === "weekly") {
    const intervalWeeks = Math.max(1, recurrence.interval || 1);
    const daysOfWeek =
      recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0
        ? recurrence.daysOfWeek
        : [getDayInTimeZone(anchor, timeZone)];

    const startOffset = Math.max(0, Math.floor((clampWindowStart - anchor) / MS_IN_DAY) - 7);
    for (let dayOffset = startOffset; results.length < maxOccurrences; dayOffset += 1) {
      const candidate = new Date(anchor.getTime() + dayOffset * MS_IN_DAY);
      if (candidate > clampWindowEnd) break;

      const weeksSinceAnchor = Math.floor(dayOffset / 7);
      if (weeksSinceAnchor < 0 || weeksSinceAnchor % intervalWeeks !== 0)
        continue;

      const candidateWeekday = getDayInTimeZone(candidate, timeZone);
      if (!daysOfWeek.includes(candidateWeekday)) continue;

      pushIfInWindow(candidate);
    }
    return results;
  }

  if (cadence === "monthly") {
    const intervalMonths = Math.max(1, recurrence.interval || 1);
    const anchorDay = anchor.getUTCDate();
    const anchorTime = {
      hours: anchor.getUTCHours(),
      minutes: anchor.getUTCMinutes(),
      seconds: anchor.getUTCSeconds(),
      ms: anchor.getUTCMilliseconds(),
    };

    const pushMonthlyOccurrence = (startMonthOffset) => {
      const base = new Date(
        Date.UTC(
          anchor.getUTCFullYear(),
          anchor.getUTCMonth() + startMonthOffset,
          1,
          anchorTime.hours,
          anchorTime.minutes,
          anchorTime.seconds,
          anchorTime.ms
        )
      );
      const daysInTargetMonth = new Date(
        Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
      ).getUTCDate();
      const targetDay = Math.min(anchorDay, daysInTargetMonth);
      const candidate = new Date(
        Date.UTC(
          base.getUTCFullYear(),
          base.getUTCMonth(),
          targetDay,
          anchorTime.hours,
          anchorTime.minutes,
          anchorTime.seconds,
          anchorTime.ms
        )
      );
      pushIfInWindow(candidate);
      return candidate;
    };

    const totalMonths = Math.ceil((clampWindowEnd - anchor) / (30 * MS_IN_DAY)) + 1;
    let monthOffset = Math.max(0, Math.floor((clampWindowStart - anchor) / (30 * MS_IN_DAY)));
    // Align to interval
    if (monthOffset % intervalMonths !== 0) {
      monthOffset += intervalMonths - (monthOffset % intervalMonths);
    }

    let iterations = 0;
    while (iterations < totalMonths && results.length < maxOccurrences) {
      const candidate = pushMonthlyOccurrence(monthOffset);
      if (candidate > clampWindowEnd) break;
      monthOffset += intervalMonths;
      iterations += 1;
    }
    return results;
  }

  // Custom or unsupported cadence: include only the anchor if in window
  pushIfInWindow(anchor);
  return results;
};

module.exports = {
  expandReminderOccurrences,
};
