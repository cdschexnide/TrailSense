import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@api/endpoints';
import { Alert, AlertFilters } from '@types';

export const ALERTS_QUERY_KEY = 'alerts';

// Auto-refresh interval for alerts (30 seconds)
const ALERTS_REFETCH_INTERVAL = 30 * 1000;

export const useAlerts = (filters?: AlertFilters) => {
  return useQuery({
    queryKey: [ALERTS_QUERY_KEY, filters],
    queryFn: () => alertsApi.getAlerts(filters),
    // Auto-refresh every 30 seconds for real-time updates
    refetchInterval: ALERTS_REFETCH_INTERVAL,
    // Pause polling when app is in background (saves battery)
    refetchIntervalInBackground: false,
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: [ALERTS_QUERY_KEY, id],
    queryFn: () => alertsApi.getAlertById(id),
    enabled: !!id,
    // Auto-refresh individual alert details too
    refetchInterval: ALERTS_REFETCH_INTERVAL,
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
