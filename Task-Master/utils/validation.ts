/**
 * Comprehensive Validation and Sanitization Utilities
 * 
 * Provides robust client-side validation, input sanitization, and error handling
 * for task management forms with security-focused input processing.
 */

import { TaskPriority, TaskFormValidation } from '@/types/task.types';

/**
 * Input Sanitization Functions
 * 
 * Cleanses user input to prevent XSS, injection attacks, and data corruption
 */
export class InputSanitizer {
  /**
   * Sanitizes text input by removing dangerous characters and normalizing content
   * 
   * @param input - Raw text input from user
   * @param options - Sanitization options
   * @returns Sanitized and safe text
   */
  static sanitizeText(input: string, options: {
    maxLength?: number;
    allowSpecialChars?: boolean;
    trim?: boolean;
    normalizeSpaces?: boolean;
  } = {}): string {
    if (!input || typeof input !== 'string') return '';
    
    const {
      maxLength = 1000,
      allowSpecialChars = true,
      trim = true,
      normalizeSpaces = true
    } = options;
    
    let sanitized = input;
    
    // Trim whitespace if requested
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    // Normalize multiple spaces to single space
    if (normalizeSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }
    
    // Remove or escape dangerous characters
    if (!allowSpecialChars) {
      // Remove script tags and dangerous HTML
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }
    
    // Truncate to max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  /**
   * Sanitizes and validates tag input
   * 
   * @param tag - Raw tag input
   * @returns Sanitized tag or null if invalid
   */
  static sanitizeTag(tag: string): string | null {
    if (!tag || typeof tag !== 'string') return null;
    
    // Sanitize basic text
    let sanitized = this.sanitizeText(tag, {
      maxLength: 20,
      allowSpecialChars: false,
      trim: true,
      normalizeSpaces: true
    });
    
    // Remove special characters for tags
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s-_]/g, '');
    
    // Convert to lowercase and replace spaces with hyphens
    sanitized = sanitized.toLowerCase().replace(/\s+/g, '-');
    
    // Must be at least 2 characters
    if (sanitized.length < 2) return null;
    
    return sanitized;
  }
  
  /**
   * Sanitizes category input
   * 
   * @param category - Raw category input
   * @returns Sanitized category
   */
  static sanitizeCategory(category: string): string {
    if (!category || typeof category !== 'string') return '';
    
    return this.sanitizeText(category, {
      maxLength: 50,
      allowSpecialChars: false,
      trim: true,
      normalizeSpaces: true
    });
  }
  
  /**
   * Sanitizes and validates numeric input
   * 
   * @param input - Raw numeric input
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Sanitized number or null if invalid
   */
  static sanitizeNumber(input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
    if (input === null || input === undefined || input === '') return null;
    
    const num = typeof input === 'string' ? parseFloat(input.replace(/[^0-9.-]/g, '')) : Number(input);
    
    if (isNaN(num) || !isFinite(num)) return null;
    if (num < min || num > max) return null;
    
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  }
}

/**
 * Comprehensive Form Validation
 * 
 * Validates all form fields with detailed error messages and security checks
 */
export class FormValidator {
  /**
   * Validates task title with comprehensive checks
   * 
   * @param title - Task title to validate
   * @returns Validation result with error message if invalid
   */
  static validateTitle(title: string): { isValid: boolean; error?: string; sanitized: string } {
    const sanitized = InputSanitizer.sanitizeText(title, {
      maxLength: 200,
      allowSpecialChars: true,
      trim: true,
      normalizeSpaces: true
    });
    
    if (!sanitized) {
      return { isValid: false, error: 'Task title is required', sanitized: '' };
    }
    
    if (sanitized.length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters long', sanitized };
    }
    
    if (sanitized.length > 200) {
      return { isValid: false, error: 'Title cannot exceed 200 characters', sanitized };
    }
    
    // Check for suspicious patterns
    if (/(<script|javascript:|on\w+\s*=)/i.test(sanitized)) {
      return { isValid: false, error: 'Title contains invalid characters', sanitized };
    }
    
    return { isValid: true, sanitized };
  }
  
  /**
   * Validates task description
   * 
   * @param description - Task description to validate
   * @returns Validation result
   */
  static validateDescription(description: string): { isValid: boolean; error?: string; sanitized: string } {
    const sanitized = InputSanitizer.sanitizeText(description, {
      maxLength: 2000,
      allowSpecialChars: true,
      trim: true,
      normalizeSpaces: true
    });
    
    if (sanitized.length > 2000) {
      return { isValid: false, error: 'Description cannot exceed 2000 characters', sanitized };
    }
    
    // Check for suspicious patterns
    if (/(<script|javascript:|on\w+\s*=)/i.test(sanitized)) {
      return { isValid: false, error: 'Description contains invalid characters', sanitized };
    }
    
    return { isValid: true, sanitized };
  }
  
  /**
   * Validates task priority
   * 
   * @param priority - Priority to validate
   * @returns Validation result
   */
  static validatePriority(priority: any): { isValid: boolean; error?: string; sanitized: TaskPriority } {
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
    
    if (!priority || !validPriorities.includes(priority)) {
      return { isValid: false, error: 'Invalid priority level', sanitized: 'medium' };
    }
    
    return { isValid: true, sanitized: priority as TaskPriority };
  }
  
  /**
   * Validates category input
   * 
   * @param category - Category to validate
   * @returns Validation result
   */
  static validateCategory(category: string): { isValid: boolean; error?: string; sanitized: string } {
    const sanitized = InputSanitizer.sanitizeCategory(category);
    
    if (sanitized.length > 50) {
      return { isValid: false, error: 'Category cannot exceed 50 characters', sanitized };
    }
    
    return { isValid: true, sanitized };
  }
  
  /**
   * Validates due date input
   * 
   * @param dueDate - Due date to validate
   * @returns Validation result
   */
  static validateDueDate(dueDate: string): { isValid: boolean; error?: string; sanitized: string } {
    if (!dueDate) {
      return { isValid: true, sanitized: '' };
    }
    
    // Sanitize date string
    const sanitized = dueDate.trim();
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitized)) {
      return { isValid: false, error: 'Date must be in YYYY-MM-DD format', sanitized };
    }
    
    const date = new Date(sanitized);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date', sanitized };
    }
    
    // Check if date is not too far in the past or future
    const now = new Date();
    const maxFutureDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
    const minPastDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    if (date > maxFutureDate) {
      return { isValid: false, error: 'Due date cannot be more than 10 years in the future', sanitized };
    }
    
    if (date < minPastDate) {
      return { isValid: false, error: 'Due date cannot be more than 1 year in the past', sanitized };
    }
    
    return { isValid: true, sanitized };
  }
  
  /**
   * Validates tags array
   * 
   * @param tags - Tags array to validate
   * @returns Validation result
   */
  static validateTags(tags: string[]): { isValid: boolean; error?: string; sanitized: string[] } {
    if (!Array.isArray(tags)) {
      return { isValid: true, sanitized: [] };
    }
    
    if (tags.length > 10) {
      return { isValid: false, error: 'Cannot have more than 10 tags', sanitized: tags.slice(0, 10) };
    }
    
    const sanitizedTags: string[] = [];
    const seenTags = new Set<string>();
    
    for (const tag of tags) {
      const sanitized = InputSanitizer.sanitizeTag(tag);
      if (sanitized && !seenTags.has(sanitized)) {
        sanitizedTags.push(sanitized);
        seenTags.add(sanitized);
      }
    }
    
    return { isValid: true, sanitized: sanitizedTags };
  }
  
  /**
   * Validates estimated hours
   * 
   * @param hours - Hours to validate
   * @returns Validation result
   */
  static validateEstimatedHours(hours: any): { isValid: boolean; error?: string; sanitized: number } {
    const sanitized = InputSanitizer.sanitizeNumber(hours, 0, 1000);
    
    if (sanitized === null) {
      return { isValid: true, sanitized: 0 };
    }
    
    if (sanitized < 0) {
      return { isValid: false, error: 'Estimated hours cannot be negative', sanitized: 0 };
    }
    
    if (sanitized > 1000) {
      return { isValid: false, error: 'Estimated hours cannot exceed 1000', sanitized: 1000 };
    }
    
    return { isValid: true, sanitized };
  }
  
  /**
   * Validates entire form with comprehensive error collection
   * 
   * @param formData - Form data to validate
   * @returns Comprehensive validation result
   */
  static validateForm(formData: any): {
    isValid: boolean;
    errors: TaskFormValidation;
    sanitizedData: any;
    hasSecurityIssues: boolean;
  } {
    const errors: TaskFormValidation = {};
    const sanitizedData: any = {};
    let hasSecurityIssues = false;
    
    // Validate title
    const titleValidation = this.validateTitle(formData.title || '');
    if (!titleValidation.isValid) {
      errors.title = titleValidation.error;
      if (titleValidation.error?.includes('invalid characters')) {
        hasSecurityIssues = true;
      }
    }
    sanitizedData.title = titleValidation.sanitized;
    
    // Validate description
    const descriptionValidation = this.validateDescription(formData.description || '');
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error;
      if (descriptionValidation.error?.includes('invalid characters')) {
        hasSecurityIssues = true;
      }
    }
    sanitizedData.description = descriptionValidation.sanitized;
    
    // Validate priority
    const priorityValidation = this.validatePriority(formData.priority);
    if (!priorityValidation.isValid) {
      errors.priority = priorityValidation.error;
    }
    sanitizedData.priority = priorityValidation.sanitized;
    
    // Validate category
    const categoryValidation = this.validateCategory(formData.category || '');
    if (!categoryValidation.isValid) {
      errors.category = categoryValidation.error;
    }
    sanitizedData.category = categoryValidation.sanitized;
    
    // Validate due date
    const dueDateValidation = this.validateDueDate(formData.dueDate || '');
    if (!dueDateValidation.isValid) {
      errors.dueDate = dueDateValidation.error;
    }
    sanitizedData.dueDate = dueDateValidation.sanitized;
    
    // Validate tags
    const tagsValidation = this.validateTags(formData.tags || []);
    if (!tagsValidation.isValid) {
      errors.tags = tagsValidation.error;
    }
    sanitizedData.tags = tagsValidation.sanitized;
    
    // Validate estimated hours
    const hoursValidation = this.validateEstimatedHours(formData.estimatedHours);
    if (!hoursValidation.isValid) {
      errors.estimatedHours = hoursValidation.error;
    }
    sanitizedData.estimatedHours = hoursValidation.sanitized;
    
    const isValid = Object.keys(errors).length === 0;
    
    return {
      isValid,
      errors,
      sanitizedData,
      hasSecurityIssues
    };
  }
}

/**
 * Error Recovery and Retry Mechanisms
 */
export class ErrorRecovery {
  /**
   * Implements exponential backoff for retries
   * 
   * @param attempt - Current attempt number
   * @param baseDelay - Base delay in milliseconds
   * @returns Delay in milliseconds
   */
  static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
  }
  
  /**
   * Determines if an error is retryable
   * 
   * @param error - Error to check
   * @returns Whether the error should be retried
   */
  static isRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Network errors
    if (error.status === 0 || error.code === 'ERR_NETWORK') return true;
    
    // Server errors (5xx)
    if (error.status >= 500) return true;
    
    // Rate limiting
    if (error.status === 429) return true;
    
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) return true;
    
    return false;
  }
  
  /**
   * Recovers form data from error state
   * 
   * @param formData - Current form data
   * @param lastValidData - Last known valid data
   * @returns Recovered form data
   */
  static recoverFormData(formData: any, lastValidData: any): any {
    return {
      ...lastValidData,
      ...formData,
      // Ensure critical fields are never lost
      title: formData.title || lastValidData?.title || '',
      priority: formData.priority || lastValidData?.priority || 'medium'
    };
  }
}

/**
 * Form State Persistence
 */
export class FormPersistence {
  private static readonly STORAGE_KEY = 'task_form_draft';
  
  /**
   * Saves form data to local storage
   * 
   * @param formData - Form data to save
   * @param formType - Type of form (create/edit)
   */
  static async saveFormDraft(formData: any, formType: 'create' | 'edit'): Promise<void> {
    try {
      const draft = {
        data: formData,
        type: formType,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Use AsyncStorage for React Native
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  }
  
  /**
   * Loads form draft from storage
   * 
   * @param formType - Type of form to load
   * @returns Saved form data or null
   */
  static async loadFormDraft(formType: 'create' | 'edit'): Promise<any | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const draftData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!draftData) return null;
      
      const draft = JSON.parse(draftData);
      
      // Check if draft is recent (within 1 hour) and matches form type
      const isRecent = Date.now() - draft.timestamp < 3600000; // 1 hour
      const isCorrectType = draft.type === formType;
      
      if (isRecent && isCorrectType) {
        return draft.data;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to load form draft:', error);
      return null;
    }
  }
  
  /**
   * Clears saved form draft
   */
  static async clearFormDraft(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear form draft:', error);
    }
  }
}