# LLM Intent-Aware Context Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic data dump in the LLM chat pipeline with an intent-aware system that classifies user questions, builds focused context, and post-processes responses to eliminate hallucinations and filler.

**Architecture:** User messages are classified by a regex-based IntentClassifier into one of 6 intents with extracted filters. A FocusedContextBuilder produces a data snapshot containing only relevant information (e.g., only critical alerts when asked about critical alerts). A ResponseProcessor strips preamble, detects hallucinations by cross-referencing the response against actual data, and enforces length limits. The system prompt is shortened from ~160 to ~70 tokens, with intent-specific user prompt templates that give the 1B model explicit output format instructions.

**Tech Stack:** TypeScript, Jest, React Native, ExecuTorch (Llama 3.2 1B)

**Spec:** `docs/superpowers/specs/2026-04-02-llm-intent-aware-context-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|---|---|
| `src/services/llm/IntentClassifier.ts` | Classify user message into intent + extract filters |
| `src/services/llm/FocusedContextBuilder.ts` | Build intent-specific context strings from raw alert/device data |
| `src/services/llm/ResponseProcessor.ts` | 3-stage post-processing: clean, hallucination check, length enforcement |
| `__tests__/services/llm/IntentClassifier.test.ts` | Tests for intent classification and filter extraction |
| `__tests__/services/llm/FocusedContextBuilder.test.ts` | Tests for each context builder |
| `__tests__/services/llm/ResponseProcessor.test.ts` | Tests for post-processing pipeline |

### Modified Files
| File | Changes |
|---|---|
| `src/types/llm.ts` | Add `ChatContext`, `ClassifiedIntent`, `IntentFilters` types; add `intent` to `ChatResponse` |
| `src/services/llm/templates/ConversationalTemplate.ts` | New system prompt, intent-aware `buildPrompt`, remove dead question methods |
| `src/services/llm/LLMService.ts` | Rewrite `chat()` to orchestrate intent → context → prompt → generate → process |
| `src/screens/ai/AIAssistantScreen.tsx` | Pass raw alerts/devices instead of pre-built securityContext |
| `src/services/llm/index.ts` | Export new modules |

---

### Task 1: Add New Types to `src/types/llm.ts`

**Files:**
- Modify: `src/types/llm.ts`

- [ ] **Step 1: Add intent and chat context types**

Add the following types at the end of `src/types/llm.ts`, before the closing of the file:

```typescript
// Intent Classification Types
export type IntentType =
  | 'alert_query'
  | 'device_query'
  | 'status_overview'
  | 'pattern_query'
  | 'time_query'
  | 'help';

export interface IntentFilters {
  threatLevel?: ThreatLevel;
  detectionType?: DetectionType;
  timeRange?: '24h' | '7d';
  deviceName?: string;
  isReviewed?: boolean;
  online?: boolean;
}

export interface ClassifiedIntent {
  intent: IntentType;
  filters: IntentFilters;
  confidence: number;
}

// New chat context — replaces ConversationContext for chat()
export interface ChatContext {
  messages: ChatMessage[];
  rawAlerts: Alert[];
  rawDevices: Device[];
}
```

Also update the existing `ChatResponse` interface to add the optional `intent` field:

```typescript
export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: string[];
  intent?: IntentType;
}
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors (existing errors are fine, no regressions)

- [ ] **Step 3: Commit**

```bash
git add src/types/llm.ts
git commit -m "feat(llm): add intent classification and chat context types"
```

---

### Task 2: IntentClassifier

**Files:**
- Create: `src/services/llm/IntentClassifier.ts`
- Create: `__tests__/services/llm/IntentClassifier.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/services/llm/IntentClassifier.test.ts`:

```typescript
import { IntentClassifier } from '@/services/llm/IntentClassifier';
import type { Device } from '@/types/device';

const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-12-16T09:45:00Z',
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: false,
    batteryPercent: 12,
    signalStrength: 'fair',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-12-16T09:47:00Z',
  },
];

describe('IntentClassifier', () => {
  describe('intent detection', () => {
    it('classifies alert queries', () => {
      const result = IntentClassifier.classify('Tell me about the critical alerts', mockDevices);
      expect(result.intent).toBe('alert_query');
      expect(result.filters.threatLevel).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('classifies device queries', () => {
      const result = IntentClassifier.classify('Are any sensors offline?', mockDevices);
      expect(result.intent).toBe('device_query');
      expect(result.filters.online).toBe(false);
    });

    it('classifies status overview', () => {
      const result = IntentClassifier.classify("What's going on?", mockDevices);
      expect(result.intent).toBe('status_overview');
    });

    it('classifies pattern queries', () => {
      const result = IntentClassifier.classify('Any suspicious activity this week?', mockDevices);
      expect(result.intent).toBe('pattern_query');
      expect(result.filters.timeRange).toBe('7d');
    });

    it('classifies time queries', () => {
      const result = IntentClassifier.classify('When is it usually quietest?', mockDevices);
      expect(result.intent).toBe('time_query');
    });

    it('classifies help queries', () => {
      const result = IntentClassifier.classify('What can you do?', mockDevices);
      expect(result.intent).toBe('help');
    });

    it('falls back to status_overview for ambiguous messages', () => {
      const result = IntentClassifier.classify('hello', mockDevices);
      expect(result.intent).toBe('status_overview');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('filter extraction', () => {
    it('extracts threat level from message', () => {
      const result = IntentClassifier.classify('Show me high threat detections', mockDevices);
      expect(result.filters.threatLevel).toBe('high');
    });

    it('extracts detection type', () => {
      const result = IntentClassifier.classify('How many WiFi detections today?', mockDevices);
      expect(result.filters.detectionType).toBe('wifi');
      expect(result.filters.timeRange).toBe('24h');
    });

    it('extracts device name', () => {
      const result = IntentClassifier.classify('How is the North Gate Sensor doing?', mockDevices);
      expect(result.intent).toBe('device_query');
      expect(result.filters.deviceName).toBe('North Gate Sensor');
    });

    it('extracts unreviewed filter', () => {
      const result = IntentClassifier.classify('Show me unreviewed alerts', mockDevices);
      expect(result.filters.isReviewed).toBe(false);
    });

    it('extracts time range - today', () => {
      const result = IntentClassifier.classify('What happened today?', mockDevices);
      expect(result.filters.timeRange).toBe('24h');
    });

    it('extracts time range - this week', () => {
      const result = IntentClassifier.classify('Activity this week', mockDevices);
      expect(result.filters.timeRange).toBe('7d');
    });

    it('extracts bluetooth detection type', () => {
      const result = IntentClassifier.classify('Any bluetooth detections?', mockDevices);
      expect(result.filters.detectionType).toBe('bluetooth');
    });

    it('extracts cellular detection type', () => {
      const result = IntentClassifier.classify('Show cellular alerts', mockDevices);
      expect(result.filters.detectionType).toBe('cellular');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/services/llm/IntentClassifier.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `@/services/llm/IntentClassifier`

- [ ] **Step 3: Implement IntentClassifier**

Create `src/services/llm/IntentClassifier.ts`:

```typescript
import type { Device } from '@/types/device';
import type { ClassifiedIntent, IntentFilters, IntentType } from '@/types/llm';

interface IntentRule {
  intent: IntentType;
  patterns: RegExp[];
  weight: number;
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'alert_query',
    patterns: [
      /\balerts?\b/i,
      /\bdetections?\b/i,
      /\bwarnings?\b/i,
      /\bthreat/i,
      /\bcritical\b/i,
      /\bhigh\s+threat/i,
      /\bunreviewed\b/i,
      /\bfalse\s+positive/i,
    ],
    weight: 1.0,
  },
  {
    intent: 'device_query',
    patterns: [
      /\bsensors?\b/i,
      /\bdevices?\b/i,
      /\boffline\b/i,
      /\bonline\b/i,
      /\bbatter(y|ies)\b/i,
      /\bfirmware\b/i,
      /\bsignal\s+strength/i,
    ],
    weight: 1.0,
  },
  {
    intent: 'status_overview',
    patterns: [
      /\bstatus\b/i,
      /\bsummary\b/i,
      /\boverview\b/i,
      /\bhow'?s?\s+everything/i,
      /\bwhat'?s?\s+going\s+on/i,
      /\bwhat'?s?\s+happening/i,
      /\bsituation\b/i,
      /\breport\b/i,
    ],
    weight: 0.8,
  },
  {
    intent: 'pattern_query',
    patterns: [
      /\bpatterns?\b/i,
      /\bsuspicious\b/i,
      /\bunusual\b/i,
      /\banomal/i,
      /\bactivity\b/i,
      /\btrends?\b/i,
      /\brepeat/i,
      /\bfrequen/i,
    ],
    weight: 0.9,
  },
  {
    intent: 'time_query',
    patterns: [
      /\bquietest\b/i,
      /\bbusiest\b/i,
      /\bwhat\s+time/i,
      /\bwhen\s+(is|are|was|does|do)\b/i,
      /\bpeak\s+(hours?|times?)/i,
      /\bhour(ly|s)\b/i,
    ],
    weight: 0.9,
  },
  {
    intent: 'help',
    patterns: [
      /\bwhat\s+can\s+you\s+do/i,
      /\bhelp\s+me\b/i,
      /\bhow\s+do\s+I\b/i,
      /\bwhat\s+do\s+you\s+know/i,
      /\bcapabilit/i,
    ],
    weight: 1.0,
  },
];

const THREAT_LEVEL_PATTERNS: Array<{ pattern: RegExp; value: 'critical' | 'high' | 'medium' | 'low' }> = [
  { pattern: /\bcritical\b/i, value: 'critical' },
  { pattern: /\bhigh\b/i, value: 'high' },
  { pattern: /\bmedium\b/i, value: 'medium' },
  { pattern: /\blow\b/i, value: 'low' },
];

const DETECTION_TYPE_PATTERNS: Array<{ pattern: RegExp; value: 'wifi' | 'bluetooth' | 'cellular' }> = [
  { pattern: /\bwi-?fi\b/i, value: 'wifi' },
  { pattern: /\bblue-?tooth\b|ble\b/i, value: 'bluetooth' },
  { pattern: /\bcellular\b/i, value: 'cellular' },
];

const TIME_RANGE_PATTERNS: Array<{ pattern: RegExp; value: '24h' | '7d' }> = [
  { pattern: /\btoday\b/i, value: '24h' },
  { pattern: /\blast\s+24\s*h/i, value: '24h' },
  { pattern: /\bpast\s+(24\s*hours?|day)\b/i, value: '24h' },
  { pattern: /\bthis\s+week\b/i, value: '7d' },
  { pattern: /\blast\s+(7\s*d|week|seven\s+days)/i, value: '7d' },
  { pattern: /\bpast\s+week\b/i, value: '7d' },
];

export class IntentClassifier {
  /**
   * Classify a user message into an intent with extracted filters.
   * @param message - The user's message
   * @param devices - Current device list (used for device name matching)
   */
  static classify(message: string, devices: Device[] = []): ClassifiedIntent {
    const scores = new Map<IntentType, number>();

    // Score each intent by counting pattern matches
    for (const rule of INTENT_RULES) {
      let matchCount = 0;
      for (const pattern of rule.patterns) {
        if (pattern.test(message)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        scores.set(rule.intent, matchCount * rule.weight);
      }
    }

    // Check if message references a device name → boost device_query
    const matchedDeviceName = this.matchDeviceName(message, devices);
    if (matchedDeviceName) {
      const current = scores.get('device_query') ?? 0;
      scores.set('device_query', current + 1.5);
    }

    // Find highest scoring intent
    let bestIntent: IntentType = 'status_overview';
    let bestScore = 0;

    for (const [intent, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    // Calculate confidence (0-1 based on score strength)
    const confidence = bestScore > 0 ? Math.min(bestScore / 2, 1.0) : 0.3;

    // Extract filters
    const filters = this.extractFilters(message, devices);

    return {
      intent: bestIntent,
      filters,
      confidence,
    };
  }

  private static extractFilters(message: string, devices: Device[]): IntentFilters {
    const filters: IntentFilters = {};

    // Threat level
    for (const { pattern, value } of THREAT_LEVEL_PATTERNS) {
      if (pattern.test(message)) {
        filters.threatLevel = value;
        break;
      }
    }

    // Detection type
    for (const { pattern, value } of DETECTION_TYPE_PATTERNS) {
      if (pattern.test(message)) {
        filters.detectionType = value;
        break;
      }
    }

    // Time range
    for (const { pattern, value } of TIME_RANGE_PATTERNS) {
      if (pattern.test(message)) {
        filters.timeRange = value;
        break;
      }
    }

    // Device name
    const deviceName = this.matchDeviceName(message, devices);
    if (deviceName) {
      filters.deviceName = deviceName;
    }

    // Review status
    if (/\bunreviewed\b/i.test(message)) {
      filters.isReviewed = false;
    } else if (/\breviewed\b/i.test(message)) {
      filters.isReviewed = true;
    }

    // Online/offline status
    if (/\boffline\b/i.test(message)) {
      filters.online = false;
    } else if (/\bonline\b/i.test(message)) {
      filters.online = true;
    }

    return filters;
  }

  private static matchDeviceName(message: string, devices: Device[]): string | undefined {
    const messageLower = message.toLowerCase();
    for (const device of devices) {
      if (messageLower.includes(device.name.toLowerCase())) {
        return device.name;
      }
    }
    return undefined;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/services/llm/IntentClassifier.test.ts --verbose 2>&1 | tail -30`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/IntentClassifier.ts __tests__/services/llm/IntentClassifier.test.ts
git commit -m "feat(llm): add IntentClassifier with regex-based intent detection and filter extraction"
```

---

### Task 3: FocusedContextBuilder

**Files:**
- Create: `src/services/llm/FocusedContextBuilder.ts`
- Create: `__tests__/services/llm/FocusedContextBuilder.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/services/llm/FocusedContextBuilder.test.ts`:

```typescript
import { FocusedContextBuilder } from '@/services/llm/FocusedContextBuilder';
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';

const now = new Date();
const hoursAgo = (h: number): string =>
  new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    deviceId: 'device-001',
    timestamp: hoursAgo(2),
    threatLevel: 'critical',
    detectionType: 'cellular',
    rssi: -52,
    macAddress: 'A4:CF:12:00:00:01',
    isReviewed: false,
    isFalsePositive: false,
    metadata: { band: '850MHz' },
    isStationary: true,
    duration: 720,
  },
  {
    id: 'alert-2',
    deviceId: 'device-001',
    timestamp: hoursAgo(5),
    threatLevel: 'critical',
    detectionType: 'cellular',
    rssi: -58,
    macAddress: 'A4:CF:12:00:00:01',
    isReviewed: false,
    isFalsePositive: false,
  },
  {
    id: 'alert-3',
    deviceId: 'device-002',
    timestamp: hoursAgo(12),
    threatLevel: 'low',
    detectionType: 'wifi',
    rssi: -75,
    macAddress: 'BB:22:33:44:55:66',
    isReviewed: true,
    isFalsePositive: false,
    metadata: { ssid: 'FedEx-Van' },
  },
  {
    id: 'alert-4',
    deviceId: 'device-003',
    timestamp: hoursAgo(48),
    threatLevel: 'high',
    detectionType: 'bluetooth',
    rssi: -61,
    macAddress: 'CC:33:44:55:66:77',
    isReviewed: false,
    isFalsePositive: false,
  },
];

const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    detectionCount: 142,
    lastSeen: hoursAgo(1),
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: hoursAgo(1),
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: true,
    batteryPercent: 65,
    signalStrength: 'good',
    detectionCount: 98,
    lastSeen: hoursAgo(1),
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: hoursAgo(1),
  },
  {
    id: 'device-003',
    name: 'Cabin Approach',
    online: false,
    batteryPercent: 5,
    signalStrength: 'weak',
    detectionCount: 156,
    lastSeen: hoursAgo(96),
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: hoursAgo(96),
  },
];

describe('FocusedContextBuilder', () => {
  describe('buildAlertContext', () => {
    it('filters by threat level', () => {
      const result = FocusedContextBuilder.build(
        'alert_query',
        { threatLevel: 'critical' },
        mockAlerts,
        mockDevices
      );
      expect(result).toContain('critical');
      expect(result).toContain('A4:CF:12:00:00:01');
      expect(result).toContain('North Gate Sensor');
      expect(result).not.toContain('FedEx-Van');
      expect(result).not.toContain('BB:22:33:44:55:66');
    });

    it('flags repeat MAC addresses', () => {
      const result = FocusedContextBuilder.build(
        'alert_query',
        { threatLevel: 'critical' },
        mockAlerts,
        mockDevices
      );
      // Both critical alerts share MAC A4:CF:12:00:00:01
      expect(result).toMatch(/same\s+device|repeat|seen\s+\d+\s+times/i);
    });

    it('includes RSSI zone labels', () => {
      const result = FocusedContextBuilder.build(
        'alert_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/IMMEDIATE|NEAR|FAR/);
    });

    it('returns all alerts when no threat filter', () => {
      const result = FocusedContextBuilder.build(
        'alert_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toContain('critical');
      expect(result).toContain('low');
      expect(result).toContain('high');
    });
  });

  describe('buildDeviceContext', () => {
    it('lists offline devices first', () => {
      const result = FocusedContextBuilder.build(
        'device_query',
        {},
        mockAlerts,
        mockDevices
      );
      const offlineIndex = result.indexOf('OFFLINE');
      const onlineIndex = result.indexOf('ONLINE');
      expect(offlineIndex).toBeLessThan(onlineIndex);
    });

    it('labels battery levels', () => {
      const result = FocusedContextBuilder.build(
        'device_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toContain('CRITICAL');
      expect(result).toContain('Cabin Approach');
    });

    it('includes device counts', () => {
      const result = FocusedContextBuilder.build(
        'device_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/3.*sensor/i);
      expect(result).toMatch(/2.*online|online.*2/i);
      expect(result).toMatch(/1.*offline|offline.*1/i);
    });
  });

  describe('buildStatusContext', () => {
    it('leads with top concerns', () => {
      const result = FocusedContextBuilder.build(
        'status_overview',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/concern|attention|urgent/i);
      expect(result).toContain('offline');
    });

    it('includes alert breakdown', () => {
      const result = FocusedContextBuilder.build(
        'status_overview',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/critical.*2|2.*critical/i);
    });
  });

  describe('buildPatternContext', () => {
    it('groups by MAC address', () => {
      const result = FocusedContextBuilder.build(
        'pattern_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toContain('A4:CF:12:00:00:01');
      expect(result).toMatch(/2\s+(detection|time)/i);
    });
  });

  describe('buildTimeContext', () => {
    it('includes hourly distribution', () => {
      const result = FocusedContextBuilder.build(
        'time_query',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/hour|AM|PM/i);
    });
  });

  describe('help intent', () => {
    it('returns capability description', () => {
      const result = FocusedContextBuilder.build(
        'help',
        {},
        mockAlerts,
        mockDevices
      );
      expect(result).toMatch(/alert|sensor|pattern/i);
    });
  });

  describe('empty data', () => {
    it('handles empty alerts', () => {
      const result = FocusedContextBuilder.build(
        'alert_query',
        { threatLevel: 'critical' },
        [],
        mockDevices
      );
      expect(result).toMatch(/no.*critical.*alert/i);
    });

    it('handles empty devices', () => {
      const result = FocusedContextBuilder.build(
        'device_query',
        {},
        mockAlerts,
        []
      );
      expect(result).toMatch(/no.*sensor|no.*device/i);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/services/llm/FocusedContextBuilder.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `@/services/llm/FocusedContextBuilder`

- [ ] **Step 3: Implement FocusedContextBuilder**

Create `src/services/llm/FocusedContextBuilder.ts`:

```typescript
import type { Alert, ThreatLevel } from '@/types/alert';
import type { Device } from '@/types/device';
import type { IntentFilters, IntentType } from '@/types/llm';

/**
 * RSSI to proximity zone mapping
 */
function rssiToZone(rssi: number): { zone: string; distance: string } {
  if (rssi > -50) return { zone: 'IMMEDIATE', distance: '~0-20 ft' };
  if (rssi > -70) return { zone: 'NEAR', distance: '~20-50 ft' };
  if (rssi > -85) return { zone: 'FAR', distance: '~50-200 ft' };
  return { zone: 'EXTREME', distance: '~200+ ft' };
}

/**
 * Battery percentage to human label
 */
function batteryLabel(percent: number | undefined): string {
  if (percent === undefined) return 'N/A';
  if (percent < 20) return `${percent}% (CRITICAL)`;
  if (percent < 40) return `${percent}% (LOW)`;
  return `${percent}%`;
}

/**
 * Format a timestamp to a short human-readable string
 */
function formatTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get device name from deviceId
 */
function getDeviceName(deviceId: string, devices: Device[]): string {
  return devices.find(d => d.id === deviceId)?.name ?? deviceId;
}

/**
 * Filter alerts by IntentFilters
 */
function filterAlerts(alerts: Alert[], filters: IntentFilters): Alert[] {
  let filtered = [...alerts];

  if (filters.threatLevel) {
    filtered = filtered.filter(a => a.threatLevel === filters.threatLevel);
  }

  if (filters.detectionType) {
    filtered = filtered.filter(a => a.detectionType === filters.detectionType);
  }

  if (filters.isReviewed !== undefined) {
    filtered = filtered.filter(a => a.isReviewed === filters.isReviewed);
  }

  if (filters.timeRange) {
    const now = Date.now();
    const cutoff = filters.timeRange === '24h'
      ? now - 24 * 60 * 60 * 1000
      : now - 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= cutoff);
  }

  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return filtered;
}

/**
 * Builds intent-specific context strings from raw data.
 * Each builder maximizes relevant information within the ~800-token budget.
 */
export class FocusedContextBuilder {
  static build(
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): string {
    switch (intent) {
      case 'alert_query':
        return this.buildAlertContext(alerts, filters, devices);
      case 'device_query':
        return this.buildDeviceContext(devices, filters);
      case 'status_overview':
        return this.buildStatusContext(alerts, devices);
      case 'pattern_query':
        return this.buildPatternContext(alerts, devices, filters);
      case 'time_query':
        return this.buildTimeContext(alerts, filters);
      case 'help':
        return this.buildHelpContext();
    }
  }

  private static buildAlertContext(
    alerts: Alert[],
    filters: IntentFilters,
    devices: Device[]
  ): string {
    const filtered = filterAlerts(alerts, filters);
    const levelLabel = filters.threatLevel ?? 'all';

    if (filtered.length === 0) {
      return `No ${levelLabel === 'all' ? '' : levelLabel + ' '}alerts found${filters.timeRange ? ` in the last ${filters.timeRange === '24h' ? '24 hours' : '7 days'}` : ''}.`;
    }

    // Count MAC address occurrences for repeat detection
    const macCounts = new Map<string, number>();
    for (const alert of filtered) {
      macCounts.set(alert.macAddress, (macCounts.get(alert.macAddress) ?? 0) + 1);
    }

    const header = `${filtered.length} ${levelLabel === 'all' ? '' : levelLabel + ' '}alerts${filters.timeRange ? ` in the last ${filters.timeRange === '24h' ? '24 hours' : '7 days'}` : ''}. Most recent:`;

    // Show up to 10 alerts with full detail
    const alertLines = filtered.slice(0, 10).map((alert, i) => {
      const { zone, distance } = rssiToZone(alert.rssi);
      const deviceName = getDeviceName(alert.deviceId, devices);
      const reviewed = alert.isReviewed ? 'Reviewed' : 'UNREVIEWED';
      const macCount = macCounts.get(alert.macAddress) ?? 1;
      const repeatNote = macCount > 1 ? ` (seen ${macCount} times in results)` : '';

      const notes: string[] = [];
      if (alert.metadata?.band) notes.push(alert.metadata.band);
      if (alert.metadata?.ssid) notes.push(`SSID: ${alert.metadata.ssid}`);
      if (alert.metadata?.deviceName) notes.push(alert.metadata.deviceName);
      if (alert.isStationary) notes.push('stationary');
      if (alert.duration) notes.push(`${Math.round(alert.duration / 60)} min duration`);
      const hour = new Date(alert.timestamp).getHours();
      if (hour >= 22 || hour <= 6) notes.push('nighttime');

      return [
        `${i + 1}. ${alert.detectionType} detection at ${deviceName}`,
        `   Time: ${formatTime(alert.timestamp)}`,
        `   Signal: ${alert.rssi} dBm (${zone} zone, ${distance})`,
        `   MAC: ${alert.macAddress}${repeatNote}`,
        `   Status: ${reviewed}`,
        notes.length > 0 ? `   Notes: ${notes.join(', ')}` : '',
      ].filter(Boolean).join('\n');
    });

    return `${header}\n\n${alertLines.join('\n\n')}`;
  }

  private static buildDeviceContext(
    devices: Device[],
    filters: IntentFilters
  ): string {
    if (devices.length === 0) {
      return 'No sensors registered in the system.';
    }

    let filtered = [...devices];
    if (filters.online !== undefined) {
      filtered = filtered.filter(d => d.online === filters.online);
    }
    if (filters.deviceName) {
      filtered = filtered.filter(
        d => d.name.toLowerCase() === filters.deviceName!.toLowerCase()
      );
    }

    const offline = filtered.filter(d => !d.online);
    const online = filtered.filter(d => d.online);

    const total = devices.length;
    const onlineCount = devices.filter(d => d.online).length;
    const offlineCount = total - onlineCount;

    const header = `${total} TrailSense sensors. ${onlineCount} online, ${offlineCount} offline.`;

    const formatDevice = (d: Device, idx: number): string => {
      const status = d.online ? 'ONLINE' : 'OFFLINE';
      const battery = batteryLabel(d.batteryPercent ?? d.battery);
      const lastSeen = d.lastSeen ? formatTime(d.lastSeen) : 'N/A';
      const lines = [
        `${idx}. ${d.name} - ${status}`,
        `   Battery: ${battery}`,
        `   Signal: ${d.signalStrength ?? 'N/A'}`,
        `   Detections: ${d.detectionCount ?? 0}`,
        `   Last seen: ${lastSeen}`,
      ];
      return lines.join('\n');
    };

    const sections: string[] = [header];
    let idx = 1;

    if (offline.length > 0) {
      sections.push('\nOFFLINE (needs attention):');
      for (const d of offline) {
        sections.push(formatDevice(d, idx++));
      }
    }

    if (online.length > 0) {
      sections.push('\nONLINE:');
      for (const d of online) {
        sections.push(formatDevice(d, idx++));
      }
    }

    return sections.join('\n');
  }

  private static buildStatusContext(alerts: Alert[], devices: Device[]): string {
    const now = new Date();
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;

    const threatCounts: Record<ThreatLevel, number> = {
      critical: 0, high: 0, medium: 0, low: 0,
    };
    let unreviewedCount = 0;
    let last24hCount = 0;
    let last24hCritical = 0;
    let last24hHigh = 0;

    for (const alert of alerts) {
      threatCounts[alert.threatLevel]++;
      if (!alert.isReviewed) unreviewedCount++;
      if (new Date(alert.timestamp).getTime() >= oneDayAgo) {
        last24hCount++;
        if (alert.threatLevel === 'critical') last24hCritical++;
        if (alert.threatLevel === 'high') last24hHigh++;
      }
    }

    const offlineDevices = devices.filter(d => !d.online);
    const lowBatteryDevices = devices.filter(d => (d.batteryPercent ?? d.battery ?? 100) < 20);

    // Build top concerns
    const concerns: string[] = [];
    if (offlineDevices.length > 0) {
      const names = offlineDevices.map(d => d.name).join(', ');
      concerns.push(`${offlineDevices.length} sensor${offlineDevices.length > 1 ? 's' : ''} offline (${names})`);
    }
    if (lowBatteryDevices.length > 0) {
      const names = lowBatteryDevices.map(d => `${d.name} at ${d.batteryPercent ?? d.battery}%`).join(', ');
      concerns.push(`Low battery: ${names}`);
    }
    if (threatCounts.critical > 0) {
      concerns.push(`${threatCounts.critical} critical alert${threatCounts.critical > 1 ? 's' : ''}, ${unreviewedCount} unreviewed total`);
    }
    if (threatCounts.critical === 0 && unreviewedCount > 0) {
      concerns.push(`${unreviewedCount} unreviewed alert${unreviewedCount > 1 ? 's' : ''}`);
    }

    // Find most recent critical
    const recentCritical = [...alerts]
      .filter(a => a.threatLevel === 'critical')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (recentCritical) {
      const deviceName = getDeviceName(recentCritical.deviceId, devices);
      concerns.push(`Most recent critical: ${recentCritical.detectionType} at ${deviceName}, ${formatTime(recentCritical.timestamp)}`);
    }

    const onlineCount = devices.filter(d => d.online).length;

    const parts = [
      `SECURITY STATUS as of ${formatTime(now)}:`,
      '',
      concerns.length > 0
        ? `TOP CONCERNS:\n${concerns.map(c => `- ${c}`).join('\n')}`
        : 'No urgent concerns.',
      '',
      `ALERT BREAKDOWN: ${threatCounts.critical} critical, ${threatCounts.high} high, ${threatCounts.medium} medium, ${threatCounts.low} low (${alerts.length} total)`,
      `SENSORS: ${onlineCount}/${devices.length} online`,
      '',
      `LAST 24 HOURS: ${last24hCount} new alerts${last24hCritical > 0 ? ` (${last24hCritical} critical, ${last24hHigh} high)` : ''}`,
    ];

    return parts.join('\n');
  }

  private static buildPatternContext(
    alerts: Alert[],
    devices: Device[],
    filters: IntentFilters
  ): string {
    // Apply time filter
    let filtered = filters.timeRange
      ? filterAlerts(alerts, { timeRange: filters.timeRange })
      : alerts;

    const timeLabel = filters.timeRange === '24h' ? 'last 24 hours' : filters.timeRange === '7d' ? 'last 7 days' : 'all time';

    // Group by MAC address
    const macGroups = new Map<string, Alert[]>();
    for (const alert of filtered) {
      const group = macGroups.get(alert.macAddress) ?? [];
      group.push(alert);
      macGroups.set(alert.macAddress, group);
    }

    // Sort groups by count descending
    const sortedGroups = [...macGroups.entries()].sort((a, b) => b[1].length - a[1].length);

    const parts: string[] = [`DETECTION PATTERNS (${timeLabel}):`];

    if (sortedGroups.length === 0) {
      parts.push('\nNo detections in this time period.');
      return parts.join('\n');
    }

    // Repeat visitors (seen 2+ times)
    const repeats = sortedGroups.filter(([, alerts]) => alerts.length >= 2);
    if (repeats.length > 0) {
      parts.push('\nREPEAT VISITORS:');
      for (const [mac, macAlerts] of repeats.slice(0, 5)) {
        const hours = macAlerts.map(a => new Date(a.timestamp).getHours());
        const nightCount = hours.filter(h => h >= 22 || h <= 6).length;
        const types = [...new Set(macAlerts.map(a => a.detectionType))].join(', ');
        const allNight = nightCount === macAlerts.length && macAlerts.length > 1;
        const label = allNight ? 'SUSPICIOUS' : 'ROUTINE';

        const timeDesc = allNight
          ? `all nighttime (${Math.min(...hours) > 12 ? Math.min(...hours) - 12 : Math.min(...hours)}-${Math.max(...hours) > 12 ? Math.max(...hours) - 12 : Math.max(...hours)} AM)`
          : `various times`;

        parts.push(`- MAC ${mac}: ${macAlerts.length} detections, ${timeDesc}, ${types}`);
        parts.push(`  → ${label}: ${allNight ? 'irregular schedule, nighttime' : 'multiple visits detected'}`);
      }
    }

    // Hourly distribution
    const hourCounts = new Array(24).fill(0);
    for (const alert of filtered) {
      hourCounts[new Date(alert.timestamp).getHours()]++;
    }

    const nightTotal = hourCounts.slice(0, 6).reduce((s, c) => s + c, 0) + hourCounts.slice(22).reduce((s, c) => s + c, 0);
    const dayTotal = hourCounts.slice(6, 22).reduce((s, c) => s + c, 0);
    const nightPct = filtered.length > 0 ? Math.round((nightTotal / filtered.length) * 100) : 0;

    parts.push('\nHOURLY DISTRIBUTION:');
    parts.push(`  12AM-6AM: ${nightTotal} alerts (${nightPct}%)${nightPct > 25 ? ' ← above average for nighttime' : ''}`);
    parts.push(`  6AM-12PM: ${hourCounts.slice(6, 12).reduce((s, c) => s + c, 0)} alerts`);
    parts.push(`  12PM-6PM: ${hourCounts.slice(12, 18).reduce((s, c) => s + c, 0)} alerts`);
    parts.push(`  6PM-12AM: ${hourCounts.slice(18, 22).reduce((s, c) => s + c, 0) + hourCounts.slice(22).reduce((s, c) => s + c, 0)} alerts`);

    // Anomalies
    const newMacs = sortedGroups.filter(([, a]) => {
      const firstSeen = Math.min(...a.map(al => new Date(al.timestamp).getTime()));
      return Date.now() - firstSeen < 48 * 60 * 60 * 1000 && a.length >= 2;
    });

    if (newMacs.length > 0 || nightPct > 25) {
      parts.push('\nANOMALIES:');
      if (nightPct > 25) {
        parts.push(`- Nighttime activity accounts for ${nightPct}% of detections — higher than typical`);
      }
      for (const [mac, a] of newMacs) {
        parts.push(`- New device (MAC ${mac}) seen ${a.length} times in 48 hours, not in Known Devices`);
      }
    }

    return parts.join('\n');
  }

  private static buildTimeContext(alerts: Alert[], filters: IntentFilters): string {
    const filtered = filters.timeRange ? filterAlerts(alerts, { timeRange: filters.timeRange }) : alerts;
    const timeLabel = filters.timeRange === '24h' ? 'last 24 hours' : filters.timeRange === '7d' ? 'last 7 days' : 'all time';

    const hourCounts = new Array(24).fill(0);
    const weekdayCounts = new Array(7).fill(0);

    for (const alert of filtered) {
      const date = new Date(alert.timestamp);
      hourCounts[date.getHours()]++;
      weekdayCounts[date.getDay()]++;
    }

    const formatHour = (h: number): string => {
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    };

    const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
    const quietestHour = hourCounts.indexOf(Math.min(...hourCounts));

    const parts: string[] = [`DETECTION TIME PATTERNS (${timeLabel}):`];

    parts.push('\nHOURLY BREAKDOWN:');
    for (let h = 0; h < 24; h += 6) {
      const row = [];
      for (let col = 0; col < 6 && h + col < 24; col++) {
        const hour = h + col;
        const count = hourCounts[hour];
        const marker = hour === busiestHour && count > 0 ? '←' : '';
        row.push(`${formatHour(hour).padStart(5)}: ${count}${marker}`);
      }
      parts.push(`  ${row.join('    ')}`);
    }

    parts.push(`\nBUSIEST: ${formatHour(busiestHour)} (${hourCounts[busiestHour]} alerts)`);
    parts.push(`QUIETEST: ${formatHour(quietestHour)} (${hourCounts[quietestHour]} alerts)`);

    // Weekday vs weekend
    const weekdayTotal = weekdayCounts.slice(1, 6).reduce((s, c) => s + c, 0);
    const weekendTotal = weekdayCounts[0] + weekdayCounts[6];
    const weekdayCount = 5;
    const weekendCount = 2;

    if (filtered.length > 0) {
      parts.push(`\nWEEKDAY vs WEEKEND:`);
      parts.push(`  Weekdays: ${weekdayTotal} total (avg ${(weekdayTotal / weekdayCount).toFixed(1)}/day)`);
      parts.push(`  Weekends: ${weekendTotal} total (avg ${(weekendTotal / weekendCount).toFixed(1)}/day)`);
    }

    return parts.join('\n');
  }

  private static buildHelpContext(): string {
    return [
      'TrailSense AI can answer questions about:',
      '- Detection alerts — filter by threat level (critical/high/medium/low), type (WiFi/Bluetooth/cellular), or time',
      '- Sensor status — which sensors are online/offline, battery levels, signal strength',
      '- Activity patterns — repeat visitors, suspicious behavior, anomalies',
      '- Time trends — busiest/quietest hours, weekday vs weekend activity',
      '',
      'Try asking: "Show me critical alerts", "Are any sensors offline?", "Any suspicious activity this week?"',
    ].join('\n');
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/services/llm/FocusedContextBuilder.test.ts --verbose 2>&1 | tail -40`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/FocusedContextBuilder.ts __tests__/services/llm/FocusedContextBuilder.test.ts
git commit -m "feat(llm): add FocusedContextBuilder with intent-specific context formatters"
```

---

### Task 4: ResponseProcessor

**Files:**
- Create: `src/services/llm/ResponseProcessor.ts`
- Create: `__tests__/services/llm/ResponseProcessor.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/services/llm/ResponseProcessor.test.ts`:

```typescript
import { ResponseProcessor } from '@/services/llm/ResponseProcessor';
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    deviceId: 'device-001',
    timestamp: new Date().toISOString(),
    threatLevel: 'critical',
    detectionType: 'cellular',
    rssi: -52,
    macAddress: 'A4:CF:12:00:00:01',
    isReviewed: false,
    isFalsePositive: false,
  },
  {
    id: 'alert-2',
    deviceId: 'device-002',
    timestamp: new Date().toISOString(),
    threatLevel: 'low',
    detectionType: 'wifi',
    rssi: -75,
    macAddress: 'BB:22:33:44:55:66',
    isReviewed: true,
    isFalsePositive: false,
  },
];

const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-12-16T09:45:00Z',
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: false,
    batteryPercent: 12,
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-12-16T09:47:00Z',
  },
];

describe('ResponseProcessor', () => {
  describe('Stage 1: preamble/filler stripping', () => {
    it('strips "Based on the provided information" preamble', () => {
      const result = ResponseProcessor.process(
        "Based on the provided information, I've analyzed your alerts. You have 2 alerts.",
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).not.toMatch(/^Based on/i);
      expect(result).toContain('2 alerts');
    });

    it('strips "According to the system" preamble', () => {
      const result = ResponseProcessor.process(
        "According to the system's current data, there are 2 devices.",
        'device_query', {}, mockAlerts, mockDevices
      );
      expect(result).not.toMatch(/^According/i);
    });

    it('strips filler closings', () => {
      const result = ResponseProcessor.process(
        'You have 1 critical alert. Is there anything else you\'d like to know?',
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).not.toContain('anything else');
    });

    it('strips "taking necessary precautions" sentences', () => {
      const result = ResponseProcessor.process(
        'You have 1 critical alert. I recommend taking necessary precautions to ensure your safety.',
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).not.toContain('precautions');
    });

    it('strips "Considering the context of rural" sentences', () => {
      const result = ResponseProcessor.process(
        'You have 1 alert. Considering the context of rural properties, this is normal.',
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).not.toContain('rural');
    });

    it('trims to last complete sentence', () => {
      const result = ResponseProcessor.process(
        'You have 1 alert. The alert is critical. This means that the',
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).toMatch(/\.$/);
      expect(result).not.toContain('This means that the');
    });
  });

  describe('Stage 2: hallucination detection', () => {
    it('catches "device list is empty" when devices exist', () => {
      const result = ResponseProcessor.process(
        'Your device list appears to be empty.',
        'device_query', {}, mockAlerts, mockDevices
      );
      // Should be replaced with a data-driven fallback
      expect(result).toContain('North Gate Sensor');
      expect(result).toContain('South Boundary');
    });

    it('catches "no critical alerts" when critical alerts exist', () => {
      const result = ResponseProcessor.process(
        "You don't have any critical alerts.",
        'alert_query', { threatLevel: 'critical' }, mockAlerts, mockDevices
      );
      // Should be replaced with a fallback listing the critical alert
      expect(result).toContain('critical');
      expect(result).toContain('A4:CF:12:00:00:01');
    });

    it('catches "everything looks normal" when critical alerts exist', () => {
      const result = ResponseProcessor.process(
        'Everything looks normal on your property.',
        'status_overview', {}, mockAlerts, mockDevices
      );
      expect(result).toContain('critical');
    });

    it('does not flag valid responses', () => {
      const validResponse = 'You have 1 critical alert: cellular detection at North Gate Sensor.';
      const result = ResponseProcessor.process(
        validResponse,
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).toContain('1 critical alert');
    });
  });

  describe('Stage 3: length enforcement', () => {
    it('truncates responses over 150 words to last complete sentence', () => {
      const longResponse = Array(160).fill('word').join(' ') + '. Final sentence.';
      const result = ResponseProcessor.process(
        longResponse,
        'status_overview', {}, mockAlerts, mockDevices
      );
      const wordCount = result.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(155); // some tolerance for sentence boundary
    });

    it('does not truncate short responses', () => {
      const shortResponse = 'You have 1 critical alert.';
      const result = ResponseProcessor.process(
        shortResponse,
        'alert_query', {}, mockAlerts, mockDevices
      );
      expect(result).toBe(shortResponse);
    });
  });

  describe('empty response handling', () => {
    it('returns fallback for empty response', () => {
      const result = ResponseProcessor.process(
        '',
        'alert_query', { threatLevel: 'critical' }, mockAlerts, mockDevices
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('critical');
    });

    it('returns fallback for whitespace-only response', () => {
      const result = ResponseProcessor.process(
        '   \n  ',
        'device_query', {}, mockAlerts, mockDevices
      );
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/services/llm/ResponseProcessor.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `@/services/llm/ResponseProcessor`

- [ ] **Step 3: Implement ResponseProcessor**

Create `src/services/llm/ResponseProcessor.ts`:

```typescript
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';
import type { IntentFilters, IntentType } from '@/types/llm';

const PREAMBLE_PATTERNS = [
  /^based on the provided information,?\s*/i,
  /^based on the data,?\s*/i,
  /^based on your (security |current )?data,?\s*/i,
  /^according to the system'?s? current data,?\s*/i,
  /^i'?ve analyzed\s*/i,
  /^let me analyze\s*/i,
  /^looking at the data,?\s*/i,
  /^after reviewing (the|your) (data|alerts?|information),?\s*/i,
];

const FILLER_SENTENCE_PATTERNS = [
  /is there anything else you'?d? like to know\??/i,
  /feel free to ask if you have more questions\.?/i,
  /don'?t hesitate to ask\.?/i,
  /let me know if you (need|want|have).*\./i,
  /taking necessary precautions/i,
  /^considering the context of rural/i,
  /ensure your safety and the safety/i,
  /i'?m? here to help/i,
  /hope this helps/i,
];

const NEGATION_PATTERNS = [
  /\b(empty|no\s+\w+\s+found|none|zero|didn'?t have any|don'?t have any|appears to be empty)\b/i,
];

const NORMAL_PATTERNS = [
  /\beverything\s+(looks?|appears?|seems?)\s+normal\b/i,
  /\bno\s+(issues?|concerns?|problems?)\b/i,
  /\ball\s+(clear|good|fine)\b/i,
];

/**
 * 3-stage response post-processor.
 * Stage 1: Strip preamble and filler
 * Stage 2: Detect hallucinations by cross-referencing against actual data
 * Stage 3: Enforce length limits
 */
export class ResponseProcessor {
  private static readonly MAX_WORDS = 150;

  static process(
    response: string,
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): string {
    let result = response;

    // Handle empty/whitespace responses
    if (!result || !result.trim()) {
      return this.buildFallback(intent, filters, alerts, devices);
    }

    // Stage 1: Clean
    result = this.stripPreamble(result);
    result = this.stripFillerSentences(result);
    result = this.trimToLastCompleteSentence(result);

    // Handle if cleaning emptied the response
    if (!result.trim()) {
      return this.buildFallback(intent, filters, alerts, devices);
    }

    // Stage 2: Hallucination check
    if (this.detectHallucination(result, intent, filters, alerts, devices)) {
      return this.buildFallback(intent, filters, alerts, devices);
    }

    // Stage 3: Length enforcement
    result = this.enforceMaxLength(result);

    return result;
  }

  // --- Stage 1: Clean ---

  private static stripPreamble(text: string): string {
    let result = text.trim();
    for (const pattern of PREAMBLE_PATTERNS) {
      result = result.replace(pattern, '');
    }
    // Capitalize first letter after stripping
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result.trim();
  }

  private static stripFillerSentences(text: string): string {
    // Split into sentences, remove filler ones
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const filtered = sentences.filter(sentence => {
      const trimmed = sentence.trim();
      return !FILLER_SENTENCE_PATTERNS.some(pattern => pattern.test(trimmed));
    });
    return filtered.join(' ').trim();
  }

  private static trimToLastCompleteSentence(text: string): string {
    const trimmed = text.trim();
    // If it already ends with sentence-ending punctuation, return as-is
    if (/[.!?]$/.test(trimmed)) {
      return trimmed;
    }
    // Find the last sentence-ending punctuation
    const lastPunctuation = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('!'),
      trimmed.lastIndexOf('?')
    );
    if (lastPunctuation > 0) {
      return trimmed.substring(0, lastPunctuation + 1).trim();
    }
    // No complete sentence found — return as-is
    return trimmed;
  }

  // --- Stage 2: Hallucination Detection ---

  private static detectHallucination(
    response: string,
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): boolean {
    switch (intent) {
      case 'device_query':
        return this.detectDeviceHallucination(response, devices);
      case 'alert_query':
        return this.detectAlertHallucination(response, filters, alerts);
      case 'status_overview':
        return this.detectStatusHallucination(response, alerts);
      default:
        return false;
    }
  }

  private static detectDeviceHallucination(response: string, devices: Device[]): boolean {
    if (devices.length === 0) return false;
    // Model claims no devices when devices exist
    return NEGATION_PATTERNS.some(p => p.test(response));
  }

  private static detectAlertHallucination(
    response: string,
    filters: IntentFilters,
    alerts: Alert[]
  ): boolean {
    const filtered = filters.threatLevel
      ? alerts.filter(a => a.threatLevel === filters.threatLevel)
      : alerts;

    if (filtered.length === 0) return false;
    // Model claims no alerts when matching alerts exist
    return NEGATION_PATTERNS.some(p => p.test(response));
  }

  private static detectStatusHallucination(response: string, alerts: Alert[]): boolean {
    const hasCritical = alerts.some(a => a.threatLevel === 'critical' || a.threatLevel === 'high');
    if (!hasCritical) return false;
    // Model claims everything is normal when critical/high alerts exist
    return NORMAL_PATTERNS.some(p => p.test(response));
  }

  // --- Stage 3: Length Enforcement ---

  private static enforceMaxLength(text: string): string {
    const words = text.split(/\s+/);
    if (words.length <= this.MAX_WORDS) return text;

    // Take first MAX_WORDS words, then trim to last complete sentence
    const truncated = words.slice(0, this.MAX_WORDS).join(' ');
    return this.trimToLastCompleteSentence(truncated);
  }

  // --- Fallback Builders ---

  private static buildFallback(
    intent: IntentType,
    filters: IntentFilters,
    alerts: Alert[],
    devices: Device[]
  ): string {
    switch (intent) {
      case 'alert_query':
        return this.buildAlertFallback(alerts, filters);
      case 'device_query':
        return this.buildDeviceFallback(devices);
      case 'status_overview':
        return this.buildStatusFallback(alerts, devices);
      default:
        return this.buildGenericFallback(alerts, devices);
    }
  }

  private static buildAlertFallback(alerts: Alert[], filters: IntentFilters): string {
    const filtered = filters.threatLevel
      ? alerts.filter(a => a.threatLevel === filters.threatLevel)
      : alerts;

    if (filtered.length === 0) {
      const label = filters.threatLevel ? `${filters.threatLevel} ` : '';
      return `No ${label}alerts found.`;
    }

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const label = filters.threatLevel ?? 'total';
    const lines = sorted.slice(0, 5).map((a, i) => {
      const time = new Date(a.timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      });
      return `${i + 1}. ${a.detectionType} detection, ${time} — signal ${a.rssi} dBm, MAC ${a.macAddress}`;
    });

    return `${filtered.length} ${label} alerts. Most recent:\n${lines.join('\n')}`;
  }

  private static buildDeviceFallback(devices: Device[]): string {
    if (devices.length === 0) return 'No sensors registered.';

    const online = devices.filter(d => d.online);
    const offline = devices.filter(d => !d.online);

    const lines: string[] = [`${devices.length} sensors: ${online.length} online, ${offline.length} offline.`];

    if (offline.length > 0) {
      lines.push('Offline: ' + offline.map(d => `${d.name} (battery ${d.batteryPercent ?? 'N/A'}%)`).join(', '));
    }
    if (online.length > 0) {
      lines.push('Online: ' + online.map(d => d.name).join(', '));
    }

    return lines.join('\n');
  }

  private static buildStatusFallback(alerts: Alert[], devices: Device[]): string {
    const critical = alerts.filter(a => a.threatLevel === 'critical').length;
    const high = alerts.filter(a => a.threatLevel === 'high').length;
    const offline = devices.filter(d => !d.online);
    const unreviewed = alerts.filter(a => !a.isReviewed).length;

    const parts: string[] = [];

    if (critical > 0) parts.push(`${critical} critical alerts`);
    if (high > 0) parts.push(`${high} high alerts`);
    if (unreviewed > 0) parts.push(`${unreviewed} unreviewed`);
    if (offline.length > 0) {
      parts.push(`${offline.length} sensor${offline.length > 1 ? 's' : ''} offline (${offline.map(d => d.name).join(', ')})`);
    }

    if (parts.length === 0) {
      return `${alerts.length} total alerts, all ${devices.length} sensors online. No urgent issues.`;
    }

    return parts.join('. ') + `.`;
  }

  private static buildGenericFallback(alerts: Alert[], devices: Device[]): string {
    return `${alerts.length} alerts in system, ${devices.filter(d => d.online).length}/${devices.length} sensors online.`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/services/llm/ResponseProcessor.test.ts --verbose 2>&1 | tail -40`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/ResponseProcessor.ts __tests__/services/llm/ResponseProcessor.test.ts
git commit -m "feat(llm): add ResponseProcessor with preamble stripping, hallucination detection, and length enforcement"
```

---

### Task 5: Rewrite ConversationalTemplate

**Files:**
- Modify: `src/services/llm/templates/ConversationalTemplate.ts`

- [ ] **Step 1: Rewrite ConversationalTemplate**

Replace the entire contents of `src/services/llm/templates/ConversationalTemplate.ts`:

```typescript
import { PromptTemplate } from './PromptTemplate';
import type { ChatMessage, IntentType, Message as PromptMessage } from '@/types/llm';

/**
 * Intent-specific user prompt instruction suffixes.
 * Each tells the 1B model exactly how to format its output.
 */
const INTENT_INSTRUCTIONS: Record<IntentType, string> = {
  alert_query:
    'List each relevant alert with its threat level, detection type, sensor name, and time. Then give one sentence of analysis.',
  device_query:
    'List each device with its status. Mention offline devices first. State battery levels and last seen times.',
  status_overview:
    'Start with the most urgent issue. Then summarize alert counts and device health. Keep it brief.',
  pattern_query:
    'Describe the pattern you see in the data. Mention specific MAC addresses, times, and frequencies. Flag anything unusual.',
  time_query:
    'Answer using specific hours and counts from the data.',
  help:
    'Answer briefly. If the question is about security data, say what specific question to ask.',
};

const SYSTEM_PROMPT = `You are TrailSense AI. You answer questions about property security sensor data.

RULES:
1. ONLY state facts from the DATA section below. Never guess or add information.
2. If data is missing, say "I don't have that data" — do not fill in gaps.
3. Start with the direct answer. No preamble like "Based on the provided information".
4. Reference specific names, numbers, and times from the data.
5. Keep your answer under 100 words.`;

/**
 * Conversational Template — Intent-Aware
 *
 * Builds prompts using a short system prompt, focused context data from
 * FocusedContextBuilder, and intent-specific output instructions.
 */
export class ConversationalTemplate extends PromptTemplate {
  constructor() {
    super(SYSTEM_PROMPT);
  }

  /**
   * Build prompt messages for the LLM.
   * Called by LLMService.chat() after intent classification and context building.
   */
  buildPrompt(context: {
    messages: ChatMessage[];
    intent: IntentType;
    focusedContext: string;
  }): PromptMessage[] {
    const { messages, intent, focusedContext } = context;
    const conversationHistory = this.formatConversationHistory(messages);
    const instruction = INTENT_INSTRUCTIONS[intent];

    const userPrompt = `${conversationHistory}

DATA:
${focusedContext}

QUESTION: ${messages[messages.length - 1]?.content ?? ''}

${instruction}`;

    return this.buildFullPrompt(userPrompt);
  }

  private formatConversationHistory(messages: ChatMessage[]): string {
    // Keep last 4 messages (leaving room for current message)
    const recent = messages.slice(-5, -1);

    if (recent.length === 0) {
      return '';
    }

    const formatted = recent
      .map(m => {
        const role = m.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${m.content}`;
      })
      .join('\n');

    return `CONVERSATION:\n${formatted}\n`;
  }
}
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors from this file (there may be errors in LLMService.ts since it still calls the old signature — that's fixed in Task 6)

- [ ] **Step 3: Commit**

```bash
git add src/services/llm/templates/ConversationalTemplate.ts
git commit -m "refactor(llm): rewrite ConversationalTemplate with intent-aware prompts and shorter system prompt"
```

---

### Task 6: Rewrite LLMService.chat()

**Files:**
- Modify: `src/services/llm/LLMService.ts`

- [ ] **Step 1: Update imports and chat method**

In `src/services/llm/LLMService.ts`, add imports at the top:

```typescript
import { IntentClassifier } from './IntentClassifier';
import { FocusedContextBuilder } from './FocusedContextBuilder';
import { ResponseProcessor } from './ResponseProcessor';
```

Also update the type imports — add `ChatContext` and remove `ConversationContext`:

```typescript
import {
  LLMRequest,
  LLMResponse,
  AlertSummary,
  PatternAnalysis,
  ChatResponse,
  AlertContext,
  DeviceContext,
  ChatContext,
} from '@/types/llm';
```

- [ ] **Step 2: Replace the chat() method**

Replace the existing `chat()` method in `LLMService`:

```typescript
  /**
   * Handle conversational query with intent-aware pipeline
   */
  async chat(context: ChatContext): Promise<ChatResponse> {
    try {
      const { messages, rawAlerts, rawDevices } = context;
      const userMessage = messages[messages.length - 1]?.content ?? '';

      llmLogger.info('Processing chat message', {
        messageCount: messages.length,
        userMessage: userMessage.substring(0, 50),
      });

      // 1. Classify intent
      const { intent, filters } = IntentClassifier.classify(userMessage, rawDevices);

      llmLogger.debug('Intent classified', { intent, filters });

      // 2. Build focused context
      const focusedContext = FocusedContextBuilder.build(
        intent,
        filters,
        rawAlerts,
        rawDevices
      );

      // 3. Build prompt with intent-specific template
      const promptMessages = this.conversationalTemplate.buildPrompt({
        messages,
        intent,
        focusedContext,
      });

      // 4. Generate
      const response = await this.generate({
        messages: promptMessages,
        options: {
          maxTokens: LLM_CONFIG.CONVERSATIONAL.MAX_TOKENS,
          temperature: LLM_CONFIG.CONVERSATIONAL.TEMPERATURE,
        },
      });

      // 5. Post-process
      const processed = ResponseProcessor.process(
        response.text,
        intent,
        filters,
        rawAlerts,
        rawDevices
      );

      return {
        message: processed,
        confidence: 0.8,
        intent,
      };
    } catch (error) {
      llmLogger.error('Failed to process chat message', error);
      throw error;
    }
  }
```

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: May show errors in `AIAssistantScreen.tsx` (still passing old `ConversationContext`) — fixed in Task 7

- [ ] **Step 4: Commit**

```bash
git add src/services/llm/LLMService.ts
git commit -m "refactor(llm): rewrite chat() to use intent-aware pipeline with classification, focused context, and post-processing"
```

---

### Task 7: Update AIAssistantScreen

**Files:**
- Modify: `src/screens/ai/AIAssistantScreen.tsx`

- [ ] **Step 1: Add useAlerts and useDevices imports**

At the top of the file, add:

```typescript
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
```

- [ ] **Step 2: Add data hooks and update handleSendMessage**

Inside the `AIAssistantScreen` component, after the existing `useSecurityContext()` call, add the raw data hooks:

```typescript
  // Raw data for LLM pipeline (intent-aware context building)
  const { data: alerts = [] } = useAlerts({});
  const { data: devices = [] } = useDevices();
```

Then update the `handleSendMessage` function. Replace the `llmService.chat()` call inside the try block:

```typescript
        const chatResponse = await llmService.chat({
          messages: [...messages.filter(m => m.role !== 'system'), userMessage],
          rawAlerts: alerts,
          rawDevices: devices,
        });
```

This replaces the old call that passed `securityContext: { recentAlerts, deviceStatus, contextString }`.

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to the chat call

- [ ] **Step 4: Commit**

```bash
git add src/screens/ai/AIAssistantScreen.tsx
git commit -m "refactor(llm): pass raw alerts/devices to chat pipeline instead of pre-built context"
```

---

### Task 8: Update Exports

**Files:**
- Modify: `src/services/llm/index.ts`

- [ ] **Step 1: Add new module exports**

Add the following exports to `src/services/llm/index.ts`:

```typescript
// Intent-Aware Pipeline
export { IntentClassifier } from './IntentClassifier';
export { FocusedContextBuilder } from './FocusedContextBuilder';
export { ResponseProcessor } from './ResponseProcessor';
```

Also add the new types to the re-export block:

```typescript
export type {
  // ...existing exports...
  ChatContext,
  ClassifiedIntent,
  IntentFilters,
  IntentType,
} from '@/types/llm';
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/services/llm/index.ts
git commit -m "chore(llm): export IntentClassifier, FocusedContextBuilder, ResponseProcessor"
```

---

### Task 9: Fix Existing mockModeFlow Test

The existing `mockModeFlow.test.tsx` calls `llmService.chat()` with the old `ConversationContext` shape (`securityContext: { recentAlerts, deviceStatus }`). It needs to be updated to the new `ChatContext` shape (`rawAlerts, rawDevices`). The test also asserts that the raw mock response is returned verbatim, but now `ResponseProcessor` will clean/transform the response, so the assertion needs to account for post-processing.

**Files:**
- Modify: `__tests__/services/llm/mockModeFlow.test.tsx`

- [ ] **Step 1: Update the chat call and assertion**

In `__tests__/services/llm/mockModeFlow.test.tsx`, find the test `'uses mock inference for chat without loading the native model'` and replace the `llmService.chat()` call and assertion:

```typescript
    const response = await llmService.chat({
      messages: [
        {
          role: 'user',
          content: 'What happened overnight?',
          timestamp: Date.now(),
        },
      ],
      rawAlerts: [],
      rawDevices: [],
    });

    // ResponseProcessor may transform the mock response, but we should
    // still get a non-empty response and the inference engine should be called
    expect(response.message.length).toBeGreaterThan(0);
    expect(loadModelSpy).not.toHaveBeenCalled();
    expect(inferenceSpy).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npx jest __tests__/services/llm/mockModeFlow.test.tsx --verbose 2>&1 | tail -15`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/services/llm/mockModeFlow.test.tsx
git commit -m "test(llm): update mockModeFlow test for new ChatContext shape"
```

---

### Task 10: Run Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run all LLM tests**

Run: `npx jest __tests__/services/llm/ --verbose 2>&1 | tail -40`
Expected: All 5 test files pass (IntentClassifier, FocusedContextBuilder, ResponseProcessor, mockModeFlow, modelManagerLoad)

- [ ] **Step 2: Run type-check on full project**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: No new type errors

- [ ] **Step 3: Run linter**

Run: `npm run lint:fix 2>&1 | tail -10`
Expected: No new lint errors (auto-fixes applied)

- [ ] **Step 4: Run formatter**

Run: `npm run format 2>&1 | tail -5`
Expected: Files formatted

- [ ] **Step 5: Final commit if lint/format changed anything**

```bash
git add -A
git status
# Only commit if there are changes
git diff --cached --quiet || git commit -m "chore: lint and format intent-aware pipeline"
```
