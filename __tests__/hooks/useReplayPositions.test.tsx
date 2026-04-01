import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useReplayPositions } from '@hooks/api/useReplayPositions';

jest.mock('@/config/mockConfig', () => ({
  isMockMode: true,
}));

jest.mock('@/mocks/data/mockReplayPositions', () => ({
  generateReplayData: () => ({
    positions: [
      {
        id: 'pos-1',
        deviceId: 'device-001',
        fingerprintHash: 'fp-test',
        macAddress: 'AA:BB:CC:DD:EE:01',
        signalType: 'cellular',
        latitude: 31.53,
        longitude: -110.288,
        accuracyMeters: 15,
        confidence: 0.8,
        measurementCount: 4,
        updatedAt: new Date().toISOString(),
      },
    ],
    alerts: [],
  }),
}));

describe('useReplayPositions', () => {
  it('returns mock positions in mock mode', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useReplayPositions('device-001'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].fingerprintHash).toBe('fp-test');
  });
});
