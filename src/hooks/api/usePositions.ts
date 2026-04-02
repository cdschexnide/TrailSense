/**
 * usePositions Hook
 *
 * React Query hook for fetching triangulated device positions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPositions, clearPositions } from '../../api/endpoints/positions';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';

export const POSITIONS_QUERY_KEY = 'positions';

/**
 * Fetch positions for a specific device
 */
export function usePositions(deviceId: string | undefined, options?: { enabled?: boolean }) {
  const mockMode = isDemoOrMockMode();
  return useQuery({
    queryKey: [POSITIONS_QUERY_KEY, deviceId],
    queryFn: () => getPositions(deviceId!),
    enabled: !!deviceId && (options?.enabled !== false),
    refetchInterval: mockMode ? false : 10000,
    staleTime: mockMode ? Infinity : 5000,
  });
}

/**
 * Clear positions mutation
 */
export function useClearPositions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => clearPositions(deviceId),
    onSuccess: (_, deviceId) => {
      // Invalidate positions query for this device
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY, deviceId] });
    },
  });
}
