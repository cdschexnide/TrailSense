import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '@/api/endpoints/alerts';
import { getReplayPositions } from '@/api/endpoints/positions';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';
import {
  generateReplayData,
  ReplayData,
} from '@/mocks/data/mockReplayPositions';

export function useReplayData(deviceId: string | undefined) {
  return useQuery<ReplayData>({
    queryKey: ['replayData', deviceId],
    queryFn: async () => {
      if (isDemoOrMockMode()) {
        return generateReplayData();
      }

      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);

      const [positionsResponse, alertsResponse] = await Promise.all([
        getReplayPositions(deviceId!, midnight.toISOString(), now.toISOString()),
        alertsApi.getAlerts({
          deviceId: deviceId!,
          startDate: midnight.toISOString(),
          endDate: now.toISOString(),
        }),
      ]);

      return {
        positions: positionsResponse.positions,
        alerts: alertsResponse,
      };
    },
    enabled: !!deviceId,
    staleTime: 60_000,
  });
}

export function useReplayPositions(deviceId: string | undefined) {
  const query = useReplayData(deviceId);

  return {
    ...query,
    data: query.data?.positions,
  };
}
