import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  devicesApi,
  DeviceFilters,
  UpdateDevicePayload,
} from '@api/endpoints/devices';

export const useDevices = (filters?: DeviceFilters) => {
  return useQuery({
    queryKey: ['devices', filters],
    queryFn: () => devicesApi.getDevices(filters),
  });
};

export const useDeviceById = (id: string) => {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDevicePayload;
    }) => devicesApi.updateDevice(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => devicesApi.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useDeviceAlerts = (
  deviceId: string,
  filters?: { limit?: number; offset?: number }
) => {
  return useQuery({
    queryKey: ['devices', deviceId, 'alerts', filters],
    queryFn: () => devicesApi.getDeviceAlerts(deviceId, filters),
    enabled: !!deviceId,
  });
};
