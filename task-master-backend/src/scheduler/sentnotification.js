// const { sendReminderNotification } = require("../utils/notification");
// const Reminder = require("../models/Reminder");

// module.exports = function registerJobs(agenda) {
//   agenda.define("send reminder", async (job, done) => {
//     try {
//       const { reminderId, occurrenceDate } = job.attrs.data;
//       const reminder = await Reminder.findById(reminderId).lean();
//       if (!reminder || reminder.isDeleted) return done();

//       await sendReminderNotification(
//         reminder.user,
//         reminder.title,
//         `Reminder for ${reminder.title} at ${new Date(occurrenceDate).toLocaleTimeString()}`
//       );

//       await job.remove();
//       done();
//     } catch (error) {
//       console.error("Job error:", error);
//       done(error);
//     }
//   });
// };
