import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import { biometricService } from '../services/biometric.service';
import { secureStorageService } from '../services/secureStorage.service';
import {
  AuthContextType,
  User,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setisAuthenticated] = useState(!!(user && token));
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // const isAuthenticated = !!(user && token);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Update authentication state when user or token changes
  useEffect(() => {
    setisAuthenticated(!!(user && token));
  }, [user, token]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const [storedUser, storedToken, biometricStatus] = await Promise.all([
        authService.getStoredUser(),
        authService.getStoredToken(),
        secureStorageService.isBiometricEnabled(),
      ]);

      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
        setisAuthenticated(true);
      }

      setBiometricEnabled(biometricStatus);
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear any corrupted auth data
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      setToken(authResponse.tokens.accessToken);
      setisAuthenticated(true);
    } catch (error) {
      console.log("error while loggin in : AuthContext", error)
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse = await authService.register(credentials);
      setUser(authResponse.user);
      setToken(authResponse.tokens.accessToken);
      setisAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still continue with logout even if backend call fails
    } finally {
      // Clear all authentication state
      setUser(null);
      setToken(null);
      setisAuthenticated(false);
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const newToken = await authService.refreshToken();
      if (newToken) {
        setToken(newToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const loginWithBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get stored biometric data
      const biometricData = await secureStorageService.getBiometricData();
      
      if (!biometricData.enabled || !biometricData.token || !biometricData.userEmail) {
        throw new Error('Biometric authentication is not set up');
      }

      // Authenticate with device biometrics
      const biometricAuthResult = await biometricService.authenticateWithBiometrics(
        'Sign in with biometrics'
      );

      if (!biometricAuthResult.success) {
        throw new Error(biometricAuthResult.error || 'Biometric authentication failed');
      }

      // Login with biometric token
      const authResponse = await authService.loginWithBiometric({
        email: biometricData.userEmail,
        biometricToken: biometricData.token,
      });

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

  const setupBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (!user) {
        throw new Error('User must be logged in to setup biometric authentication');
      }

      // Check biometric capabilities
      const capabilities = await biometricService.checkBiometricCapabilities();
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Authenticate with biometrics for setup
      const authResult = await biometricService.authenticateWithBiometrics(
        'Set up biometric authentication'
      );

      if (!authResult.success) {
        throw new Error(authResult.error || 'Biometric authentication failed');
      }

      // Setup biometric on backend
      const setupResponse = await authService.setupBiometric();

      // Store biometric data securely
      await secureStorageService.storeBiometricData(
        setupResponse.biometricToken,
        user.email
      );

      setBiometricEnabled(true);
      
      // Update user object with biometric status
      setUser({ ...user, biometricEnabled: true });
    } catch (error) {
      console.error('Biometric setup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Disable biometric on backend
      await authService.disableBiometric();

      // Clear local biometric data
      await secureStorageService.clearBiometricData();

      setBiometricEnabled(false);
      
      // Update user object with biometric status
      if (user) {
        setUser({ ...user, biometricEnabled: false });
      }
    } catch (error) {
      console.error('Biometric disable error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricStatus = async (): Promise<boolean> => {
    try {
      const [localStatus, backendStatus] = await Promise.all([
        secureStorageService.isBiometricEnabled(),
        authService.getBiometricStatus(),
      ]);

      const isEnabled = localStatus && backendStatus.biometricEnabled;
      setBiometricEnabled(isEnabled);
      
      return isEnabled;
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricEnabled(false);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    login,
    loginWithBiometric,
    register,
    logout,
    refreshToken,
    setupBiometric,
    disableBiometric,
    checkBiometricStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
