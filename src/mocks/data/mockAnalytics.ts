import type {
  AnalyticsData,
  DeviceFingerprint,
  HeatmapPoint,
} from '@/types/alert';
import { mockAlerts } from './mockAlerts';
import { mockDevices } from './mockDevices';

const uniqueFingerprints = [...new Set(mockAlerts.map(a => a.fingerprintHash))];

const calculateAnalytics = (): AnalyticsData => {
  const totalDetections = mockAlerts.length;
  const unknownDevices = mockAlerts.filter(a => !a.isFalsePositive).length;

  const dailyMap = new Map<string, number>();
  mockAlerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const dailyDetections = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const detectionTypeDistribution = [
    {
      type: 'cellular',
      count: mockAlerts.filter(a => a.detectionType === 'cellular').length,
    },
    {
      type: 'wifi',
      count: mockAlerts.filter(a => a.detectionType === 'wifi').length,
    },
    {
      type: 'bluetooth',
      count: mockAlerts.filter(a => a.detectionType === 'bluetooth').length,
    },
  ];

  const threatLevelDistribution = [
    {
      level: 'critical',
      count: mockAlerts.filter(a => a.threatLevel === 'critical').length,
    },
    {
      level: 'high',
      count: mockAlerts.filter(a => a.threatLevel === 'high').length,
    },
    {
      level: 'medium',
      count: mockAlerts.filter(a => a.threatLevel === 'medium').length,
    },
    {
      level: 'low',
      count: mockAlerts.filter(a => a.threatLevel === 'low').length,
    },
  ];

  const deviceDistribution = mockDevices.map(device => ({
    deviceId: device.id,
    count: mockAlerts.filter(alert => alert.deviceId === device.id).length,
  }));

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: mockAlerts.filter(
      alert => new Date(alert.timestamp).getHours() === hour
    ).length,
  }));

  const timestamps = mockAlerts.map(alert => alert.timestamp).sort();

  return {
    period: '30d',
    startDate: timestamps[0] ?? new Date().toISOString(),
    endDate: timestamps[timestamps.length - 1] ?? new Date().toISOString(),
    totalAlerts: mockAlerts.length,
    threatLevelDistribution,
    detectionTypeDistribution,
    deviceDistribution,
    dailyTrend: dailyDetections,
    topDetectedDevices: uniqueFingerprints.slice(0, 10).map(fingerprintHash => ({
      fingerprintHash,
      count: mockAlerts.filter(alert => alert.fingerprintHash === fingerprintHash)
        .length,
    })),
    totalDetections,
    unknownDevices,
    dailyDetections,
    cellularCount: detectionTypeDistribution[0].count,
    wifiCount: detectionTypeDistribution[1].count,
    bluetoothCount: detectionTypeDistribution[2].count,
    hourlyDistribution,
    criticalCount: threatLevelDistribution[0].count,
    highCount: threatLevelDistribution[1].count,
    mediumCount: threatLevelDistribution[2].count,
    lowCount: threatLevelDistribution[3].count,
  };
};

export const mockAnalyticsData: AnalyticsData = calculateAnalytics();

export const mockHeatmapPoints: HeatmapPoint[] = mockAlerts
  .filter(alert => alert.location)
  .map(alert => ({
    latitude: alert.location!.latitude,
    longitude: alert.location!.longitude,
    weight:
      alert.threatLevel === 'critical'
        ? 4
        : alert.threatLevel === 'high'
          ? 3
          : alert.threatLevel === 'medium'
            ? 2
            : 1,
    type: alert.detectionType,
  }));

const generateDeviceFingerprint = (
  fingerprintHash: string
): DeviceFingerprint => {
  const detections = mockAlerts.filter(a => a.fingerprintHash === fingerprintHash);

  if (detections.length === 0) {
    return {
      id: `fingerprint-${fingerprintHash}`,
      fingerprintHash,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      totalVisits: 0,
      detections: [],
      averageDuration: 0,
      commonHours: [],
      category: 'unknown',
    };
  }

  const sortedDetections = [...detections].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstSeen = sortedDetections[0].timestamp;
  const lastSeen = sortedDetections[sortedDetections.length - 1].timestamp;

  const hourMap = new Map<number, number>();
  detections.forEach(d => {
    const hour = new Date(d.timestamp).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const commonHours = Array.from(hourMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  return {
    id: `fingerprint-${fingerprintHash}`,
    fingerprintHash,
    firstSeen,
    lastSeen,
    totalVisits: detections.length,
    detections: sortedDetections.map(d => ({
      timestamp: d.timestamp,
      confidence: d.confidence,
      location: d.location,
      type: d.detectionType,
    })),
    averageDuration: Math.max(60, Math.round(detections.length * 45)),
    commonHours,
    category: detections[0].isFalsePositive ? 'known' : 'unknown',
  };
};

export const mockDeviceFingerprints: DeviceFingerprint[] = uniqueFingerprints
  .slice(0, 10)
  .map(generateDeviceFingerprint);

export const mockComparisonData = {
  thisWeek: {
    totalDetections: 24,
    unknownDevices: 18,
    avgThreatLevel: 2.3,
  },
  lastWeek: {
    totalDetections: 19,
    unknownDevices: 15,
    avgThreatLevel: 2.1,
  },
  thisMonth: {
    totalDetections: mockAlerts.filter(a => {
      const alertDate = new Date(a.timestamp);
      const now = new Date();
      return (
        alertDate.getMonth() === now.getMonth() &&
        alertDate.getFullYear() === now.getFullYear()
      );
    }).length,
    unknownDevices: mockAlerts.filter(a => {
      const alertDate = new Date(a.timestamp);
      const now = new Date();
      return (
        alertDate.getMonth() === now.getMonth() &&
        alertDate.getFullYear() === now.getFullYear() &&
        !a.isFalsePositive
      );
    }).length,
    avgThreatLevel: 2.4,
  },
  lastMonth: {
    totalDetections: 38,
    unknownDevices: 31,
    avgThreatLevel: 2.2,
  },
};

export const mockThreatTimeline = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const dateStr = date.toISOString().split('T')[0];

  const dayAlerts = mockAlerts.filter(a => a.timestamp.startsWith(dateStr));

  return {
    date: dateStr,
    critical: dayAlerts.filter(a => a.threatLevel === 'critical').length,
    high: dayAlerts.filter(a => a.threatLevel === 'high').length,
    medium: dayAlerts.filter(a => a.threatLevel === 'medium').length,
    low: dayAlerts.filter(a => a.threatLevel === 'low').length,
  };
});

export const mockTopDevices = mockDevices
  .map(device => ({
    deviceId: device.id,
    deviceName: device.name,
    detectionCount: mockAlerts.filter(a => a.deviceId === device.id).length,
    criticalCount: mockAlerts.filter(
      a => a.deviceId === device.id && a.threatLevel === 'critical'
    ).length,
    lastDetection: mockAlerts
      .filter(a => a.deviceId === device.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]?.timestamp,
  }))
  .sort((a, b) => b.detectionCount - a.detectionCount);
