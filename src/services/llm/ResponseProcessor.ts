import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';
import type { IntentFilters, IntentType } from '@/types/llm';
import { FocusedContextBuilder } from './FocusedContextBuilder';

const PREAMBLES = [
  /^Based on the provided information,?\s*/i,
  /^Based on the data,?\s*/i,
  /^According to the system's current data,?\s*/i,
  /^I've analyzed\s*/i,
  /^Let me analyze\s*/i,
  /^Looking at the data,?\s*/i,
];

const CLOSING_PATTERNS = [
  /Is there anything else you'd like to know\??/i,
  /Feel free to ask if you have more questions\.?/i,
];

function cleanFormatting(response: string): string {
  let processed = response.trim();

  PREAMBLES.forEach(pattern => {
    processed = processed.replace(pattern, '');
  });

  const sentences = processed
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .filter(sentence => !sentence.includes('taking necessary precautions'))
    .filter(sentence => !/^Considering the context of rural/i.test(sentence))
    .filter(
      sentence =>
        !CLOSING_PATTERNS.some(pattern => pattern.test(sentence))
    );

  processed = sentences.join(' ').trim();

  const lastTerminal = Math.max(
    processed.lastIndexOf('.'),
    processed.lastIndexOf('!'),
    processed.lastIndexOf('?')
  );

  if (lastTerminal >= 0 && lastTerminal < processed.length - 1) {
    processed = processed.slice(0, lastTerminal + 1);
  }

  return processed.trim();
}

function buildFallback(
  intent: IntentType,
  filters: IntentFilters,
  alerts: Alert[],
  devices: Device[]
): string {
  switch (intent) {
    case 'alert_query': {
      const matchingAlerts = [...FocusedContextBuilder.filterAlerts(alerts, filters)].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      if (matchingAlerts.length === 0) {
        return 'No matching alerts found.';
      }

      const list = matchingAlerts
        .slice(0, 3)
        .map((alert, index) => {
          const deviceName =
            devices.find(device => device.id === alert.deviceId)?.name || alert.deviceId;
          const time = new Date(alert.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          return `${index + 1}. ${alert.detectionType} detection at ${deviceName}, ${time} - signal ${alert.rssi} dBm`;
        })
        .join(' ');

      return `${matchingAlerts.length} matching alerts. Most recent: ${list}`;
    }
    case 'device_query': {
      const matchingDevices = FocusedContextBuilder.filterDevices(devices, filters);
      if (matchingDevices.length === 0) {
        return 'No matching devices found.';
      }

      return matchingDevices
        .slice(0, 4)
        .map(device => {
          const lastSeen = new Date(device.lastSeen || device.updatedAt).toLocaleString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }
          );
          return `${device.name}: ${device.online ? 'online' : 'offline'}, battery ${device.batteryPercent ?? device.battery ?? 'N/A'}%, last seen ${lastSeen}.`;
        })
        .join(' ');
    }
    case 'status_overview': {
      const critical = alerts.filter(alert => alert.threatLevel === 'critical').length;
      const high = alerts.filter(alert => alert.threatLevel === 'high').length;
      const offline = devices.filter(device => !device.online).length;
      return `Top issues: ${offline} offline sensors, ${critical} critical alerts, ${high} high alerts.`;
    }
    default:
      return cleanFormatting(
        FocusedContextBuilder.build(intent, filters, alerts, devices)
      );
  }
}

function hasHallucination(
  response: string,
  intent: IntentType,
  filters: IntentFilters,
  alerts: Alert[],
  devices: Device[]
): boolean {
  const normalized = response.toLowerCase();

  // Catch generic "I don't have data" refusals when data exists
  if (
    /\bdon't have\b.*\bdata\b|\bno data\b|\bunable to\b|\bcannot\b.*\baccess\b|\bno information\b/.test(
      normalized
    )
  ) {
    return alerts.length > 0 || devices.length > 0;
  }

  if (intent === 'device_query' && /\bno devices?\b|\bno sensors?\b|\bnone\b|\bempty\b/.test(normalized)) {
    return FocusedContextBuilder.filterDevices(devices, filters).length > 0;
  }

  if (intent === 'alert_query' && /\bno alerts?\b|\bnone\b|\bempty\b/.test(normalized)) {
    return FocusedContextBuilder.filterAlerts(alerts, filters).length > 0;
  }

  if (
    intent === 'status_overview' &&
    /\beverything looks normal\b|\ball clear\b|\bno issues\b/.test(normalized)
  ) {
    const counts = alerts.filter(
      alert => alert.threatLevel === 'critical' || alert.threatLevel === 'high'
    ).length;
    return counts > 0;
  }

  return false;
}

function enforceLength(text: string, wordLimit: number = 150): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) {
    return text.trim();
  }

  const trimmed = words.slice(0, wordLimit).join(' ');
  const lastTerminal = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('!'),
    trimmed.lastIndexOf('?')
  );

  return (lastTerminal >= 0 ? trimmed.slice(0, lastTerminal + 1) : trimmed).trim();
}

export class ResponseProcessor {
  static process(
    response: string,
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): string {
    const cleaned = cleanFormatting(response);
    const corrected = hasHallucination(cleaned, intent, filters, alerts, devices)
      ? buildFallback(intent, filters, alerts, devices)
      : cleaned;

    return enforceLength(corrected);
  }
}
