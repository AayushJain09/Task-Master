/**
 * Reminder Model
 *
 * Data model for the reminders module. Supports the following features:
 * - Recurring cadence definitions (daily, weekly, custom)
 * - Category + tag metadata for filtering
 * - Offline-first synchronization metadata (client references, versioning)
 *
 * @module models/Reminder
 */

const mongoose = require('mongoose');

const recurrenceSchema = new mongoose.Schema(
  {
    cadence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'custom'],
      default: 'none',
    },
    interval: {
      type: Number,
      min: 1,
      max: 365,
      default: 1,
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: (days) => days.every((day) => day >= 0 && day <= 6),
        message: 'daysOfWeek must be integers between 0 (Sunday) and 6 (Saturday)',
      },
      default: [],
    },
    customRule: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },
    anchorDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    timezone: {
      type: String,
      default: 'UTC',
      maxlength: 60,
    },

    recurrence: {
      type: recurrenceSchema,
      default: () => ({}),
    },

    category: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'personal',
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? [...new Set(tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean))]
          : [],
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    clientReference: {
      id: { type: String, trim: true, maxlength: 120 },
      device: { type: String, trim: true, maxlength: 120 },
    },

    clientUpdatedAt: {
      type: Date,
      default: null,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    syncStatus: {
      type: String,
      enum: ['pending', 'synced'],
      default: 'synced',
    },

    version: {
      type: Number,
      default: 1,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for efficient querying in the reminder feed and sync APIs.
 */
reminderSchema.index({ user: 1, scheduledAt: 1, isDeleted: 1 });
reminderSchema.index({ user: 1, updatedAt: 1 });
reminderSchema.index({ user: 1, clientUpdatedAt: 1 });
reminderSchema.index({ tags: 1 });
reminderSchema.index({ title: 'text', description: 'text', tags: 'text', notes: 'text' });

/**
 * Pre-save hook to keep optimistic versioning in sync with updates.
 */
reminderSchema.pre('save', function reminderVersionBump(next) {
  if (!this.isNew && this.isModified()) {
    this.version += 1;
  }
  next();
});

reminderSchema.pre('findOneAndUpdate', function bumpVersionOnUpdate(next) {
  const update = this.getUpdate() || {};
  update.$inc = update.$inc || {};
  update.$inc.version = (update.$inc.version || 0) + 1;
  update.$set = update.$set || {};
  update.$set.updatedAt = new Date();
  this.setUpdate(update);
  next();
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;
