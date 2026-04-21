import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getPositions } from '@api/endpoints/positions';
import { POSITIONS_QUERY_KEY } from '@hooks/api/usePositions';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';
import { Device } from '@/types/device';
import { TriangulatedPosition } from '@/types/triangulation';

export interface DeduplicatedPosition extends TriangulatedPosition {
  detectedByDeviceIds: string[];
}

export function useAllPositions(devices: Device[] | undefined) {
  const mockMode = isDemoOrMockMode();

  const onlineDevices = useMemo(
    () => (devices ?? []).filter(device => device.online),
    [devices]
  );

  const queries = useQueries({
    queries: onlineDevices.map(device => ({
      queryKey: [POSITIONS_QUERY_KEY, device.id] as const,
      queryFn: () => getPositions(device.id),
      refetchInterval: mockMode ? false : 10000,
      staleTime: mockMode ? Infinity : 5000,
    })),
  });

  const positions = useMemo(() => {
    const rawPositions: TriangulatedPosition[] = [];

    for (let index = 0; index < queries.length; index += 1) {
      const query = queries[index];
      const deviceId = onlineDevices[index]?.id;

      if (!query.data || !deviceId) {
        continue;
      }

      const positionList = Array.isArray(query.data.positions)
        ? query.data.positions
        : [];

      for (const position of positionList) {
        rawPositions.push({
          ...position,
          deviceId: position.deviceId || deviceId,
        });
      }
    }

    const byFingerprint = new Map<string, DeduplicatedPosition>();

    for (const position of rawPositions) {
      const existing = byFingerprint.get(position.fingerprintHash);

      if (!existing) {
        byFingerprint.set(position.fingerprintHash, {
          ...position,
          detectedByDeviceIds: [position.deviceId],
        });
        continue;
      }

      if (!existing.detectedByDeviceIds.includes(position.deviceId)) {
        existing.detectedByDeviceIds.push(position.deviceId);
      }

      if (position.confidence > existing.confidence) {
        byFingerprint.set(position.fingerprintHash, {
          ...position,
          detectedByDeviceIds: existing.detectedByDeviceIds,
        });
      }
    }

    return Array.from(byFingerprint.values());
  }, [onlineDevices, queries]);

  const isLoading = queries.some(query => query.isLoading);

  return { positions, isLoading };
}

export default useAllPositions;
