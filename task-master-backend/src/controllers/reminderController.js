/**
 * Reminder Controller
 *
 * Handles reminder creation, quick-add parsing, filtering, snoozing, and
 * offline synchronization workflows.
 *
 * @module controllers/reminderController
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const { parsePagination, buildPaginationResponse } = require('../utils/helpers');
const {
  parseNaturalLanguageReminder,
  ensureTimeZone,
} = require('../utils/reminderParser');

const pickReminderFields = (payload = {}) => {
  const sanitized = {};

  if (payload.title) sanitized.title = payload.title.trim();
  if (payload.description !== undefined) sanitized.description = payload.description;
  if (payload.notes !== undefined) sanitized.notes = payload.notes;
  if (payload.category) sanitized.category = payload.category.toLowerCase();
  if (payload.priority) sanitized.priority = payload.priority;
  if (payload.status) sanitized.status = payload.status;
  if (payload.timezone) sanitized.timezone = ensureTimeZone(payload.timezone);
  if (payload.quickAddSource) sanitized.quickAddSource = payload.quickAddSource;

  if (payload.tags) {
    sanitized.tags = Array.isArray(payload.tags)
      ? payload.tags.map(tag => tag.toLowerCase().trim()).filter(Boolean)
      : [];
  }

  if (payload.recurrence) {
    sanitized.recurrence = {
      cadence: payload.recurrence.cadence || 'none',
      interval: payload.recurrence.interval || 1,
      daysOfWeek: Array.isArray(payload.recurrence.daysOfWeek)
        ? payload.recurrence.daysOfWeek.map(Number).filter(day => day >= 0 && day <= 6)
        : [],
      customRule: payload.recurrence.customRule || '',
      anchorDate: payload.recurrence.anchorDate ? new Date(payload.recurrence.anchorDate) : null,
    };
  }

  return sanitized;
};

const formatReminderResponse = reminder => {
  if (!reminder) return null;
  const plain = reminder.toObject ? reminder.toObject() : reminder;
  delete plain.__v;
  return plain;
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return false;
  }
  return true;
};

/**
 * GET /api/reminders
 */
const getReminders = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const {
    from,
    to,
    category,
    status,
    priority,
    tags,
    search,
  } = req.query;

  const { page, limit, skip } = parsePagination(req.query, 1, 20, 100);
  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (from || to) {
    filter.scheduledAt = {};
    if (from) filter.scheduledAt.$gte = new Date(from);
    if (to) filter.scheduledAt.$lte = new Date(to);
  }

  if (category) filter.category = category.toLowerCase();
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
    if (tagArray.length > 0) {
      filter.tags = { $in: tagArray };
    }
  }

  if (search) {
    filter.$text = { $search: search };
  }

  try {
    const [items, total] = await Promise.all([
      Reminder.find(filter).sort({ scheduledAt: 1 }).skip(skip).limit(limit),
      Reminder.countDocuments(filter),
    ]);

    const payload = buildPaginationResponse(
      items.map(formatReminderResponse),
      page,
      limit,
      total
    );

    res.status(200).json({
      success: true,
      message: 'Reminders retrieved successfully',
      data: payload,
    });
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve reminders',
    });
  }
};

/**
 * POST /api/reminders/quick-add
 */
const quickAddReminder = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const { input, timezone, defaults = {} } = req.body;

  try {
    const parsed = parseNaturalLanguageReminder(input, {
      timeZone: timezone || defaults.timezone,
    });

    const normalizedCategory = (defaults.category || 'personal').toLowerCase();
    const reminderPayload = {
      user: userId,
      title: parsed.title,
      scheduledAt: parsed.scheduledAt,
      timezone: parsed.timezone,
      category: normalizedCategory,
      priority: defaults.priority || 'medium',
      tags: defaults.tags || [],
      quickAddSource: parsed.source,
      clientReference: defaults.clientReference || {},
      clientUpdatedAt: defaults.clientUpdatedAt ? new Date(defaults.clientUpdatedAt) : new Date(),
      syncStatus: defaults.clientReference ? 'pending' : 'synced',
    };

    const reminder = await Reminder.create(reminderPayload);

    res.status(201).json({
      success: true,
      message: 'Reminder created from quick-add text',
      data: formatReminderResponse(reminder),
    });
  } catch (error) {
    console.error('Quick add reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create reminder from quick text',
    });
  }
};

/**
 * POST /api/reminders
 */
const createReminder = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const {
    title,
    scheduledAt,
    timezone,
    tags = [],
    category = 'personal',
    priority = 'medium',
  } = req.body;

  try {
    const normalizedCategory = category.toLowerCase();
    const reminder = await Reminder.create({
      user: userId,
      title,
      scheduledAt: new Date(scheduledAt),
      timezone: ensureTimeZone(timezone || 'UTC'),
      category: normalizedCategory,
      priority,
      tags: Array.isArray(tags) ? tags.map(tag => tag.toLowerCase().trim()).filter(Boolean) : [],
      ...pickReminderFields(req.body),
      syncStatus: req.body.clientReference ? 'pending' : 'synced',
      clientReference: req.body.clientReference,
      clientUpdatedAt: req.body.clientUpdatedAt ? new Date(req.body.clientUpdatedAt) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: formatReminderResponse(reminder),
    });
  } catch (error) {
    console.error('Create reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create reminder',
    });
  }
};

/**
 * PATCH /api/reminders/:reminderId
 */
const updateReminder = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const { reminderId } = req.params;

  try {
    const reminder = await Reminder.findOne({
      _id: reminderId,
      user: userId,
      isDeleted: false,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    Object.assign(reminder, pickReminderFields(req.body));

    if (req.body.scheduledAt) {
      reminder.scheduledAt = new Date(req.body.scheduledAt);
    }

    if (req.body.tags) {
      reminder.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map(tag => tag.toLowerCase().trim()).filter(Boolean)
        : [];
    }

    reminder.clientUpdatedAt = new Date();
    reminder.syncStatus = 'pending';
    await reminder.save();

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      data: formatReminderResponse(reminder),
    });
  } catch (error) {
    console.error('Update reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update reminder',
    });
  }
};

/**
 * DELETE /api/reminders/:reminderId
 */
const deleteReminder = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const { reminderId } = req.params;

  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, user: userId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          syncStatus: 'pending',
          clientUpdatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Delete reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to delete reminder',
    });
  }
};

/**
 * POST /api/reminders/sync
 *
 * Performs offline-first synchronization: applies client changes, resolves
 * conflicts, and returns any server-side updates since the client last synced.
 */
const syncReminders = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userId = req.user.userId;
  const { clientId, lastSyncAt, changes = [] } = req.body;

  const appliedChanges = [];
  const conflicts = [];

  const applyChange = async (change) => {
    const clientUpdatedAt = change.clientUpdatedAt ? new Date(change.clientUpdatedAt) : new Date();

    if (change.operation === 'delete') {
      if (!change.serverId || !mongoose.Types.ObjectId.isValid(change.serverId)) {
        return;
      }
      const reminder = await Reminder.findOne({
        _id: change.serverId,
        user: userId,
      });
      if (!reminder) return;

      reminder.isDeleted = true;
      reminder.deletedAt = new Date();
      reminder.syncStatus = 'pending';
      reminder.clientUpdatedAt = clientUpdatedAt;
      await reminder.save();
      appliedChanges.push({ clientId: change.clientId, serverId: reminder.id, operation: 'delete' });
      return;
    }

    const payload = {
      ...pickReminderFields(change.data || {}),
    };

    if (change.data?.scheduledAt) {
      payload.scheduledAt = new Date(change.data.scheduledAt);
    }

    if (change.data?.tags) {
      payload.tags = Array.isArray(change.data.tags)
        ? change.data.tags.map(tag => tag.toLowerCase().trim()).filter(Boolean)
        : [];
    }

    if (change.serverId && mongoose.Types.ObjectId.isValid(change.serverId)) {
      const reminder = await Reminder.findOne({
        _id: change.serverId,
        user: userId,
      });
      if (!reminder) {
        return;
      }

      if (reminder.updatedAt && reminder.updatedAt.getTime() > clientUpdatedAt.getTime()) {
        conflicts.push({
          clientId: change.clientId,
          serverId: reminder.id,
          reason: 'Server has newer changes',
          serverState: formatReminderResponse(reminder),
        });
        return;
      }

      Object.assign(reminder, payload);
      if (payload.scheduledAt) {
        reminder.scheduledAt = payload.scheduledAt;
      }
      reminder.clientReference = {
        id: change.clientId,
        device: clientId,
      };
      reminder.clientUpdatedAt = clientUpdatedAt;
      reminder.syncStatus = 'pending';
      await reminder.save();
      appliedChanges.push({ clientId: change.clientId, serverId: reminder.id, operation: 'update' });
      return;
    }

    const normalizedCategory = (payload.category || 'personal').toLowerCase();
    const reminder = await Reminder.create({
      user: userId,
      title: payload.title || change.data?.title || 'Reminder',
      scheduledAt: payload.scheduledAt || new Date(),
      timezone: payload.timezone || 'UTC',
      category: normalizedCategory,
      ...payload,
      clientReference: { id: change.clientId, device: clientId },
      clientUpdatedAt,
      syncStatus: 'pending',
    });

    appliedChanges.push({
      clientId: change.clientId,
      serverId: reminder.id,
      operation: 'insert',
    });
  };

  try {
    for (const change of changes) {
      // eslint-disable-next-line no-await-in-loop
      await applyChange(change);
    }

    const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);
    const serverChanges = await Reminder.find({
      user: userId,
      updatedAt: { $gt: since },
    })
      .sort({ updatedAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Sync completed',
      data: {
        appliedChanges,
        conflicts,
        serverChanges,
      },
    });
  } catch (error) {
    console.error('Reminder sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to sync reminders',
    });
  }
};

module.exports = {
  getReminders,
  quickAddReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  syncReminders,
};
