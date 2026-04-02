import { QueryClient } from '@tanstack/react-query';
import { isMockMode } from '@/config/mockConfig';

// These defaults handle the static boot-time case (FORCE_MOCK_MODE / USE_MOCK_API).
// For runtime demo-mode entry, demoModeRuntime.ts overwrites these dynamically.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isMockMode ? Infinity : 1000 * 60 * 5, // Never stale in mock mode
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: isMockMode ? false : 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isMockMode,
    },
  },
});
