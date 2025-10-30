import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

class BiometricService {
  private static readonly BIOMETRIC_TOKEN_KEY = 'biometric_token';
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly USER_EMAIL_KEY = 'biometric_user_email';

  /**
   * Check if device supports biometric authentication and user has enrolled
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticateWithBiometrics(reason: string = 'Authenticate to continue'): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.checkBiometricCapabilities();
      
      if (!capabilities.hasHardware) {
        return {
          success: false,
          error: 'Biometric authentication is not supported on this device',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials are enrolled on this device',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
        };
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
      };
    }
  }

  /**
   * Enable biometric authentication for user
   */
  async enableBiometricAuth(userEmail: string, biometricToken: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(BiometricService.BIOMETRIC_TOKEN_KEY, biometricToken);
      await SecureStore.setItemAsync(BiometricService.USER_EMAIL_KEY, userEmail);
      await SecureStore.setItemAsync(BiometricService.BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(BiometricService.BIOMETRIC_TOKEN_KEY);
      await SecureStore.deleteItemAsync(BiometricService.USER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BiometricService.BIOMETRIC_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BiometricService.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Get stored biometric token
   */
  async getBiometricToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BiometricService.BIOMETRIC_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting biometric token:', error);
      return null;
    }
  }

  /**
   * Get stored user email for biometric login
   */
  async getBiometricUserEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BiometricService.USER_EMAIL_KEY);
    } catch (error) {
      console.error('Error getting biometric user email:', error);
      return null;
    }
  }

  /**
   * Get friendly name for biometric type
   */
  getBiometricTypeNames(types: LocalAuthentication.AuthenticationType[]): string[] {
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
  }

  /**
   * Perform biometric login
   */
  async performBiometricLogin(): Promise<{ success: boolean; token?: string; userEmail?: string; error?: string }> {
    try {
      // Check if biometric is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
        };
      }

      // Authenticate with biometrics
      const authResult = await this.authenticateWithBiometrics('Sign in with biometrics');
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      // Get stored credentials
      const token = await this.getBiometricToken();
      const userEmail = await this.getBiometricUserEmail();

      if (!token || !userEmail) {
        return {
          success: false,
          error: 'Biometric credentials not found. Please sign in with password.',
        };
      }

      return {
        success: true,
        token,
        userEmail,
      };
    } catch (error: any) {
      console.error('Biometric login error:', error);
      return {
        success: false,
        error: error.message || 'Biometric login failed',
      };
    }
  }
}

export const biometricService = new BiometricService();