import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { AuthService } from '@services/authService';
import { API_BASE_URL } from '@constants/config';
import { isMockMode } from '@/config/mockConfig';

// Use a dummy URL in mock mode to prevent actual API calls
// Since we inject data directly into React Query cache, API calls should not occur
const baseURL = isMockMode ? 'http://localhost:9999/mock-api' : API_BASE_URL;

function createBaseClient(): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const publicApiClient = createBaseClient();
export const apiClient = createBaseClient();

// Lazy reference to queryClient — set by demoModeRuntime or App.tsx to avoid
// circular imports. When set, the adapter can return seeded cache data instead
// of destructive empty fallbacks.
let _queryClientRef: QueryClient | null = null;
export function setMockAdapterQueryClient(qc: QueryClient | null) {
  _queryClientRef = qc;
}

// Extract trailing resource ID from a URL segment, e.g. "/alerts/alert-001" → "alert-001"
function extractId(url: string, segment: string): string | undefined {
  const re = new RegExp(`/${segment}/([^/?]+)`);
  return re.exec(url)?.[1];
}

// Extract a query parameter value from a URL, e.g. "?deviceId=dev-001" → "dev-001"
function extractQueryParam(url: string, param: string): string | undefined {
  const re = new RegExp(`[?&]${param}=([^&]+)`);
  return re.exec(url)?.[1];
}

// URL-to-query-key mapping for cache lookups.
// When a URL contains a resource ID (e.g. /alerts/alert-001), the individual
// cache entry is tried first so the adapter returns the single object rather
// than the full collection array.
function urlToQueryKeys(url: string): (string | undefined)[][] {
  if (url.includes('/known-devices')) {
    const id = extractId(url, 'known-devices');
    if (id) return [['knownDevices', id], ['knownDevices']];
    return [['knownDevices']];
  }
  if (url.includes('/positions')) {
    // Positions use query param ?deviceId= rather than path-based ID
    const id =
      extractId(url, 'positions') || extractQueryParam(url, 'deviceId');
    if (id) return [['positions', id], ['positions']];
    return [['positions']];
  }
  if (url.includes('/alerts')) {
    const id = extractId(url, 'alerts');
    if (id) return [['alerts', id], ['alerts', undefined], ['alerts']];
    return [['alerts', undefined], ['alerts']];
  }
  if (url.includes('/devices')) {
    const id = extractId(url, 'devices');
    if (id) return [['devices', id], ['devices']];
    return [['devices']];
  }
  return [];
}

// Default empty responses when no cache data is available
function emptyFallback(url: string): unknown {
  if (url.includes('/positions')) return { positions: [] };
  if (url.includes('/alerts')) return [];
  if (url.includes('/devices')) return [];
  if (url.includes('/known-devices')) return [];
  return {};
}

// Mock adapter — returns seeded cache data if available, otherwise empty
// fallbacks. Data is pre-seeded into React Query cache; this adapter prevents
// network calls while preserving seeded state.
// Also used by demoModeRuntime.ts for runtime demo-mode entry.
export const mockApiAdapter = (config: InternalAxiosRequestConfig) => {
  const url = config.url || '';

  // Try to return seeded data from the query cache
  let data: unknown = undefined;
  if (_queryClientRef) {
    const keys = urlToQueryKeys(url);
    for (const key of keys) {
      const cached = _queryClientRef.getQueryData(key);
      if (cached !== undefined) {
        data = cached;
        break;
      }
    }
  }

  // Fall back to empty response only if nothing was cached
  if (data === undefined) {
    data = emptyFallback(url);
  }

  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
};

// Install mock adapter at boot when static isMockMode is true
if (isMockMode) {
  apiClient.defaults.adapter = mockApiAdapter;
}

// Development logging interceptor
if (__DEV__) {
  apiClient.interceptors.request.use(
    config => {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    },
    (error: AxiosError) => {
      console.error('[API Request Error]', {
        message: error.message,
        code: error.code,
      });
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    response => {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
        }
      );
      return response;
    },
    (error: AxiosError) => {
      console.error(
        `[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        {
          message: error.message,
          status: error.response?.status,
          code: error.code,
        }
      );
      return Promise.reject(error);
    }
  );
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
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
