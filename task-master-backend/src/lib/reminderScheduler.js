const { getAgenda, initAgenda } = require('./agenda');
const { expandReminderOccurrences } = require('../utils/recurrence');
const Reminder = require('../models/Reminder');

// ensure, if agenda is intialised or not 
async function ensureAgenda() {
  let a = getAgenda();
  if (!a) {
    a = await initAgenda();
  }
  return a;
}

/**
 * Helper for Canceling all agenda jobs for a reminder.
 */
async function cancelJobsForReminder(reminderId) {
  const agenda = await ensureAgenda();
  const removed = await agenda.cancel({ 'data.reminderId': reminderId.toString() });
  return removed;
}

/**
 * Schedule next N occurrences for a reminder.
 * We'll schedule occurrences in a horizon (e.g., next 30 days) to avoid creating thousands of jobs.
 */
async function scheduleOccurrencesForReminder(reminder, { horizonDays = 30 } = {}) {
  if (!reminder || !reminder._id) return;

  const agenda = await ensureAgenda();

  // compute window from now to horizon
  const now = new Date();
  const windowEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const occurrences = expandReminderOccurrences(reminder, now, windowEnd);
  for (const occ of occurrences) {
    const occISO = occ.occurrenceDate.toISOString();
    // create unique job
    await agenda.create('sendReminder', { reminderId: reminder._id.toString(), occurrenceDate: occISO })
      .unique({ 'data.reminderId': reminder._id.toString(), 'data.occurrenceDate': occISO })
      .schedule(occ.occurrenceDate)
      .save();
  }
}

/**
 * Cancel then schedule (used on create/update)
 */
async function rescheduleReminder(reminder, opts = {}) {
  await cancelJobsForReminder(reminder._id);
  // If reminder is deleted or status not appropriate, skip scheduling
  if (reminder.isDeleted) return;
  await scheduleOccurrencesForReminder(reminder, opts);
}

module.exports = {
  ensureAgenda,
  cancelJobsForReminder,
  scheduleOccurrencesForReminder,
  rescheduleReminder,
};
