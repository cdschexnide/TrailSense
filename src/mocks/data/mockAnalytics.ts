import type {
  Alert,
  AnalyticsData,
  BackendDeviceFingerprint,
  HeatmapPoint,
} from '@/types/alert';
import { mockAlerts } from './mockAlerts';
import { getMockDevices } from './mockDevices';
import { FINGERPRINT_PREFIX } from '../helpers/fingerprints';

function signalTypeFromFingerprint(
  hash: string
): 'wifi' | 'bluetooth' | 'cellular' {
  if (hash.startsWith(FINGERPRINT_PREFIX.wifi)) return 'wifi';
  if (hash.startsWith(FINGERPRINT_PREFIX.bluetooth)) return 'bluetooth';
  return 'cellular';
}

export function getAnalyticsData(alerts: Alert[]): AnalyticsData {
  const totalDetections = alerts.length;
  const unknownDevices = new Set(
    alerts.filter(a => !a.isFalsePositive).map(a => a.fingerprintHash)
  ).size;
  const uniqueFingerprints = [...new Set(alerts.map(a => a.fingerprintHash))];
  const dailyMap = new Map<string, number>();
  alerts.forEach(alert => {
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
      count: alerts.filter(a => a.detectionType === 'cellular').length,
    },
    {
      type: 'wifi',
      count: alerts.filter(a => a.detectionType === 'wifi').length,
    },
    {
      type: 'bluetooth',
      count: alerts.filter(a => a.detectionType === 'bluetooth').length,
    },
  ];

  const threatLevelDistribution = [
    {
      level: 'critical',
      count: alerts.filter(a => a.threatLevel === 'critical').length,
    },
    {
      level: 'high',
      count: alerts.filter(a => a.threatLevel === 'high').length,
    },
    {
      level: 'medium',
      count: alerts.filter(a => a.threatLevel === 'medium').length,
    },
    {
      level: 'low',
      count: alerts.filter(a => a.threatLevel === 'low').length,
    },
  ];

  const deviceDistribution = getMockDevices().map(device => ({
    deviceId: device.id,
    count: alerts.filter(alert => alert.deviceId === device.id).length,
  }));

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: alerts.filter(
      alert => new Date(alert.timestamp).getHours() === hour
    ).length,
  }));

  const timestamps = alerts.map(alert => alert.timestamp).sort();

  return {
    period: '30d',
    startDate: timestamps[0] ?? new Date().toISOString(),
    endDate: timestamps[timestamps.length - 1] ?? new Date().toISOString(),
    totalAlerts: alerts.length,
    threatLevelDistribution,
    detectionTypeDistribution,
    deviceDistribution,
    dailyTrend: dailyDetections,
    topDetectedDevices: uniqueFingerprints
      .slice(0, 10)
      .map(fingerprintHash => ({
        fingerprintHash,
        count: alerts.filter(alert => alert.fingerprintHash === fingerprintHash)
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
}

export const mockAnalyticsData: AnalyticsData = getAnalyticsData(mockAlerts);

export function getHeatmapPoints(alerts: Alert[]): HeatmapPoint[] {
  return alerts.filter(alert => alert.location).map(alert => ({
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
}

export const mockHeatmapPoints: HeatmapPoint[] = getHeatmapPoints(mockAlerts);

function generateBackendFingerprint(
  fingerprintHash: string,
  alerts: Alert[]
): BackendDeviceFingerprint {
  const detections = alerts.filter(a => a.fingerprintHash === fingerprintHash);

  if (detections.length === 0) {
    return {
      id: `fingerprint-${fingerprintHash}`,
      fingerprintHash,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      totalVisits: 0,
      totalSamples: 0,
      totalAlerts: 0,
      commonHours: [],
      category: signalTypeFromFingerprint(fingerprintHash),
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
    totalSamples: detections.length * 3,
    totalAlerts: detections.length,
    commonHours,
    category: signalTypeFromFingerprint(fingerprintHash),
  };
}

export function getDeviceFingerprints(
  alerts: Alert[]
): BackendDeviceFingerprint[] {
  const uniqueFingerprints = [...new Set(alerts.map(a => a.fingerprintHash))];
  return uniqueFingerprints
    .slice(0, 10)
    .map(hash => generateBackendFingerprint(hash, alerts));
}

export const mockDeviceFingerprints: BackendDeviceFingerprint[] =
  getDeviceFingerprints(mockAlerts);

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

/** Matches the return type of analyticsApi.getTopDevices in src/api/analytics.ts */
type TopDevice = {
  fingerprintHash: string;
  visits: number;
  lastSeen: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string;
};

export const mockTopDevices: TopDevice[] = [
  ...new Set(mockAlerts.map(a => a.fingerprintHash)),
]
  .slice(0, 10)
  .map(hash => {
    const alertsForHash = mockAlerts.filter(a => a.fingerprintHash === hash);
    const sorted = [...alertsForHash].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      fingerprintHash: hash,
      visits: alertsForHash.length,
      lastSeen: sorted[0]?.timestamp ?? new Date().toISOString(),
      threatLevel: sorted[0]?.threatLevel ?? ('low' as const),
      category: signalTypeFromFingerprint(hash),
    };
  });
