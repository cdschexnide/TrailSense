import type {
  Alert,
  AnalyticsData,
  BackendDeviceFingerprint,
  HeatmapPoint,
} from '@/types/alert';
import { mockAlerts } from './mockAlerts';
import { getMockDevices } from './mockDevices';
import { FINGERPRINT_PREFIX } from '../helpers/fingerprints';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function signalTypeFromFingerprint(
  hash: string
): 'wifi' | 'bluetooth' | 'cellular' {
  if (hash.startsWith(FINGERPRINT_PREFIX.wifi)) return 'wifi';
  if (hash.startsWith(FINGERPRINT_PREFIX.bluetooth)) return 'bluetooth';
  return 'cellular';
}

function generateRssiDistribution(alerts: Alert[]) {
  const buckets = [-90, -80, -70, -60, -50, -40, -30];
  return buckets.map((bucketMin, i) => {
    const bucketMax = i < buckets.length - 1 ? buckets[i + 1] : -20;
    const count = alerts.filter(a => {
      const simulatedRssi = -90 + (a.confidence / 100) * 70;
      return simulatedRssi >= bucketMin && simulatedRssi < bucketMax;
    }).length;
    return { bucketMin, bucketMax, count };
  });
}

function computeMedianRssi(alerts: Alert[]): number {
  if (alerts.length === 0) return -60;
  const rssiValues = alerts
    .map(a => -90 + (a.confidence / 100) * 70)
    .sort((a, b) => a - b);
  const mid = Math.floor(rssiValues.length / 2);
  return Math.round(
    rssiValues.length % 2 !== 0
      ? rssiValues[mid]
      : (rssiValues[mid - 1] + rssiValues[mid]) / 2
  );
}

function generateProximityZones(alerts: Alert[]) {
  return [
    {
      zone: 'immediate' as const,
      count: alerts.filter(a => a.accuracyMeters < 5).length,
    },
    {
      zone: 'near' as const,
      count: alerts.filter(a => a.accuracyMeters >= 5 && a.accuracyMeters < 15)
        .length,
    },
    {
      zone: 'far' as const,
      count: alerts.filter(
        a => a.accuracyMeters >= 15 && a.accuracyMeters < 50
      ).length,
    },
    {
      zone: 'extreme' as const,
      count: alerts.filter(a => a.accuracyMeters >= 50).length,
    },
  ];
}

function generateConfidenceDistribution(alerts: Alert[]) {
  return [
    {
      tier: 'high' as const,
      count: alerts.filter(a => a.confidence >= 75).length,
    },
    {
      tier: 'medium' as const,
      count: alerts.filter(a => a.confidence >= 50 && a.confidence < 75).length,
    },
    {
      tier: 'low' as const,
      count: alerts.filter(a => a.confidence < 50).length,
    },
  ];
}

function generateModalityBreakdown(alerts: Alert[]) {
  const rand = seededRandom(alerts.length * 7);
  const wifi = alerts.filter(a => a.detectionType === 'wifi');
  const ble = alerts.filter(a => a.detectionType === 'bluetooth');
  const cellular = alerts.filter(a => a.detectionType === 'cellular');

  return {
    wifi: {
      count: wifi.length,
      channelsActive: Math.min(7, Math.max(1, Math.ceil(wifi.length / 3))),
      probeRequestPercent: Math.round(70 + rand() * 20),
    },
    ble: {
      count: ble.length,
      phonePercent: Math.round(55 + rand() * 20),
      applePercent: Math.round(30 + rand() * 20),
      beaconPercent: Math.round(5 + rand() * 15),
    },
    cellular: {
      count: cellular.length,
      avgPeakDbm: Math.round(-65 + rand() * 10),
      avgBurstDurationMs: Math.round(60 + rand() * 80),
      avgNoiseFloorDbm: Math.round(-82 + rand() * 8),
    },
  };
}

function generateCrossModalStats(alerts: Alert[]) {
  const rand = seededRandom(alerts.length * 13);
  const wifiCount = alerts.filter(a => a.detectionType === 'wifi').length;
  const bleCount = alerts.filter(a => a.detectionType === 'bluetooth').length;
  const minCount = Math.min(wifiCount, bleCount);

  return {
    wifiBleLinks: Math.max(0, Math.round(minCount * 0.3)),
    avgLinkConfidence: Math.round(65 + rand() * 20),
    phantomMerges: Math.max(0, Math.round(wifiCount * 0.1)),
  };
}

function generateRssiTrend(alerts: Alert[]) {
  const dailyMap = new Map<
    string,
    { wifi: number[]; ble: number[]; cell: number[] }
  >();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { wifi: [], ble: [], cell: [] });
    }
    const entry = dailyMap.get(date)!;
    const rssi = -90 + (alert.confidence / 100) * 60;
    if (alert.detectionType === 'wifi') entry.wifi.push(rssi);
    else if (alert.detectionType === 'bluetooth') entry.ble.push(rssi);
    else entry.cell.push(rssi);
  });

  const avg = (arr: number[]) =>
    arr.length > 0
      ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      : null;

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, data]) => ({
      date,
      wifiAvgRssi: avg(data.wifi),
      bleAvgRssi: avg(data.ble),
      cellularAvgRssi: avg(data.cell),
    }));
}

function generateHourlyDayOfWeekDistribution(alerts: Alert[]) {
  const result: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
    date: string;
  }> = [];

  alerts.forEach(alert => {
    const d = new Date(alert.timestamp);
    const dayOfWeek = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    const date = alert.timestamp.split('T')[0];
    const existing = result.find(
      r => r.dayOfWeek === dayOfWeek && r.hour === hour && r.date === date
    );
    if (existing) {
      existing.count++;
    } else {
      result.push({ dayOfWeek, hour, count: 1, date });
    }
  });

  return result;
}

function generateDayOfWeekDistribution(alerts: Alert[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  alerts.forEach(alert => {
    const d = new Date(alert.timestamp);
    const dayOfWeek = (d.getDay() + 6) % 7;
    counts[dayOfWeek]++;
  });
  return counts.map((count, day) => ({ day, count }));
}

function generateNighttimeActivity(alerts: Alert[]) {
  const nightAlerts = alerts.filter(a => {
    const hour = new Date(a.timestamp).getHours();
    return hour >= 22 || hour < 6;
  });

  const dailyMap = new Map<string, number>();
  nightAlerts.forEach(a => {
    const date = a.timestamp.split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const trend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({ date, count }));

  return {
    count: nightAlerts.length,
    percentOfTotal:
      alerts.length > 0
        ? Math.round((nightAlerts.length / alerts.length) * 100)
        : 0,
    trend,
  };
}

function generatePerSensorTrend(alerts: Alert[]) {
  const devices = getMockDevices();
  const dailyMap = new Map<string, Map<string, number>>();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) dailyMap.set(date, new Map());
    const dayMap = dailyMap.get(date)!;
    dayMap.set(alert.deviceId, (dayMap.get(alert.deviceId) || 0) + 1);
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, sensorMap]) => ({
      date,
      sensors: devices.map(d => ({
        deviceId: d.id,
        deviceName: d.name,
        count: sensorMap.get(d.id) || 0,
      })),
    }));
}

function generateThreatTimeline(alerts: Alert[]) {
  const dailyMap = new Map<
    string,
    { critical: number; high: number; medium: number; low: number }
  >();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { critical: 0, high: 0, medium: 0, low: 0 });
    }
    const entry = dailyMap.get(date)!;
    entry[alert.threatLevel]++;
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, counts]) => ({ date, ...counts }));
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
    rssiDistribution: generateRssiDistribution(alerts),
    medianRssi: computeMedianRssi(alerts),
    peakRssi: Math.round(
      -90 + (Math.max(...alerts.map(a => a.confidence), 0) / 100) * 70
    ),
    proximityZoneDistribution: generateProximityZones(alerts),
    confidenceDistribution: generateConfidenceDistribution(alerts),
    modalityBreakdown: generateModalityBreakdown(alerts),
    crossModalStats: generateCrossModalStats(alerts),
    rssiTrend: generateRssiTrend(alerts),
    hourlyDayOfWeekDistribution: generateHourlyDayOfWeekDistribution(alerts),
    dayOfWeekDistribution: generateDayOfWeekDistribution(alerts),
    nighttimeActivity: generateNighttimeActivity(alerts),
    perSensorTrend: generatePerSensorTrend(alerts),
    threatTimeline: generateThreatTimeline(alerts),
    uniqueDevices: new Set(alerts.map(a => a.fingerprintHash)).size,
    avgConfidence:
      alerts.length > 0
        ? Math.round(
            alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length
          )
        : 0,
    closestApproachMeters:
      alerts.length > 0
        ? Math.round(Math.min(...alerts.map(a => a.accuracyMeters)))
        : 0,
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
