/**
 * Reminder Validation Rules
 *
 * Express-validator rule sets for the reminders API.
 *
 * @module validators/reminderValidator
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const validateReminderId = [
  param('reminderId')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid reminder id'),
];

const validateReminderQuery = [
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be a valid ISO date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be a valid ISO date'),
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 }),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled']),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  query('tags')
    .optional()
    .isString()
    .isLength({ max: 200 }),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 }),
  query('page')
    .optional()
    .isInt({ min: 1 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }),
  query('timezone')
    .optional()
    .isString()
    .isLength({ max: 60 }),
];

const baseReminderBody = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 200 }),
  body('scheduledAt')
    .notEmpty()
    .withMessage('scheduledAt is required')
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO date'),
  body('timezone')
    .optional()
    .isString()
    .isLength({ max: 60 }),
  body('category')
    .optional()
    .isLength({ min: 1, max: 50 }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled']),
  body('tags')
    .optional()
    .isArray({ max: 20 }),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 }),
  body('recurrence')
    .optional()
    .isObject(),
  body('recurrence.cadence')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'custom']),
  body('recurrence.interval')
    .optional()
    .isInt({ min: 1, max: 365 }),
  body('recurrence.daysOfWeek')
    .optional()
    .isArray({ max: 7 }),
  body('recurrence.daysOfWeek.*')
    .optional()
    .isInt({ min: 0, max: 6 }),
];

const validateReminderCreation = [...baseReminderBody];

const validateReminderUpdate = [
  body('title').optional().isLength({ min: 2, max: 200 }),
  body('scheduledAt').optional().isISO8601(),
  body('timezone').optional().isString().isLength({ max: 60 }),
  body('category').optional().isLength({ min: 1, max: 50 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['pending', 'completed', 'cancelled']),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ min: 1, max: 30 }),
  body('recurrence').optional().isObject(),
  body('recurrence.cadence').optional().isIn(['none', 'daily', 'weekly', 'custom']),
  body('recurrence.interval').optional().isInt({ min: 1, max: 365 }),
  body('recurrence.daysOfWeek').optional().isArray({ max: 7 }),
  body('recurrence.daysOfWeek.*').optional().isInt({ min: 0, max: 6 }),
];

const validateSyncPayload = [
  body('clientId')
    .notEmpty()
    .withMessage('clientId is required')
    .isLength({ max: 120 }),
  body('lastSyncAt')
    .optional()
    .isISO8601()
    .withMessage('lastSyncAt must be ISO8601'),
  body('changes')
    .optional()
    .isArray({ max: 200 }),
  body('changes.*.operation')
    .notEmpty()
    .isIn(['upsert', 'delete']),
  body('changes.*.serverId')
    .optional()
    .custom(value => !value || mongoose.Types.ObjectId.isValid(value))
    .withMessage('serverId must be a valid id'),
  body('changes.*.clientId')
    .optional()
    .isString()
    .isLength({ max: 120 }),
  body('changes.*.clientUpdatedAt')
    .optional()
    .isISO8601(),
];

module.exports = {
  validateReminderId,
  validateReminderQuery,
  validateReminderCreation,
  validateReminderUpdate,
  validateSyncPayload,
};
