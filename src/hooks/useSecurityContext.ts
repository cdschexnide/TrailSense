import { useMemo } from 'react';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';

/**
 * Security Context for AI Assistant
 * Aggregates security data to provide context-aware AI responses
 */
export interface SecurityContextData {
  // Summary stats
  totalAlerts: number;
  unreviewedAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;

  // Time-based stats
  alertsLast24h: number;
  alertsLast7d: number;

  // Device stats
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;

  // Detection type breakdown
  wifiDetections: number;
  bluetoothDetections: number;
  cellularDetections: number;

  // Recent activity
  recentAlerts: any[];
  deviceList: any[];
  mostActiveDevice: string | null;
  quietestPeriod: string | null;
  busiestPeriod: string | null;

  // Formatted context string for LLM
  contextString: string;

  // Loading state
  isLoading: boolean;
}

/**
 * Hook to gather security context for AI Assistant
 * Provides real-time data aggregation for context-aware AI responses
 */
export const useSecurityContext = (): SecurityContextData => {
  const { data: alerts, isLoading: alertsLoading } = useAlerts({});
  const { data: devices, isLoading: devicesLoading } = useDevices();

  const contextData = useMemo(() => {
    const alertList = alerts || [];
    const deviceList = devices || [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Alert counts by threat level
    const criticalAlerts = alertList.filter(
      (a: any) => a.threatLevel?.toLowerCase() === 'critical'
    ).length;
    const highAlerts = alertList.filter(
      (a: any) => a.threatLevel?.toLowerCase() === 'high'
    ).length;
    const mediumAlerts = alertList.filter(
      (a: any) => a.threatLevel?.toLowerCase() === 'medium'
    ).length;
    const lowAlerts = alertList.filter(
      (a: any) => a.threatLevel?.toLowerCase() === 'low'
    ).length;

    // Unreviewed alerts
    const unreviewedAlerts = alertList.filter((a: any) => !a.isReviewed).length;

    // Time-based filtering
    const alertsLast24h = alertList.filter((a: any) => {
      const alertDate = new Date(a.timestamp || a.createdAt);
      return alertDate >= oneDayAgo;
    }).length;

    const alertsLast7d = alertList.filter((a: any) => {
      const alertDate = new Date(a.timestamp || a.createdAt);
      return alertDate >= sevenDaysAgo;
    }).length;

    // Detection type breakdown
    const wifiDetections = alertList.filter(
      (a: any) => a.detectionType?.toLowerCase() === 'wifi'
    ).length;
    const bluetoothDetections = alertList.filter(
      (a: any) =>
        a.detectionType?.toLowerCase() === 'bluetooth' ||
        a.detectionType?.toLowerCase() === 'ble'
    ).length;
    const cellularDetections = alertList.filter(
      (a: any) => a.detectionType?.toLowerCase() === 'cellular'
    ).length;

    // Device stats
    const onlineDevices = deviceList.filter((d: any) => d.online).length;
    const offlineDevices = deviceList.filter((d: any) => !d.online).length;
    const lowBatteryDevices = deviceList.filter(
      (d: any) => (d.batteryPercent || d.battery || 100) < 20
    ).length;

    // Find most active device
    const deviceAlertCounts: Record<string, number> = {};
    alertList.forEach((a: any) => {
      const deviceId = a.deviceId;
      if (deviceId) {
        deviceAlertCounts[deviceId] = (deviceAlertCounts[deviceId] || 0) + 1;
      }
    });
    const mostActiveDeviceId = Object.entries(deviceAlertCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const mostActiveDevice =
      deviceList.find((d: any) => d.id === mostActiveDeviceId)?.name ||
      mostActiveDeviceId ||
      null;

    // Analyze time patterns
    const hourCounts: Record<number, number> = {};
    alertList.forEach((a: any) => {
      const hour = new Date(a.timestamp || a.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts).sort(
      ([, a], [, b]) => b - a
    );
    const busiestHour = sortedHours[0]?.[0];
    const quietestHour = sortedHours[sortedHours.length - 1]?.[0];

    const formatHour = (hour: string | undefined) => {
      if (!hour) return null;
      const h = parseInt(hour, 10);
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    };

    // Recent alerts (last 10 for better context)
    const recentAlerts = [...alertList]
      .sort(
        (a: any, b: any) =>
          new Date(b.timestamp || b.createdAt).getTime() -
          new Date(a.timestamp || a.createdAt).getTime()
      )
      .slice(0, 10);

    // Helper to get device name from ID
    const getDeviceName = (deviceId: string): string => {
      const device = deviceList.find((d: any) => d.id === deviceId);
      return device?.name || deviceId || 'Unknown Device';
    };

    // Build device status section
    const deviceStatusSection =
      deviceList.length > 0
        ? deviceList
            .map((d: any) => {
              const status = d.online ? 'ONLINE' : 'OFFLINE';
              const battery = d.batteryPercent || d.battery || 'N/A';
              const signal = d.signalStrength || 'N/A';
              const detections = d.detectionCount || 0;
              const location =
                d.latitude && d.longitude
                  ? `(${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)})`
                  : '';
              return `  - ${d.name} [${status}]: Battery ${battery}%, Signal: ${signal}, Detections: ${detections} ${location}`;
            })
            .join('\n')
        : '  No devices registered';

    // Build detailed alerts section with device names
    const recentAlertsSection =
      recentAlerts.length > 0
        ? recentAlerts
            .map((a: any, i: number) => {
              const time = new Date(
                a.timestamp || a.createdAt
              ).toLocaleString();
              const deviceName = getDeviceName(a.deviceId);
              const confidence =
                typeof a.confidence === 'number' ? `${a.confidence}%` : 'N/A';
              const fingerprint = a.fingerprintHash || 'N/A';
              const reviewed = a.isReviewed ? 'Reviewed' : 'UNREVIEWED';
              return `${i + 1}. [${a.threatLevel?.toUpperCase() || 'UNKNOWN'}] ${a.detectionType || 'Unknown'} detection
     - Detected by: ${deviceName}
     - Time: ${time}
     - Confidence: ${confidence}
     - Fingerprint: ${fingerprint}
     - Status: ${reviewed}`;
            })
            .join('\n')
        : 'No recent alerts';

    // Build context string for LLM
    const contextString = `
CURRENT SECURITY STATUS (as of ${now.toLocaleString()}):

ALERT SUMMARY:
- Total alerts in system: ${alertList.length}
- Unreviewed alerts: ${unreviewedAlerts}
- Alerts in last 24 hours: ${alertsLast24h}
- Alerts in last 7 days: ${alertsLast7d}

THREAT LEVEL BREAKDOWN:
- Critical: ${criticalAlerts}
- High: ${highAlerts}
- Medium: ${mediumAlerts}
- Low: ${lowAlerts}

DETECTION TYPES:
- WiFi detections: ${wifiDetections}
- Bluetooth detections: ${bluetoothDetections}
- Cellular detections: ${cellularDetections}

TRAILSENSE DEVICE STATUS:
${deviceStatusSection}
${mostActiveDevice ? `\nMost active sensor: ${mostActiveDevice}` : ''}

TIME PATTERNS:
${busiestHour ? `- Busiest time: Around ${formatHour(busiestHour)}` : '- No clear busy period'}
${quietestHour ? `- Quietest time: Around ${formatHour(quietestHour)}` : ''}

RECENT ALERTS (Last ${recentAlerts.length}):
${recentAlertsSection}
`.trim();

    return {
      totalAlerts: alertList.length,
      unreviewedAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      alertsLast24h,
      alertsLast7d,
      totalDevices: deviceList.length,
      onlineDevices,
      offlineDevices,
      lowBatteryDevices,
      wifiDetections,
      bluetoothDetections,
      cellularDetections,
      recentAlerts,
      deviceList,
      mostActiveDevice,
      quietestPeriod: formatHour(quietestHour),
      busiestPeriod: formatHour(busiestHour),
      contextString,
      isLoading: alertsLoading || devicesLoading,
    };
  }, [alerts, devices, alertsLoading, devicesLoading]);

  return contextData;
};

export default useSecurityContext;
