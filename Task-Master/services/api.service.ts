import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { API_CONFIG } from '@/config/constants';
import { ApiResponse, ApiError } from '@/types/api.types';
import { secureStorageService } from './secureStorage.service';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private shouldLog = __DEV__ || process.env.NODE_ENV === 'development';

  private logDebug(message: string, payload?: any) {
    if (this.shouldLog) {
      // eslint-disable-next-line no-console
      console.log(message, payload ?? '');
    }
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = await secureStorageService.getAuthTokens();
        if (tokens.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        // this.logDebug('[API][request]', {
        //   method: config.method?.toUpperCase(),
        //   url: config.url,
        //   data: config.data,
        // });
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // this.logDebug('[API][response]', {
        //   url: response.config.url,
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };
        this.logDebug('[API][error]', {
          url: originalRequest?.url,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;
          // refresh logic
          try {
            const tokens = await secureStorageService.getAuthTokens();
            if (tokens.refreshToken) {
              // Use raw axios client to avoid interceptor recursion
              const refreshResponse = await axios.post(
                `${API_CONFIG.BASE_URL}/auth/refresh`,
                { refreshToken: tokens.refreshToken },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  timeout: API_CONFIG.TIMEOUT,
                }
              );
              
              // Handle different response formats from backend
              let newTokens;
              const responseData = refreshResponse.data;
              
              // Check if response has wrapper format {success: true, data: {tokens: {...}}}
              if (responseData && responseData.success && responseData.data && responseData.data.tokens) {
                newTokens = responseData.data.tokens;
              }
              // Check if response has direct tokens format {tokens: {...}}
              else if (responseData && responseData.tokens) {
                newTokens = responseData.tokens;
              }
              // Check if response is tokens directly {accessToken: ..., refreshToken: ...}
              else if (responseData && responseData.accessToken) {
                newTokens = responseData;
              }
              else {
                throw new Error('Invalid token refresh response format');
              }
              
              if (!newTokens.accessToken) {
                throw new Error('Access token not found in refresh response');
              }
              
              // Store new tokens - refreshToken might be optional in some responses
              const refreshToken = newTokens.refreshToken || tokens.refreshToken;
              await secureStorageService.storeAuthTokens(newTokens.accessToken, refreshToken);

              this.processQueue(null, newTokens.accessToken);

              // Update the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }
              
              // Retry the original request with new token
              return this.client(originalRequest);
            } else {
              throw new Error('No refresh token available');
            }
          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError, null);
            
            // Clear auth data on refresh failure
            await this.clearAuthData();
            
            // Create proper error for failed refresh
            const authError = {
              message: 'Session expired. Please login again.',
              status: 401,
              code: 'AUTH_TOKEN_EXPIRED',
              details: refreshError?.message || 'Token refresh failed',
            };
            
            throw authError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async clearAuthData(): Promise<void> {
    await secureStorageService.clearAllAuthData();
  }

  private handleError(error: any): ApiError {
    // Handle custom auth errors first
    if (error?.code === 'AUTH_TOKEN_EXPIRED') {
      return {
        message: error.message || 'Session expired. Please login again.',
        status: 401,
        code: 'AUTH_TOKEN_EXPIRED',
        details: error.details || null,
      };
    }
    
    if (axios.isAxiosError(error)) {
      // Network error (no response received)
      if (!error.response) {
        return {
          message: 'Network error. Please check your internet connection and try again.',
          status: 0,
          code: 'ERR_NETWORK',
          details: null,
        };
      }

      // Server responded with error status
      if (error.response?.status === 429) {
        return {
          message: 'Rate limit exceeded, try again in some time.',
          status: 429,
          code: error.response?.data?.code || 'RATE_LIMIT_EXCEEDED',
          details: error.response?.data?.message || null,
        };
      }

      const apiError: ApiError = {
        message:
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred',
        status: error.response?.status || 0,
        code: error.response?.data?.code || error.code,
        details: error.response?.data?.details || null,
      };
      return apiError;
    }

    // Handle non-Axios errors (could be network timeouts, DNS issues, etc.)
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    // Check for specific error types that indicate connectivity issues
    if (errorMessage.includes('Network Error') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND')) {
      return {
        message: 'Unable to connect to server. Please check your internet connection and try again.',
        status: 0,
        code: 'ERR_NETWORK',
        details: errorMessage,
      };
    }

    return {
      message: errorMessage,
      status: 0,
      code: 'ERR_UNKNOWN',
      details: error?.stack || null,
    };
  }

  private async retryRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
    attempts: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<AxiosResponse<T>> {
    try {
      return await request();
    } catch (error) {
      if (attempts > 1 && this.shouldRetry(error)) {
        await this.delay(API_CONFIG.RETRY_DELAY);
        return this.retryRequest(request, attempts - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (!axios.isAxiosError(error)) return false;

    const status = error.response?.status;
    return !status || status >= 500 || status === 429;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryRequest(() =>
      this.client.get<ApiResponse<T> | T>(url, config)
    );
    
    // Check if response has the ApiResponse wrapper format
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      return responseData.data as T;
    }
    
    return response.data as T;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.retryRequest(() =>
      this.client.post<ApiResponse<T> | T>(url, data, config)
    );
    
    // Check if response has the ApiResponse wrapper format
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      return responseData.data as T;
    }
    
    return response.data as T;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.retryRequest(() =>
      this.client.put<ApiResponse<T> | T>(url, data, config)
    );
    return (response.data as ApiResponse<T>).data || (response.data as T);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.retryRequest(() =>
      this.client.patch<ApiResponse<T> | T>(url, data, config)
    );
    return (response.data as ApiResponse<T>).data || (response.data as T);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryRequest(() =>
      this.client.delete<ApiResponse<T> | T>(url, config)
    );
    return (response.data as ApiResponse<T>).data || (response.data as T);
  }
}

export const apiService = new ApiService();
