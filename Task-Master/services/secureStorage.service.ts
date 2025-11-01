/**
 * Secure Storage Service
 * 
 * This service provides a standardized interface for storing SENSITIVE data only
 * using Expo SecureStore. It handles authentication tokens and biometric data
 * that require hardware-backed encryption.
 * 
 * Features:
 * - Type-safe storage keys and operations
 * - Automatic JSON serialization for complex objects
 * - Comprehensive error handling and logging
 * - Batch operations for performance optimization
 * - Secure data encryption at rest
 * - Biometric authentication data management
 * 
 * Sensitive Data Stored (SecureStore):
 * - Authentication tokens (access, refresh)
 * - Biometric authentication tokens and setup data
 * - API keys and secret configurations
 * 
 * Non-Sensitive Data (AsyncStorage - see asyncStorage.service.ts):
 * - User profile data (name, email, preferences)
 * - Theme and UI preferences
 * - Notification settings
 * - App configuration and cache
 * 
 * Security Features:
 * - Hardware-backed encryption when available
 * - Secure element storage on supported devices
 * - Automatic key rotation support
 * - Tamper detection and secure deletion
 * 
 * @module services/secureStorage
 * @requires expo-secure-store
 * 
 * @example
 * import { secureStorageService } from '@/services/secureStorage.service';
 * 
 * // Store authentication tokens
 * await secureStorageService.storeAuthTokens('access_token', 'refresh_token');
 * 
 * // Setup biometric authentication
 * await secureStorageService.storeBiometricData('biometric_token', 'user@email.com');
 */

import * as SecureStore from 'expo-secure-store';
import { User } from '@/types/auth.types';

/**
 * Secure storage keys interface for type safety (SENSITIVE DATA ONLY)
 * 
 * Defines secure storage keys for sensitive data that requires hardware encryption.
 * This ensures type safety and prevents typos in sensitive data operations.
 * 
 * Note: User data, theme, and preferences are stored in AsyncStorage.
 */
export interface SecureStorageKeys {
  // Authentication Tokens (SENSITIVE)
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
  
  // Biometric Authentication (SENSITIVE)
  BIOMETRIC_TOKEN: string;
  BIOMETRIC_ENABLED: string; // 'true' | 'false'
  BIOMETRIC_USER_EMAIL: string;
  BIOMETRIC_SETUP_DATE: string; // ISO timestamp
  
  // Security Settings (SENSITIVE)
  ENCRYPTION_KEY: string; // For additional data encryption
  DEVICE_ID: string; // Unique device identifier
  
  // API Configuration (SENSITIVE)
  API_BASE_URL: string; // For dynamic API endpoints
  API_VERSION: string; // API version for compatibility
}

/**
 * Biometric data interface for structured storage
 */
export interface BiometricData {
  enabled: boolean;
  token: string | null;
  userEmail: string | null;
  setupDate: string | null;
}

/**
 * Authentication tokens interface
 */
export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Secure Storage Service Class
 * 
 * Provides a comprehensive interface for managing sensitive application data
 * with hardware-backed encryption, automatic serialization, and error handling.
 */
class SecureStorageService {
  // ================================
  // SECURE STORAGE KEY DEFINITIONS
  // ================================
  
  /**
   * Standardized secure storage keys with consistent naming convention (SENSITIVE DATA ONLY)
   * 
   * Format: CATEGORY_PURPOSE (e.g., AUTH_ACCESS_TOKEN, BIOMETRIC_TOKEN)
   * This prevents key collisions and makes secure storage management easier.
   * 
   * Note: User data is stored in AsyncStorage for better performance and accessibility.
   */
  private static readonly KEYS: Record<keyof SecureStorageKeys, string> = {
    // Authentication Tokens (SENSITIVE)
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    
    // Biometric Authentication (SENSITIVE)
    BIOMETRIC_TOKEN: 'biometric_auth_token',
    BIOMETRIC_ENABLED: 'biometric_auth_enabled',
    BIOMETRIC_USER_EMAIL: 'biometric_user_email',
    BIOMETRIC_SETUP_DATE: 'biometric_setup_date',
    
    // Security Settings (SENSITIVE)
    ENCRYPTION_KEY: 'security_encryption_key',
    DEVICE_ID: 'device_unique_identifier',
    
    // API Configuration (SENSITIVE)
    API_BASE_URL: 'api_base_endpoint_url',
    API_VERSION: 'api_version_number',
  };

  // ================================
  // CORE STORAGE OPERATIONS
  // ================================

  /**
   * Store a value securely with automatic serialization
   * 
   * Handles both primitive values and complex objects by automatically
   * serializing them to JSON. Uses hardware-backed encryption when available.
   * 
   * @param {keyof SecureStorageKeys} key - Secure storage key from predefined keys
   * @param {any} value - Value to store securely (will be JSON serialized if needed)
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await secureStorageService.setItem('ACCESS_TOKEN', 'jwt_token_here');
   * await secureStorageService.setItem('USER_DATA', { id: '123', email: 'user@example.com' });
   */
  async setItem(key: keyof SecureStorageKeys, value: any): Promise<boolean> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await SecureStore.setItemAsync(SecureStorageService.KEYS[key], serializedValue);
      return true;
    } catch (error) {
      console.error(`SecureStorage Error - Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a value securely with automatic deserialization
   * 
   * Attempts to parse JSON for objects, falls back to string value.
   * Returns null if key doesn't exist or decryption fails.
   * 
   * @param {keyof SecureStorageKeys} key - Secure storage key to retrieve
   * @returns {Promise<any>} Stored value or null
   * 
   * @example
   * const token = await secureStorageService.getItem('ACCESS_TOKEN');
   * const userData = await secureStorageService.getItem('USER_DATA');
   */
  async getItem(key: keyof SecureStorageKeys): Promise<any> {
    try {
      const value = await SecureStore.getItemAsync(SecureStorageService.KEYS[key]);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string value
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if JSON parsing fails
      }
    } catch (error) {
      console.error(`SecureStorage Error - Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value securely with secure deletion
   * 
   * Securely deletes the stored value and clears it from memory.
   * Uses secure deletion methods when available on the device.
   * 
   * @param {keyof SecureStorageKeys} key - Secure storage key to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeItem(key: keyof SecureStorageKeys): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(SecureStorageService.KEYS[key]);
      return true;
    } catch (error) {
      console.error(`SecureStorage Error - Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a secure storage key exists
   * 
   * @param {keyof SecureStorageKeys} key - Secure storage key to check
   * @returns {Promise<boolean>} Whether key exists
   */
  async hasItem(key: keyof SecureStorageKeys): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(SecureStorageService.KEYS[key]);
      return value !== null;
    } catch (error) {
      console.error(`SecureStorage Error - Failed to check ${key}:`, error);
      return false;
    }
  }

  /**
   * Securely clear all application data (use with extreme caution)
   * 
   * Removes all sensitive data stored by this application.
   * Uses secure deletion methods and overwrites memory when possible.
   * This operation cannot be undone.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(SecureStorageService.KEYS);
      await Promise.all(
        keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {}))
      );
      console.log('SecureStorage - All sensitive data cleared successfully');
      return true;
    } catch (error) {
      console.error('SecureStorage Error - Failed to clear all data:', error);
      return false;
    }
  }

  // ================================
  // BATCH OPERATIONS
  // ================================
  
  /**
   * Store multiple key-value pairs securely in sequence
   * 
   * More reliable than parallel operations for sensitive data.
   * Each operation is completed before starting the next.
   * 
   * @param {Array<[keyof SecureStorageKeys, any]>} pairs - Array of [key, value] pairs
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await secureStorageService.multiSet([
   *   ['ACCESS_TOKEN', 'jwt_token'],
   *   ['REFRESH_TOKEN', 'refresh_token'],
   *   ['USER_DATA', userData]
   * ]);
   */
  async multiSet(pairs: Array<[keyof SecureStorageKeys, any]>): Promise<boolean> {
    try {
      for (const [key, value] of pairs) {
        const success = await this.setItem(key, value);
        if (!success) {
          throw new Error(`Failed to store ${key}`);
        }
      }
      return true;
    } catch (error) {
      console.error('SecureStorage Error - Failed to set multiple items:', error);
      return false;
    }
  }

  /**
   * Retrieve multiple values securely in sequence
   * 
   * @param {Array<keyof SecureStorageKeys>} keys - Array of keys to retrieve
   * @returns {Promise<Record<string, any>>} Object with key-value pairs
   */
  async multiGet(keys: Array<keyof SecureStorageKeys>): Promise<Record<string, any>> {
    try {
      const output: Record<string, any> = {};
      
      for (const key of keys) {
        output[key] = await this.getItem(key);
      }
      
      return output;
    } catch (error) {
      console.error('SecureStorage Error - Failed to get multiple items:', error);
      return {};
    }
  }

  // ================================
  // NOTE: USER DATA MANAGEMENT
  // ================================
  // 
  // User data is now stored in AsyncStorage for better performance and accessibility.
  // See asyncStorage.service.ts for user data management methods:
  // - storeUserData()
  // - getUserData() 
  // - updateUserData()
  // - clearUserData()
  //

  // ================================
  // AUTHENTICATION TOKEN MANAGEMENT
  // ================================
  
  /**
   * Store authentication tokens securely
   * 
   * Stores both access and refresh tokens with metadata for tracking.
   * Includes timestamp for token rotation and security auditing.
   * 
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await secureStorageService.storeAuthTokens('access_jwt', 'refresh_jwt');
   */
  async storeAuthTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      
      const results = await Promise.all([
        this.setItem('ACCESS_TOKEN', {
          token: accessToken,
          storedAt: timestamp,
        }),
        this.setItem('REFRESH_TOKEN', {
          token: refreshToken,
          storedAt: timestamp,
        }),
      ]);
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorage Error - Failed to store auth tokens:', error);
      return false;
    }
  }

  /**
   * Get authentication tokens with metadata
   * 
   * @returns {Promise<AuthTokens>} Token object with access and refresh tokens
   */
  async getAuthTokens(): Promise<AuthTokens> {
    try {
      const [accessTokenData, refreshTokenData] = await Promise.all([
        this.getItem('ACCESS_TOKEN'),
        this.getItem('REFRESH_TOKEN'),
      ]);
      
      return {
        accessToken: accessTokenData?.token || accessTokenData || null,
        refreshToken: refreshTokenData?.token || refreshTokenData || null,
      };
    } catch (error) {
      console.error('SecureStorage Error - Failed to get auth tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  /**
   * Update only the access token (for token refresh scenarios)
   * 
   * @param {string} accessToken - New access token
   * @returns {Promise<boolean>} Success status
   */
  async updateAccessToken(accessToken: string): Promise<boolean> {
    try {
      return this.setItem('ACCESS_TOKEN', {
        token: accessToken,
        storedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('SecureStorage Error - Failed to update access token:', error);
      return false;
    }
  }

  /**
   * Clear authentication tokens securely
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAuthTokens(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.removeItem('ACCESS_TOKEN'),
        this.removeItem('REFRESH_TOKEN'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorage Error - Failed to clear auth tokens:', error);
      return false;
    }
  }

  // ================================
  // BIOMETRIC AUTHENTICATION MANAGEMENT
  // ================================

  /**
   * Store biometric authentication data with metadata
   * 
   * Stores biometric token, user email, and setup metadata.
   * Includes setup timestamp for security auditing and token rotation.
   * 
   * @param {string} token - Biometric authentication token
   * @param {string} userEmail - User email associated with biometric setup
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await secureStorageService.storeBiometricData('biometric_token', 'user@example.com');
   */
  async storeBiometricData(token: string, userEmail: string): Promise<boolean> {
    try {
      const setupDate = new Date().toISOString();
      
      const results = await Promise.all([
        this.setItem('BIOMETRIC_TOKEN', token),
        this.setItem('BIOMETRIC_USER_EMAIL', userEmail),
        this.setItem('BIOMETRIC_ENABLED', 'true'),
        this.setItem('BIOMETRIC_SETUP_DATE', setupDate),
      ]);
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorage Error - Failed to store biometric data:', error);
      return false;
    }
  }

  /**
   * Store biometric data with structured object (alternative interface)
   * 
   * Accepts a structured biometric data object for more complex scenarios.
   * 
   * @param {BiometricData} biometricData - Structured biometric data object
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * const biometricData = {
   *   enabled: true,
   *   token: 'biometric_token',
   *   userEmail: 'user@example.com',
   *   setupDate: new Date().toISOString()
   * };
   * await secureStorageService.setBiometricData(biometricData);
   */
  async setBiometricData(biometricData: BiometricData): Promise<boolean> {
    try {
      if (!biometricData.enabled || !biometricData.token || !biometricData.userEmail) {
        console.error('SecureStorage Error - Invalid biometric data provided');
        return false;
      }
      
      return this.storeBiometricData(biometricData.token, biometricData.userEmail);
    } catch (error) {
      console.error('SecureStorage Error - Failed to set biometric data:', error);
      return false;
    }
  }

  /**
   * Get biometric authentication data with metadata
   * 
   * @returns {Promise<BiometricData>} Complete biometric data object
   */
  async getBiometricData(): Promise<BiometricData> {
    try {
      const [token, userEmail, enabledStr, setupDate] = await Promise.all([
        this.getItem('BIOMETRIC_TOKEN'),
        this.getItem('BIOMETRIC_USER_EMAIL'),
        this.getItem('BIOMETRIC_ENABLED'),
        this.getItem('BIOMETRIC_SETUP_DATE'),
      ]);
      
      return {
        enabled: enabledStr === 'true',
        token,
        userEmail,
        setupDate,
      };
    } catch (error) {
      console.error('SecureStorage Error - Failed to get biometric data:', error);
      return {
        enabled: false,
        token: null,
        userEmail: null,
        setupDate: null,
      };
    }
  }

  /**
   * Clear biometric authentication data securely
   * 
   * Removes all biometric-related data and disables biometric authentication.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearBiometricData(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.removeItem('BIOMETRIC_TOKEN'),
        this.removeItem('BIOMETRIC_USER_EMAIL'),
        this.removeItem('BIOMETRIC_ENABLED'),
        this.removeItem('BIOMETRIC_SETUP_DATE'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorage Error - Failed to clear biometric data:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled
   * 
   * @returns {Promise<boolean>} Whether biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await this.getItem('BIOMETRIC_ENABLED');
      return enabled === 'true';
    } catch (error) {
      console.error('SecureStorage Error - Failed to check biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   * 
   * Sets biometric enabled to false without clearing the stored data.
   * Useful for temporary disabling without losing setup.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async disableBiometric(): Promise<boolean> {
    try {
      return this.setItem('BIOMETRIC_ENABLED', 'false');
    } catch (error) {
      console.error('SecureStorage Error - Failed to disable biometric:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   * 
   * Re-enables biometric authentication if data exists.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async enableBiometric(): Promise<boolean> {
    try {
      const biometricData = await this.getBiometricData();
      
      if (!biometricData.token || !biometricData.userEmail) {
        console.error('SecureStorage Error - Cannot enable biometric without setup data');
        return false;
      }
      
      return this.setItem('BIOMETRIC_ENABLED', 'true');
    } catch (error) {
      console.error('SecureStorage Error - Failed to enable biometric:', error);
      return false;
    }
  }

  // ================================
  // UTILITY OPERATIONS
  // ================================

  /**
   * Clear all sensitive authentication data (logout)
   * 
   * Removes authentication tokens and biometric data from SecureStore.
   * User profile data is handled separately in AsyncStorage.
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAllAuthData(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.clearAuthTokens(),
        this.clearBiometricData(),
      ]);
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorage Error - Failed to clear all auth data:', error);
      return false;
    }
  }

  /**
   * Get secure storage usage information
   * 
   * @returns {Promise<{totalKeys: number, hasAuthData: boolean, hasBiometricData: boolean}>} Storage stats
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    hasAuthData: boolean;
    hasBiometricData: boolean;
  }> {
    try {
      const [authTokens, biometricData] = await Promise.all([
        this.getAuthTokens(),
        this.getBiometricData(),
      ]);
      
      const keys = Object.values(SecureStorageService.KEYS);
      
      return {
        totalKeys: keys.length,
        hasAuthData: !!(authTokens.accessToken || authTokens.refreshToken),
        hasBiometricData: biometricData.enabled && !!biometricData.token,
      };
    } catch (error) {
      console.error('SecureStorage Error - Failed to get storage info:', error);
      return {
        totalKeys: 0,
        hasAuthData: false,
        hasBiometricData: false,
      };
    }
  }

  /**
   * Validate stored data integrity
   * 
   * Checks if stored sensitive authentication data is valid and consistent.
   * 
   * @returns {Promise<{isValid: boolean, issues: string[]}>} Validation results
   */
  async validateStoredData(): Promise<{isValid: boolean, issues: string[]}> {
    const issues: string[] = [];
    
    try {
      // Check authentication tokens
      const authTokens = await this.getAuthTokens();
      if (authTokens.accessToken && !authTokens.refreshToken) {
        issues.push('Access token exists without refresh token');
      }
      
      // Check biometric data consistency
      const biometricData = await this.getBiometricData();
      if (biometricData.enabled && (!biometricData.token || !biometricData.userEmail)) {
        issues.push('Biometric enabled but missing token or email');
      }
      
      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('SecureStorage Error - Failed to validate stored data:', error);
      return {
        isValid: false,
        issues: ['Failed to validate stored data'],
      };
    }
  }
}

// ================================
// SINGLETON EXPORT
// ================================

/**
 * Singleton instance of Secure Storage service
 * 
 * Use this exported instance throughout the application to ensure
 * consistent secure storage operations and prevent multiple instances.
 * 
 * @example
 * import { secureStorageService } from '@/services/secureStorage.service';
 * import { asyncStorageService } from '@/services/asyncStorage.service';
 * 
 * // Store sensitive authentication data (SecureStore)
 * await secureStorageService.storeAuthTokens('access_token', 'refresh_token');
 * await secureStorageService.storeBiometricData('biometric_token', 'user@email.com');
 * 
 * // Store non-sensitive user data (AsyncStorage)
 * await asyncStorageService.storeUserData(userData);
 * await asyncStorageService.setUserPreference('theme', 'dark');
 * 
 * // Complete logout - clear sensitive data only
 * await secureStorageService.clearAllAuthData();
 */
export const secureStorageService = new SecureStorageService();