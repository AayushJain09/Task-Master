const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_updated',
      'task_completed',
      'task_deleted',
      'task_overdue',
      'task_status_changed',
      'reminder',
      'update_user_status',
      'update_user_role',
      'delete_user'
    ],
    required: true,
  },

  title: { type: String, required: true },
  message: { type: String, required: true },

  isRead: { type: Boolean, default: false },
  metadata:{

  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

