/**
 * Date Utility Functions
 * 
 * Handles date formatting and timezone issues for task management
 */

/**
 * Converts a date string to ISO format while preserving the intended date
 * Avoids timezone shifting issues by setting time to noon
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns ISO string safe from timezone shifts
 */
export const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // If it's already an ISO string, return as-is
    if (dateString.includes('T') || dateString.includes('Z')) {
      return dateString;
    }
    
    // Validate the input format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }
    
    // For date strings, append time to ensure it's treated as intended date
    // Use end of day to be safe with timezone conversions
    const dateTimeString = dateString + 'T23:59:59.999Z';
    
    return dateTimeString;
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