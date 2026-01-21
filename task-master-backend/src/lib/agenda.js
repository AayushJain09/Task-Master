const Agenda = require("agenda");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService"); //centralized notification module
const Reminder = require("../models/Reminder");
const { expandReminderOccurrences } = require("../utils/recurrence");
const { parseDateInputToUTC } = require("../utils/timezone");
const { runTokenCleanup } = require("./tokenCleanup");

let agenda;

/**
 * intialise agenda only once
 * @param {*} param0
 * @returns
 */
async function initAgenda({
  mongoCollection = "agendaJobs",
  lockLifetime = 10 * 60 * 1000,
} = {}) {
  if (agenda) return agenda;

  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error(
      "Mongoose connection is not ready. Connect mongoose first."
    );
  }

  //   created agenda instance
  agenda = new Agenda({
    db: {
      address: process.env.MONGODB_URI,
      collection: mongoCollection,
    },
    defaultLockLifetime: lockLifetime,
  });

  // logs for debug
  agenda.on("start", (job) =>
    console.log(`Agenda job starting: ${job.attrs.name}`, job.attrs.data)
  );
  agenda.on("complete", (job) =>
    console.log(`Agenda job finished: ${job.attrs.name}`, job.attrs.data)
  );
  agenda.on("fail", (err, job) =>
    console.error(`Agenda job failed: ${job.attrs.name}`, err, job.attrs.data)
  );

  // Define job processor
  agenda.define(
    "sendReminder",
    { concurrency: 5, lockLifetime },
    async (job, done) => {
      const { reminderId, occurrenceDate } = job.attrs.data || {};
      try {
        if (!reminderId) {
          throw new Error("Missing reminderId in job data");
        }

        // Re-fetch reminder to get latest state (deleted? cancelled?)
        const reminder = await Reminder.findById(reminderId).lean();
        if (!reminder || reminder.isDeleted) {
          // Nothing to do — cancel any future jobs for this reminder
          await agenda.cancel({ "data.reminderId": reminderId });
          return done();
        }

        // If occurrence is in future by a margin, re-schedule (rare)
        // if (occDate.getTime() > Date.now() + 5 * 60 * 1000) {
        //   // This job fired early or schedule changed -- re-schedule for exact time
        //   await agenda.schedule(occDate, "sendReminder", {
        //     reminderId,
        //     occurrenceDate: occDate.toISOString(),
        //   });
        //   return done();
        // }

        const nowUTC = parseDateInputToUTC(new Date(), {
          timeZone: reminder.timezone || "UTC",
        });
        const occDateUTC = parseDateInputToUTC(occurrenceDate, {
          timeZone: reminder.timezone || "UTC",
        });

        // schedule changed re-schedule at correct UTC time
        if (occDateUTC.getTime() > nowUTC.getTime() + 5 * 60 * 1000) {
          await agenda.schedule(occDateUTC, "sendReminder", {
            reminderId,
            occurrenceDate: occDateUTC.toISOString(),
          });
          return done();
        }

        // Using notification service to save & send
        const usersToNotify = reminder.user ? [reminder.user] : [];
        await notificationService.saveAndSend(usersToNotify, null, {
          type: "reminder",
          title: reminder.title || "Reminder",
          message: reminder.description || reminder.title || "Reminder is due",
          metadata: { reminderId },
        });

        // update lastSentAt, or status, etc.
        await Reminder.findByIdAndUpdate(reminderId, {
          $set: {
            lastSentAt: parseDateInputToUTC(new Date(), {
              timeZone: reminder.timezone || "UTC",
            }),
            syncStatus: "pending",
          },
        });

        // For recurring reminders: schedule next occurrence(s) if not already scheduled
        if (
          reminder.recurrence &&
          reminder.recurrence.cadence &&
          reminder.recurrence.cadence !== "none"
        ) {
          const nowZoned = parseDateInputToUTC(new Date(), {
            timeZone: reminder.timezone || "UTC",
          });
          const futureWindowEndZoned = new Date(
            nowZoned.getTime() + 30 * 24 * 60 * 60 * 1000
          );

          const occurrences = expandReminderOccurrences(
            reminder,
            nowZoned,
            futureWindowEndZoned
          );

          // For each occurrence, create unique job
          for (const occ of occurrences) {
            const occISO = occ.occurrenceDate.toISOString();
            await agenda
              .create("sendReminder", {
                reminderId: reminderId.toString(),
                occurrenceDate: occISO,
              })
              .unique({
                "data.reminderId": reminderId.toString(),
                "data.occurrenceDate": occISO,
              })
              .schedule(occ.occurrenceDate)
              .save();
          }
        }

        return done();
      } catch (err) {
        console.error("sendReminder job failed", err);
        return done(err);
      }
    }
  );

  agenda.define(
    "checkOverdueTasks",
    { concurrency: 1, lockLifetime },
    async (job, done) => {
      try {
        const now = new Date();

        const overdueTasks = await mongoose
          .model("Task")
          .find({
            isActive: true,
            status: { $ne: "done" },
            dueDate: { $lt: now },
          })
          .populate("assignedTo", "_id")
          .lean({ virtuals: true });
        console.log("Overdue tasks found:", overdueTasks.length);

        for (const task of overdueTasks) {
          if (!task.daysUntilDue) continue;

          const daysOverdue = Math.abs(task.daysUntilDue);
          const assignees = (task.assignedTo || []).map((u) => u._id);

          const updates = {};
          let shouldSave = false;

          const send = async (flag) => {
            await notificationService.taskOverdue(task, assignees, daysOverdue);
            updates[`overdueNotifications.${flag}`] = true;
            shouldSave = true;
          };

          if (daysOverdue >= 0 && !task.overdueNotifications?.day0) {
            await send("day0");
          }

          if (daysOverdue >= 2 && !task.overdueNotifications?.day2) {
            await send("day2");
          }

          if (daysOverdue >= 5 && !task.overdueNotifications?.day5) {
            await send("day5");
          }

          if (daysOverdue >= 8 && !task.overdueNotifications?.day8) {
            await send("day8");
          }

          if (shouldSave) {
            await mongoose
              .model("Task")
              .updateOne({ _id: task._id }, { $set: updates });
          }
        }

        done();
      } catch (err) {
        console.error("checkOverdueTasks failed", err);
        done(err);
      }
    }
  );

  // Define token cleanup job
  agenda.define(
    "cleanupTokens",
    { concurrency: 1, lockLifetime },
    async (job, done) => {
      try {
        console.log("Running scheduled token cleanup...");
        const results = await runTokenCleanup();
        console.log("Token cleanup results:", results);
        done();
      } catch (err) {
        console.error("Token cleanup job failed:", err);
        done(err);
      }
    }
  );

  // Start agenda
  await agenda.start();

  // Schedule daily overdue task check
  await agenda.every("1 day", "checkOverdueTasks");

  // Schedule weekly token cleanup (runs every Sunday at 2 AM)
  await agenda.every("1 week", "cleanupTokens");

  // Log scheduled jobs
  const overdueJobs = await agenda.jobs({ name: "checkOverdueTasks" });
  const tokenJobs = await agenda.jobs({ name: "cleanupTokens" });

  console.log("Scheduled checkOverdueTasks jobs:", overdueJobs.length);
  console.log("Scheduled cleanupTokens jobs:", tokenJobs.length);

  overdueJobs.forEach((job) => {
    console.log("Overdue check next run at:", job.attrs.nextRunAt);
  });

  tokenJobs.forEach((job) => {
    console.log("Token cleanup next run at:", job.attrs.nextRunAt);
  });

  console.log("Agenda started with all scheduled jobs");
  return agenda;
}

module.exports = {
  initAgenda,
  getAgenda: () => agenda,
};
