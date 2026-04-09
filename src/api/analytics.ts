import { apiClient } from './client';
import { AnalyticsData, BackendDeviceFingerprint, HeatmapPoint } from '@types';

interface GetAnalyticsParams {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: Date;
  endDate?: Date;
}

interface GetHeatmapDataParams {
  startDate?: Date;
  endDate?: Date;
}

export const analyticsApi = {
  async getAnalytics(params: GetAnalyticsParams): Promise<AnalyticsData> {
    const response = await apiClient.get('/api/analytics', {
      params: {
        period: params.period || 'week',
        ...(params.startDate && { startDate: params.startDate.toISOString() }),
        ...(params.endDate && { endDate: params.endDate.toISOString() }),
      },
    });
    return response.data;
  },

  async getHeatmapData(params: GetHeatmapDataParams): Promise<HeatmapPoint[]> {
    const response = await apiClient.get('/analytics/heatmap', {
      params: {
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      },
    });
    return response.data;
  },

  async getDeviceHistory(
    fingerprintHash: string
  ): Promise<BackendDeviceFingerprint> {
    const response = await apiClient.get(
      `/analytics/devices/${fingerprintHash}`
    );
    return response.data;
  },

  async exportReport(params: {
    format: 'pdf' | 'csv' | 'json';
    period: 'day' | 'week' | 'month' | 'year';
    startDate?: Date;
    endDate?: Date;
  }): Promise<Blob> {
    const response = await apiClient.get('/analytics/export', {
      params: {
        format: params.format,
        period: params.period,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      },
      responseType: 'blob',
    });
    return response.data;
  },

  async getComparison(params: {
    period: 'day' | 'week' | 'month';
    compareWith: 'previous' | 'lastYear';
  }): Promise<{
    current: AnalyticsData;
    comparison: AnalyticsData;
    percentageChange: {
      totalDetections: number;
      unknownDevices: number;
      avgResponseTime: number;
    };
  }> {
    const response = await apiClient.get('/analytics/comparison', {
      params,
    });
    return response.data;
  },

  async getThreatTimeline(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      timestamp: string;
      threatLevel: 'low' | 'medium' | 'high' | 'critical';
      count: number;
    }>
  > {
    const response = await apiClient.get('/analytics/threat-timeline', {
      params: {
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      },
    });
    return response.data;
  },

  async getTopDevices(params: {
    limit?: number;
    period?: 'day' | 'week' | 'month';
  }): Promise<
    Array<{
      fingerprintHash: string;
      visits: number;
      lastSeen: string;
      threatLevel: 'low' | 'medium' | 'high' | 'critical';
      category: string;
    }>
  > {
    const response = await apiClient.get('/analytics/top-devices', {
      params: {
        limit: params.limit || 10,
        period: params.period || 'week',
      },
    });
    return response.data;
  },
};
