/**
 * Date Utility Functions
 *
 * Handles date formatting and timezone issues for task management.
 */

import { convertLocalDateTimeToISO, resolveTimezone } from '@/utils/timezone';

/**
 * Converts a YYYY-MM-DD string into an ISO timestamp that represents the end of
 * the local day for the provided timezone. Falls back to the raw input when the
 * format is invalid so the backend can decide how to handle it.
 */
export const formatDateForAPI = (dateString: string, timezone?: string): string => {
  if (!dateString) return '';

  try {
    if (dateString.includes('T') || dateString.includes('Z')) {
      return dateString;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }

    const safeZone = resolveTimezone(timezone);
    return convertLocalDateTimeToISO(dateString, '23:59', safeZone);
  } catch (error) {
    console.error('Error formatting date for API:', error, 'Input:', dateString);
    return dateString;
  }
};

/**
 * Gets today's date in YYYY-MM-DD format
 * 
 * @returns Today's date string
 */
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a date string represents today
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns True if the date is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayString();
};

/**
 * Checks if a date string represents a future date
 * 
 * @param dateString - Date in YYYY-MM-DD format  
 * @returns True if the date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  return dateString > getTodayString();
};

/**
 * Formats a date for display in the UI
 * 
 * @param dateString - Date in YYYY-MM-DD or ISO format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
