import { apiService } from '@/services/api.service';
import * as SecureStore from 'expo-secure-store';
import { AUTH_CONFIG } from '@/config/constants';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthApiResponse,
  User,
  BiometricCredentials,
  BiometricSetupResponse,
  BiometricStatusResponse,
} from '@/types/auth.types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.post('/auth/login', credentials);
      
      if (!response.user || !response.tokens) {
        throw new Error('Invalid response format');
      }

      const { user, tokens } = response;

      // Store tokens securely
      await SecureStore.setItemAsync(AUTH_CONFIG.TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(user));

      return response;
    } catch (error: any) {
      console.error('Auth service login error:', error);
      
      // Handle network errors first
      if (error?.code === 'ERR_NETWORK' || !error?.status) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle specific HTTP status codes
      switch (error?.status) {
        case 401:
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        case 403:
          throw new Error('Your account has been suspended. Please contact support.');
        case 404:
          throw new Error('Account not found. Please check your email or register a new account.');
        case 409:
          throw new Error('Account conflict. Please try again or contact support.');
        case 422:
          throw new Error('Invalid login data. Please check your email format and password.');
        case 429:
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again later.');
        default:
          // Use the server's error message if available, otherwise use a generic message
          const serverMessage = error?.message;
          if (serverMessage && !serverMessage.includes('Network') && !serverMessage.includes('timeout')) {
            throw new Error(serverMessage);
          }
          throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.post('/auth/register', credentials);
      
      if (!response.user || !response.tokens) {
        throw new Error('Invalid response format');
      }

      const { user, tokens } = response;

      // Store tokens securely
      await SecureStore.setItemAsync(AUTH_CONFIG.TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(user));

      return response;
    } catch (error: any) {
      console.error('Auth service registration error:', error);
      
      // Handle network errors first
      if (error?.code === 'ERR_NETWORK' || !error?.status) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle specific HTTP status codes
      switch (error?.status) {
        case 400:
          const validationErrors = error?.response?.data?.errors;
          if (validationErrors && Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: any) => err.message).join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(error?.message || 'Invalid registration data. Please check your inputs.');
        case 409:
          throw new Error('An account with this email already exists. Please try logging in instead.');
        case 422:
          throw new Error('Invalid registration data. Please check all fields and try again.');
        case 429:
          throw new Error('Too many registration attempts. Please wait a moment and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again later.');
        default:
          const serverMessage = error?.message;
          if (serverMessage && !serverMessage.includes('Network') && !serverMessage.includes('timeout')) {
            throw new Error(serverMessage);
          }
          throw new Error('Registration failed. Please check your information and try again.');
      }
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to invalidate tokens
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // Always clear stored tokens regardless of backend response
      await SecureStore.deleteItemAsync(AUTH_CONFIG.TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_CONFIG.USER_KEY);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(AUTH_CONFIG.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_CONFIG.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: any = await apiService.post('/auth/refresh', { refreshToken });
      
      if (!response.tokens?.accessToken) {
        throw new Error('Token refresh failed');
      }

      const newAccessToken = response.tokens.accessToken;
      const newRefreshToken = response.tokens.refreshToken;

      // Store new tokens
      await SecureStore.setItemAsync(AUTH_CONFIG.TOKEN_KEY, newAccessToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);

      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logout();
      return null;
    }
  }

  async loginWithBiometric(credentials: BiometricCredentials): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.post('/auth/biometric/login', credentials);
      
      if (!response.user || !response.tokens) {
        throw new Error('Invalid response format');
      }

      // Store authentication data
      await SecureStore.setItemAsync(AUTH_CONFIG.TOKEN_KEY, response.tokens.accessToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, response.tokens.refreshToken);
      await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      console.error('Biometric login error:', error);
      
      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error('Invalid biometric credentials');
      } else if (error.response?.status === 403) {
        throw new Error('Biometric authentication is disabled for this account');
      } else if (error.response?.status === 404) {
        throw new Error('Account not found');
      }
      
      throw new Error(error.message || 'Biometric login failed');
    }
  }

  async setupBiometric(): Promise<BiometricSetupResponse> {
    try {
      const response: BiometricSetupResponse = await apiService.post('/auth/biometric/setup');
      
      console.log("response", response)
      if (!response) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error: any) {
      console.error('Biometric setup error:', error);
      
      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 409) {
        throw new Error('Biometric authentication is already enabled');
      }
      
      throw new Error(error.message || 'Biometric setup failed');
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await apiService.post('/auth/biometric/disable');
    } catch (error: any) {
      console.error('Biometric disable error:', error);
      
      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Biometric authentication is not enabled');
      }
      
      throw new Error(error.message || 'Failed to disable biometric authentication');
    }
  }

  async getBiometricStatus(): Promise<BiometricStatusResponse> {
    try {
      const response: BiometricStatusResponse = await apiService.get('/auth/biometric/status');
      
      if (!response) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error: any) {
      console.error('Biometric status error:', error);
      
      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      }
      
      // Return default status if API call fails
      return { biometricEnabled: false };
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response: User = await apiService.get('/auth/profile');
      
      if (!response) {
        throw new Error('Invalid response format');
      }

      // Update stored user data with fresh profile data
      await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(response));

      return response;
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      
      // Handle network errors first
      if (error?.code === 'ERR_NETWORK' || !error?.status) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle specific HTTP status codes
      switch (error?.status) {
        case 401:
          // Token expired or invalid - clear stored data and force re-login
          await this.logout();
          throw new Error('Session expired. Please login again.');
        case 403:
          // Account deactivated
          await this.logout();
          throw new Error('Your account has been deactivated. Please contact support.');
        case 404:
          // User not found
          await this.logout();
          throw new Error('Account not found. Please login again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again later.');
        default:
          // Use the server's error message if available
          const serverMessage = error?.message;
          if (serverMessage && !serverMessage.includes('Network') && !serverMessage.includes('timeout')) {
            throw new Error(serverMessage);
          }
          throw new Error('Failed to fetch profile. Please try again.');
      }
    }
  }

  async updateProfile(profileData: { firstName?: string; lastName?: string }): Promise<User> {
    try {
      const response: User = await apiService.put('/auth/profile', profileData);
      
      if (!response) {
        throw new Error('Invalid response format');
      }

      // Update stored user data with updated profile
      await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(response));

      return response;
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle network errors first
      if (error?.code === 'ERR_NETWORK' || !error?.status) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle specific HTTP status codes
      switch (error?.status) {
        case 400:
          const validationErrors = error?.response?.data?.errors;
          if (validationErrors && Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: any) => err.message).join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(error?.message || 'Invalid profile data. Please check your inputs.');
        case 401:
          await this.logout();
          throw new Error('Session expired. Please login again.');
        case 403:
          await this.logout();
          throw new Error('Your account has been deactivated. Please contact support.');
        case 404:
          await this.logout();
          throw new Error('Account not found. Please login again.');
        case 422:
          throw new Error('Invalid profile data. Please check all fields and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again later.');
        default:
          const serverMessage = error?.message;
          if (serverMessage && !serverMessage.includes('Network') && !serverMessage.includes('timeout')) {
            throw new Error(serverMessage);
          }
          throw new Error('Failed to update profile. Please try again.');
      }
    }
  }
}

export const authService = new AuthService();
