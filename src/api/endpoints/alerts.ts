import { apiClient } from '../client';
import { Alert, AlertFilters } from '@types';

export const alertsApi = {
  getAlerts: async (filters?: AlertFilters): Promise<Alert[]> => {
    const { data } = await apiClient.get('/alerts', { params: filters });
    return data;
  },

  getAlertById: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get(`/alerts/${id}`);
    return data;
  },

  markReviewed: async (id: string): Promise<void> => {
    await apiClient.patch(`/alerts/${id}/reviewed`);
  },

  deleteAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/alerts/${id}`);
  },
};
