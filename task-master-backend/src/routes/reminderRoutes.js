/**
 * Reminder Routes
 *
 * Defines API endpoints for reminder management including filtering
 * and offline synchronization.
 *
 * @module routes/reminderRoutes
 */

const express = require('express');
const router = express.Router();

const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  syncReminders,
  getReminderOccurrences,
} = require('../controllers/reminderController');

const {
  validateReminderId,
  validateReminderQuery,
  validateReminderCreation,
  validateReminderUpdate,
  validateSyncPayload,
  validateReminderOccurrencesQuery,
} = require('../validators/reminderValidator');

const { authenticate } = require('../middleware/auth');
const { rateLimitStrict, rateLimitModerate } = require('../middleware/rateLimiter');

router.get('/', authenticate, rateLimitModerate, validateReminderQuery, getReminders);
router.get(
  '/occurrences',
  authenticate,
  rateLimitModerate,
  validateReminderOccurrencesQuery,
  getReminderOccurrences
);

router.post('/', authenticate, rateLimitStrict, validateReminderCreation, createReminder);

router.post(
  '/sync',
  authenticate,
  rateLimitStrict,
  validateSyncPayload,
  syncReminders
);

router.patch(
  '/:reminderId',
  authenticate,
  rateLimitStrict,
  validateReminderId,
  validateReminderUpdate,
  updateReminder
);

router.delete(
  '/:reminderId',
  authenticate,
  rateLimitStrict,
  validateReminderId,
  deleteReminder
);

module.exports = router;
