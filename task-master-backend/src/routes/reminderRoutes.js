/**
 * Reminder Routes
 *
 * Defines API endpoints for reminder management including quick-add,
 * filtering, snoozing, and offline synchronization.
 *
 * @module routes/reminderRoutes
 */

const express = require('express');
const router = express.Router();

const {
  getReminders,
  quickAddReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  syncReminders,
} = require('../controllers/reminderController');

const {
  validateReminderId,
  validateReminderQuery,
  validateReminderCreation,
  validateReminderUpdate,
  validateQuickAddReminder,
  validateSyncPayload,
} = require('../validators/reminderValidator');

const { authenticate } = require('../middleware/auth');
const { rateLimitStrict, rateLimitModerate } = require('../middleware/rateLimiter');

router.get('/', authenticate, rateLimitModerate, validateReminderQuery, getReminders);

router.post(
  '/quick-add',
  authenticate,
  rateLimitStrict,
  validateQuickAddReminder,
  quickAddReminder
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
