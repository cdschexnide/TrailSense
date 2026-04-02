import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@api/endpoints/alerts';
import {
  useAlerts as useApiAlerts,
  useAlert as useApiAlert,
  useMarkAlertReviewed as useApiMarkAlertReviewed,
  useDeleteAlert as useApiDeleteAlert,
} from '@hooks/api/useAlerts';
import { AlertFilters } from '@types';

export const useAlerts = useApiAlerts;
export const useAlertById = useApiAlert;
export const useMarkAlertReviewed = useApiMarkAlertReviewed;
export const useDeleteAlert = useApiDeleteAlert;

export const useMarkMultipleAlertsReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      await Promise.all(
        alertIds.map(alertId => alertsApi.markReviewed(alertId))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export type { AlertFilters };
