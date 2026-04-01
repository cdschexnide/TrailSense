import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knownDevicesApi } from '@api/endpoints';
import { KnownDevice, CreateKnownDeviceDTO } from '@types';

export const KNOWN_DEVICES_QUERY_KEY = 'knownDevices';

export const useKnownDevices = () => {
  return useQuery({
    queryKey: [KNOWN_DEVICES_QUERY_KEY],
    queryFn: () => knownDevicesApi.getKnownDevices(),
  });
};

export const useKnownDevice = (id: string) => {
  return useQuery({
    queryKey: [KNOWN_DEVICES_QUERY_KEY, id],
    queryFn: () => knownDevicesApi.getKnownDeviceById(id),
    enabled: !!id,
  });
};

export const useAddKnownDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: CreateKnownDeviceDTO) =>
      knownDevicesApi.addKnownDevice(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};

export const useUpdateKnownDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<KnownDevice>;
    }) => knownDevicesApi.updateKnownDevice(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<KnownDevice>(
        [KNOWN_DEVICES_QUERY_KEY, variables.id],
        data
      );
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};

export const useDeleteKnownDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => knownDevicesApi.deleteKnownDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};
