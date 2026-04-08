import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@api/analytics';
import { AnalyticsData, HeatmapPoint } from '@types';

export interface UseAnalyticsOptions {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsComparisonResponse {
  current: AnalyticsData;
  comparison: AnalyticsData;
  percentageChange: {
    totalDetections: number;
    unknownDevices: number;
    avgResponseTime: number;
  };
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

export const useComparison = (
  options: {
    period?: 'day' | 'week' | 'month';
    compareWith?: 'previous' | 'lastYear';
    enabled?: boolean;
  } = {}
) => {
  const { period = 'week', compareWith = 'previous', enabled = true } = options;

  return useQuery<AnalyticsComparisonResponse>({
    queryKey: ['analytics-comparison', period, compareWith],
    queryFn: () => analyticsApi.getComparison({ period, compareWith }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled,
  });
};
