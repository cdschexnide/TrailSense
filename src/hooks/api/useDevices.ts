import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '@api/endpoints';
import { Device, CreateDeviceDTO } from '@types';

export const DEVICES_QUERY_KEY = 'devices';

// Auto-refresh interval for devices (30 seconds)
const DEVICES_REFETCH_INTERVAL = 30 * 1000;

export const useDevices = () => {
  return useQuery({
    queryKey: [DEVICES_QUERY_KEY],
    queryFn: () => devicesApi.getDevices(),
    // Auto-refresh every 30 seconds for real-time updates
    // (detection counts, battery, signal, GPS coordinates)
    refetchInterval: DEVICES_REFETCH_INTERVAL,
    // Pause polling when app is in background (saves battery)
    refetchIntervalInBackground: false,
  });
};

export const useDevice = (id: string) => {
  return useQuery({
    queryKey: [DEVICES_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
    // Auto-refresh individual device details too
    refetchInterval: DEVICES_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
};

export const useAddDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (device: CreateDeviceDTO) => devicesApi.addDevice(device),
    onSuccess: () => {
      // Invalidate devices list to refetch
      queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Device> }) =>
      devicesApi.updateDevice(id, updates),
    onSuccess: (data, variables) => {
      // Update specific device in cache
      queryClient.setQueryData<Device>([DEVICES_QUERY_KEY, variables.id], data);

      // Invalidate devices list
      queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesApi.deleteDevice(id),
    onSuccess: () => {
      // Invalidate devices list to refetch
      queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
    },
  });
};
