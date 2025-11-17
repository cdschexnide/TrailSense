import axios from 'axios';
import { AuthService } from '@services/authService';
import { API_BASE_URL } from '@constants/config';
import { isMockMode } from '@/config/mockConfig';

// Use a dummy URL in mock mode to prevent actual API calls
// Since we inject data directly into React Query cache, API calls should not occur
const baseURL = isMockMode ? 'http://localhost:9999/mock-api' : API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock mode interceptor - prevent actual API calls
if (isMockMode) {
  apiClient.interceptors.request.use(
    config => {
      console.warn(
        `[Mock Mode] API call attempted: ${config.method?.toUpperCase()} ${config.url}`,
        '\nThis should not happen as data is pre-seeded in React Query cache.',
        '\nIf you see this, a component may be making an unnecessary API call.'
      );
      // Return config to allow request (it will fail to connect, which is fine)
      return config;
    },
    error => Promise.reject(error)
  );
}

// Development logging interceptor
if (__DEV__) {
  apiClient.interceptors.request.use(
    config => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
      return config;
    },
    error => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    response => {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
      return response;
    },
    error => {
      console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async config => {
    const tokens = await AuthService.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await AuthService.getTokens();
        if (tokens?.refreshToken) {
          const newTokens = await AuthService.refreshToken(tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AuthService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
