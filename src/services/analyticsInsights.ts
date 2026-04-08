import type { AnalyticsData } from '@/types/alert';
import type { Device } from '@/types/device';
import type { AnalyticsComparisonResponse } from '@/hooks/useAnalytics';

export type InsightType =
  | 'new-devices'
  | 'activity-spike'
  | 'nighttime'
  | 'sensor-offline'
  | 'confidence-drop';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  type: InsightType;
  title: string;
  subtitle: string;
  severity: InsightSeverity;
  targetTab?: 'overview' | 'signals' | 'patterns';
}

export function generateInsights(
  analytics: AnalyticsData | null | undefined,
  comparison: AnalyticsComparisonResponse | null | undefined,
  devices: Device[]
): Insight[] {
  const insights: Insight[] = [];

  if (!analytics) return insights;

  if (comparison?.current && comparison?.comparison) {
    const currentUnique = comparison.current.uniqueDevices;
    const prevUnique = comparison.comparison.uniqueDevices;
    if (currentUnique > prevUnique) {
      const newCount = currentUnique - prevUnique;
      insights.push({
        type: 'new-devices',
        title: `${newCount} new device${newCount !== 1 ? 's' : ''} detected`,
        subtitle: `${currentUnique} unique this period vs ${prevUnique} last period`,
        severity: 'warning',
        targetTab: 'patterns',
      });
    }
  }

  if (analytics.dailyTrend.length > 2) {
    const counts = analytics.dailyTrend.map(d => d.count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const spikeDay = analytics.dailyTrend.find(d => d.count > avg * 2);
    if (spikeDay && avg > 0) {
      insights.push({
        type: 'activity-spike',
        title: `Activity spike: ${(spikeDay.count / avg).toFixed(1)}x average`,
        subtitle: `${spikeDay.date} had ${spikeDay.count} detections`,
        severity: 'warning',
        targetTab: 'patterns',
      });
    }
  }

  if (analytics.nighttimeActivity.percentOfTotal > 20) {
    insights.push({
      type: 'nighttime',
      title: `${analytics.nighttimeActivity.percentOfTotal}% nighttime activity`,
      subtitle: `${analytics.nighttimeActivity.count} detections between 10 PM-6 AM`,
      severity:
        analytics.nighttimeActivity.percentOfTotal > 40 ? 'critical' : 'info',
      targetTab: 'patterns',
    });
  }

  const offlineDevices = devices.filter(d => !d.online);
  if (offlineDevices.length > 0) {
    insights.push({
      type: 'sensor-offline',
      title: `${offlineDevices.length} sensor${offlineDevices.length !== 1 ? 's' : ''} offline`,
      subtitle: offlineDevices.map(d => d.name).join(', '),
      severity: 'critical',
      targetTab: 'overview',
    });
  }

  if (comparison?.current && comparison?.comparison) {
    const currentConf = comparison.current.avgConfidence;
    const prevConf = comparison.comparison.avgConfidence;
    if (prevConf - currentConf > 10) {
      insights.push({
        type: 'confidence-drop',
        title: 'Detection confidence dropped',
        subtitle: `${Math.round(prevConf - currentConf)}% decrease vs last period`,
        severity: 'warning',
        targetTab: 'signals',
      });
    }
  }

  return insights;
}
