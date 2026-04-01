import { useMemo } from 'react';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { Alert, Device, ThreatLevel } from '@types';
import { isDeviceOnline } from '@utils/dateUtils';

export type PropertyStatusLevel = 'clear' | 'warning' | 'critical';

export interface PropertyStatus {
  level: PropertyStatusLevel;
  title: string;
  subtitle: string;
  activeAlertCount: number;
  visitorsToday: number;
  knownVisitorsToday: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesTotal: number;
  onlineDeviceNames: string[];
  offlineDeviceNames: string[];
  allAlerts: Alert[];
  allDevices: Device[];
  recentAlerts: Alert[];
  threatCounts: Record<ThreatLevel, number>;
  isLoading: boolean;
  alertsError: Error | null;
  devicesError: Error | null;
  recentVisitorMacs: string[];
  refetchAlerts: () => Promise<unknown>;
  refetchDevices: () => Promise<unknown>;
}

export function usePropertyStatus(): PropertyStatus {
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts();
  const {
    data: devices,
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices,
  } = useDevices();

  return useMemo(() => {
    const allAlerts = [...(alerts ?? [])].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const allDevices = devices ?? [];

    const threatCounts: Record<ThreatLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const unreviewedAlerts = allAlerts.filter(alert => !alert.isReviewed);
    for (const alert of unreviewedAlerts) {
      threatCounts[alert.threatLevel] += 1;
    }

    const activeAlertCount = unreviewedAlerts.length;
    const recentAlerts = allAlerts.slice(0, 2);

    const onlineDevices = allDevices.filter(device =>
      isDeviceOnline(device.lastSeen)
    );
    const offlineDevices = allDevices.filter(
      device => !isDeviceOnline(device.lastSeen)
    );

    const localMidnight = new Date();
    localMidnight.setHours(0, 0, 0, 0);
    const todayAlerts = allAlerts.filter(
      alert => new Date(alert.timestamp) >= localMidnight
    );
    const uniqueMacs = new Set(todayAlerts.map(alert => alert.macAddress));
    const visitorsToday = uniqueMacs.size;
    const recentVisitorMacs = Array.from(uniqueMacs).slice(0, 10);
    const knownVisitorsToday = 0;

    const lastAlert = allAlerts[0];
    const lastDetectionAge = lastAlert
      ? Date.now() - new Date(lastAlert.timestamp).getTime()
      : Number.POSITIVE_INFINITY;
    const isStale = lastDetectionAge > 24 * 60 * 60 * 1000;

    let level: PropertyStatusLevel = 'clear';
    let title = 'All Clear';
    let subtitle = 'No active threats';

    const criticalOrHighCount = threatCounts.critical + threatCounts.high;

    if (criticalOrHighCount > 0) {
      level = 'critical';
      title = `${criticalOrHighCount} Active Threat${
        criticalOrHighCount === 1 ? '' : 's'
      }`;
      subtitle = `${activeAlertCount} unreviewed alert${
        activeAlertCount === 1 ? '' : 's'
      }`;
    } else if (activeAlertCount > 0) {
      level = 'warning';
      title = `${activeAlertCount} Alert${activeAlertCount === 1 ? '' : 's'}`;
      subtitle = `${activeAlertCount} unreviewed (medium/low)`;
    } else if (offlineDevices.length > 0) {
      level = 'warning';
      title = `${offlineDevices.length} Device${
        offlineDevices.length === 1 ? '' : 's'
      } Offline`;
      subtitle = offlineDevices.map(device => device.name).join(', ');
    } else if (isStale) {
      level = 'warning';
      title = 'Data May Be Stale';
      subtitle = lastAlert
        ? `Last detection ${relativeTime(lastAlert.timestamp)}`
        : 'No detections recorded';
    } else if (lastAlert) {
      subtitle = `Last detection ${relativeTime(lastAlert.timestamp)}`;
    }

    return {
      level,
      title,
      subtitle,
      activeAlertCount,
      visitorsToday,
      knownVisitorsToday,
      devicesOnline: onlineDevices.length,
      devicesOffline: offlineDevices.length,
      devicesTotal: allDevices.length,
      onlineDeviceNames: onlineDevices.map(device => device.name),
      offlineDeviceNames: offlineDevices.map(device => device.name),
      allAlerts,
      allDevices,
      recentAlerts,
      recentVisitorMacs,
      threatCounts,
      isLoading: alertsLoading || devicesLoading,
      alertsError: alertsError as Error | null,
      devicesError: devicesError as Error | null,
      refetchAlerts,
      refetchDevices,
    };
  }, [
    alerts,
    alertsError,
    alertsLoading,
    devices,
    devicesError,
    devicesLoading,
    refetchAlerts,
    refetchDevices,
  ]);
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
