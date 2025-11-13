/**
 * Reminder Types
 *
 * Strongly typed interfaces shared between reminder services and UI layers.
 * Mirrors the backend contract documented in Swagger.
 */

export type ReminderCategory = 'work' | 'personal' | 'health' | 'deadline';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReminderStatus = 'pending' | 'completed' | 'cancelled';

export interface ReminderRecurrence {
  cadence: 'none' | 'daily' | 'weekly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  customRule?: string;
  anchorDate?: string | null;
}

export interface ReminderClientReference {
  id?: string;
  device?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  scheduledAt: string; // ISO timestamp
  timezone: string;
  category: ReminderCategory;
  tags: string[];
  priority: ReminderPriority;
  status: ReminderStatus;
  recurrence?: ReminderRecurrence;
  quickAddSource?: string;
  clientReference?: ReminderClientReference;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderListResponse {
  items: Reminder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export interface ReminderQueryParams {
  from?: string;
  to?: string;
  category?: ReminderCategory | 'all';
  status?: ReminderStatus;
  priority?: ReminderPriority;
  tags?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ReminderCreateRequest {
  title: string;
  scheduledAt: string;
  timezone: string;
  category?: ReminderCategory;
  priority?: ReminderPriority;
  tags?: string[];
  notes?: string;
  description?: string;
}

export type ReminderUpdateRequest = Partial<ReminderCreateRequest> & {
  status?: ReminderStatus;
};

export interface ReminderQuickAddRequest {
  input: string;
  timezone?: string;
  defaults?: {
    category?: ReminderCategory;
    priority?: ReminderPriority;
    tags?: string[];
    clientReference?: ReminderClientReference;
    clientUpdatedAt?: string;
  };
}

export type ReminderErrorCode =
  | 'REMINDER_VALIDATION_ERROR'
  | 'REMINDER_ACCESS_DENIED'
  | 'REMINDER_NOT_FOUND'
  | 'REMINDER_RATE_LIMIT'
  | 'REMINDER_UNKNOWN';

export interface ReminderError {
  message: string;
  code: ReminderErrorCode;
  details?: any;
}
