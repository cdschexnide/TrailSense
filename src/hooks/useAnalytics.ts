import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@api/analytics';
import { AnalyticsData, HeatmapPoint } from '@types';

export interface UseAnalyticsOptions {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: Date;
  endDate?: Date;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { period = 'week', startDate, endDate } = options;

  const query = useQuery<AnalyticsData>({
    queryKey: ['analytics', period, startDate, endDate],
    queryFn: () =>
      analyticsApi.getAnalytics({
        period,
        startDate,
        endDate,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    ...query,
    isError: query.isError,
    error: query.error,
  };
};

export const useHeatmapData = (
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
) => {
  return useQuery<HeatmapPoint[]>({
    queryKey: ['heatmap', options.startDate, options.endDate],
    queryFn: () =>
      analyticsApi.getHeatmapData({
        startDate: options.startDate,
        endDate: options.endDate,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDeviceHistory = (fingerprintHash: string) => {
  return useQuery({
    queryKey: ['device-history', fingerprintHash],
    queryFn: () => analyticsApi.getDeviceHistory(fingerprintHash),
    enabled: !!fingerprintHash,
  });
};
