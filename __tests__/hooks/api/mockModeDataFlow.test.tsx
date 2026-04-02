import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Store } from '@reduxjs/toolkit';
import { seedMockData } from '@/utils/seedMockData';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { usePositions } from '@hooks/api/usePositions';
import { alertsApi } from '@api/endpoints/alerts';
import { devicesApi } from '@api/endpoints/devices';
import * as positionsApi from '@api/endpoints/positions';

jest.mock('@/config/mockConfig', () => ({
  isMockMode: true,
  getIsMockMode: () => true,
  mockConfig: {
    enabled: true,
    autoLogin: true,
    logMockCalls: false,
    apiDelay: 0,
    mockWebSocket: true,
    wsEventInterval: 5000,
    wsDeviceStatusInterval: 15000,
  },
}));

jest.mock('@api/endpoints/alerts');
jest.mock('@api/endpoints/devices');
jest.mock('@api/endpoints/positions', () => ({
  getPositions: jest.fn(),
  clearPositions: jest.fn(),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function createMockStore(): Store {
  return {
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    replaceReducer: jest.fn(),
  } as unknown as Store;
}

describe('mock-mode data flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('seeds live positions into React Query cache for mock mode', async () => {
    const queryClient = createQueryClient();

    await seedMockData({
      queryClient,
      store: createMockStore(),
    });

    const device001Positions = queryClient.getQueryData<{
      positions: unknown[];
    }>(['positions', 'device-001']);

    expect(device001Positions).toBeDefined();
    expect(device001Positions?.positions.length).toBeGreaterThan(0);
  });

  it('does not refetch devices from the API when mock cache is already seeded', async () => {
    const queryClient = createQueryClient();
    const mockDevices = [{ id: 'device-001', name: 'North Gate Sensor' }];

    queryClient.setQueryData(['devices'], mockDevices);
    (devicesApi.getDevices as jest.Mock).mockResolvedValue(mockDevices);

    const { result } = renderHook(() => useDevices(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual(mockDevices));
    expect(devicesApi.getDevices).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(devicesApi.getDevices).not.toHaveBeenCalled();
  });

  it('does not refetch alerts from the API when mock cache is already seeded', async () => {
    const queryClient = createQueryClient();
    const mockAlerts = [{ id: 'alert-001', deviceId: 'device-001' }];

    queryClient.setQueryData(['alerts'], mockAlerts);
    (alertsApi.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual(mockAlerts));
    expect(alertsApi.getAlerts).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(alertsApi.getAlerts).not.toHaveBeenCalled();
  });

  it('does not fetch live positions from the API in mock mode when cached data exists', async () => {
    const queryClient = createQueryClient();
    const mockResponse = {
      positions: [
        {
          id: 'pos-001',
          deviceId: 'device-001',
          fingerprintHash: 'fp-test',
          macAddress: 'AA:BB:CC:DD:EE:FF',
          signalType: 'wifi',
          latitude: 31.53,
          longitude: -110.28,
          accuracyMeters: 12,
          confidence: 0.9,
          measurementCount: 4,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    queryClient.setQueryData(['positions', 'device-001'], mockResponse);
    (positionsApi.getPositions as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePositions('device-001'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual(mockResponse));
    expect(positionsApi.getPositions).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(positionsApi.getPositions).not.toHaveBeenCalled();
  });
});
