import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Device } from '@/types/device';

const DEVICES_QUERY_KEY = 'devices';

const mockOn = jest.fn();
const mockOff = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('@api/websocket', () => ({
  websocketService: {
    connect: (...args: unknown[]) => mockConnect(...args),
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
    on: (...args: unknown[]) => mockOn(...args),
    off: (...args: unknown[]) => mockOff(...args),
  },
}));

import { useWebSocket } from '@hooks/useWebSocket';

const baseDevice: Device = {
  id: 'device-001',
  name: 'North Gate',
  online: true,
  alertCount: 10,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function createWrapper(queryClient: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  Wrapper.displayName = 'UseWebSocketTestWrapper';
  return Wrapper;
}

describe('useWebSocket', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  function getDeviceStatusHandler(): (
    status: Partial<Device> & { id: string }
  ) => void {
    renderHook(() => useWebSocket('test-token'), {
      wrapper: createWrapper(queryClient),
    });

    const deviceStatusCall = mockOn.mock.calls.find(
      ([event]: [string]) => event === 'device-status'
    );

    return deviceStatusCall[1];
  }

  it('patches individual device cache instantly', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY, 'device-001'], baseDevice);

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-001', alertCount: 15, online: false });

    const single = queryClient.getQueryData<Device>([
      DEVICES_QUERY_KEY,
      'device-001',
    ]);

    expect(single!.alertCount).toBe(15);
    expect(single!.online).toBe(false);
    expect(single!.name).toBe('North Gate');
  });

  it('invalidates all device queries on every device-status event', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY], [baseDevice]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-001', alertCount: 15 });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [DEVICES_QUERY_KEY],
    });
  });

  it('invalidates for unknown device IDs too', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY], [baseDevice]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-NEW', online: true });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [DEVICES_QUERY_KEY],
    });
  });

  it('does not patch individual cache for unknown device', () => {
    const handler = getDeviceStatusHandler();
    handler({ id: 'device-NEW', online: true });

    const single = queryClient.getQueryData<Device>([
      DEVICES_QUERY_KEY,
      'device-NEW',
    ]);

    expect(single).toBeUndefined();
  });
});
