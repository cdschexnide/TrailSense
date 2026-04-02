import type { QueryClient } from '@tanstack/react-query';
import type { AxiosAdapter } from 'axios';
import { apiClient, mockApiAdapter, setMockAdapterQueryClient } from '@api/client';
import { isMockMode } from '@/config/mockConfig';
import { isDemoMode } from '@/config/demoMode';

let savedQueryDefaults: ReturnType<QueryClient['getDefaultOptions']> | null =
  null;
// null = not yet snapshotted; undefined = original adapter was undefined
let savedApiAdapter: AxiosAdapter | undefined | null = null;

/**
 * Apply runtime mock configuration to apiClient and queryClient.
 * Called when entering demo mode (from login screen or cold-start).
 * Idempotent: snapshots are only taken on the first call.
 */
export function applyDemoModeConfig(queryClient: QueryClient): void {
  if (!savedQueryDefaults) {
    savedQueryDefaults = queryClient.getDefaultOptions();
  }

  if (savedApiAdapter === null) {
    savedApiAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
  }

  apiClient.defaults.adapter = mockApiAdapter;
  setMockAdapterQueryClient(queryClient);
  queryClient.setDefaultOptions({
    ...savedQueryDefaults,
    queries: {
      ...savedQueryDefaults?.queries,
      staleTime: Infinity,
      retry: false,
      refetchOnReconnect: false,
    },
  });
}

/**
 * Revert runtime mock configuration.
 * Called on logout from demo mode.
 */
export function revertDemoModeConfig(queryClient: QueryClient): void {
  if (savedApiAdapter !== null) {
    if (savedApiAdapter !== undefined) {
      apiClient.defaults.adapter = savedApiAdapter;
    } else {
      delete apiClient.defaults.adapter;
    }
    savedApiAdapter = null;
    setMockAdapterQueryClient(null);
  }

  if (savedQueryDefaults) {
    queryClient.setDefaultOptions(savedQueryDefaults);
    savedQueryDefaults = null;
  }
}

/**
 * Live check for whether the app is in any mock/demo mode.
 * Unlike the static `isMockMode` snapshot, this reflects runtime state.
 * Use in query hooks for options that must respond to demo mode entry.
 */
export function isDemoOrMockMode(): boolean {
  return isMockMode || isDemoMode();
}

/**
 * Returns query options appropriate for mock/demo mode.
 * Disables refetching and sets infinite stale time when in demo mode.
 * Call at render time so it reads live state.
 */
export function demoQueryOptions() {
  const active = isDemoOrMockMode();
  return {
    staleTime: active ? Infinity : undefined,
    refetchInterval: active ? false : undefined,
    refetchIntervalInBackground: false,
  } as const;
}
