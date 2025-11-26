import { apiClient } from '../client';
import { Alert, AlertFilters } from '@types';

export const alertsApi = {
  getAlerts: async (filters?: AlertFilters): Promise<Alert[]> => {
    const { data } = await apiClient.get('/api/alerts', { params: filters });
    return data;
  },

  getAlertById: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get(`/api/alerts/${id}`);
    return data;
  },

  markReviewed: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/alerts/${id}/reviewed`);
  },

  deleteAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/alerts/${id}`);
  },
};
