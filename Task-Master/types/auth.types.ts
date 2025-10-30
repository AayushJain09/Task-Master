export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  isEmailVerified: boolean;
  biometricEnabled?: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  data: AuthResponse;
}

export interface BiometricCredentials {
  email: string;
  biometricToken: string;
}

export interface BiometricSetupResponse {
  biometricToken: string;
  biometricEnabled: boolean;
  setupTimestamp: string;
}

export interface BiometricStatusResponse {
  biometricEnabled: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setupBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  checkBiometricStatus: () => Promise<boolean>;
}