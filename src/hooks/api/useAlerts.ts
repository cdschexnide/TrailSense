import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@api/endpoints';
import { Alert, AlertFilters } from '@types';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';

export const ALERTS_QUERY_KEY = 'alerts';

// Auto-refresh interval for alerts (30 seconds)
const ALERTS_REFETCH_INTERVAL = 30 * 1000;

// Normalize empty/undefined filters to a consistent undefined key
function normalizeFilters(filters?: AlertFilters): AlertFilters | undefined {
  if (!filters || Object.keys(filters).length === 0) return undefined;
  return filters;
}

export const useAlerts = (filters?: AlertFilters) => {
  const normalized = normalizeFilters(filters);
  const mockMode = isDemoOrMockMode();
  return useQuery({
    queryKey:
      normalized === undefined
        ? [ALERTS_QUERY_KEY]
        : [ALERTS_QUERY_KEY, normalized],
    queryFn: () => alertsApi.getAlerts(normalized),
    staleTime: mockMode ? Infinity : undefined,
    refetchInterval: mockMode ? false : ALERTS_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
};

export const useAlert = (id: string) => {
  const mockMode = isDemoOrMockMode();
  return useQuery({
    queryKey: [ALERTS_QUERY_KEY, id],
    queryFn: () => alertsApi.getAlertById(id),
    enabled: !!id,
    staleTime: mockMode ? Infinity : undefined,
    refetchInterval: mockMode ? false : ALERTS_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
};

export const useMarkAlertReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.markReviewed(id),
    onSuccess: (_, id) => {
      // Invalidate alerts list
      queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });

      // Update specific alert in cache
      queryClient.setQueryData<Alert>([ALERTS_QUERY_KEY, id], oldData => {
        if (oldData) {
          return { ...oldData, isReviewed: true };
        }
        return oldData;
      });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.deleteAlert(id),
    onSuccess: () => {
      // Invalidate alerts list to refetch
      queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
    },
  });
};
