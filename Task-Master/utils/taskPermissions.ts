/**
 * Task Permission Utilities
 * 
 * Utilities for checking user permissions on tasks to ensure proper access control
 * and authorization throughout the application.
 */

import { Task } from '@/components/tasks/TaskCard';
import { User } from '@/types/auth.types';

/**
 * Check if the current user can edit a task
 * Only the task creator (assignedBy) can edit the task
 * 
 * @param task - The task to check permissions for
 * @param currentUser - The currently logged-in user
 * @returns true if user can edit, false otherwise
 */
export const canEditTask = (task: Task, currentUser: User | null): boolean => {
  if (!currentUser || !task.assignedBy) {
    return false;
  }
  
  return task.assignedBy._id === currentUser.id;
};

/**
 * Check if the current user can delete a task
 * Only the task creator (assignedBy) can delete the task
 * 
 * @param task - The task to check permissions for
 * @param currentUser - The currently logged-in user
 * @returns true if user can delete, false otherwise
 */
export const canDeleteTask = (task: Task, currentUser: User | null): boolean => {
  if (!currentUser || !task.assignedBy) {
    return false;
  }
  
  return task.assignedBy._id === currentUser.id;
};

/**
 * Check if the current user can update task status
 * Both the task creator (assignedBy) and assignee (assignedTo) can update status
 * 
 * @param task - The task to check permissions for
 * @param currentUser - The currently logged-in user
 * @returns true if user can update status, false otherwise
 */
export const canUpdateTaskStatus = (task: Task, currentUser: User | null): boolean => {
  if (!currentUser) {
    return false;
  }
  
  const isCreator = task.assignedBy?._id === currentUser.id;
  const isAssignee = task.assignedTo?._id === currentUser.id;
  
  return isCreator || isAssignee;
};

/**
 * Check if the current user can view a task
 * Users can view tasks they created or are assigned to
 * 
 * @param task - The task to check permissions for
 * @param currentUser - The currently logged-in user
 * @returns true if user can view, false otherwise
 */
export const canViewTask = (task: Task, currentUser: User | null): boolean => {
  if (!currentUser) {
    return false;
  }
  
  const isCreator = task.assignedBy?._id === currentUser.id;
  const isAssignee = task.assignedTo?._id === currentUser.id;
  
  return isCreator || isAssignee;
};

/**
 * Get user's role in relation to a task
 * 
 * @param task - The task to check permissions for
 * @param currentUser - The currently logged-in user
 * @returns 'creator' | 'assignee' | 'none'
 */
export const getUserTaskRole = (task: Task, currentUser: User | null): 'creator' | 'assignee' | 'none' => {
  if (!currentUser) {
    return 'none';
  }
  
  const isCreator = task.assignedBy?._id === currentUser.id;
  const isAssignee = task.assignedTo?._id === currentUser.id;
  
  if (isCreator) return 'creator';
  if (isAssignee) return 'assignee';
  return 'none';
};