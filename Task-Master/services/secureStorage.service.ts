import * as SecureStore from 'expo-secure-store';

export interface SecureStorageKeys {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
  BIOMETRIC_TOKEN: string;
  BIOMETRIC_ENABLED: string;
  BIOMETRIC_USER_EMAIL: string;
  THEME_PREFERENCE: string;
}

class SecureStorageService {
  private static readonly KEYS: SecureStorageKeys = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    BIOMETRIC_TOKEN: 'biometric_token',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    BIOMETRIC_USER_EMAIL: 'biometric_user_email',
    THEME_PREFERENCE: 'theme_preference',
  };

  /**
   * Store a value securely
   */
  async setItem(key: keyof SecureStorageKeys, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(SecureStorageService.KEYS[key], value);
      return true;
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: keyof SecureStorageKeys): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SecureStorageService.KEYS[key]);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value securely
   */
  async removeItem(key: keyof SecureStorageKeys): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(SecureStorageService.KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: keyof SecureStorageKeys): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(SecureStorageService.KEYS[key]);
      return value !== null;
    } catch (error) {
      console.error(`Error checking ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(SecureStorageService.KEYS);
      await Promise.all(
        keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {}))
      );
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  /**
   * Store authentication tokens
   */
  async storeAuthTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.setItem('ACCESS_TOKEN', accessToken),
        this.setItem('REFRESH_TOKEN', refreshToken),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error storing auth tokens:', error);
      return false;
    }
  }

  /**
   * Get authentication tokens
   */
  async getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getItem('ACCESS_TOKEN'),
        this.getItem('REFRESH_TOKEN'),
      ]);
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.removeItem('ACCESS_TOKEN'),
        this.removeItem('REFRESH_TOKEN'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
      return false;
    }
  }

  /**
   * Store biometric authentication data
   */
  async storeBiometricData(token: string, userEmail: string): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.setItem('BIOMETRIC_TOKEN', token),
        this.setItem('BIOMETRIC_USER_EMAIL', userEmail),
        this.setItem('BIOMETRIC_ENABLED', 'true'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error storing biometric data:', error);
      return false;
    }
  }

  /**
   * Get biometric authentication data
   */
  async getBiometricData(): Promise<{
    token: string | null;
    userEmail: string | null;
    enabled: boolean;
  }> {
    try {
      const [token, userEmail, enabledStr] = await Promise.all([
        this.getItem('BIOMETRIC_TOKEN'),
        this.getItem('BIOMETRIC_USER_EMAIL'),
        this.getItem('BIOMETRIC_ENABLED'),
      ]);
      return {
        token,
        userEmail,
        enabled: enabledStr === 'true',
      };
    } catch (error) {
      console.error('Error getting biometric data:', error);
      return {
        token: null,
        userEmail: null,
        enabled: false,
      };
    }
  }

  /**
   * Clear biometric authentication data
   */
  async clearBiometricData(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.removeItem('BIOMETRIC_TOKEN'),
        this.removeItem('BIOMETRIC_USER_EMAIL'),
        this.removeItem('BIOMETRIC_ENABLED'),
      ]);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error clearing biometric data:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await this.getItem('BIOMETRIC_ENABLED');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  /**
   * Store theme preference
   */
  async storeThemePreference(theme: string): Promise<boolean> {
    return this.setItem('THEME_PREFERENCE', theme);
  }

  /**
   * Get theme preference
   */
  async getThemePreference(): Promise<string | null> {
    return this.getItem('THEME_PREFERENCE');
  }
}

export const secureStorageService = new SecureStorageService();