import { apiClient } from '../client';
import { KnownDevice, CreateKnownDeviceDTO } from '@types';

export const knownDevicesApi = {
  getKnownDevices: async (): Promise<KnownDevice[]> => {
    const { data } = await apiClient.get('/whitelist');
    return data;
  },

  getKnownDeviceById: async (id: string): Promise<KnownDevice> => {
    const { data } = await apiClient.get(`/whitelist/${id}`);
    return data;
  },

  addKnownDevice: async (
    entry: CreateKnownDeviceDTO
  ): Promise<KnownDevice> => {
    const { data } = await apiClient.post('/whitelist', entry);
    return data;
  },

  updateKnownDevice: async (
    id: string,
    updates: Partial<KnownDevice>
  ): Promise<KnownDevice> => {
    const { data } = await apiClient.patch(`/whitelist/${id}`, updates);
    return data;
  },

  deleteKnownDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/whitelist/${id}`);
  },
};
