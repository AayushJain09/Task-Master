/**
 * Reminders Service
 *
 * Provides typed helpers for interacting with the reminders API including
 * listing, creation, updates, and offline sync hooks.
 */

import { apiService } from './api.service';
import { ApiError } from '@/types/api.types';
import {
  Reminder,
  ReminderCreateRequest,
  ReminderUpdateRequest,
  ReminderListResponse,
  ReminderQueryParams,
  ReminderError,
} from '@/types/reminder.types';
import { resolveTimezone as resolveClientTimezone } from '@/utils/timezone';

class RemindersService {
  private readonly baseEndpoint = '/reminders';

  private transformError(error: ApiError): ReminderError {
    const codeMap: Record<number, ReminderError['code']> = {
      400: 'REMINDER_VALIDATION_ERROR',
      401: 'REMINDER_ACCESS_DENIED',
      403: 'REMINDER_ACCESS_DENIED',
      404: 'REMINDER_NOT_FOUND',
      429: 'REMINDER_RATE_LIMIT',
    };

    return {
      message: error.message || 'Unable to process reminder request.',
      code: codeMap[error.status] || 'REMINDER_UNKNOWN',
      details: error.details,
    };
  }

  private buildQuery(params?: ReminderQueryParams): string {
    if (!params) {
      const timezoneOnly = resolveClientTimezone();
      return `?timezone=${encodeURIComponent(timezoneOnly)}`;
    }
    const searchParams = new URLSearchParams();

    const payload: ReminderQueryParams = { ...params };
    payload.timezone = resolveClientTimezone(payload.timezone);

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  async getReminders(params?: ReminderQueryParams): Promise<ReminderListResponse> {
    try {
      const query = this.buildQuery(params);
      return await apiService.get<ReminderListResponse>(`${this.baseEndpoint}${query}`);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  async createReminder(payload: ReminderCreateRequest): Promise<Reminder> {
    try {
      const timezone = resolveClientTimezone(payload.timezone);
      const requestPayload: ReminderCreateRequest = {
        ...payload,
        timezone,
      };
      return await apiService.post<Reminder>(this.baseEndpoint, requestPayload);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  async updateReminder(reminderId: string, payload: ReminderUpdateRequest): Promise<Reminder> {
    try {
      const timezone = resolveClientTimezone(payload.timezone);
      const requestPayload: ReminderUpdateRequest = {
        ...payload,
        timezone,
      };
      return await apiService.patch<Reminder>(`${this.baseEndpoint}/${reminderId}`, requestPayload);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseEndpoint}/${reminderId}`);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }
}

export const remindersService = new RemindersService();
