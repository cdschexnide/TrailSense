# Mock Data Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all mock/demo mode data with current backend API contracts so demo mode accurately represents real data shapes.

**Architecture:** Create shared helper modules for fingerprint formatting and dynamic timestamps, then update all mock data files, the mock WebSocket service, seed utility, and relevant types to use them. Factory functions replace static arrays where dynamic timestamps are needed.

**Tech Stack:** TypeScript, React Native, Jest

**Spec:** `docs/superpowers/specs/2026-04-05-mock-data-contract-alignment-design.md`

---

### Task 1: Shared Timestamp Helpers

**Files:**

- Create: `src/mocks/helpers/timestamps.ts`
- Create: `__tests__/mocks/helpers/timestamps.test.ts`

- [ ] **Step 1: Write failing tests for timestamp helpers**

```typescript
// __tests__/mocks/helpers/timestamps.test.ts
import {
  now,
  minutesAgo,
  hoursAgo,
  daysAgo,
  todayAt,
} from '@/mocks/helpers/timestamps';

describe('timestamp helpers', () => {
  it('now() returns current ISO string', () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();
    const ts = new Date(result).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('minutesAgo(5) returns a time ~5 minutes in the past', () => {
    const result = minutesAgo(5);
    const diff = Date.now() - new Date(result).getTime();
    // Allow 1 second tolerance
    expect(diff).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
  });

  it('hoursAgo(2) returns a time ~2 hours in the past', () => {
    const result = hoursAgo(2);
    const diff = Date.now() - new Date(result).getTime();
    expect(diff).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(2 * 60 * 60 * 1000 + 1000);
  });

  it('daysAgo(3) returns a time ~3 days in the past', () => {
    const result = daysAgo(3);
    const diff = Date.now() - new Date(result).getTime();
    expect(diff).toBeGreaterThanOrEqual(3 * 24 * 60 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(3 * 24 * 60 * 60 * 1000 + 1000);
  });

  it('todayAt(10, 30) returns today at 10:30', () => {
    const result = todayAt(10, 30);
    const date = new Date(result);
    const today = new Date();
    expect(date.getFullYear()).toBe(today.getFullYear());
    expect(date.getMonth()).toBe(today.getMonth());
    expect(date.getDate()).toBe(today.getDate());
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(30);
  });

  it('all helpers return valid ISO 8601 strings', () => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    expect(now()).toMatch(isoRegex);
    expect(minutesAgo(1)).toMatch(isoRegex);
    expect(hoursAgo(1)).toMatch(isoRegex);
    expect(daysAgo(1)).toMatch(isoRegex);
    expect(todayAt(12, 0)).toMatch(isoRegex);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/mocks/helpers/timestamps.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement timestamp helpers**

```typescript
// src/mocks/helpers/timestamps.ts

/** Returns current time as ISO 8601 string. */
export function now(): string {
  return new Date().toISOString();
}

/** Returns ISO string for `n` minutes before now. */
export function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

/** Returns ISO string for `n` hours before now. */
export function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

/** Returns ISO string for `n` days before now. */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Returns ISO string for today at the given hour and minute (local time). */
export function todayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/helpers/timestamps.test.ts --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/mocks/helpers/timestamps.ts __tests__/mocks/helpers/timestamps.test.ts
git commit -m "feat: add dynamic timestamp helpers for mock data"
```

---

### Task 2: Shared Fingerprint Helpers

**Files:**

- Create: `src/mocks/helpers/fingerprints.ts`
- Create: `__tests__/mocks/helpers/fingerprints.test.ts`

- [ ] **Step 1: Write failing tests for fingerprint helpers**

```typescript
// __tests__/mocks/helpers/fingerprints.test.ts
import {
  wifiFingerprint,
  bleFingerprint,
  cellularFingerprint,
  randomFingerprint,
  fingerprintForType,
  PERSONA_FINGERPRINTS,
  FINGERPRINT_PREFIX,
} from '@/mocks/helpers/fingerprints';

describe('fingerprint helpers', () => {
  it('wifiFingerprint prepends w_ prefix', () => {
    expect(wifiFingerprint('3a7fb2e1')).toBe('w_3a7fb2e1');
  });

  it('bleFingerprint prepends b_ prefix', () => {
    expect(bleFingerprint('e50201')).toBe('b_e50201');
  });

  it('cellularFingerprint prepends c_ prefix', () => {
    expect(cellularFingerprint('0003')).toBe('c_0003');
  });

  it('fingerprintForType applies correct prefix', () => {
    expect(fingerprintForType('wifi', 'abc123')).toBe('w_abc123');
    expect(fingerprintForType('bluetooth', 'abc123')).toBe('b_abc123');
    expect(fingerprintForType('cellular', 'abc123')).toBe('c_abc123');
  });

  it('randomFingerprint generates correct prefix', () => {
    expect(randomFingerprint('wifi')).toMatch(/^w_[a-f0-9]{8}$/);
    expect(randomFingerprint('bluetooth')).toMatch(/^b_[a-f0-9]{8}$/);
    expect(randomFingerprint('cellular')).toMatch(/^c_[a-f0-9]{8}$/);
  });

  it('randomFingerprint generates unique values', () => {
    const a = randomFingerprint('wifi');
    const b = randomFingerprint('wifi');
    expect(a).not.toBe(b);
  });

  it('PERSONA_FINGERPRINTS use correct backend format', () => {
    expect(PERSONA_FINGERPRINTS.delivery).toBe('c_a1b2c3');
    expect(PERSONA_FINGERPRINTS.visitor).toBe('w_d4e5f6');
    expect(PERSONA_FINGERPRINTS.loiterer).toBe('b_a7b8c9');
    expect(PERSONA_FINGERPRINTS.vehicle).toBe('c_d0e1f2');
  });

  it('FINGERPRINT_PREFIX maps detection types to prefixes', () => {
    expect(FINGERPRINT_PREFIX.wifi).toBe('w_');
    expect(FINGERPRINT_PREFIX.bluetooth).toBe('b_');
    expect(FINGERPRINT_PREFIX.cellular).toBe('c_');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/mocks/helpers/fingerprints.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement fingerprint helpers**

```typescript
// src/mocks/helpers/fingerprints.ts
import type { DetectionType } from '@/types/alert';

/** Prefix mapping from detection type to backend fingerprint prefix. */
export const FINGERPRINT_PREFIX: Record<DetectionType, string> = {
  wifi: 'w_',
  bluetooth: 'b_',
  cellular: 'c_',
};

/** Shared persona fingerprints in backend format. */
export const PERSONA_FINGERPRINTS = {
  delivery: 'c_a1b2c3', // cellular
  visitor: 'w_d4e5f6', // wifi
  loiterer: 'b_a7b8c9', // bluetooth
  vehicle: 'c_d0e1f2', // cellular
} as const;

/** Persona metadata: maps persona key to signal type. */
export const PERSONA_SIGNAL_TYPES: Record<
  keyof typeof PERSONA_FINGERPRINTS,
  DetectionType
> = {
  delivery: 'cellular',
  visitor: 'wifi',
  loiterer: 'bluetooth',
  vehicle: 'cellular',
};

export function wifiFingerprint(hash: string): string {
  return `w_${hash}`;
}

export function bleFingerprint(hash: string): string {
  return `b_${hash}`;
}

export function cellularFingerprint(hash: string): string {
  return `c_${hash}`;
}

/** Apply the correct prefix for a given detection type. */
export function fingerprintForType(type: DetectionType, hash: string): string {
  return `${FINGERPRINT_PREFIX[type]}${hash}`;
}

/** Generate a random 8-char hex hash with the correct prefix. */
export function randomFingerprint(type: DetectionType): string {
  const hash = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${FINGERPRINT_PREFIX[type]}${hash}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/helpers/fingerprints.test.ts --no-coverage`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/mocks/helpers/fingerprints.ts __tests__/mocks/helpers/fingerprints.test.ts
git commit -m "feat: add backend-format fingerprint helpers for mock data"
```

---

### Task 3: Update Type Definitions

**Files:**

- Modify: `src/types/auth.ts:1-15`
- Modify: `src/types/alert.ts:8-26`

- [ ] **Step 1: Make `role` optional, add `updatedAt`, and make `expiresIn` optional in auth types**

In `src/types/auth.ts`, change:

```typescript
// Line 6: make role optional
role: 'admin' | 'user';
```

to:

```typescript
role?: 'admin' | 'user';
```

And after `lastLogin?: string;` (line 8), add:

```typescript
updatedAt?: string;
```

And change:

```typescript
// Line 14: make expiresIn optional
expiresIn: number;
```

to:

```typescript
expiresIn?: number;
```

- [ ] **Step 2: Add presenceCertainty and proximity to AlertMetadata**

In `src/types/alert.ts`, after the `triangulatedPosition` block (line 25), add two new fields inside the `AlertMetadata` interface. Change:

```typescript
  // Triangulation-specific fields
  triangulatedPosition?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    confidence: number;
  };
```

to:

```typescript
  // Triangulation-specific fields
  presenceCertainty?: number;
  proximity?: number;
  triangulatedPosition?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    confidence: number;
  };
```

- [ ] **Step 3: Add optional createdAt to Alert interface**

In `src/types/alert.ts`, add `createdAt` to the `Alert` interface (after `metadata`, around line 43). Change:

```typescript
  metadata?: AlertMetadata;
}
```

to:

```typescript
  metadata?: AlertMetadata;
  createdAt?: string;
}
```

- [ ] **Step 4: Add BackendDeviceFingerprint type**

In `src/types/alert.ts`, after the existing `DeviceFingerprint` interface (after line 115), add the new backend API response type. Do NOT modify the existing `DeviceFingerprint` — it's used by `src/services/deviceFingerprinting.ts`:

```typescript
/**
 * Backend API response shape from GET /analytics/devices/:fingerprintHash.
 * Separate from DeviceFingerprint which is the app-internal domain model
 * used by src/services/deviceFingerprinting.ts.
 */
export interface BackendDeviceFingerprint {
  id: string;
  fingerprintHash: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalSamples: number;
  totalAlerts: number;
  commonHours: number[];
  category: string;
}
```

- [ ] **Step 5: Run type check**

Run: `npm run type-check`
Expected: No new errors (all new fields are optional, new type is additive)

- [ ] **Step 6: Commit**

```bash
git add src/types/auth.ts src/types/alert.ts
git commit -m "feat: align auth and alert types with backend contracts"
```

---

### Task 4: Update Mock Devices to Use Dynamic Timestamps

**Files:**

- Modify: `src/mocks/data/mockDevices.ts`

- [ ] **Step 1: Write failing test for dynamic device timestamps**

```typescript
// __tests__/mocks/data/mockDevices.test.ts
import { getMockDevices } from '@/mocks/data/mockDevices';

describe('getMockDevices', () => {
  it('returns 5 devices', () => {
    expect(getMockDevices()).toHaveLength(5);
  });

  it('online devices have lastSeen within 5 minutes of now', () => {
    const devices = getMockDevices();
    const onlineDevices = devices.filter(d => d.online);
    const fiveMinutesMs = 5 * 60 * 1000;

    onlineDevices.forEach(device => {
      const diff = Date.now() - new Date(device.lastSeen!).getTime();
      expect(diff).toBeLessThan(fiveMinutesMs);
      expect(diff).toBeGreaterThanOrEqual(0);
    });
  });

  it('offline devices have lastSeen more than 1 day ago', () => {
    const devices = getMockDevices();
    const offlineDevices = devices.filter(d => !d.online);
    const oneDayMs = 24 * 60 * 60 * 1000;

    offlineDevices.forEach(device => {
      const diff = Date.now() - new Date(device.lastSeen!).getTime();
      expect(diff).toBeGreaterThan(oneDayMs);
    });
  });

  it('no device has signalStrength "offline"', () => {
    const devices = getMockDevices();
    devices.forEach(device => {
      expect(device.signalStrength).not.toBe('offline');
    });
  });

  it('all devices have metadata field (null)', () => {
    const devices = getMockDevices();
    devices.forEach(device => {
      expect(device).toHaveProperty('metadata');
    });
  });

  it('generates fresh timestamps on each call', () => {
    const a = getMockDevices()[0].lastSeen;
    // Small delay to ensure different timestamp
    const b = getMockDevices()[0].lastSeen;
    // Both should be recent, within seconds of each other
    const diffA = Date.now() - new Date(a!).getTime();
    expect(diffA).toBeLessThan(10000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mocks/data/mockDevices.test.ts --no-coverage`
Expected: FAIL — `getMockDevices` is not exported

- [ ] **Step 3: Rewrite mockDevices.ts with factory function and dynamic timestamps**

Replace the entire file `src/mocks/data/mockDevices.ts`:

```typescript
import type { Device } from '@/types/device';
import { minutesAgo, hoursAgo, daysAgo } from '../helpers/timestamps';

// Mock devices located in Southeast Texas area
// Center coordinates: 30.396526, -94.317806

/** Factory function that generates devices with fresh timestamps. */
export function getMockDevices(): (Device & { metadata: null })[] {
  return [
    {
      id: 'device-001',
      name: 'North Gate Sensor',
      online: true,
      batteryPercent: 87,
      signalStrength: 'excellent',
      alertCount: 142,
      latitude: 30.396526,
      longitude: -94.317806,
      lastSeen: minutesAgo(1),
      firmwareVersion: 'v2.1.3',
      uptimeSeconds: 88200,
      lastBootAt: hoursAgo(Math.round(88200 / 3600)),
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: minutesAgo(1),
      metadata: null,
    },
    {
      id: 'device-002',
      name: 'South Boundary',
      online: true,
      batteryPercent: 92,
      signalStrength: 'good',
      alertCount: 87,
      latitude: 30.3943,
      longitude: -94.3191,
      lastSeen: minutesAgo(2),
      firmwareVersion: 'v2.1.3',
      uptimeSeconds: 259200,
      lastBootAt: hoursAgo(Math.round(259200 / 3600)),
      createdAt: '2025-01-10T08:15:00Z',
      updatedAt: minutesAgo(2),
      metadata: null,
    },
    {
      id: 'device-003',
      name: 'East Trail Monitor',
      online: true,
      batteryPercent: 65,
      signalStrength: 'fair',
      alertCount: 213,
      latitude: 30.397,
      longitude: -94.3155,
      lastSeen: minutesAgo(3),
      firmwareVersion: 'v2.1.2',
      uptimeSeconds: 43500,
      lastBootAt: hoursAgo(Math.round(43500 / 3600)),
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: minutesAgo(3),
      metadata: null,
    },
    {
      id: 'device-004',
      name: 'West Perimeter',
      online: false,
      batteryPercent: 12,
      signalStrength: 'poor',
      alertCount: 45,
      latitude: 30.3958,
      longitude: -94.3205,
      lastSeen: daysAgo(2),
      firmwareVersion: 'v2.0.9',
      createdAt: '2025-02-01T12:00:00Z',
      updatedAt: daysAgo(2),
      metadata: null,
    },
    {
      id: 'device-005',
      name: 'Cabin Approach',
      online: false,
      batteryPercent: 0,
      signalStrength: 'poor',
      alertCount: 156,
      latitude: 30.3988,
      longitude: -94.3162,
      lastSeen: daysAgo(5),
      firmwareVersion: 'v2.1.1',
      createdAt: '2025-01-20T14:00:00Z',
      updatedAt: daysAgo(5),
      metadata: null,
    },
  ];
}

/**
 * Static snapshot for backward compatibility with imports that expect
 * a plain array. Prefer getMockDevices() for fresh timestamps.
 */
export const mockDevices: Device[] = getMockDevices();

export const mockOnlineDevices = mockDevices.filter(d => d.online);
export const mockOfflineDevices = mockDevices.filter(d => !d.online);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/data/mockDevices.test.ts --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 5: Run type check to verify no breakage**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add src/mocks/data/mockDevices.ts __tests__/mocks/data/mockDevices.test.ts
git commit -m "feat: dynamic timestamps and contract-aligned fields in mock devices"
```

---

### Task 5: Update Mock Alerts — Fingerprints, Timestamps, Metadata

**Files:**

- Modify: `src/mocks/data/mockAlerts.ts`

- [ ] **Step 1: Write failing test for alert contract alignment**

```typescript
// __tests__/mocks/data/mockAlerts.test.ts
import { getMockAlerts, PERSONA_FINGERPRINTS } from '@/mocks/data/mockAlerts';

const FINGERPRINT_REGEX = /^[wcb]_[a-f0-9]+$/;

describe('getMockAlerts', () => {
  const alerts = getMockAlerts();

  it('returns 55 alerts', () => {
    expect(alerts).toHaveLength(55);
  });

  it('all fingerprints use backend w_/b_/c_ format', () => {
    alerts.forEach(alert => {
      expect(alert.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });

  it('fingerprint prefix matches detectionType', () => {
    const prefixMap = { wifi: 'w_', bluetooth: 'b_', cellular: 'c_' };
    alerts.forEach(alert => {
      const expectedPrefix = prefixMap[alert.detectionType];
      expect(alert.fingerprintHash.startsWith(expectedPrefix)).toBe(true);
    });
  });

  it('all alerts have createdAt field', () => {
    alerts.forEach(alert => {
      expect(alert).toHaveProperty('createdAt');
      expect(new Date(alert.createdAt!).getTime()).not.toBeNaN();
    });
  });

  it('all alerts have timestamps within the last 7 days', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000 + 60000; // small buffer
    alerts.forEach(alert => {
      const diff = Date.now() - new Date(alert.timestamp).getTime();
      expect(diff).toBeLessThan(sevenDaysMs);
      expect(diff).toBeGreaterThanOrEqual(0);
    });
  });

  it('metadata includes presenceCertainty and proximity', () => {
    const alertsWithMeta = alerts.filter(a => a.metadata);
    expect(alertsWithMeta.length).toBeGreaterThan(0);
    alertsWithMeta.forEach(alert => {
      expect(alert.metadata).toHaveProperty('presenceCertainty');
      expect(alert.metadata).toHaveProperty('proximity');
      expect(typeof alert.metadata!.presenceCertainty).toBe('number');
      expect(typeof alert.metadata!.proximity).toBe('number');
    });
  });

  it('metadata includes triangulatedPosition', () => {
    const alertsWithMeta = alerts.filter(a => a.metadata?.triangulatedPosition);
    expect(alertsWithMeta.length).toBeGreaterThan(0);
    alertsWithMeta.forEach(alert => {
      const tp = alert.metadata!.triangulatedPosition!;
      expect(tp).toHaveProperty('latitude');
      expect(tp).toHaveProperty('longitude');
      expect(tp).toHaveProperty('accuracyMeters');
      expect(tp).toHaveProperty('confidence');
    });
  });

  it('PERSONA_FINGERPRINTS use backend format', () => {
    PERSONA_FINGERPRINTS.forEach(p => {
      expect(p.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mocks/data/mockAlerts.test.ts --no-coverage`
Expected: FAIL — `getMockAlerts` not exported, fingerprint format mismatch

- [ ] **Step 3: Rewrite mockAlerts.ts**

Replace the entire file `src/mocks/data/mockAlerts.ts`:

```typescript
import type {
  Alert,
  AlertMetadata,
  DetectionType,
  ThreatLevel,
} from '@/types/alert';
import {
  fingerprintForType,
  randomFingerprint,
  PERSONA_FINGERPRINTS as PERSONAS,
} from '../helpers/fingerprints';
import { hoursAgo, daysAgo } from '../helpers/timestamps';
import { getMockDevices } from './mockDevices';

/**
 * Generate presenceCertainty/proximity values consistent with a threat level.
 * Follows the backend's 4x4 threat matrix ranges.
 */
function metricsForThreat(threatLevel: ThreatLevel): {
  presenceCertainty: number;
  proximity: number;
} {
  const ranges: Record<ThreatLevel, [number, number]> = {
    critical: [70, 95],
    high: [50, 80],
    medium: [30, 60],
    low: [10, 35],
  };
  const [min, max] = ranges[threatLevel];
  const rand = (lo: number, hi: number) =>
    Math.floor(Math.random() * (hi - lo + 1)) + lo;
  return {
    presenceCertainty: rand(min, max),
    proximity: rand(min, max),
  };
}

const generateLocation = (deviceId: string, variance: number = 0.0005) => {
  const devices = getMockDevices();
  const device = devices.find(d => d.id === deviceId);
  if (
    !device ||
    device.latitude === undefined ||
    device.longitude === undefined
  ) {
    return undefined;
  }

  return {
    latitude: device.latitude + (Math.random() - 0.5) * variance,
    longitude: device.longitude + (Math.random() - 0.5) * variance,
  };
};

const metadataFor = (
  deviceId: string,
  threatLevel: ThreatLevel,
  accuracyMeters: number,
  signalCount: number,
  measurementCount: number
): AlertMetadata => {
  const metrics = metricsForThreat(threatLevel);
  const location = generateLocation(deviceId) ?? {
    latitude: 30.396526,
    longitude: -94.317806,
  };

  return {
    source: 'positions',
    signalCount,
    windowDuration: signalCount * 30,
    measurementCount,
    distance: accuracyMeters,
    presenceCertainty: metrics.presenceCertainty,
    proximity: metrics.proximity,
    triangulatedPosition: {
      ...location,
      accuracyMeters,
      confidence: Math.min(99, 55 + measurementCount * 5),
    },
  };
};

const createAlert = ({
  id,
  deviceId,
  timestamp,
  threatLevel,
  detectionType,
  fingerprintHash,
  confidence,
  accuracyMeters,
  isReviewed,
  isFalsePositive,
  signalCount = 1,
  measurementCount = 3,
}: {
  id: string;
  deviceId: string;
  timestamp: string;
  threatLevel: ThreatLevel;
  detectionType: DetectionType;
  fingerprintHash: string;
  confidence: number;
  accuracyMeters: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  signalCount?: number;
  measurementCount?: number;
}): Alert & { createdAt: string } => ({
  id,
  deviceId,
  timestamp,
  threatLevel,
  detectionType,
  fingerprintHash,
  confidence,
  accuracyMeters,
  isReviewed,
  isFalsePositive,
  location: generateLocation(deviceId),
  metadata: metadataFor(
    deviceId,
    threatLevel,
    accuracyMeters,
    signalCount,
    measurementCount
  ),
  createdAt: timestamp,
});

/** Factory: generates alerts with fresh dynamic timestamps. */
export function getMockAlerts(): (Alert & { createdAt: string })[] {
  const devices = getMockDevices();

  const seededAlerts = [
    createAlert({
      id: 'alert-001',
      deviceId: 'device-001',
      timestamp: hoursAgo(1),
      threatLevel: 'critical',
      detectionType: 'cellular',
      fingerprintHash: PERSONAS.loiterer,
      confidence: 94,
      accuracyMeters: 4.2,
      isReviewed: false,
      isFalsePositive: false,
      signalCount: 6,
      measurementCount: 8,
    }),
    createAlert({
      id: 'alert-002',
      deviceId: 'device-003',
      timestamp: hoursAgo(3),
      threatLevel: 'critical',
      detectionType: 'cellular',
      fingerprintHash: fingerprintForType('cellular', '2201a4f8'),
      confidence: 89,
      accuracyMeters: 7.5,
      isReviewed: false,
      isFalsePositive: false,
      signalCount: 5,
      measurementCount: 6,
    }),
    createAlert({
      id: 'alert-003',
      deviceId: 'device-001',
      timestamp: hoursAgo(6),
      threatLevel: 'high',
      detectionType: 'wifi',
      fingerprintHash: PERSONAS.visitor,
      confidence: 84,
      accuracyMeters: 14.4,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-004',
      deviceId: 'device-002',
      timestamp: hoursAgo(24),
      threatLevel: 'high',
      detectionType: 'wifi',
      fingerprintHash: PERSONAS.visitor,
      confidence: 78,
      accuracyMeters: 18.2,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-005',
      deviceId: 'device-003',
      timestamp: hoursAgo(36),
      threatLevel: 'high',
      detectionType: 'cellular',
      fingerprintHash: PERSONAS.vehicle,
      confidence: 82,
      accuracyMeters: 12.8,
      isReviewed: false,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-006',
      deviceId: 'device-001',
      timestamp: hoursAgo(40),
      threatLevel: 'medium',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '44210bee'),
      confidence: 71,
      accuracyMeters: 24.6,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-007',
      deviceId: 'device-002',
      timestamp: hoursAgo(48),
      threatLevel: 'medium',
      detectionType: 'bluetooth',
      fingerprintHash: fingerprintForType('bluetooth', '1188cd3a'),
      confidence: 67,
      accuracyMeters: 32.1,
      isReviewed: true,
      isFalsePositive: true,
    }),
    createAlert({
      id: 'alert-008',
      deviceId: 'device-001',
      timestamp: hoursAgo(48),
      threatLevel: 'medium',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '3310ef92'),
      confidence: 74,
      accuracyMeters: 21.4,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-009',
      deviceId: 'device-003',
      timestamp: hoursAgo(72),
      threatLevel: 'low',
      detectionType: 'bluetooth',
      fingerprintHash: fingerprintForType('bluetooth', '7720ab5f'),
      confidence: 58,
      accuracyMeters: 47.2,
      isReviewed: true,
      isFalsePositive: true,
    }),
    createAlert({
      id: 'alert-010',
      deviceId: 'device-002',
      timestamp: hoursAgo(72),
      threatLevel: 'low',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '5590dde1'),
      confidence: 61,
      accuracyMeters: 55.4,
      isReviewed: true,
      isFalsePositive: false,
    }),
  ];

  const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
  const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];
  const deviceIds = devices.filter(d => d.online).map(d => d.id);

  const generatedAlerts = Array.from({ length: 45 }, (_, i) => {
    const index = i + 11;
    const detectionType = detectionTypes[index % detectionTypes.length];
    const deviceId = deviceIds[index % deviceIds.length];
    const confidence = Math.min(99, 55 + (index % 40));
    const accuracyMeters = 6 + (index % 55);

    // Spread generated alerts across the last 7 days
    const totalHoursAgo = Math.floor((index / 55) * 7 * 24);

    return createAlert({
      id: `alert-${String(index).padStart(3, '0')}`,
      deviceId,
      timestamp: hoursAgo(totalHoursAgo),
      threatLevel: threatLevels[index % threatLevels.length],
      detectionType,
      fingerprintHash: fingerprintForType(
        detectionType,
        index.toString(16).padStart(4, '0') + 'ff'
      ),
      confidence,
      accuracyMeters,
      isReviewed: index % 5 !== 0,
      isFalsePositive: index % 7 === 0,
      signalCount: 1 + (index % 6),
      measurementCount: 3 + (index % 5),
    });
  });

  return [...seededAlerts, ...generatedAlerts].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}

export const mockAlerts: (Alert & { createdAt: string })[] = getMockAlerts();

export const mockUnreviewedAlerts = mockAlerts.filter(a => !a.isReviewed);
export const mockCriticalAlerts = mockAlerts.filter(
  a => a.threatLevel === 'critical'
);
export const mockHighAlerts = mockAlerts.filter(a => a.threatLevel === 'high');
export const mockMediumAlerts = mockAlerts.filter(
  a => a.threatLevel === 'medium'
);
export const mockLowAlerts = mockAlerts.filter(a => a.threatLevel === 'low');
export const mockRecentAlerts = mockAlerts.slice(0, 20);
export const mockMultibandAlerts: Alert[] = [];

/** Persona fingerprints as array for backward compatibility with seedMockData. */
export const PERSONA_FINGERPRINTS = [
  { fingerprintHash: PERSONAS.delivery, signalType: 'cellular' as const },
  { fingerprintHash: PERSONAS.visitor, signalType: 'wifi' as const },
  { fingerprintHash: PERSONAS.loiterer, signalType: 'bluetooth' as const }, // b_a7b8c9
  { fingerprintHash: PERSONAS.vehicle, signalType: 'cellular' as const }, // c_d0e1f2
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/data/mockAlerts.test.ts --no-coverage`
Expected: All 8 tests PASS

- [ ] **Step 5: Run type check**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add src/mocks/data/mockAlerts.ts __tests__/mocks/data/mockAlerts.test.ts
git commit -m "feat: align mock alerts with backend fingerprint format and metadata"
```

---

### Task 6: Update Mock Users — Remove Non-Backend Fields

**Files:**

- Modify: `src/mocks/data/mockUsers.ts`

- [ ] **Step 1: Update mockUsers.ts to match backend user shape**

Replace the file `src/mocks/data/mockUsers.ts`:

```typescript
import type { User, AuthTokens } from '@/types/auth';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'admin@trailsense.com',
    name: 'John Anderson',
    role: 'admin',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-11-16T08:30:00Z',
  },
  {
    id: 'user-002',
    email: 'user@trailsense.com',
    name: 'Sarah Mitchell',
    role: 'user',
    createdAt: '2025-02-20T14:30:00Z',
    updatedAt: '2025-11-15T18:45:00Z',
  },
];

export const mockAdminUser = mockUsers[0];
export const mockRegularUser = mockUsers[1];

export const mockAuthTokens: AuthTokens = {
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
};

// Mock login credentials for testing
export const mockCredentials = {
  admin: {
    email: 'admin@trailsense.com',
    password: 'admin123',
  },
  user: {
    email: 'user@trailsense.com',
    password: 'user123',
  },
};
```

Key changes:

- Kept `role` (required by `src/store/slices/userSlice.ts:7`)
- Removed `lastLogin` (backend doesn't return this)
- Added `updatedAt` (backend returns this)
- Removed `expiresIn` from `mockAuthTokens` (backend doesn't return this)

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors (both `role` and `expiresIn` were made optional in Task 3)

- [ ] **Step 3: Commit**

```bash
git add src/mocks/data/mockUsers.ts
git commit -m "feat: trim mock user data to match backend response shape"
```

---

### Task 7: Update Mock Analytics — topDevices Shape and DeviceFingerprint

**Files:**

- Modify: `src/mocks/data/mockAnalytics.ts`

- [ ] **Step 1: Write failing test for analytics alignment**

```typescript
// __tests__/mocks/data/mockAnalytics.test.ts
import {
  mockAnalyticsData,
  mockTopDevices,
  mockDeviceFingerprints,
} from '@/mocks/data/mockAnalytics';

const FINGERPRINT_REGEX = /^[wcb]_[a-f0-9]+$/;

describe('mockAnalyticsData', () => {
  it('topDetectedDevices uses { fingerprintHash, count } shape', () => {
    mockAnalyticsData.topDetectedDevices.forEach(entry => {
      expect(entry).toHaveProperty('fingerprintHash');
      expect(entry).toHaveProperty('count');
      expect(typeof entry.fingerprintHash).toBe('string');
      expect(typeof entry.count).toBe('number');
    });
  });

  it('topDetectedDevices fingerprints use backend format', () => {
    mockAnalyticsData.topDetectedDevices.forEach(entry => {
      expect(entry.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});

describe('mockTopDevices', () => {
  it('uses shape from src/api/analytics.ts getTopDevices', () => {
    mockTopDevices.forEach(entry => {
      expect(entry).toHaveProperty('fingerprintHash');
      expect(entry).toHaveProperty('visits');
      expect(entry).toHaveProperty('lastSeen');
      expect(entry).toHaveProperty('threatLevel');
      expect(entry).toHaveProperty('category');
    });
  });
});

describe('mockDeviceFingerprints', () => {
  it('uses backend shape with totalSamples and totalAlerts', () => {
    mockDeviceFingerprints.forEach(fp => {
      expect(fp).toHaveProperty('totalSamples');
      expect(fp).toHaveProperty('totalAlerts');
      expect(fp).not.toHaveProperty('detections');
      expect(fp).not.toHaveProperty('averageDuration');
    });
  });

  it('category is a signal type, not unknown/known', () => {
    const validTypes = ['wifi', 'bluetooth', 'cellular'];
    mockDeviceFingerprints.forEach(fp => {
      expect(validTypes).toContain(fp.category);
    });
  });

  it('fingerprints use backend format', () => {
    mockDeviceFingerprints.forEach(fp => {
      expect(fp.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mocks/data/mockAnalytics.test.ts --no-coverage`
Expected: FAIL — shape mismatches

- [ ] **Step 3: Verify BackendDeviceFingerprint type exists from Task 3**

Run: `grep -n 'BackendDeviceFingerprint' src/types/alert.ts`
Expected: Shows the interface added in Task 3. If missing, go back and complete Task 3 Step 4 first.

Note: The existing `DeviceFingerprint` interface is NOT modified — it's used by
`src/services/deviceFingerprinting.ts` which reads `detections` and `averageDuration`.

- [ ] **Step 4: Rewrite mockAnalytics.ts**

Replace the entire file `src/mocks/data/mockAnalytics.ts`:

```typescript
import type {
  Alert,
  AnalyticsData,
  BackendDeviceFingerprint,
  HeatmapPoint,
} from '@/types/alert';
import { mockAlerts } from './mockAlerts';
import { getMockDevices } from './mockDevices';
import { FINGERPRINT_PREFIX } from '../helpers/fingerprints';

/**
 * Infer signal type from backend-format fingerprint prefix.
 */
function signalTypeFromFingerprint(
  hash: string
): 'wifi' | 'bluetooth' | 'cellular' {
  if (hash.startsWith(FINGERPRINT_PREFIX.wifi)) return 'wifi';
  if (hash.startsWith(FINGERPRINT_PREFIX.bluetooth)) return 'bluetooth';
  return 'cellular';
}

/**
 * Factory: compute analytics from a given alerts array.
 * Accepts alerts as parameter so it can be called with fresh data in seedMockData.
 */
export function getAnalyticsData(alerts: Alert[]): AnalyticsData {
  const totalDetections = alerts.length;
  const unknownDevices = alerts.filter(a => !a.isFalsePositive).length;
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

  const devices = getMockDevices();
  const deviceDistribution = devices.map(device => ({
    deviceId: device.id,
    count: alerts.filter(alert => alert.deviceId === device.id).length,
  }));

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: alerts.filter(alert => new Date(alert.timestamp).getHours() === hour)
      .length,
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
    // Derived extras — computed from alerts
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

/** Static snapshot for backward compat. Prefer getAnalyticsData(alerts). */
export const mockAnalyticsData: AnalyticsData = getAnalyticsData(mockAlerts);

/**
 * Factory: compute heatmap points from a given alerts array.
 */
export function getHeatmapPoints(alerts: Alert[]): HeatmapPoint[] {
  return alerts
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
}

/** Static snapshot. Prefer getHeatmapPoints(alerts). */
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

/**
 * Factory: compute device fingerprints from a given alerts array.
 */
export function getDeviceFingerprints(
  alerts: Alert[]
): BackendDeviceFingerprint[] {
  const uniqueFingerprints = [...new Set(alerts.map(a => a.fingerprintHash))];
  return uniqueFingerprints
    .slice(0, 10)
    .map(hash => generateBackendFingerprint(hash, alerts));
}

/** Static snapshot. Prefer getDeviceFingerprints(alerts). */
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
      const _now = new Date();
      return (
        alertDate.getMonth() === _now.getMonth() &&
        alertDate.getFullYear() === _now.getFullYear()
      );
    }).length,
    unknownDevices: mockAlerts.filter(a => {
      const alertDate = new Date(a.timestamp);
      const _now = new Date();
      return (
        alertDate.getMonth() === _now.getMonth() &&
        alertDate.getFullYear() === _now.getFullYear() &&
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

/**
 * Top devices — aligned to src/api/analytics.ts:99 getTopDevices shape.
 */
export const mockTopDevices = [
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/data/mockAnalytics.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 6: Run type check**

Run: `npm run type-check`
Expected: No new errors — existing `DeviceFingerprint` is unchanged so `src/services/deviceFingerprinting.ts` still compiles. The new `BackendDeviceFingerprint` is additive.

- [ ] **Step 7: Commit**

```bash
git add src/mocks/data/mockAnalytics.ts __tests__/mocks/data/mockAnalytics.test.ts
git commit -m "feat: align analytics mock data with backend shapes, add factory functions"
```

---

### Task 8: Update Mock Replay Positions — Fingerprints

**Files:**

- Modify: `src/mocks/data/mockReplayPositions.ts`

- [ ] **Step 1: Update SCENARIOS fingerprints to backend format**

In `src/mocks/data/mockReplayPositions.ts`, import the shared persona fingerprints and update the SCENARIOS array. At the top of the file, add the import:

```typescript
import { PERSONA_FINGERPRINTS as PERSONAS } from '../helpers/fingerprints';
```

Then update each scenario's `fingerprintHash`:

- Scenario 1 (delivery): change `'fp-delivery-a1b2c3'` to `PERSONAS.delivery`
- Scenario 2 (visitor): change `'fp-visitor-d4e5f6'` to `PERSONAS.visitor`
- Scenario 3 (loiterer): change `'fp-loiterer-g7h8i9'` to `PERSONAS.loiterer`
- Scenario 4 (vehicle): change `'fp-vehicle-j0k1l2'` to `PERSONAS.vehicle`

- [ ] **Step 2: Update existing replay test to use new fingerprints and correct field names**

The existing test at `__tests__/mocks/mockReplayPositions.test.ts` hardcodes old fingerprint
format (`fp-loiterer-g7h8i9`) and references `updatedAt` instead of `observedAt` on
`ReplayPosition` objects. Update those references:

- Replace any `'fp-loiterer-g7h8i9'` with the new value from `PERSONA_FINGERPRINTS` (`PERSONAS.loiterer` = `'b_a7b8c9'`)
- Replace any `'fp-delivery-a1b2c3'` with `'c_a1b2c3'`
- Replace any `'fp-visitor-d4e5f6'` with `'w_d4e5f6'`
- Replace any `'fp-vehicle-j0k1l2'` with `'c_d0e1f2'`
- If the test references `position.updatedAt`, change to `position.observedAt` (ReplayPosition uses `observedAt`)

- [ ] **Step 3: Add fingerprint format assertion to replay test**

Append to the existing test file `__tests__/mocks/mockReplayPositions.test.ts`:

```typescript
import { generateReplayData } from '@/mocks/data/mockReplayPositions';

describe('replay fingerprint format', () => {
  const data = generateReplayData();

  it('all positions use backend fingerprint format', () => {
    data.positions.forEach(pos => {
      expect(pos.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]+$/);
    });
  });

  it('all alerts use backend fingerprint format', () => {
    data.alerts.forEach(alert => {
      expect(alert.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]+$/);
    });
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/mocks/mockReplayPositions.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/mockReplayPositions.ts __tests__/mocks/mockReplayPositions.test.ts
git commit -m "feat: update replay positions to use backend fingerprint format"
```

---

### Task 9: Update Mock WebSocket — Missing Fields and positions-updated Event

**Files:**

- Modify: `src/mocks/mockWebSocket.ts`

- [ ] **Step 1: Write failing test for WebSocket contract alignment**

```typescript
// __tests__/mocks/mockWebSocket.test.ts
import { mockWebSocketService } from '@/mocks/mockWebSocket';

// Helper to collect emitted events
function collectEvent(event: string): Promise<any> {
  return new Promise(resolve => {
    mockWebSocketService.on(event, (data: any) => {
      resolve(data);
    });
  });
}

afterEach(() => {
  mockWebSocketService.disconnect();
});

describe('mock WebSocket device-status event', () => {
  it('includes signalStrength, lastBootAt, latitude, longitude', async () => {
    const statusPromise = collectEvent('device-status');
    mockWebSocketService.connect('test-token');
    const status = await statusPromise;

    expect(status).toHaveProperty('id');
    expect(status).toHaveProperty('signalStrength');
    expect(status).toHaveProperty('lastBootAt');
    expect(status).toHaveProperty('latitude');
    expect(status).toHaveProperty('longitude');
    // Mock emits raw backend shape (battery, not batteryPercent)
    // mapDeviceStatusEvent in WebSocketService handles normalization
    expect(status).toHaveProperty('battery');
  }, 20000);
});

describe('mock WebSocket alert event', () => {
  it('fingerprint uses backend format', async () => {
    const alertPromise = collectEvent('alert');
    mockWebSocketService.connect('test-token');
    const alert = await alertPromise;

    expect(alert.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]{8}$/);
    expect(alert).toHaveProperty('createdAt');
  }, 10000);
});

describe('mock WebSocket positions-updated event', () => {
  it('emits positions-updated with correct shape', async () => {
    const posPromise = collectEvent('positions-updated');
    mockWebSocketService.connect('test-token');
    const data = await posPromise;

    expect(data).toHaveProperty('deviceId');
    expect(data).toHaveProperty('positions');
    expect(Array.isArray(data.positions)).toBe(true);
    expect(data.positions.length).toBeGreaterThan(0);

    const pos = data.positions[0];
    expect(pos).toHaveProperty('id');
    expect(pos).toHaveProperty('fingerprintHash');
    expect(pos).toHaveProperty('signalType');
    expect(pos).toHaveProperty('latitude');
    expect(pos).toHaveProperty('longitude');
    expect(pos).toHaveProperty('accuracyMeters');
    expect(pos).toHaveProperty('confidence');
    expect(pos).toHaveProperty('measurementCount');
    expect(pos).toHaveProperty('updatedAt');
    expect(pos.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]{8}$/);
  }, 15000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mocks/mockWebSocket.test.ts --no-coverage`
Expected: FAIL — missing fields, no positions-updated event

- [ ] **Step 3: Rewrite mockWebSocket.ts**

Replace the entire file `src/mocks/mockWebSocket.ts`:

```typescript
/**
 * Mock WebSocket Service
 *
 * Simulates real-time WebSocket events for development and testing.
 * Generates realistic alert, device status, and position events.
 */

import { Alert, ThreatLevel, DetectionType } from '@/types/alert';
import { Device } from '@/types/device';
import { getMockDevices } from './data/mockDevices';
import { randomFingerprint } from './helpers/fingerprints';

type EventCallback = (data: any) => void;

class MockWebSocketService {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private alertIntervalId: NodeJS.Timeout | null = null;
  private deviceStatusIntervalId: NodeJS.Timeout | null = null;
  private positionsIntervalId: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private eventCounter: number = 0;
  private devices: Device[] = [];
  private uptimeState = new Map<string, number>();
  private alertCountState = new Map<string, number>();
  private signalStrengthState = new Map<string, string>();

  // Configuration
  private readonly EVENT_INTERVAL = 5000;
  private readonly DEVICE_STATUS_INTERVAL = 15000;
  private readonly POSITIONS_INTERVAL = 10000;

  connect(_token: string) {
    if (this.isConnected) {
      console.warn('[MockWebSocket] Already connected');
      return;
    }

    // Snapshot fresh device data on connect
    this.devices = getMockDevices();
    this.uptimeState = new Map(
      this.devices
        .filter(d => d.uptimeSeconds != null)
        .map(d => [d.id, d.uptimeSeconds!])
    );
    this.alertCountState = new Map(
      this.devices
        .filter(d => d.alertCount != null)
        .map(d => [d.id, d.alertCount!])
    );
    this.signalStrengthState = new Map(
      this.devices
        .filter(d => d.signalStrength != null)
        .map(d => [d.id, d.signalStrength!])
    );

    console.log('[MockWebSocket] Connecting to mock WebSocket...');
    this.isConnected = true;

    setTimeout(() => {
      console.log('[MockWebSocket] Connected');
      this.emit('connect', {});
    }, 500);

    this.startEventGeneration();
  }

  disconnect() {
    if (!this.isConnected) return;

    console.log('[MockWebSocket] Disconnecting...');
    this.isConnected = false;
    this.stopEventGeneration();
    this.emit('disconnect', {});
    console.log('[MockWebSocket] Disconnected');
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private startEventGeneration() {
    this.alertIntervalId = setInterval(() => {
      this.generateMockAlert();
    }, this.EVENT_INTERVAL);

    this.deviceStatusIntervalId = setInterval(() => {
      this.generateMockDeviceStatus();
    }, this.DEVICE_STATUS_INTERVAL);

    this.positionsIntervalId = setInterval(() => {
      this.generateMockPositionsUpdate();
    }, this.POSITIONS_INTERVAL);
  }

  private stopEventGeneration() {
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
    }
    if (this.deviceStatusIntervalId) {
      clearInterval(this.deviceStatusIntervalId);
      this.deviceStatusIntervalId = null;
    }
    if (this.positionsIntervalId) {
      clearInterval(this.positionsIntervalId);
      this.positionsIntervalId = null;
    }
  }

  private generateMockAlert() {
    this.eventCounter++;

    const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
    const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];

    const threatWeights = [40, 35, 20, 5];
    const threatLevel = this.weightedRandom(threatLevels, threatWeights);

    const typeWeights = [20, 50, 30];
    const detectionType = this.weightedRandom(detectionTypes, typeWeights);

    const onlineDevices = this.devices.filter(d => d.online);
    const device =
      onlineDevices[Math.floor(Math.random() * onlineDevices.length)];

    const confidenceRanges: Record<DetectionType, [number, number]> = {
      cellular: [70, 92],
      wifi: [60, 88],
      bluetooth: [55, 82],
    };

    const [minConfidence, maxConfidence] = confidenceRanges[detectionType];
    const confidence =
      Math.floor(Math.random() * (maxConfidence - minConfidence + 1)) +
      minConfidence;
    const accuracyMeters = Number((4 + Math.random() * 45).toFixed(1));
    const timestamp = new Date().toISOString();

    const uniqueId = `live-alert-${Date.now()}-${this.eventCounter}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert & { createdAt: string } = {
      id: uniqueId,
      deviceId: device.id,
      timestamp,
      threatLevel,
      detectionType,
      fingerprintHash: randomFingerprint(detectionType),
      confidence,
      accuracyMeters,
      isReviewed: false,
      isFalsePositive: false,
      location:
        device.latitude !== undefined && device.longitude !== undefined
          ? {
              latitude: device.latitude + (Math.random() - 0.5) * 0.001,
              longitude: device.longitude + (Math.random() - 0.5) * 0.001,
            }
          : undefined,
      metadata: {
        source: 'positions',
        signalCount: 1 + Math.floor(Math.random() * 4),
        measurementCount: 3 + Math.floor(Math.random() * 4),
      },
      createdAt: timestamp,
    };

    console.log(
      `[MockWebSocket] Alert: ${threatLevel.toUpperCase()} ${detectionType} ${confidence}% @ ~${accuracyMeters}m from ${device.name}`
    );
    this.emit('alert', alert);

    const currentCount = this.alertCountState.get(device.id) ?? 0;
    this.alertCountState.set(device.id, currentCount + 1);
  }

  private generateMockDeviceStatus() {
    const device =
      this.devices[Math.floor(Math.random() * this.devices.length)];

    const batteryChange = Math.floor(Math.random() * 5) - 2;
    const newBattery = Math.max(
      0,
      Math.min(100, (device.batteryPercent ?? 50) + batteryChange)
    );

    const priorUptime =
      this.uptimeState.get(device.id) ?? device.uptimeSeconds ?? undefined;
    const uptimeSeconds =
      priorUptime != null
        ? priorUptime + Math.floor(Math.random() * 300) + 60
        : undefined;

    if (uptimeSeconds != null) {
      this.uptimeState.set(device.id, uptimeSeconds);
    }

    // Drift signal strength occasionally
    const currentSignal =
      this.signalStrengthState.get(device.id) ?? device.signalStrength;
    const signalLevels = ['poor', 'fair', 'good', 'excellent'];
    let signalStrength = currentSignal;
    if (signalStrength && Math.random() < 0.1) {
      const idx = signalLevels.indexOf(signalStrength);
      if (idx >= 0) {
        const drift = Math.random() < 0.5 ? -1 : 1;
        const newIdx = Math.max(
          0,
          Math.min(signalLevels.length - 1, idx + drift)
        );
        signalStrength = signalLevels[newIdx];
        this.signalStrengthState.set(device.id, signalStrength);
      }
    }

    // Emit raw backend shape — WebSocketService.mapDeviceStatusEvent handles
    // normalization (e.g., detectionCount → alertCount). We emit `battery`
    // (backend field name) so the normalization path is exercised in demo mode.
    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      name: device.name,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5,
      alertCount: this.alertCountState.get(device.id) ?? device.alertCount,
      signalStrength,
      lastBootAt: device.lastBootAt,
      latitude: device.latitude,
      longitude: device.longitude,
      ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
    };

    console.log(
      `[MockWebSocket] Device Status: ${device.name} battery: ${newBattery}%`
    );
    this.emit('device-status', statusUpdate);
  }

  private generateMockPositionsUpdate() {
    const onlineDevices = this.devices.filter(d => d.online);
    if (onlineDevices.length === 0) return;

    const device =
      onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
    if (device.latitude === undefined || device.longitude === undefined) return;

    const detectionTypes: DetectionType[] = ['wifi', 'bluetooth', 'cellular'];
    const numPositions = 2 + Math.floor(Math.random() * 3); // 2-4

    const positions = Array.from({ length: numPositions }, (_, i) => {
      const type = detectionTypes[i % detectionTypes.length];
      const presenceCertainty = 20 + Math.floor(Math.random() * 70);
      const proximity = 20 + Math.floor(Math.random() * 70);

      return {
        id: `pos-live-${Date.now()}-${i}`,
        fingerprintHash: randomFingerprint(type),
        signalType: type,
        latitude: device.latitude! + (Math.random() - 0.5) * 0.002,
        longitude: device.longitude! + (Math.random() - 0.5) * 0.002,
        accuracyMeters: 5 + Math.random() * 20,
        confidence: Math.round(60 + Math.random() * 35),
        measurementCount: 3 + Math.floor(Math.random() * 5),
        updatedAt: new Date().toISOString(),
        presenceCertainty,
        proximity,
        threatLevel: this.deriveThreatLevel(presenceCertainty, proximity),
      };
    });

    this.emit('positions-updated', {
      deviceId: device.id,
      positions,
    });
  }

  /**
   * Derive threat level from presence/proximity using backend's 4x4 matrix.
   */
  private deriveThreatLevel(presence: number, proximity: number): ThreatLevel {
    const pRow =
      presence <= 25 ? 0 : presence <= 50 ? 1 : presence <= 75 ? 2 : 3;
    const pCol =
      proximity <= 30 ? 0 : proximity <= 55 ? 1 : proximity <= 75 ? 2 : 3;

    const matrix: ThreatLevel[][] = [
      ['low', 'low', 'low', 'medium'],
      ['low', 'low', 'medium', 'high'],
      ['low', 'medium', 'high', 'critical'],
      ['medium', 'high', 'critical', 'critical'],
    ];

    return matrix[pRow][pCol];
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }
}

export const mockWebSocketService = new MockWebSocketService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/mocks/mockWebSocket.test.ts --no-coverage`
Expected: All 3 test suites PASS

- [ ] **Step 5: Commit**

```bash
git add src/mocks/mockWebSocket.ts __tests__/mocks/mockWebSocket.test.ts
git commit -m "feat: align mock WebSocket with backend event shapes and add positions-updated"
```

---

### Task 10: Update Seed Function — Use Factory Functions

**Files:**

- Modify: `src/utils/seedMockData.ts`

- [ ] **Step 1: Update imports and use factory functions**

In `src/utils/seedMockData.ts`, update the imports and `generateMockPositions` to use the shared helpers. Replace the file:

```typescript
/**
 * Mock Data Seeding Utility
 *
 * Injects mock data into React Query cache and Redux store
 * to enable development and testing without a backend API.
 */

import { QueryClient } from '@tanstack/react-query';
import { Store } from '@reduxjs/toolkit';
import {
  mockAdminUser,
  mockAuthTokens,
  mockKnownDevices,
  mockAppSettings,
} from '@/mocks/data';
import { getMockAlerts, PERSONA_FINGERPRINTS } from '@/mocks/data/mockAlerts';
import { getMockDevices } from '@/mocks/data/mockDevices';
import {
  getAnalyticsData,
  getHeatmapPoints,
  getDeviceFingerprints,
} from '@/mocks/data/mockAnalytics';
import { TriangulatedPosition } from '@/types/triangulation';
import { randomFingerprint } from '@/mocks/helpers/fingerprints';

// React Query keys
const ALERTS_QUERY_KEY = 'alerts';
const DEVICES_QUERY_KEY = 'devices';
const POSITIONS_QUERY_KEY = 'positions';
const KNOWN_DEVICES_QUERY_KEY = 'knownDevices';
const ANALYTICS_QUERY_KEY = 'analytics';
const HEATMAP_QUERY_KEY = 'heatmap';
const DEVICE_HISTORY_QUERY_KEY = 'device-history';

/**
 * Generate mock triangulated positions for a device
 */
function generateMockPositions(
  deviceId: string,
  centerLat: number,
  centerLng: number
): { positions: TriangulatedPosition[] } {
  const positions: TriangulatedPosition[] = [];
  const signalTypes = ['wifi', 'bluetooth', 'cellular'] as const;

  for (let i = 0; i < 8; i++) {
    const persona = PERSONA_FINGERPRINTS[i];
    const signalType = persona ? persona.signalType : signalTypes[i % 3];
    const fingerprintHash = persona
      ? persona.fingerprintHash
      : randomFingerprint(signalTypes[i % 3]);

    positions.push({
      id: `pos-${deviceId}-${i}`,
      deviceId,
      fingerprintHash,
      signalType,
      latitude: centerLat + (Math.random() - 0.5) * 0.002,
      longitude: centerLng + (Math.random() - 0.5) * 0.002,
      accuracyMeters: 5 + Math.random() * 20,
      confidence: Math.round(70 + Math.random() * 30),
      measurementCount: 3 + Math.floor(Math.random() * 5),
      presenceCertainty: Math.floor(Math.random() * 100),
      proximity: Math.floor(Math.random() * 100),
      threatLevel: (['low', 'medium', 'high', 'critical'] as const)[
        Math.floor(Math.random() * 4)
      ],
      updatedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });
  }
  return { positions };
}

interface SeedOptions {
  queryClient: QueryClient;
  store: Store;
  user?: 'admin' | 'user';
}

/**
 * Seeds the application with mock data using factory functions
 * for fresh timestamps on each call.
 */
export const seedMockData = async ({
  queryClient,
  store,
  user: _user = 'admin',
}: SeedOptions): Promise<void> => {
  console.log('[MockData] Starting mock data seeding...');

  try {
    // Generate fresh data
    const freshDevices = getMockDevices();
    const freshAlerts = getMockAlerts();

    // 1. Seed Redux Store
    console.log('[MockData] Seeding Redux store...');

    store.dispatch({
      type: 'auth/setCredentials',
      payload: {
        user: mockAdminUser,
        tokens: mockAuthTokens,
      },
    });

    store.dispatch({
      type: 'user/setUser',
      payload: mockAdminUser,
    });

    store.dispatch({
      type: 'settings/updateSettings',
      payload: mockAppSettings,
    });

    // 2. Seed React Query Cache
    console.log('[MockData] Seeding React Query cache...');

    // Alerts — fresh timestamps
    queryClient.setQueryData([ALERTS_QUERY_KEY, undefined], freshAlerts);
    queryClient.setQueryData([ALERTS_QUERY_KEY], freshAlerts);

    freshAlerts.forEach(alert => {
      queryClient.setQueryData([ALERTS_QUERY_KEY, alert.id], alert);
    });

    // Devices — fresh timestamps
    queryClient.setQueryData([DEVICES_QUERY_KEY], freshDevices);

    freshDevices.forEach(device => {
      queryClient.setQueryData([DEVICES_QUERY_KEY, device.id], device);
    });

    // Positions for each device with coordinates
    freshDevices.forEach(device => {
      if (
        typeof device.latitude === 'number' &&
        typeof device.longitude === 'number'
      ) {
        const posData = generateMockPositions(
          device.id,
          device.latitude,
          device.longitude
        );
        queryClient.setQueryData([POSITIONS_QUERY_KEY, device.id], posData);
      }
    });

    // Known devices
    queryClient.setQueryData([KNOWN_DEVICES_QUERY_KEY], mockKnownDevices);

    mockKnownDevices.forEach(entry => {
      queryClient.setQueryData([KNOWN_DEVICES_QUERY_KEY, entry.id], entry);
    });

    // Analytics — recomputed from fresh alerts so timestamps are consistent
    const freshAnalytics = getAnalyticsData(freshAlerts);
    const freshHeatmap = getHeatmapPoints(freshAlerts);
    const freshFingerprints = getDeviceFingerprints(freshAlerts);

    const periods = ['day', 'week', 'month', 'year'] as const;
    periods.forEach(period => {
      queryClient.setQueryData(
        [ANALYTICS_QUERY_KEY, period, undefined, undefined],
        freshAnalytics
      );
    });

    // Heatmap data
    queryClient.setQueryData(
      [HEATMAP_QUERY_KEY, undefined, undefined],
      freshHeatmap
    );

    // Device history/fingerprints
    freshFingerprints.forEach(fingerprint => {
      queryClient.setQueryData(
        [DEVICE_HISTORY_QUERY_KEY, fingerprint.fingerprintHash],
        fingerprint
      );
    });

    // User profile
    queryClient.setQueryData(['user', 'profile'], mockAdminUser);

    console.log('[MockData] Mock data seeding complete!');
    console.log('[MockData] Seeded:');
    console.log(`  - ${freshAlerts.length} alerts`);
    console.log(`  - ${freshDevices.length} devices`);
    console.log(`  - ${mockKnownDevices.length} known devices`);
    console.log(`  - Analytics data`);
    console.log(`  - Heatmap data (${freshHeatmap.length} points)`);
    console.log(`  - ${freshFingerprints.length} device fingerprints`);
    console.log(`  - User: ${mockAdminUser.email}`);
  } catch (error) {
    console.error('[MockData] Error seeding mock data:', error);
    throw error;
  }
};

export const clearMockData = ({
  queryClient,
  store,
}: Omit<SeedOptions, 'user'>): void => {
  console.log('[MockData] Clearing mock data...');
  queryClient.clear();
  store.dispatch({ type: 'auth/logout' });
  console.log('[MockData] Mock data cleared');
};

export const refreshMockData = async (options: SeedOptions): Promise<void> => {
  clearMockData(options);
  await seedMockData(options);
};
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/seedMockData.ts
git commit -m "feat: use factory functions in seed utility for fresh timestamps"
```

---

### Task 11: Update Barrel Exports

**Files:**

- Modify: `src/mocks/data/index.ts`

- [ ] **Step 1: Add getMockDevices and getMockAlerts to barrel exports**

In `src/mocks/data/index.ts`, update the Devices and Alerts sections:

Change the Analytics section (lines 44-51):

```typescript
export {
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockComparisonData,
  mockThreatTimeline,
  mockTopDevices,
} from './mockAnalytics';
```

to:

```typescript
export {
  getAnalyticsData,
  getHeatmapPoints,
  getDeviceFingerprints,
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockComparisonData,
  mockThreatTimeline,
  mockTopDevices,
} from './mockAnalytics';
```

Change lines 13-17:

```typescript
export {
  mockDevices,
  mockOnlineDevices,
  mockOfflineDevices,
} from './mockDevices';
```

to:

```typescript
export {
  getMockDevices,
  mockDevices,
  mockOnlineDevices,
  mockOfflineDevices,
} from './mockDevices';
```

Change lines 20-30:

```typescript
export {
  mockAlerts,
  mockUnreviewedAlerts,
  mockCriticalAlerts,
  mockHighAlerts,
  mockMediumAlerts,
  mockLowAlerts,
  mockMultibandAlerts,
  mockRecentAlerts,
  PERSONA_FINGERPRINTS,
} from './mockAlerts';
```

to:

```typescript
export {
  getMockAlerts,
  mockAlerts,
  mockUnreviewedAlerts,
  mockCriticalAlerts,
  mockHighAlerts,
  mockMediumAlerts,
  mockLowAlerts,
  mockMultibandAlerts,
  mockRecentAlerts,
  PERSONA_FINGERPRINTS,
} from './mockAlerts';
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/mocks/data/index.ts
git commit -m "feat: export factory functions from mock data barrel"
```

---

### Task 12: Full Test Suite Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass. If any tests fail due to the `DeviceFingerprint` type change (removal of `detections` and `averageDuration`), note the failing files — they need to be updated to use the new shape.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: Clean pass. If there are errors referencing `DeviceFingerprint.detections` or `DeviceFingerprint.averageDuration` in screen components, those are consumers that need updating — create follow-up tasks for each.

- [ ] **Step 3: Run lint**

Run: `npm run lint:fix`
Expected: No lint errors in modified files

- [ ] **Step 4: Final commit if lint made changes**

```bash
git add -u
git commit -m "fix: lint and format cleanup after mock data alignment"
```
