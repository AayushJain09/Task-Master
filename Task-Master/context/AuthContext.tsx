/**
 * Authentication Context
 * 
 * This module provides a React Context for managing application-wide authentication state.
 * It handles user authentication, session management, biometric authentication, and profile
 * data synchronization across the entire application.
 * 
 * Key Features:
 * - Email/password authentication with automatic token management
 * - Biometric authentication (fingerprint/face ID) support
 * - Profile fetching and verification on app startup
 * - Automatic token refresh and session validation
 * - Secure storage integration for persistent authentication
 * - Error handling with automatic logout for security issues
 * - Loading states for UI feedback during auth operations
 * 
 * Authentication Flow:
 * 1. App initialization → Load stored auth data → Verify with server
 * 2. Login/Register → Store auth tokens → Update context state
 * 3. Profile operations → Keep user data fresh and validated
 * 4. Logout → Clear all stored data → Reset context state
 * 
 * @module context/AuthContext
 * @requires ../services/auth.service - Authentication service layer
 * @requires ../services/biometric.service - Biometric authentication service
 * @requires ../services/secureStorage.service - Secure storage operations
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

// Service layer imports
import { authService } from '../services/auth.service';
import { biometricService } from '../services/biometric.service';
import { secureStorageService } from '../services/secureStorage.service';

// Type definitions
import {
  AuthContextType,
  User,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth.types';

/**
 * Authentication Context
 * Provides authentication state and methods to child components
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props interface for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication context to all child components.
 * Manages authentication state, handles initialization, and provides auth methods.
 * 
 * @param {AuthProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap with auth context
 * 
 * @example
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // ================================
  // STATE MANAGEMENT
  // ================================
  
  /** Current authenticated user data */
  const [user, setUser] = useState<User | null>(null);
  
  /** Current authentication token */
  const [token, setToken] = useState<string | null>(null);
  
  /** Loading state for authentication operations */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Authentication status derived from user and token presence */
  const [isAuthenticated, setisAuthenticated] = useState(!!(user && token));
  
  /** Biometric authentication enabled status */
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // ================================
  // EFFECT HOOKS
  // ================================
  
  /**
   * Initialize authentication on app startup
   * Loads stored auth data and verifies user status with server
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Update authentication state when user or token changes
   * Ensures isAuthenticated reflects current auth status
   */
  useEffect(() => {
    setisAuthenticated(!!(user && token));
  }, [user, token]);

  // ================================
  // AUTHENTICATION INITIALIZATION
  // ================================

  /**
   * Verifies user profile in background during app initialization
   * 
   * This function runs profile verification silently without blocking the UI
   * or causing startup errors. It handles auth failures gracefully by logging
   * the user out only for critical issues.
   */
  const verifyProfileInBackground = async () => {
    try {
      // Small delay to allow UI to render first
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const freshProfile = await authService.getProfile();
      setUser(freshProfile);
      console.log('Profile verified and updated in background');
    } catch (profileError: any) {
      console.warn('Background profile verification failed:', profileError.message);
      
      // Only logout for critical auth failures, not network issues
      if (profileError.message?.includes('Session expired') || 
          profileError.message?.includes('deactivated') ||
          profileError.message?.includes('not found') ||
          profileError.status === 401 || profileError.status === 403) {
        console.log('Critical auth failure detected, logging out user');
        await logout();
      }
      // For network errors or server issues, keep user logged in with cached data
    }
  };
  
  /**
   * Initializes authentication state on app startup
   * 
   * Process:
   * 1. Load stored authentication data (user, token, biometric status)
   * 2. If user is stored, verify current status with server
   * 3. Handle authentication errors gracefully
   * 4. Set loading state to false when complete
   * 
   * This function ensures that returning users maintain their authentication
   * state while also validating that their account is still active and valid.
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Load stored authentication data in parallel for performance
      const [storedUser, storedToken, biometricStatus] = await Promise.all([
        authService.getStoredUser(),
        authService.getStoredToken(),
        secureStorageService.isBiometricEnabled(),
      ]);

      // If we have stored authentication data, set it and verify with server
      if (storedUser && storedToken) {
        // First set the stored user and token for API calls
        setUser(storedUser);
        setToken(storedToken);
        setisAuthenticated(true);
        
        // Verify profile in background without blocking UI
        // This ensures user data is fresh and account is still valid
        verifyProfileInBackground();
        console.log('Authentication initialized with stored data');
      }

      // Set biometric status regardless of authentication state
      setBiometricEnabled(biometricStatus);
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear any corrupted auth data
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // AUTHENTICATION METHODS
  // ================================

  /**
   * Handles user login with email and password
   * 
   * @param {LoginCredentials} credentials - User login credentials
   * @param {string} credentials.email - User email address
   * @param {string} credentials.password - User password
   * 
   * @throws {Error} Authentication errors from login service
   * 
   * Process:
   * 1. Validate credentials with auth service
   * 2. Store authentication tokens securely
   * 3. Update context state with user data
   * 4. Handle errors and provide user feedback
   * 
   * @example
   * await login({ email: 'user@example.com', password: 'password123' });
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Authenticate user through auth service
      const authResponse = await authService.login(credentials);
      
      // Update context state with successful authentication
      setUser(authResponse.user);
      setToken(authResponse.tokens.accessToken);
      setisAuthenticated(true);
    } catch (error) {
      console.log("error while loggin in : AuthContext", error);
      throw error; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user registration and automatic login
   * 
   * @param {RegisterCredentials} credentials - User registration data
   * @param {string} credentials.email - User email address
   * @param {string} credentials.password - User password
   * @param {string} credentials.confirmPassword - Password confirmation
   * @param {string} credentials.firstName - User first name
   * @param {string} credentials.lastName - User last name
   * 
   * @throws {Error} Registration errors from auth service
   * 
   * Process:
   * 1. Create user account through auth service
   * 2. Automatically log in the new user
   * 3. Store authentication tokens
   * 4. Update context state
   * 
   * @example
   * await register({
   *   email: 'user@example.com',
   *   password: 'password123',
   *   confirmPassword: 'password123',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Register user and automatically log them in
      const authResponse = await authService.register(credentials);
      
      // Update context state with new user authentication
      setUser(authResponse.user);
      setToken(authResponse.tokens.accessToken);
      setisAuthenticated(true);
    } catch (error) {
      throw error; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user logout
   * 
   * Process:
   * 1. Call backend logout endpoint to invalidate tokens
   * 2. Clear all stored authentication data
   * 3. Reset all context state
   * 4. Continue logout even if backend call fails (for offline scenarios)
   * 
   * This method ensures complete cleanup of user session data.
   * 
   * @example
   * await logout();
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Attempt to logout on backend (invalidate refresh tokens)
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still continue with logout even if backend call fails
    } finally {
      // Always clear all authentication state locally
      setUser(null);
      setToken(null);
      setisAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * Refreshes authentication token
   * 
   * Used when access token expires to maintain user session without
   * requiring re-authentication.
   * 
   * @throws {Error} Token refresh errors (triggers logout)
   * 
   * Process:
   * 1. Use refresh token to get new access token
   * 2. Update stored token and context state
   * 3. On failure, logout user for security
   * 
   * @example
   * await refreshToken();
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const newToken = await authService.refreshToken();
      if (newToken) {
        setToken(newToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout(); // Force logout on refresh failure
      throw error;
    }
  };

  // ================================
  // BIOMETRIC AUTHENTICATION METHODS
  // ================================

  /**
   * Handles biometric login (fingerprint/face ID)
   * 
   * Process:
   * 1. Get stored biometric credentials
   * 2. Authenticate with device biometrics
   * 3. Login with biometric token
   * 4. Update context state
   * 
   * @throws {Error} Biometric authentication errors
   * 
   * @example
   * await loginWithBiometric();
   */
  const loginWithBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get stored biometric authentication data
      const biometricData = await secureStorageService.getBiometricData();
      
      // Validate biometric data is available
      if (!biometricData.enabled || !biometricData.token || !biometricData.userEmail) {
        throw new Error('Biometric authentication is not set up');
      }

      // Authenticate with device biometrics (fingerprint/face ID prompt)
      const biometricAuthResult = await biometricService.authenticateWithBiometrics(
        'Sign in with biometrics'
      );

      if (!biometricAuthResult.success) {
        throw new Error(biometricAuthResult.error || 'Biometric authentication failed');
      }

      // Login with server using biometric token
      const authResponse = await authService.loginWithBiometric({
        email: biometricData.userEmail,
        biometricToken: biometricData.token,
      });

      // Update context state with successful authentication
      setUser(authResponse.user);
      setToken(authResponse.tokens.accessToken);
      setisAuthenticated(true);
    } catch (error) {
      console.error('Biometric login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sets up biometric authentication for the user
   * 
   * Process:
   * 1. Check device biometric capabilities
   * 2. Authenticate with device biometrics for setup
   * 3. Generate and store biometric token on server
   * 4. Store biometric data locally
   * 5. Update biometric status
   * 
   * @throws {Error} Biometric setup errors
   * 
   * @example
   * await setupBiometric();
   */
  const setupBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Ensure user is authenticated before setup
      if (!user) {
        throw new Error('User must be logged in to setup biometric authentication');
      }

      // Check device biometric capabilities
      const capabilities = await biometricService.checkBiometricCapabilities();
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Authenticate with biometrics for initial setup
      const authResult = await biometricService.authenticateWithBiometrics(
        'Set up biometric authentication'
      );

      if (!authResult.success) {
        throw new Error(authResult.error || 'Biometric authentication failed');
      }

      // Setup biometric authentication on server
      const setupResponse = await authService.setupBiometric();

      // Store biometric data locally for future use
      await secureStorageService.setBiometricData({
        enabled: true,
        token: setupResponse.biometricToken,
        userEmail: user.email,
        setupDate: new Date().toISOString(),
      });

      // Update context state
      setBiometricEnabled(true);
      console.log('Biometric authentication setup completed');
    } catch (error) {
      console.error('Biometric setup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disables biometric authentication
   * 
   * Process:
   * 1. Disable biometric authentication on server
   * 2. Clear local biometric data
   * 3. Update context state
   * 
   * @throws {Error} Biometric disable errors
   * 
   * @example
   * await disableBiometric();
   */
  const disableBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Disable biometric authentication on server
      await authService.disableBiometric();

      // Clear local biometric data
      await secureStorageService.clearBiometricData();

      // Update context state
      setBiometricEnabled(false);
      console.log('Biometric authentication disabled');
    } catch (error) {
      console.error('Biometric disable error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks biometric authentication status
   * 
   * Verifies both local and server-side biometric status to ensure
   * consistency across devices and accounts.
   * 
   * @returns {Promise<boolean>} True if biometric is enabled and available
   * 
   * @example
   * const isEnabled = await checkBiometricStatus();
   */
  const checkBiometricStatus = async (): Promise<boolean> => {
    try {
      // Check both local storage and server status
      const [localStatus, backendStatus] = await Promise.all([
        secureStorageService.isBiometricEnabled(),
        authService.getBiometricStatus(),
      ]);

      // Biometric is enabled only if both local and server agree
      const isEnabled = localStatus && backendStatus.biometricEnabled;
      setBiometricEnabled(isEnabled);
      
      return isEnabled;
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricEnabled(false);
      return false;
    }
  };

  // ================================
  // PROFILE MANAGEMENT METHODS
  // ================================

  /**
   * Refreshes user profile data from server
   * 
   * Fetches fresh user data to ensure profile information is current
   * and the user account is still active and valid.
   * 
   * @throws {Error} Profile refresh errors (may trigger logout)
   * 
   * @example
   * await refreshProfile();
   */
  const refreshProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Ensure user is authenticated
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to refresh profile');
      }

      // Fetch fresh profile data from server
      const freshProfile = await authService.getProfile();
      setUser(freshProfile);
      console.log('Profile refreshed successfully');
    } catch (error: any) {
      console.error('Profile refresh error:', error);
      
      // If profile refresh fails due to auth issues, logout the user
      if (error.message?.includes('Session expired') || 
          error.message?.includes('deactivated') ||
          error.message?.includes('not found')) {
        console.log('Logging out due to profile refresh failure');
        await logout();
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates user profile information
   * 
   * @param {Object} profileData - Profile update data
   * @param {string} [profileData.firstName] - Updated first name
   * @param {string} [profileData.lastName] - Updated last name
   * 
   * @throws {Error} Profile update errors (may trigger logout)
   * 
   * @example
   * await updateUserProfile({ firstName: 'John', lastName: 'Smith' });
   */
  const updateUserProfile = async (profileData: { firstName?: string; lastName?: string }): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Ensure user is authenticated
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to update profile');
      }

      // Update profile on server and get updated user data
      const updatedProfile = await authService.updateProfile(profileData);
      setUser(updatedProfile);
      console.log('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // If profile update fails due to auth issues, logout the user
      if (error.message?.includes('Session expired') || 
          error.message?.includes('deactivated') ||
          error.message?.includes('not found')) {
        console.log('Logging out due to profile update failure');
        await logout();
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // CONTEXT VALUE DEFINITION
  // ================================

  /**
   * Context value object containing all authentication state and methods
   * This is what child components receive when using useAuth()
   */
  const value: AuthContextType = {
    // Authentication state
    user,
    token,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    
    // Authentication methods
    login,
    loginWithBiometric,
    register,
    logout,
    refreshToken,
    
    // Biometric methods
    setupBiometric,
    disableBiometric,
    checkBiometricStatus,
    
    // Profile methods
    refreshProfile,
    updateUserProfile,
  };

  // ================================
  // PROVIDER COMPONENT RENDER
  // ================================

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 * 
 * This hook provides a convenient way to access authentication state and methods
 * from any component within the AuthProvider tree.
 * 
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * function MyComponent() {
 *   const { user, login, logout, isLoading } = useAuth();
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!user) return <LoginForm onSubmit={login} />;
 *   return <UserDashboard user={user} onLogout={logout} />;
 * }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}