import type { Device } from '@/types/device';
import type { ClassifiedIntent, IntentFilters, IntentType } from '@/types/llm';

const THREAT_LEVEL_PATTERNS = [
  { regex: /\bcritical\b/i, value: 'critical' },
  { regex: /\bhigh(?:\s+threat)?\b/i, value: 'high' },
  { regex: /\bmedium\b/i, value: 'medium' },
  { regex: /\blow\b/i, value: 'low' },
] as const;

const DETECTION_TYPE_PATTERNS = [
  { regex: /\bwi[\s-]?fi\b/i, value: 'wifi' },
  { regex: /\bbluetooth\b|\bble\b/i, value: 'bluetooth' },
  { regex: /\bcell(?:ular)?\b/i, value: 'cellular' },
] as const;

const INTENT_RULES: Array<{
  intent: IntentType;
  patterns: RegExp[];
  confidence: number;
}> = [
  {
    intent: 'help',
    patterns: [
      /\bhelp\b/i,
      /\bwhat can you do\b/i,
      /\bhow do i\b/i,
      /\bhow can you help\b/i,
    ],
    confidence: 0.95,
  },
  {
    intent: 'time_query',
    patterns: [
      /\bquietest\b/i,
      /\bbusiest\b/i,
      /\bwhat time\b/i,
      /\bwhen\b/i,
      /\bhour(?:ly)?\b/i,
    ],
    confidence: 0.85,
  },
  {
    intent: 'pattern_query',
    patterns: [
      /\bpattern(?:s)?\b/i,
      /\bsuspicious\b/i,
      /\bunusual\b/i,
      /\bactivity\b/i,
      /\brepeat\b/i,
      /\bvisitor(?:s)?\b/i,
    ],
    confidence: 0.82,
  },
  {
    intent: 'device_query',
    patterns: [
      /\bdevice(?:s)?\b/i,
      /\bsensor(?:s)?\b/i,
      /\boffline\b/i,
      /\bonline\b/i,
      /\bbattery\b/i,
    ],
    confidence: 0.84,
  },
  {
    intent: 'alert_query',
    patterns: [
      /\balert(?:s)?\b/i,
      /\bdetection(?:s)?\b/i,
      /\bwarning(?:s)?\b/i,
      /\bthreat(?:s)?\b/i,
      /\bcritical alerts?\b/i,
      /\bhigh threat\b/i,
    ],
    confidence: 0.82,
  },
  {
    intent: 'status_overview',
    patterns: [
      /\bstatus\b/i,
      /\bsummary\b/i,
      /\bwhat(?:'s| is) going on\b/i,
      /\bhow(?:'s| is) everything\b/i,
      /\boverview\b/i,
    ],
    confidence: 0.75,
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractDeviceName(
  message: string,
  devices: Device[]
): string | undefined {
  const normalizedMessage = normalizeText(message);

  for (const device of devices) {
    const normalizedDeviceName = normalizeText(device.name);
    if (!normalizedDeviceName) {
      continue;
    }

    if (normalizedMessage.includes(normalizedDeviceName)) {
      return device.name;
    }

    const deviceTokens = normalizedDeviceName.split(' ').filter(Boolean);
    if (deviceTokens.length >= 2) {
      const partialName = deviceTokens.slice(0, 2).join(' ');
      if (normalizedMessage.includes(partialName)) {
        return device.name;
      }
    }
  }

  return undefined;
}

function extractFilters(message: string, devices: Device[]): IntentFilters {
  const filters: IntentFilters = {};

  for (const pattern of THREAT_LEVEL_PATTERNS) {
    if (pattern.regex.test(message)) {
      filters.threatLevel = pattern.value;
      break;
    }
  }

  for (const pattern of DETECTION_TYPE_PATTERNS) {
    if (pattern.regex.test(message)) {
      filters.detectionType = pattern.value;
      break;
    }
  }

  if (/\btoday\b|\blast 24\s*hours?\b|\b24h\b/i.test(message)) {
    filters.timeRange = '24h';
  } else if (/\bthis week\b|\blast 7\s*days?\b|\b7d\b/i.test(message)) {
    filters.timeRange = '7d';
  }

  if (/\bunreviewed\b|\bpending\b/i.test(message)) {
    filters.isReviewed = false;
  } else if (/\breviewed\b/i.test(message)) {
    filters.isReviewed = true;
  }

  if (/\boffline\b|\bdown\b/i.test(message)) {
    filters.online = false;
  } else if (/\bonline\b|\bactive\b/i.test(message)) {
    filters.online = true;
  }

  const deviceName = extractDeviceName(message, devices);
  if (deviceName) {
    filters.deviceName = deviceName;
  }

  return filters;
}

function detectIntent(
  message: string,
  filters: IntentFilters
): ClassifiedIntent {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some(pattern => pattern.test(message))) {
      return {
        intent: rule.intent,
        filters,
        confidence: rule.confidence,
      };
    }
  }

  if (filters.deviceName || typeof filters.online === 'boolean') {
    return {
      intent: 'device_query',
      filters,
      confidence: 0.7,
    };
  }

  if (
    filters.threatLevel ||
    filters.detectionType ||
    typeof filters.isReviewed === 'boolean'
  ) {
    return {
      intent: 'alert_query',
      filters,
      confidence: 0.7,
    };
  }

  if (filters.timeRange) {
    return {
      intent: 'pattern_query',
      filters,
      confidence: 0.68,
    };
  }

  return {
    intent: 'status_overview',
    filters,
    confidence: 0.35,
  };
}

export class IntentClassifier {
  static classify(message: string, devices: Device[]): ClassifiedIntent {
    const filters = extractFilters(message, devices);
    return detectIntent(message, filters);
  }
}
