import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@api/endpoints';
import { Alert, AlertFilters } from '@types';

export const ALERTS_QUERY_KEY = 'alerts';

export const useAlerts = (filters?: AlertFilters) => {
  return useQuery({
    queryKey: [ALERTS_QUERY_KEY, filters],
    queryFn: () => alertsApi.getAlerts(filters),
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: [ALERTS_QUERY_KEY, id],
    queryFn: () => alertsApi.getAlertById(id),
    enabled: !!id,
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
