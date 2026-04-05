import type { Alert, DetectionType, ThreatLevel } from '@/types/alert';
import type { Device } from '@/types/device';
import type { IntentFilters, IntentType } from '@/types/llm';
import type { StructuredCardData } from '@/types/cardData';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type HourBucket = { label: string; count: number };

function parseTimestamp(value?: string): number {
  const timestamp = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Unknown time';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function batteryLabel(battery?: number): string {
  if (battery === undefined) {
    return 'UNKNOWN';
  }
  if (battery < 20) {
    return 'CRITICAL';
  }
  if (battery < 40) {
    return 'LOW';
  }
  return 'OK';
}

function accuracyToZone(accuracyMeters: number): string {
  if (accuracyMeters < 5) {
    return 'IMMEDIATE (~0-20 ft)';
  }
  if (accuracyMeters < 10) {
    return 'NEAR (~20-50 ft)';
  }
  if (accuracyMeters < 25) {
    return 'FAR (~50-200 ft)';
  }
  return 'EXTREME (~200+ ft)';
}

function filterAlerts(alerts: Alert[], filters: IntentFilters): Alert[] {
  const now = Date.now();
  return alerts.filter(alert => {
    if (filters.threatLevel && alert.threatLevel !== filters.threatLevel) {
      return false;
    }
    if (filters.detectionType && alert.detectionType !== filters.detectionType) {
      return false;
    }
    if (
      typeof filters.isReviewed === 'boolean' &&
      alert.isReviewed !== filters.isReviewed
    ) {
      return false;
    }
    if (filters.timeRange) {
      const windowMs = filters.timeRange === '24h' ? DAY_MS : 7 * DAY_MS;
      if (parseTimestamp(alert.timestamp) < now - windowMs) {
        return false;
      }
    }
    return true;
  });
}

function filterDevices(devices: Device[], filters: IntentFilters): Device[] {
  return devices.filter(device => {
    if (typeof filters.online === 'boolean' && device.online !== filters.online) {
      return false;
    }
    if (filters.deviceName && device.name !== filters.deviceName) {
      return false;
    }
    return true;
  });
}

function countByThreat(alerts: Alert[]): Record<ThreatLevel, number> {
  return alerts.reduce<Record<ThreatLevel, number>>(
    (counts, alert) => {
      counts[alert.threatLevel] += 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

function countByDetection(alerts: Alert[]): Record<DetectionType, number> {
  return alerts.reduce<Record<DetectionType, number>>(
    (counts, alert) => {
      counts[alert.detectionType] += 1;
      return counts;
    },
    { wifi: 0, bluetooth: 0, cellular: 0 }
  );
}

function buildHourlyBuckets(alerts: Alert[]): HourBucket[] {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    label: new Date(Date.UTC(2026, 0, 1, hour)).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    }),
    count: 0,
  }));

  alerts.forEach(alert => {
    const date = new Date(alert.timestamp);
    const hour = date.getHours();
    if (hours[hour]) {
      hours[hour].count += 1;
    }
  });

  return hours;
}

function formatFingerprint(fingerprintHash: string): string {
  return fingerprintHash || 'unknown';
}

function getDeviceName(deviceId: string, devices: Device[]): string {
  return devices.find(device => device.id === deviceId)?.name || deviceId;
}

function buildAlertContext(
  alerts: Alert[],
  devices: Device[],
  filters: IntentFilters
): string {
  const filteredAlerts = [...filterAlerts(alerts, filters)].sort(
    (a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp)
  );

  if (filteredAlerts.length === 0) {
    return 'No matching alerts found.';
  }

  const label = filters.threatLevel
    ? `${filteredAlerts.length} ${filters.threatLevel} alerts`
    : `${filteredAlerts.length} matching alerts`;

  const body = filteredAlerts
    .slice(0, 6)
    .map((alert, index) => {
      const repeatCount = filteredAlerts.filter(
        candidate => candidate.fingerprintHash === alert.fingerprintHash
      ).length;
      const repeatText =
        repeatCount > 1 ? `, repeat device seen ${repeatCount} times` : '';

      return `${index + 1}. ${alert.detectionType} detection at ${getDeviceName(
        alert.deviceId,
        devices
      )}
Time: ${formatDate(alert.timestamp)}
Threat: ${alert.threatLevel.toUpperCase()}
Confidence: ${alert.confidence}% identity certainty
Accuracy: ~${alert.accuracyMeters.toFixed(1)}m (${accuracyToZone(alert.accuracyMeters)})
Fingerprint: ${formatFingerprint(alert.fingerprintHash)}
Status: ${alert.isReviewed ? 'REVIEWED' : 'UNREVIEWED'}${repeatText}`;
    })
    .join('\n\n');

  return `${label}. Most recent:\n\n${body}`;
}

function buildDeviceContext(
  devices: Device[],
  alerts: Alert[],
  filters: IntentFilters
): string {
  const filteredDevices = filterDevices(devices, filters);

  if (filteredDevices.length === 0) {
    return 'No matching devices found.';
  }

  const deviceAlertCounts = alerts.reduce<Record<string, number>>((counts, alert) => {
    counts[alert.deviceId] = (counts[alert.deviceId] || 0) + 1;
    return counts;
  }, {});

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (a.online !== b.online) {
      return a.online ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  const onlineCount = filteredDevices.filter(device => device.online).length;
  const offlineCount = filteredDevices.length - onlineCount;

  return `You have ${filteredDevices.length} TrailSense sensors. ${onlineCount} online, ${offlineCount} offline.

${sortedDevices
  .map((device, index) => {
    const battery = device.batteryPercent ?? device.battery;
    const lastSeen = formatDate(device.lastSeen || device.updatedAt);
    const detectionCount = device.detectionCount ?? deviceAlertCounts[device.id] ?? 0;
    return `${index + 1}. ${device.name} - ${device.online ? 'ONLINE' : 'OFFLINE'}
Battery: ${battery ?? 'N/A'}% (${batteryLabel(battery)})
Signal: ${device.signalStrength || 'unknown'}
Last seen: ${lastSeen}
Detections: ${detectionCount}`;
  })
  .join('\n\n')}`;
}

function buildStatusContext(alerts: Alert[], devices: Device[]): string {
  const threatCounts = countByThreat(alerts);
  const detectionCounts = countByDetection(alerts);
  const offlineDevices = devices.filter(device => !device.online);
  const unreviewedAlerts = alerts.filter(alert => !alert.isReviewed).length;
  const recentCritical = [...alerts]
    .filter(alert => alert.threatLevel === 'critical')
    .sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp))[0];
  const last24hCount = filterAlerts(alerts, { timeRange: '24h' }).length;

  const concerns: string[] = [];
  if (offlineDevices.length > 0) {
    concerns.push(
      `${offlineDevices.length} sensors offline (${offlineDevices
        .slice(0, 3)
        .map(device => device.name)
        .join(', ')})`
    );
  }
  if (threatCounts.critical > 0 || threatCounts.high > 0) {
    concerns.push(
      `${threatCounts.critical} critical and ${threatCounts.high} high alerts`
    );
  }
  if (unreviewedAlerts > 0) {
    concerns.push(`${unreviewedAlerts} unreviewed alerts`);
  }

  return `SECURITY STATUS:
TOP CONCERNS:
${concerns.length > 0 ? concerns.map(item => `- ${item}`).join('\n') : '- No urgent issues in the current data'}

ALERT BREAKDOWN: ${threatCounts.critical} critical, ${threatCounts.high} high, ${threatCounts.medium} medium, ${threatCounts.low} low (${alerts.length} total)
DETECTION TYPES: ${detectionCounts.wifi} WiFi, ${detectionCounts.bluetooth} Bluetooth, ${detectionCounts.cellular} Cellular
SENSORS: ${devices.filter(device => device.online).length}/${devices.length} online
LAST 24 HOURS: ${last24hCount} alerts
${recentCritical ? `MOST RECENT CRITICAL: ${recentCritical.detectionType} at ${getDeviceName(recentCritical.deviceId, devices)}, ${formatDate(recentCritical.timestamp)}` : 'MOST RECENT CRITICAL: None'}`;
}

function buildPatternContext(alerts: Alert[], devices: Device[], filters: IntentFilters): string {
  const filteredAlerts = filterAlerts(alerts, filters);
  if (filteredAlerts.length === 0) {
    return 'No pattern data available for the selected filters.';
  }

  const visitsByMac = filteredAlerts.reduce<Record<string, Alert[]>>((groups, alert) => {
    const key = alert.fingerprintHash;
    groups[key] = groups[key] || [];
    groups[key].push(alert);
    return groups;
  }, {});

  const repeatVisitors = Object.entries(visitsByMac)
    .filter(([, entries]) => entries.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4);

  const hourlyBuckets = buildHourlyBuckets(filteredAlerts);
  const busiest = [...hourlyBuckets].sort((a, b) => b.count - a.count)[0];

  return `DETECTION PATTERNS:
REPEAT VISITORS:
${repeatVisitors.length > 0
  ? repeatVisitors
      .map(([fingerprintHash, entries]) => {
        const first = entries[0];
        const nighttime = entries.filter(entry => {
          const hour = new Date(entry.timestamp).getHours();
          return hour < 6;
        }).length;
        const label = nighttime >= Math.ceil(entries.length / 2) ? 'SUSPICIOUS' : 'ROUTINE';
        return `- ${formatFingerprint(fingerprintHash)}: ${entries.length} detections, ${first.detectionType}, last at ${getDeviceName(first.deviceId, devices)} -> ${label}`;
      })
      .join('\n')
  : '- No repeat visitors detected'}

HOURLY DISTRIBUTION:
${hourlyBuckets
  .filter(bucket => bucket.count > 0)
  .slice(0, 8)
  .map(bucket => `- ${bucket.label}: ${bucket.count}`)
  .join('\n')}

ANOMALIES:
${busiest && busiest.count > 0 ? `- Busiest hour is ${busiest.label} with ${busiest.count} alerts` : '- No anomalies detected'}`;
}

function buildTimeContext(alerts: Alert[], filters: IntentFilters): string {
  const filteredAlerts = filterAlerts(alerts, filters);
  if (filteredAlerts.length === 0) {
    return 'No time-based alert data available.';
  }

  const hourlyBuckets = buildHourlyBuckets(filteredAlerts);
  const busiest = [...hourlyBuckets].sort((a, b) => b.count - a.count)[0];
  const quietest = [...hourlyBuckets].sort((a, b) => a.count - b.count)[0];

  return `DETECTION TIME PATTERNS:
HOURLY BREAKDOWN:
${hourlyBuckets.map(bucket => `- ${bucket.label}: ${bucket.count}`).join('\n')}

BUSIEST: ${busiest.label} (${busiest.count} alerts)
QUIETEST: ${quietest.label} (${quietest.count} alerts)`;
}

export { accuracyToZone, formatFingerprint, batteryLabel, formatDate };

export class FocusedContextBuilder {
  static filterAlerts = filterAlerts;
  static filterDevices = filterDevices;

  static build(
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): string {
    switch (intent) {
      case 'alert_query':
        return buildAlertContext(alerts, devices, filters);
      case 'device_query':
        return buildDeviceContext(devices, alerts, filters);
      case 'pattern_query':
        return buildPatternContext(alerts, devices, filters);
      case 'time_query':
        return buildTimeContext(alerts, filters);
      case 'help':
        return '';
      case 'status_overview':
      default:
        return buildStatusContext(alerts, devices);
    }
  }

  static buildStructuredData(
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): StructuredCardData {
    switch (intent) {
      case 'alert_query': {
        const filtered = [...filterAlerts(alerts, filters)].sort(
          (a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp)
        );
        return {
          type: 'alert_query',
          alerts: filtered.slice(0, 6),
          filters,
          devices,
        };
      }

      case 'device_query': {
        const filtered = [...filterDevices(devices, filters)].sort((a, b) => {
          if (a.online !== b.online) return a.online ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
        const alertCounts = alerts.reduce<Record<string, number>>(
          (counts, alert) => {
            counts[alert.deviceId] = (counts[alert.deviceId] || 0) + 1;
            return counts;
          },
          {}
        );
        return { type: 'device_query', devices: filtered, alertCounts };
      }

      case 'time_query': {
        const filtered = filterAlerts(alerts, filters);
        const buckets = buildHourlyBuckets(filtered);
        const sorted = [...buckets].sort((a, b) => b.count - a.count);
        const busiest = sorted[0];
        const quietest = sorted[sorted.length - 1];
        return {
          type: 'time_query',
          hourlyBuckets: buckets.map((b, i) => ({
            hour: i,
            label: b.label,
            count: b.count,
          })),
          busiestHour: busiest?.label ?? '',
          quietestHour: quietest?.label ?? '',
        };
      }

      case 'status_overview': {
        const threatCounts = countByThreat(alerts);
        const onlineCount = devices.filter(d => d.online).length;
        const unreviewedCount = alerts.filter(a => !a.isReviewed).length;
        const topAlerts = [...alerts]
          .sort(
            (a, b) =>
              parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp)
          )
          .slice(0, 5);
        return {
          type: 'status_overview',
          alerts: topAlerts,
          devices,
          threatCounts,
          onlineCount,
          offlineCount: devices.length - onlineCount,
          unreviewedCount,
        };
      }

      case 'pattern_query': {
        const filtered = filterAlerts(alerts, filters);
        const visitsByMac = filtered.reduce<Record<string, Alert[]>>(
          (groups, alert) => {
            groups[alert.fingerprintHash] = groups[alert.fingerprintHash] || [];
            groups[alert.fingerprintHash].push(alert);
            return groups;
          },
          {}
        );
        const visitors = Object.entries(visitsByMac)
          .filter(([, entries]) => entries.length > 1)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 8)
          .map(([fingerprintHash, entries]) => {
            const nighttime = entries.filter(e => {
              const hour = new Date(e.timestamp).getHours();
              return hour < 6;
            }).length;
            const classification =
              nighttime >= Math.ceil(entries.length / 2)
                ? ('SUSPICIOUS' as const)
                : ('ROUTINE' as const);
            const first = entries[0];
            return {
              fingerprint: formatFingerprint(fingerprintHash),
              count: entries.length,
              classification,
              detectionType: first.detectionType,
              lastDevice: getDeviceName(first.deviceId, devices),
            };
          });
        const buckets = buildHourlyBuckets(filtered);
        const busiest = [...buckets].sort((a, b) => b.count - a.count)[0];
        return {
          type: 'pattern_query',
          visitors,
          busiestHour: busiest?.count > 0 ? busiest.label : undefined,
        };
      }

      case 'help':
      default:
        return { type: 'help' };
    }
  }
}
