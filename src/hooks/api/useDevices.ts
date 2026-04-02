import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '@api/endpoints';
import { Device, CreateDeviceDTO } from '@types';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';

export const DEVICES_QUERY_KEY = 'devices';
type DeviceStatus = 'online' | 'offline';

export interface DeviceFilters {
  status?: DeviceStatus[];
  type?: string;
}

type UpdateDeviceVariables =
  | { id: string; updates: Partial<Device> }
  | { id: string; payload: Partial<Device> };

// Auto-refresh interval for devices (30 seconds)
const DEVICES_REFETCH_INTERVAL = 30 * 1000;

function normalizeFilters(filters?: DeviceFilters): DeviceFilters | undefined {
  if (!filters || Object.keys(filters).length === 0) {
    return undefined;
  }

  return filters;
}

export const useDevices = (filters?: DeviceFilters) => {
  const mockMode = isDemoOrMockMode();
  const normalized = normalizeFilters(filters);

  return useQuery({
    queryKey:
      normalized === undefined
        ? [DEVICES_QUERY_KEY]
        : [DEVICES_QUERY_KEY, normalized],
    queryFn: () => devicesApi.getDevices(normalized),
    staleTime: mockMode ? Infinity : undefined,
    refetchInterval: mockMode ? false : DEVICES_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
};

export const useDevice = (id: string) => {
  const mockMode = isDemoOrMockMode();
  return useQuery({
    queryKey: [DEVICES_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
    staleTime: mockMode ? Infinity : undefined,
    refetchInterval: mockMode ? false : DEVICES_REFETCH_INTERVAL,
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
    mutationFn: (variables: UpdateDeviceVariables) => {
      const updates =
        'updates' in variables ? variables.updates : variables.payload;
      return devicesApi.updateDevice(variables.id, updates);
    },
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
