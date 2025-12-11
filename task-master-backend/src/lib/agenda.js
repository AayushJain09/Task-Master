const Agenda = require("agenda");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService"); //centralized notification module
const Reminder = require("../models/Reminder");
const { expandReminderOccurrences } = require("../utils/recurrence");
const {
  parseDateInputToUTC,
} = require("../utils/timezone");

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

        // Re-fetch reminder to get latest state (deleted? snoozed? cancelled?)
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

  // Start agenda
  await agenda.start();
  console.log("Agenda started");
  return agenda;
}

module.exports = {
  initAgenda,
  getAgenda: () => agenda,
};
