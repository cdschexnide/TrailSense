import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAllPositions } from '@hooks/useAllPositions';
import { getPositions } from '@api/endpoints/positions';
import { Device } from '@/types/device';
import { TriangulatedPosition } from '@/types/triangulation';

jest.mock('@api/endpoints/positions');
jest.mock('@/config/demoModeRuntime', () => ({
  isDemoOrMockMode: () => true,
}));

let testQueryClient: QueryClient;

const createWrapper = () => {
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: testQueryClient },
      children
    );
  Wrapper.displayName = 'UseAllPositionsTestWrapper';
  return Wrapper;
};

afterEach(() => {
  testQueryClient?.clear();
});

const makeDevice = (
  id: string,
  online: boolean,
  lat = 30.396,
  lng = -94.317
): Device => ({
  id,
  name: `Device ${id}`,
  online,
  latitude: lat,
  longitude: lng,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const makePosition = (
  overrides: Partial<TriangulatedPosition> = {}
): TriangulatedPosition => ({
  id: `pos-${Math.random()}`,
  deviceId: 'device-001',
  fingerprintHash: 'w_abc123',
  signalType: 'wifi',
  latitude: 30.397,
  longitude: -94.318,
  accuracyMeters: 10,
  confidence: 80,
  measurementCount: 3,
  presenceCertainty: null,
  proximity: null,
  threatLevel: null,
  updatedAt: '2026-01-01T12:00:00Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAllPositions', () => {
  it('returns empty positions when devices is undefined', async () => {
    const { result } = renderHook(() => useAllPositions(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.positions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty positions when all devices are offline', async () => {
    const devices = [makeDevice('d1', false), makeDevice('d2', false)];

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    expect(result.current.positions).toEqual([]);
    expect(getPositions).not.toHaveBeenCalled();
  });

  it('fetches positions only for online devices', async () => {
    const devices = [makeDevice('d1', true), makeDevice('d2', false)];

    (getPositions as jest.Mock).mockResolvedValue({
      positions: [makePosition({ deviceId: 'd1' })],
    });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(1));

    expect(getPositions).toHaveBeenCalledWith('d1');
    expect(getPositions).not.toHaveBeenCalledWith('d2');
  });

  it('injects deviceId from query context when position lacks it', async () => {
    const devices = [makeDevice('d1', true)];

    (getPositions as jest.Mock).mockResolvedValue({
      positions: [
        makePosition({ deviceId: '', fingerprintHash: 'w_test1' }),
      ],
    });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(1));
    expect(result.current.positions[0].deviceId).toBe('d1');
  });

  it('deduplicates by fingerprintHash keeping highest confidence', async () => {
    const devices = [makeDevice('d1', true), makeDevice('d2', true)];

    (getPositions as jest.Mock)
      .mockResolvedValueOnce({
        positions: [
          makePosition({
            deviceId: 'd1',
            fingerprintHash: 'w_shared',
            confidence: 70,
            latitude: 30.1,
          }),
        ],
      })
      .mockResolvedValueOnce({
        positions: [
          makePosition({
            deviceId: 'd2',
            fingerprintHash: 'w_shared',
            confidence: 95,
            latitude: 30.2,
          }),
        ],
      });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(1));

    const pos = result.current.positions[0];
    expect(pos.fingerprintHash).toBe('w_shared');
    expect(pos.confidence).toBe(95);
    expect(pos.latitude).toBe(30.2);
  });

  it('tracks all detecting sensor IDs in detectedByDeviceIds', async () => {
    const devices = [
      makeDevice('d1', true),
      makeDevice('d2', true),
      makeDevice('d3', true),
    ];

    (getPositions as jest.Mock)
      .mockResolvedValueOnce({
        positions: [
          makePosition({ deviceId: 'd1', fingerprintHash: 'b_multi' }),
        ],
      })
      .mockResolvedValueOnce({
        positions: [
          makePosition({ deviceId: 'd2', fingerprintHash: 'b_multi' }),
        ],
      })
      .mockResolvedValueOnce({
        positions: [
          makePosition({ deviceId: 'd3', fingerprintHash: 'b_multi' }),
        ],
      });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(1));

    const pos = result.current.positions[0];
    expect(pos.detectedByDeviceIds).toContain('d1');
    expect(pos.detectedByDeviceIds).toContain('d2');
    expect(pos.detectedByDeviceIds).toContain('d3');
    expect(pos.detectedByDeviceIds).toHaveLength(3);
  });

  it('does not add duplicate deviceIds to detectedByDeviceIds', async () => {
    const devices = [makeDevice('d1', true)];

    (getPositions as jest.Mock).mockResolvedValue({
      positions: [
        makePosition({
          deviceId: 'd1',
          fingerprintHash: 'w_dup',
          confidence: 80,
        }),
        makePosition({
          deviceId: 'd1',
          fingerprintHash: 'w_dup',
          confidence: 90,
        }),
      ],
    });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(1));

    expect(result.current.positions[0].detectedByDeviceIds).toEqual(['d1']);
    expect(result.current.positions[0].confidence).toBe(90);
  });

  it('keeps distinct fingerprints as separate positions', async () => {
    const devices = [makeDevice('d1', true)];

    (getPositions as jest.Mock).mockResolvedValue({
      positions: [
        makePosition({ fingerprintHash: 'w_one' }),
        makePosition({ fingerprintHash: 'b_two' }),
        makePosition({ fingerprintHash: 'c_three' }),
      ],
    });

    const { result } = renderHook(() => useAllPositions(devices), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.positions.length).toBe(3));

    const hashes = result.current.positions.map(p => p.fingerprintHash);
    expect(hashes).toContain('w_one');
    expect(hashes).toContain('b_two');
    expect(hashes).toContain('c_three');
  });
});
