import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, AlertFilters } from '@api/endpoints/alerts';

export const useAlerts = (filters?: AlertFilters) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsApi.getAlerts(filters),
  });
};

export const useAlertById = (id: string) => {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => alertsApi.getAlertById(id),
    enabled: !!id,
  });
};

export const useMarkAlertReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.markReviewed(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useMarkMultipleAlertsReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertIds: string[]) =>
      alertsApi.markMultipleReviewed(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
