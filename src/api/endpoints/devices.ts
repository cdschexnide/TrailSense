import { apiClient } from '../client';
import { Device, CreateDeviceDTO } from '@types';
import type { DeviceFilters } from '@hooks/api/useDevices';

type DeviceApiShape = Device & {
  detectionCount?: number;
};

/**
 * Idempotent read mapper: translates backend `detectionCount` to frontend
 * `alertCount`. Safe for mock/demo mode where seedMockData() populates the
 * React Query cache with frontend-shaped objects that already have `alertCount`.
 * If the object already has `alertCount`, it passes through unchanged.
 */
function mapDeviceResponse(raw: DeviceApiShape): Device {
  if (raw.alertCount !== undefined || raw.detectionCount === undefined) {
    return raw;
  }

  const { detectionCount, ...rest } = raw;
  return { ...rest, alertCount: detectionCount };
}

/**
 * Write mapper: translates frontend `alertCount` back to backend
 * `detectionCount` for PATCH requests, since the backend Prisma schema
 * expects `detectionCount`.
 */
function mapDeviceRequest(updates: Partial<Device>): Record<string, unknown> {
  const { alertCount, ...rest } = updates;

  if (alertCount !== undefined) {
    return { ...rest, detectionCount: alertCount };
  }

  return rest;
}

export const devicesApi = {
  getDevices: async (filters?: DeviceFilters): Promise<Device[]> => {
    const { data } = await apiClient.get('/api/devices', {
      params: filters,
    });
    return data.map(mapDeviceResponse);
  },

  getDeviceById: async (id: string): Promise<Device> => {
    const { data } = await apiClient.get(`/api/devices/${id}`);
    return mapDeviceResponse(data);
  },

  addDevice: async (device: CreateDeviceDTO): Promise<Device> => {
    const { data } = await apiClient.post('/api/devices', device);
    return mapDeviceResponse(data);
  },

  updateDevice: async (
    id: string,
    updates: Partial<Device>
  ): Promise<Device> => {
    const { data } = await apiClient.patch(
      `/api/devices/${id}`,
      mapDeviceRequest(updates)
    );
    return mapDeviceResponse(data);
  },

  deleteDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/devices/${id}`);
  },
};
