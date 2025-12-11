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
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// this will store and send the notification
async function saveAndSend(users, currentUser, data) {
  if (!Array.isArray(users)) users = [users];

  // Remove the performer from notification list
  users = excludeSelf(users, currentUser && (currentUser._id || currentUser));
  console.log("users after extraction:", users);

  // If no one left to notify, skip
  if (!users.length) return;

  const { type, title, message, metadata } = data;

  // Save notifications
  const docs = users.map((user) => ({
    user,
    type,
    title,
    message,
    metadata,
  }));
  await Notification.insertMany(docs);

  // Send push
  await firebaseSender.sendToUsers(users, { title, body: message });
}

module.exports = {
  async taskCreated(task, creator, assigneeIds) {
    await saveAndSend(assigneeIds, creator, {
      type: "task_assigned",
      title: "New Task Assigned",
      message: `${creator.firstName} assigned: ${task.title}`,
      metadata: { taskId: task._id },
    });
  },

  async taskUpdated(task, user, assigneeIds, changedFields, oldTitle) {
    await saveAndSend(assigneeIds, user, {
      type: "task_updated",
      title: "Task Updated",
      message: `${user.firstName} updated: ${oldTitle}`,
      metadata: { taskId: task._id, changedFields },
    });
  },

  async taskCompleted(task, user, assigneeIds) {
    await saveAndSend(assigneeIds, user, {
      type: "task_completed",
      title: "Task Completed",
      message: `${user.firstName} completed: ${task.title}`,
      metadata: { taskId: task._id },
    });
  },

  async taskStatusChanged(task, user, assigneeIds, previousStatus) {
  console.log("inside taskStatusChanged");

  const oldStatus = formatStatus(previousStatus);  
  const newStatus = formatStatus(task.status);

  await saveAndSend(assigneeIds, user, {
    type: "task_status_changed",
    title: "Task Status Updated",
    message: `${user.firstName} moved task "${task.title}" from ${oldStatus} → ${newStatus}`,
    metadata: { taskId: task._id },
  });

  console.log("going out from taskStatusChanged");
},

  async taskDeleted(task, user, assigneeIds) {
    await saveAndSend(assigneeIds, user, {
      type: "task_deleted",
      title: "Task Deleted",
      message: `${user.firstName} deleted: ${task.title}`,
      metadata: { taskId: task._id },
    });
  },

  async taskOverdue(task, assigneeIds) {
    await saveAndSend(assigneeIds, null, {
      type: "task_overdue",
      title: "Task Overdue",
      message: `${task.title} is overdue!`,
      metadata: { taskId: task._id, dueDate: task.dueDate },
    });
  },
  saveAndSend,
};
