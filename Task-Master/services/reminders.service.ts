/**
 * Reminders Service
 *
 * Provides typed helpers for interacting with the reminders API including
 * listing, creation, updates, quick-add, and offline sync hooks.
 */

import { apiService } from './api.service';
import { ApiError } from '@/types/api.types';
import {
  Reminder,
  ReminderCreateRequest,
  ReminderUpdateRequest,
  ReminderListResponse,
  ReminderQueryParams,
  ReminderQuickAddRequest,
  ReminderError,
} from '@/types/reminder.types';

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
    if (!params) return '';
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
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
      return await apiService.post<Reminder>(this.baseEndpoint, payload);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  async updateReminder(reminderId: string, payload: ReminderUpdateRequest): Promise<Reminder> {
    try {
      return await apiService.patch<Reminder>(`${this.baseEndpoint}/${reminderId}`, payload);
    } catch (error) {
      throw this.transformError(error as ApiError);
    }
  }

  async quickAddReminder(payload: ReminderQuickAddRequest): Promise<Reminder> {
    try {
      return await apiService.post<Reminder>(`${this.baseEndpoint}/quick-add`, payload);
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
