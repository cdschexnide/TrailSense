import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDevices,
  useDeviceById,
  useUpdateDevice,
  useDeleteDevice,
} from '@hooks/useDevices';
import { devicesApi } from '@api/endpoints/devices';

jest.mock('@api/endpoints/devices');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'DevicesTestWrapper';
  return Wrapper;
};

describe('useDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch devices successfully', async () => {
    const mockDevices = {
      devices: [
        {
          id: '1',
          name: 'Test Device',
          type: 'sensor',
          status: 'online' as const,
          lastSeen: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      hasMore: false,
    };

    (devicesApi.getDevices as jest.Mock).mockResolvedValue(mockDevices);

    const { result } = renderHook(() => useDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDevices);
  });

  it('should fetch devices with filters', async () => {
    const filters = { status: ['online'], type: 'sensor' };
    const mockDevices = {
      devices: [],
      total: 0,
      hasMore: false,
    };

    (devicesApi.getDevices as jest.Mock).mockResolvedValue(mockDevices);

    const { result } = renderHook(() => useDevices(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(devicesApi.getDevices).toHaveBeenCalledWith(filters);
  });
});

describe('useDeviceById', () => {
  it('should fetch a single device by id', async () => {
    const mockDevice = {
      id: '1',
      name: 'Test Device',
      type: 'sensor',
      status: 'online' as const,
      lastSeen: '2024-01-01T00:00:00Z',
    };

    (devicesApi.getDeviceById as jest.Mock).mockResolvedValue(mockDevice);

    const { result } = renderHook(() => useDeviceById('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDevice);
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useDeviceById(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateDevice', () => {
  it('should update a device', async () => {
    const mockDevice = {
      id: '1',
      name: 'Updated Device',
      type: 'sensor',
      status: 'online' as const,
      lastSeen: '2024-01-01T00:00:00Z',
    };

    (devicesApi.updateDevice as jest.Mock).mockResolvedValue(mockDevice);

    const { result } = renderHook(() => useUpdateDevice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({ id: '1', payload: { name: 'Updated Device' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(devicesApi.updateDevice).toHaveBeenCalledWith('1', {
      name: 'Updated Device',
    });
  });
});

describe('useDeleteDevice', () => {
  it('should delete a device', async () => {
    (devicesApi.deleteDevice as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteDevice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(devicesApi.deleteDevice).toHaveBeenCalledWith('1');
  });
});
