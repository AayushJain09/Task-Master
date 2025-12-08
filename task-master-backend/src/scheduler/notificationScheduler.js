const agenda = require("./agenda");
const Reminder = require("../models/Reminder");
const { expandReminderOccurrences } = require("../utils/recurrence");

async function scheduleUpcomingReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000); // next 5 minutes

  const reminders = await Reminder.find({ isDeleted: false }).lean(); 
  reminders.forEach(rem => {
    const occurrences = expandReminderOccurrences(rem, now, windowEnd);
    occurrences.forEach(o => {
      agenda.schedule(o.occurrenceDate, "send reminder", {
        reminderId: rem._id.toString(), //whom to send reminder 
        occurrenceDate: o.occurrenceDate, //when the reminder was scheduled
      });
    });
  });
}

module.exports = { scheduleUpcomingReminders };
