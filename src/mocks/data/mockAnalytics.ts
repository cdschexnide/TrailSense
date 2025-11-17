import type { AnalyticsData, HeatmapPoint, DeviceFingerprint } from '@/types/alert';
import { mockAlerts } from './mockAlerts';
import { mockDevices } from './mockDevices';

// Calculate analytics from mock alerts
const calculateAnalytics = (): AnalyticsData => {
  const totalDetections = mockAlerts.length;
  const unknownDevices = mockAlerts.filter((a) => !a.isFalsePositive).length;

  // Daily detections for the last 30 days
  const dailyMap = new Map<string, number>();
  mockAlerts.forEach((alert) => {
    const date = alert.timestamp.split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const dailyDetections = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // Detection type counts
  const cellularCount = mockAlerts.filter((a) => a.detectionType === 'cellular').length;
  const wifiCount = mockAlerts.filter((a) => a.detectionType === 'wifi').length;
  const bluetoothCount = mockAlerts.filter((a) => a.detectionType === 'bluetooth').length;

  // Threat level counts
  const criticalCount = mockAlerts.filter((a) => a.threatLevel === 'critical').length;
  const highCount = mockAlerts.filter((a) => a.threatLevel === 'high').length;
  const mediumCount = mockAlerts.filter((a) => a.threatLevel === 'medium').length;
  const lowCount = mockAlerts.filter((a) => a.threatLevel === 'low').length;

  // Hourly distribution (0-23 hours)
  const hourlyMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0);
  }

  mockAlerts.forEach((alert) => {
    const hour = new Date(alert.timestamp).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });

  const hourlyDistribution = Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalDetections,
    unknownDevices,
    dailyDetections,
    cellularCount,
    wifiCount,
    bluetoothCount,
    hourlyDistribution,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  };
};

export const mockAnalyticsData: AnalyticsData = calculateAnalytics();

// Heatmap data - generate points around device locations
export const mockHeatmapPoints: HeatmapPoint[] = mockAlerts
  .filter((alert) => alert.location)
  .map((alert) => ({
    latitude: alert.location!.latitude,
    longitude: alert.location!.longitude,
    weight: alert.threatLevel === 'critical' ? 4 : alert.threatLevel === 'high' ? 3 : alert.threatLevel === 'medium' ? 2 : 1,
    type: alert.detectionType,
  }));

// Device fingerprints - track specific MAC addresses over time
const generateDeviceFingerprint = (macAddress: string): DeviceFingerprint => {
  const detections = mockAlerts.filter((a) => a.macAddress === macAddress);

  if (detections.length === 0) {
    return {
      id: `fingerprint-${macAddress}`,
      macAddress,
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

  const totalDuration = detections.reduce((sum, d) => sum + (d.duration || 0), 0);
  const averageDuration = Math.round(totalDuration / detections.length);

  // Calculate common hours
  const hourMap = new Map<number, number>();
  detections.forEach((d) => {
    const hour = new Date(d.timestamp).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const commonHours = Array.from(hourMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  return {
    id: `fingerprint-${macAddress}`,
    macAddress,
    firstSeen,
    lastSeen,
    totalVisits: detections.length,
    detections: sortedDetections.map((d) => ({
      timestamp: d.timestamp,
      rssi: d.rssi,
      location: d.location,
      type: d.detectionType,
    })),
    averageDuration,
    commonHours,
    category: detections[0].isFalsePositive ? 'known' : 'unknown',
  };
};

// Generate fingerprints for the most frequently seen devices
const uniqueMacAddresses = [...new Set(mockAlerts.map((a) => a.macAddress))];
export const mockDeviceFingerprints: DeviceFingerprint[] = uniqueMacAddresses
  .slice(0, 10) // Top 10 devices
  .map(generateDeviceFingerprint);

// Comparison data (week over week, month over month)
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
    totalDetections: mockAlerts.filter((a) => {
      const alertDate = new Date(a.timestamp);
      const now = new Date();
      return (
        alertDate.getMonth() === now.getMonth() &&
        alertDate.getFullYear() === now.getFullYear()
      );
    }).length,
    unknownDevices: mockAlerts.filter((a) => {
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

// Threat timeline data for charts
export const mockThreatTimeline = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const dateStr = date.toISOString().split('T')[0];

  const dayAlerts = mockAlerts.filter((a) => a.timestamp.startsWith(dateStr));

  return {
    date: dateStr,
    critical: dayAlerts.filter((a) => a.threatLevel === 'critical').length,
    high: dayAlerts.filter((a) => a.threatLevel === 'high').length,
    medium: dayAlerts.filter((a) => a.threatLevel === 'medium').length,
    low: dayAlerts.filter((a) => a.threatLevel === 'low').length,
  };
});

// Top devices by detection count
export const mockTopDevices = mockDevices.map((device) => ({
  deviceId: device.id,
  deviceName: device.name,
  detectionCount: mockAlerts.filter((a) => a.deviceId === device.id).length,
  criticalCount: mockAlerts.filter((a) => a.deviceId === device.id && a.threatLevel === 'critical').length,
  lastDetection: mockAlerts
    .filter((a) => a.deviceId === device.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp,
})).sort((a, b) => b.detectionCount - a.detectionCount);
