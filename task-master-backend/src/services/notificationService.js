//centralized notification services
const Notification = require("../models/notification");
const firebaseSender = require("../utils/firebaseSender");

// excluding the user
function excludeSelf(userIds, currentUserId) {
  if (!currentUserId) return userIds; // No performer
  return userIds.filter((id) => id.toString() !== currentUserId.toString());
}

function formatStatus(text) {
  return text
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// this will store and send the notification
async function saveAndSend(users, currentUser, data) {
  if (!Array.isArray(users)) users = [users];

  // Remove the performer from notification list
  users = excludeSelf(users, currentUser && (currentUser._id || currentUser));

  // If no one left to notify, skip
  if (!users.length) return;

  const { type, title, message, metadata, priority = 'medium' } = data;

  try {
    // Save notifications
    const docs = users.map((user) => ({
      user,
      type,
      title,
      message,
      metadata,
      priority,
    }));
    await Notification.insertMany(docs);

    // Send push notifications
    await firebaseSender.sendToUsers(users, { title, body: message });
  } catch (error) {
    console.error('Error in saveAndSend:', error);
    // Don't throw - we want to continue even if notification fails
  }
}

module.exports = {
  async taskCreated(task, creator, assigneeIds) {
    await saveAndSend(assigneeIds, creator, {
      type: "task_assigned",
      title: "New Task Assigned",
      message: `${creator.firstName} assigned: ${task.title}`,
      metadata: { taskId: task._id },
      priority: 'medium',
    });
  },

  async taskUpdated(task, user, assigneeIds, changedFields, oldTitle) {
    await saveAndSend(assigneeIds, user, {
      type: "task_updated",
      title: "Task Updated",
      message: `${user.firstName} updated: ${oldTitle}`,
      metadata: { taskId: task._id, changedFields },
      priority: 'low',
    });
  },

  async taskCompleted(task, user, assigneeIds) {
    await saveAndSend(assigneeIds, user, {
      type: "task_completed",
      title: "Task Completed",
      message: `${user.firstName} completed: ${task.title}`,
      metadata: { taskId: task._id },
      priority: 'low',
    });
  },

  async taskStatusChanged(task, user, assigneeIds, previousStatus) {
    const oldStatus = formatStatus(previousStatus);
    const newStatus = formatStatus(task.status);

    await saveAndSend(assigneeIds, user, {
      type: "task_status_changed",
      title: "Task Status Updated",
      message: `${user.firstName} moved task "${task.title}" from ${oldStatus} → ${newStatus}`,
      metadata: { taskId: task._id },
      priority: 'low',
    });
  },

  async taskDeleted(task, user, assigneeIds) {
    await saveAndSend(assigneeIds, user, {
      type: "task_deleted",
      title: "Task Deleted",
      message: `${user.firstName} deleted: ${task.title}`,
      metadata: { taskId: task._id },
      priority: 'low',
    });
  },

  async taskOverdue(task, assigneeIds, daysOverdue) {
    const priority = daysOverdue >= 5 ? 'urgent' : daysOverdue >= 2 ? 'high' : 'medium';

    await saveAndSend(assigneeIds, null, {
      type: "task_overdue",
      title: "Task Overdue",
      message: `"${task.title}" is overdue by ${daysOverdue} days`,
      metadata: {
        taskId: task._id,
        dueDate: task.dueDate,
        daysOverdue,
      },
      priority,
    });
  },

  async userStatusUpdated(admin, user) {
    await saveAndSend([user._id], admin, {
      type: "update_user_status",
      title: "Account Status Updated",
      message: `${admin.firstName}: changed your account status to ${user.isActive ? "Active" : "Inactive"}.`,
      metadata: { userId: user._id },
      priority: 'high',
    });
  },

  async userRoleUpdated(admin, user) {
    await saveAndSend([user._id], admin, {
      type: "update_user_role",
      title: "Role Updated",
      message: `${admin.firstName}: updated your role to ${user.role}.`,
      metadata: { userId: user._id },
      priority: 'high',
    });
  },

  async userDeleted(admin, user) {
    await saveAndSend([user._id], admin, {
      type: "delete_user",
      title: "Account Deleted",
      message: `${admin.firstName}: deleted your account.`,
      metadata: { userId: user._id },
      priority: 'urgent',
    });
  },

  saveAndSend,
};

