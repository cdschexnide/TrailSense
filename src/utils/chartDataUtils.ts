import { AnalyticsData } from '@types';
import { format, parseISO } from 'date-fns';

/**
 * Transform analytics data for line chart (detections over time)
 */
export const prepareDetectionsOverTimeData = (analytics: AnalyticsData) => {
  return {
    labels: analytics.dailyDetections.map(d =>
      format(parseISO(d.date), 'MM/dd')
    ),
    datasets: [
      {
        data: analytics.dailyDetections.map(d => d.count),
      },
    ],
  };
};

/**
 * Transform detection types for pie chart
 */
export const prepareDetectionTypesData = (
  analytics: AnalyticsData,
  colors: any
) => {
  return [
    {
      name: 'Cellular',
      population: analytics.cellularCount,
      color: colors.systemPurple,
    },
    {
      name: 'WiFi',
      population: analytics.wifiCount,
      color: colors.systemBlue,
    },
    {
      name: 'Bluetooth',
      population: analytics.bluetoothCount,
      color: colors.systemTeal,
    },
  ];
};

/**
 * Transform hourly distribution for bar chart
 */
export const prepareHourlyDistributionData = (analytics: AnalyticsData) => {
  // Show only peak hours for better readability
  const peakHours = analytics.hourlyDistribution.slice(6, 22); // 6am to 10pm

  return {
    labels: peakHours.map(h => `${h.hour}h`),
    datasets: [
      {
        data: peakHours.map(h => h.count),
      },
    ],
  };
};

/**
 * Transform threat levels for pie chart
 */
export const prepareThreatLevelsData = (
  analytics: AnalyticsData,
  colors: any
) => {
  return [
    {
      name: 'Critical',
      population: analytics.criticalCount || 0,
      color: colors.systemRed,
    },
    {
      name: 'High',
      population: analytics.highCount || 0,
      color: colors.systemOrange,
    },
    {
      name: 'Medium',
      population: analytics.mediumCount || 0,
      color: colors.systemYellow,
    },
    {
      name: 'Low',
      population: analytics.lowCount || 0,
      color: colors.systemGreen,
    },
  ];
};
