import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useKnownDevices,
  useAddKnownDevice,
  useDeleteKnownDevice,
  useUpdateKnownDevice,
} from '@hooks/api/useKnownDevices';
import { knownDevicesApi } from '@api/endpoints/knownDevices';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@api/endpoints/knownDevices');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useKnownDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch known devices successfully', async () => {
    const mockKnownDevices = [
      {
        id: '1',
        name: 'Test Device',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        category: 'family',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    (knownDevicesApi.getKnownDevices as jest.Mock).mockResolvedValue(
      mockKnownDevices
    );

    const { result } = renderHook(() => useKnownDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockKnownDevices);
  });
});

describe('useAddKnownDevice', () => {
  it('should add a known device', async () => {
    const mockKnownDevice = {
      id: '1',
      name: 'Test Device',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      category: 'family',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    (knownDevicesApi.addKnownDevice as jest.Mock).mockResolvedValue(
      mockKnownDevice
    );

    const { result } = renderHook(() => useAddKnownDevice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        name: 'Test Device',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        category: 'family',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(knownDevicesApi.addKnownDevice).toHaveBeenCalledWith({
      name: 'Test Device',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      category: 'family',
    });
  });
});

describe('useDeleteKnownDevice', () => {
  it('should remove a known device', async () => {
    (knownDevicesApi.deleteKnownDevice as jest.Mock).mockResolvedValue(
      undefined
    );

    const { result } = renderHook(() => useDeleteKnownDevice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(knownDevicesApi.deleteKnownDevice).toHaveBeenCalledWith('1');
  });
});

describe('useUpdateKnownDevice', () => {
  it('should update a known device', async () => {
    const mockKnownDevice = {
      id: '1',
      name: 'Updated Device',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      category: 'family',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (knownDevicesApi.updateKnownDevice as jest.Mock).mockResolvedValue(
      mockKnownDevice
    );

    const { result } = renderHook(() => useUpdateKnownDevice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        id: '1',
        updates: { name: 'Updated Device' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(knownDevicesApi.updateKnownDevice).toHaveBeenCalledWith('1', {
      name: 'Updated Device',
    });
  });
});
