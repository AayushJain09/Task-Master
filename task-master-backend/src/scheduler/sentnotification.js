const agenda = require("./agenda")
const Reminder = require("../models/Reminder");
const { sendReminderNotification } = require("../utils/notification");

// Define the agenda job which tells agenda whenever the job with name "send reminder" runs....
// run this function where job has all the job info and done is callback function to the agenda
agenda.define("send reminder", async (job, done) => {
  try {
    const { reminderId, occurrenceDate } = job.attrs.data;
    const reminder = await Reminder.findById(reminderId).lean();
    if (!reminder || reminder.isDeleted) return done();

    await sendReminderNotification(
      reminder.user,
      reminder.title,
      `Reminder for ${reminder.title} at ${new Date(occurrenceDate).toLocaleTimeString()}`
      // `It's time for: ${reminder.title}` 
    );
    await job.remove(); 
    done();
  } catch (error) {
    console.error("Job error:", error);
    done(error);
  }
});
