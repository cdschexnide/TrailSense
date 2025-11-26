import { apiClient } from '../client';
import { Device, CreateDeviceDTO } from '@types';

export const devicesApi = {
  getDevices: async (): Promise<Device[]> => {
    const { data } = await apiClient.get('/api/devices');
    return data;
  },

  getDeviceById: async (id: string): Promise<Device> => {
    const { data } = await apiClient.get(`/api/devices/${id}`);
    return data;
  },

  addDevice: async (device: CreateDeviceDTO): Promise<Device> => {
    const { data } = await apiClient.post('/api/devices', device);
    return data;
  },

  updateDevice: async (
    id: string,
    updates: Partial<Device>
  ): Promise<Device> => {
    const { data } = await apiClient.patch(`/api/devices/${id}`, updates);
    return data;
  },

  deleteDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/devices/${id}`);
  },
};
