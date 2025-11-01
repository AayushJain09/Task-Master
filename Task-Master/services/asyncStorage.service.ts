/**
 * AsyncStorage Service
 * 
 * This service provides a standardized interface for storing non-sensitive data
 * using React Native AsyncStorage. It handles data serialization, error handling,
 * and provides type-safe storage operations for application preferences and cache.
 * 
 * Features:
 * - Type-safe storage keys and operations
 * - Automatic JSON serialization/deserialization
 * - Comprehensive error handling and logging
 * - Batch operations for performance optimization
 * - Cache management utilities
 * - Storage size monitoring and cleanup
 * 
 * Non-Sensitive Data Stored:
 * - User profile data (name, email, role, preferences)
 * - User preferences (theme, notifications)
 * - Application cache data with expiration
 * - Feature flags and experimental settings
 * 
 * Security Note:
 * - Only use for NON-SENSITIVE data
 * - For sensitive data, use SecureStorageService instead
 * - Data is stored in plain text and accessible to other apps in debug mode
 * 
 * @module services/asyncStorage
 * @requires @react-native-async-storage/async-storage
 * 
 * @example
 * import { asyncStorageService } from '@/services/asyncStorage.service';
 * 
 * // Store user data (non-sensitive)
 * await asyncStorageService.storeUserData(userData);
 * 
 * // Store user preferences
 * await asyncStorageService.setUserPreference('theme', 'dark');
 * 
 * // Get user preferences
 * const theme = await asyncStorageService.getUserPreference('theme');
 * 
 * // Store cache with expiration
 * await asyncStorageService.setCacheData('user_profile', userData, 3600000); // 1 hour
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth.types';

/**
 * Storage keys interface for type safety
 * 
 * Defines all possible storage keys with their expected value types.
 * This ensures type safety and prevents typos in key names.
 */
export interface AsyncStorageKeys {
  // User Data (Non-Sensitive)
  USER_DATA: string; // JSON stringified User object
  USER_ID: string;
  
  // User Preferences
  THEME_PREFERENCE: 'light' | 'dark' | 'system';
  NOTIFICATION_SETTINGS: string; // JSON stringified object
  
  // Cache Keys
  PROFILE_CACHE: string; // JSON stringified User object
  API_CACHE_PREFIX: string; // For dynamic cache keys
}

/**
 * Cache metadata interface for managing cached data
 */
interface CacheMetadata {
  data: any;
  timestamp: number;
  expiresAt?: number;
  version?: string;
}

/**
 * User preferences interface for type safety
 */
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
}

/**
 * AsyncStorage Service Class
 * 
 * Provides a comprehensive interface for managing non-sensitive application data
 * with automatic serialization, error handling, and cache management.
 */
class AsyncStorageService {
  // ================================
  // STORAGE KEY DEFINITIONS
  // ================================
  
  /**
   * Standardized storage keys with consistent naming convention
   * 
   * Format: CATEGORY_PURPOSE (e.g., USER_THEME, CACHE_PROFILE)
   * This prevents key collisions and makes storage management easier.
   */
  private static readonly KEYS: Record<keyof AsyncStorageKeys, string> = {
    // User Data (Non-Sensitive)
    USER_DATA: 'user_profile_data',
    USER_ID: 'user_unique_id',
    
    // User Preferences
    THEME_PREFERENCE: 'user_theme_preference',
    NOTIFICATION_SETTINGS: 'user_notification_settings',
    
    // Cache Keys
    PROFILE_CACHE: 'cache_user_profile',
    API_CACHE_PREFIX: 'cache_api_data',
  };

  // ================================
  // CORE STORAGE OPERATIONS
  // ================================
  
  /**
   * Store a value with automatic JSON serialization
   * 
   * Handles both primitive values and complex objects by automatically
   * serializing them to JSON. Includes comprehensive error handling.
   * 
   * @param {keyof AsyncStorageKeys} key - Storage key from predefined keys
   * @param {any} value - Value to store (will be JSON serialized)
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await asyncStorageService.setItem('THEME_PREFERENCE', 'dark');
   * await asyncStorageService.setItem('NOTIFICATION_SETTINGS', { push: true });
   */
  async setItem(key: keyof AsyncStorageKeys, value: any): Promise<boolean> {
    try {
      // Reject null or undefined values
      if (value === null || value === undefined) {
        console.error(`AsyncStorage Error - Cannot store null/undefined value for key ${key}`);
        return false;
      }
      
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(AsyncStorageService.KEYS[key], serializedValue);
      return true;
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a value with automatic JSON deserialization
   * 
   * Attempts to parse JSON for objects, falls back to string value.
   * Returns null if key doesn't exist or parsing fails.
   * 
   * @param {keyof AsyncStorageKeys} key - Storage key to retrieve
   * @returns {Promise<any>} Stored value or null
   * 
   * @example
   * const theme = await asyncStorageService.getItem('THEME_PREFERENCE');
   * const settings = await asyncStorageService.getItem('NOTIFICATION_SETTINGS');
   */
  async getItem(key: keyof AsyncStorageKeys): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(AsyncStorageService.KEYS[key]);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string value
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if JSON parsing fails
      }
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a specific storage item
   * 
   * @param {keyof AsyncStorageKeys} key - Storage key to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeItem(key: keyof AsyncStorageKeys): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(AsyncStorageService.KEYS[key]);
      return true;
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a storage key exists
   * 
   * @param {keyof AsyncStorageKeys} key - Storage key to check
   * @returns {Promise<boolean>} Whether key exists
   */
  async hasItem(key: keyof AsyncStorageKeys): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AsyncStorageService.KEYS[key]);
      return value !== null;
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to check ${key}:`, error);
      return false;
    }
  }

  // ================================
  // BATCH OPERATIONS
  // ================================
  
  /**
   * Store multiple key-value pairs in a single operation
   * 
   * More efficient than multiple individual setItem calls.
   * Automatically handles serialization for all values.
   * 
   * @param {Array<[keyof AsyncStorageKeys, any]>} pairs - Array of [key, value] pairs
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await asyncStorageService.multiSet([
   *   ['THEME_PREFERENCE', 'dark'],
   *   ['LANGUAGE_PREFERENCE', 'en'],
   *   ['ONBOARDING_COMPLETED', 'true']
   * ]);
   */
  async multiSet(pairs: Array<[keyof AsyncStorageKeys, any]>): Promise<boolean> {
    try {
      const serializedPairs: Array<[string, string]> = pairs.map(([key, value]): [string, string] => [
        AsyncStorageService.KEYS[key],
        typeof value === 'string' ? value : JSON.stringify(value)
      ]);
      
      await AsyncStorage.multiSet(serializedPairs);
      return true;
    } catch (error) {
      console.error('AsyncStorage Error - Failed to set multiple items:', error);
      return false;
    }
  }

  /**
   * Retrieve multiple values in a single operation
   * 
   * @param {Array<keyof AsyncStorageKeys>} keys - Array of keys to retrieve
   * @returns {Promise<Record<string, any>>} Object with key-value pairs
   */
  async multiGet(keys: Array<keyof AsyncStorageKeys>): Promise<Record<string, any>> {
    try {
      const storageKeys = keys.map(key => AsyncStorageService.KEYS[key]);
      const results = await AsyncStorage.multiGet(storageKeys);
      
      const output: Record<string, any> = {};
      
      results.forEach(([storageKey, value], index) => {
        const originalKey = keys[index];
        if (value !== null) {
          try {
            output[originalKey] = JSON.parse(value);
          } catch {
            output[originalKey] = value;
          }
        } else {
          output[originalKey] = null;
        }
      });
      
      return output;
    } catch (error) {
      console.error('AsyncStorage Error - Failed to get multiple items:', error);
      return {};
    }
  }

  // ================================
  // USER DATA MANAGEMENT
  // ================================
  
  /**
   * Store user profile data (non-sensitive only)
   * 
   * Stores user profile information in AsyncStorage for easy access.
   * Only non-sensitive data should be stored here.
   * 
   * @param {User} userData - Complete user profile object
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * const userData = { id: '123', email: 'user@example.com', firstName: 'John' };
   * await asyncStorageService.storeUserData(userData);
   */
  async storeUserData(userData: User): Promise<boolean> {
    try {
      // Validate userData has required fields
      if (!userData || !userData.id) {
        console.error('AsyncStorage Error - Invalid user data: missing id field');
        return false;
      }
      
      const userDataWithMetadata = {
        ...userData,
        _storedAt: new Date().toISOString(),
        _version: '1.0',
      };
      
      const results = await Promise.all([
        this.setItem('USER_DATA', userDataWithMetadata),
        this.setItem('USER_ID', userData.id),
      ]);
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('AsyncStorage Error - Failed to store user data:', error);
      return false;
    }
  }

  /**
   * Get stored user profile data
   * 
   * @returns {Promise<User | null>} User profile data or null
   */
  async getUserData(): Promise<User | null> {
    try {
      const userData = await this.getItem('USER_DATA');
      
      if (!userData) {
        return null;
      }
      
      // Remove metadata before returning
      const { _storedAt, _version, ...cleanUserData } = userData;
      return cleanUserData as User;
    } catch (error) {
      console.error('AsyncStorage Error - Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Update specific user profile fields
   * 
   * @param {Partial<User>} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  async updateUserData(updates: Partial<User>): Promise<boolean> {
    try {
      const currentUserData = await this.getUserData();
      
      if (!currentUserData) {
        console.error('AsyncStorage Error - No existing user data to update');
        return false;
      }
      
      const updatedUserData = {
        ...currentUserData,
        ...updates,
      };
      
      return this.storeUserData(updatedUserData);
    } catch (error) {
      console.error('AsyncStorage Error - Failed to update user data:', error);
      return false;
    }
  }

  /**
   * Clear all user profile data
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearUserData(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.removeItem('USER_DATA'),
        this.removeItem('USER_ID'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('AsyncStorage Error - Failed to clear user data:', error);
      return false;
    }
  }

  // ================================
  // USER PREFERENCES MANAGEMENT
  // ================================
  
  /**
   * Store user preference with type safety
   * 
   * @param {keyof UserPreferences} preference - Preference type
   * @param {any} value - Preference value
   * @returns {Promise<boolean>} Success status
   */
  async setUserPreference(preference: keyof UserPreferences, value: any): Promise<boolean> {
    const keyMap: Record<keyof UserPreferences, keyof AsyncStorageKeys> = {
      theme: 'THEME_PREFERENCE',
      notifications: 'NOTIFICATION_SETTINGS',
    };
    
    return this.setItem(keyMap[preference], value);
  }

  /**
   * Get user preference with type safety
   * 
   * @param {keyof UserPreferences} preference - Preference type
   * @returns {Promise<any>} Preference value or null
   */
  async getUserPreference(preference: keyof UserPreferences): Promise<any> {
    const keyMap: Record<keyof UserPreferences, keyof AsyncStorageKeys> = {
      theme: 'THEME_PREFERENCE',
      notifications: 'NOTIFICATION_SETTINGS',
    };
    
    return this.getItem(keyMap[preference]);
  }

  /**
   * Get all user preferences in one operation
   * 
   * @returns {Promise<Partial<UserPreferences>>} All user preferences
   */
  async getAllUserPreferences(): Promise<Partial<UserPreferences>> {
    try {
      const results = await this.multiGet([
        'THEME_PREFERENCE',
        'NOTIFICATION_SETTINGS'
      ]);
      
      return {
        theme: results.THEME_PREFERENCE,
        notifications: results.NOTIFICATION_SETTINGS,
      };
    } catch (error) {
      console.error('AsyncStorage Error - Failed to get user preferences:', error);
      return {};
    }
  }

  // ================================
  // CACHE MANAGEMENT
  // ================================
  
  /**
   * Store data with expiration time for cache management
   * 
   * @param {keyof AsyncStorageKeys} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} [ttlMs] - Time to live in milliseconds (optional)
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * // Cache for 1 hour
   * await asyncStorageService.setCacheData('PROFILE_CACHE', userData, 3600000);
   */
  async setCacheData(key: keyof AsyncStorageKeys, data: any, ttlMs?: number): Promise<boolean> {
    try {
      const cacheMetadata: CacheMetadata = {
        data,
        timestamp: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
        version: '1.0',
      };
      
      return this.setItem(key, cacheMetadata);
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to set cache data for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cached data with expiration check
   * 
   * @param {keyof AsyncStorageKeys} key - Cache key
   * @returns {Promise<any>} Cached data or null if expired/missing
   */
  async getCacheData(key: keyof AsyncStorageKeys): Promise<any> {
    try {
      const cacheMetadata: CacheMetadata | null = await this.getItem(key);
      
      if (!cacheMetadata || !cacheMetadata.timestamp) {
        return null;
      }
      
      // Check if cache has expired
      if (cacheMetadata.expiresAt && Date.now() > cacheMetadata.expiresAt) {
        await this.removeItem(key); // Clean up expired cache
        return null;
      }
      
      return cacheMetadata.data;
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to get cache data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if cached data is still valid
   * 
   * @param {keyof AsyncStorageKeys} key - Cache key
   * @returns {Promise<boolean>} Whether cache is valid
   */
  async isCacheValid(key: keyof AsyncStorageKeys): Promise<boolean> {
    try {
      const cacheMetadata: CacheMetadata | null = await this.getItem(key);
      
      if (!cacheMetadata || !cacheMetadata.timestamp) {
        return false;
      }
      
      // Check expiration
      if (cacheMetadata.expiresAt && Date.now() > cacheMetadata.expiresAt) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`AsyncStorage Error - Failed to check cache validity for ${key}:`, error);
      return false;
    }
  }

  // ================================
  // UTILITY OPERATIONS
  // ================================
  
  /**
   * Clear all application data (use with caution)
   * 
   * Removes all data stored by this application.
   * Useful for logout, data reset, or troubleshooting.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage - All data cleared successfully');
      return true;
    } catch (error) {
      console.error('AsyncStorage Error - Failed to clear all data:', error);
      return false;
    }
  }

  /**
   * Clear only application-specific keys (safer than clearAll)
   * 
   * Removes only the keys defined in this service, leaving other
   * app data intact (useful in shared environments).
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAppData(): Promise<boolean> {
    try {
      const keys = Object.values(AsyncStorageService.KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('AsyncStorage - App data cleared successfully');
      return true;
    } catch (error) {
      console.error('AsyncStorage Error - Failed to clear app data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information for monitoring
   * 
   * @returns {Promise<{totalKeys: number, estimatedSize: number}>} Storage stats
   */
  async getStorageInfo(): Promise<{totalKeys: number, estimatedSize: number}> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(AsyncStorageService.KEYS).includes(key)
      );
      
      // Estimate size by getting all app data
      if (appKeys.length === 0) {
        return { totalKeys: 0, estimatedSize: 0 };
      }
      
      const data = await AsyncStorage.multiGet(appKeys);
      const estimatedSize = data.reduce((total, [, value]) => {
        return total + (value ? value.length : 0);
      }, 0);
      
      return {
        totalKeys: appKeys.length,
        estimatedSize, // Size in characters (approximate bytes)
      };
    } catch (error) {
      console.error('AsyncStorage Error - Failed to get storage info:', error);
      return { totalKeys: 0, estimatedSize: 0 };
    }
  }

  /**
   * Cleanup expired cache entries
   * 
   * Scans all cache keys and removes expired entries to free up space.
   * Should be called periodically or on app startup.
   * 
   * @returns {Promise<{cleaned: number, errors: number}>} Cleanup results
   */
  async cleanupExpiredCache(): Promise<{cleaned: number, errors: number}> {
    const cacheKeys: Array<keyof AsyncStorageKeys> = [
      'PROFILE_CACHE',
    ];
    
    let cleaned = 0;
    let errors = 0;
    
    for (const key of cacheKeys) {
      try {
        const isValid = await this.isCacheValid(key);
        if (!isValid) {
          const removed = await this.removeItem(key);
          if (removed) {
            cleaned++;
          } else {
            errors++;
          }
        }
      } catch (error) {
        console.error(`AsyncStorage Error - Failed to cleanup cache for ${key}:`, error);
        errors++;
      }
    }
    
    console.log(`AsyncStorage Cache Cleanup - Cleaned: ${cleaned}, Errors: ${errors}`);
    return { cleaned, errors };
  }
}

// ================================
// SINGLETON EXPORT
// ================================

/**
 * Singleton instance of AsyncStorage service
 * 
 * Use this exported instance throughout the application to ensure
 * consistent storage operations and prevent multiple instances.
 * 
 * @example
 * import { asyncStorageService } from '@/services/asyncStorage.service';
 * 
 * // Store theme preference
 * await asyncStorageService.setUserPreference('theme', 'dark');
 * 
 * // Get all preferences
 * const preferences = await asyncStorageService.getAllUserPreferences();
 * 
 * // Cache data with expiration
 * await asyncStorageService.setCacheData('PROFILE_CACHE', userData, 3600000);
 */
export const asyncStorageService = new AsyncStorageService();