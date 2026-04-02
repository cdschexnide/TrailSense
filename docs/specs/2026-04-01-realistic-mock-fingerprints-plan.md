# Realistic Mock Device Fingerprints — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Device Fingerprint screen with realistic multi-day visit histories for 6 device personas, so mock mode shows rich fingerprint profiles instead of empty "0 visits" screens.

**Architecture:** Add persona alert data to `mockAlerts.ts` via a generator function. Update `seedMockData.ts` to use persona MAC addresses in seeded positions. No UI code changes — the fingerprint screen already derives all its data from alerts.

**Tech Stack:** TypeScript, existing mock data infrastructure

---

### Task 1: Add persona alert generator to mockAlerts.ts

**Files:**
- Modify: `src/mocks/data/mockAlerts.ts`

- [ ] **Step 1: Add the persona definitions and generator function**

Add this code after the `generateLocation` helper (line 33) and before `export const mockAlerts`:

```typescript
// === Persona-based alerts for realistic fingerprint profiles ===

interface PersonaDefinition {
  macAddress: string;
  detectionType: DetectionType;
  threatLevel: ThreatLevel;
  rssiBase: number;
  /** Days of the week this persona visits (0=Sun, 1=Mon, ..., 6=Sat) */
  visitDays: number[];
  /** Hour and minute of typical arrival */
  arrivalHour: number;
  arrivalMinute: number;
  /** Duration of each visit in seconds */
  durationSeconds: number;
  /** How many days back to generate visits */
  lookbackDays: number;
  metadata?: Record<string, unknown>;
}

const PERSONAS: PersonaDefinition[] = [
  {
    macAddress: 'E4:A1:30:7B:22:01',
    detectionType: 'cellular',
    threatLevel: 'low',
    rssiBase: -52,
    visitDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    arrivalHour: 10,
    arrivalMinute: 15,
    durationSeconds: 180,
    lookbackDays: 14,
    metadata: { band: '700MHz', provider: 'USPS Vehicle' },
  },
  {
    macAddress: 'F8:B2:41:8C:33:02',
    detectionType: 'bluetooth',
    threatLevel: 'low',
    rssiBase: -68,
    visitDays: [2, 4, 6], // Tue, Thu, Sat
    arrivalHour: 7,
    arrivalMinute: 0,
    durationSeconds: 420,
    lookbackDays: 14,
    metadata: { deviceName: 'iPhone 15 Pro' },
  },
  {
    macAddress: '1A:C3:52:9D:44:03',
    detectionType: 'cellular',
    threatLevel: 'critical',
    rssiBase: -58,
    visitDays: [], // Manual — see special handling
    arrivalHour: 2,
    arrivalMinute: 30,
    durationSeconds: 600,
    lookbackDays: 5,
    metadata: { band: '850MHz', provider: 'Unknown' },
  },
  {
    macAddress: '2B:D4:63:AE:55:04',
    detectionType: 'wifi',
    threatLevel: 'low',
    rssiBase: -60,
    visitDays: [1, 3, 5], // Mon, Wed, Fri
    arrivalHour: 13,
    arrivalMinute: 30,
    durationSeconds: 300,
    lookbackDays: 14,
    metadata: { ssid: 'FedEx-Van-4417', vendor: 'Intel Corporate' },
  },
  {
    macAddress: '3C:E5:74:BF:66:05',
    detectionType: 'wifi',
    threatLevel: 'medium',
    rssiBase: -65,
    visitDays: [0, 6], // Sat, Sun
    arrivalHour: 17,
    arrivalMinute: 45,
    durationSeconds: 900,
    lookbackDays: 14,
    metadata: { ssid: 'Pixel-8', vendor: 'Google' },
  },
  {
    macAddress: '4D:F6:85:C0:77:06',
    detectionType: 'bluetooth',
    threatLevel: 'high',
    rssiBase: -72,
    visitDays: [], // Single visit — see special handling
    arrivalHour: 23,
    arrivalMinute: 42,
    durationSeconds: 45,
    lookbackDays: 1,
    metadata: { deviceName: 'Unknown BLE' },
  },
];

function generatePersonaAlerts(): Alert[] {
  const alerts: Alert[] = [];
  let alertIndex = 200; // Start after existing mock alert indices

  for (const persona of PERSONAS) {
    // Special handling for irregular visitors
    if (persona.macAddress === '1A:C3:52:9D:44:03') {
      // Suspicious vehicle: exactly 2 visits in last 5 days
      const visit1 = new Date();
      visit1.setDate(visit1.getDate() - 3);
      visit1.setHours(2, 30, 0, 0);

      const visit2 = new Date();
      visit2.setDate(visit2.getDate() - 1);
      visit2.setHours(3, 15, 0, 0);

      for (const ts of [visit1, visit2]) {
        alerts.push({
          id: `alert-persona-${alertIndex++}`,
          deviceId: 'device-001',
          timestamp: ts.toISOString(),
          threatLevel: persona.threatLevel,
          detectionType: persona.detectionType,
          rssi: persona.rssiBase + Math.floor(Math.random() * 6),
          macAddress: persona.macAddress,
          cellularStrength: persona.rssiBase,
          isReviewed: false,
          isFalsePositive: false,
          location: generateLocation('device-001'),
          isStationary: true,
          seenCount: 4,
          duration: persona.durationSeconds,
          metadata: persona.metadata as any,
        });
      }
      continue;
    }

    if (persona.macAddress === '4D:F6:85:C0:77:06') {
      // One-time unknown: single detection yesterday
      const ts = new Date();
      ts.setDate(ts.getDate() - 1);
      ts.setHours(23, 42, 0, 0);

      alerts.push({
        id: `alert-persona-${alertIndex++}`,
        deviceId: 'device-001',
        timestamp: ts.toISOString(),
        threatLevel: persona.threatLevel,
        detectionType: persona.detectionType,
        rssi: persona.rssiBase,
        macAddress: persona.macAddress,
        isReviewed: false,
        isFalsePositive: false,
        location: generateLocation('device-001'),
        seenCount: 1,
        duration: persona.durationSeconds,
        metadata: persona.metadata as any,
      });
      continue;
    }

    // Regular visitors: generate visits for each matching day in lookback
    for (let daysAgo = 0; daysAgo < persona.lookbackDays; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dayOfWeek = date.getDay();

      if (!persona.visitDays.includes(dayOfWeek)) continue;

      // Add small time variance (±10 minutes)
      const minuteJitter = Math.floor(Math.random() * 20) - 10;
      date.setHours(
        persona.arrivalHour,
        persona.arrivalMinute + minuteJitter,
        0,
        0
      );

      alerts.push({
        id: `alert-persona-${alertIndex++}`,
        deviceId: 'device-001',
        timestamp: date.toISOString(),
        threatLevel: persona.threatLevel,
        detectionType: persona.detectionType,
        rssi: persona.rssiBase + Math.floor(Math.random() * 10 - 5),
        macAddress: persona.macAddress,
        cellularStrength:
          persona.detectionType === 'cellular'
            ? persona.rssiBase + Math.floor(Math.random() * 8 - 4)
            : undefined,
        isReviewed: daysAgo > 1,
        isFalsePositive: false,
        location: generateLocation('device-001'),
        wifiDetected: persona.detectionType === 'wifi',
        bluetoothDetected: persona.detectionType === 'bluetooth',
        multiband: false,
        isStationary: false,
        seenCount: 1 + Math.floor(Math.random() * 4),
        duration: persona.durationSeconds,
        metadata: persona.metadata as any,
      });
    }
  }

  return alerts;
}
```

- [ ] **Step 2: Append persona alerts to the mockAlerts export**

Replace the existing `mockAlerts` export array's closing bracket to merge persona alerts:

Change the end of the `mockAlerts` array from:

```typescript
  }),
];
```

to:

```typescript
  }),
  ...generatePersonaAlerts(),
];
```

- [ ] **Step 3: Export the persona MAC addresses for use by seedMockData**

Add at the bottom of `mockAlerts.ts`, after the filtered collections:

```typescript
/** MAC addresses of persona devices — used by seedMockData for live positions */
export const PERSONA_MACS = PERSONAS.map(p => ({
  macAddress: p.macAddress,
  signalType: p.detectionType as 'wifi' | 'bluetooth' | 'cellular',
}));
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep mockAlerts`
Expected: No new errors from mockAlerts.ts

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/mockAlerts.ts
git commit -m "feat(mock): add 6 persona alert histories for realistic fingerprints"
```

---

### Task 2: Update seedMockData to use persona MAC addresses

**Files:**
- Modify: `src/utils/seedMockData.ts`

- [ ] **Step 1: Import PERSONA_MACS**

Add to the import from `@/mocks/data`:

```typescript
import {
  mockAdminUser,
  mockAuthTokens,
  mockAlerts,
  mockDevices,
  mockKnownDevices,
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockAppSettings,
} from '@/mocks/data';
```

Change to:

```typescript
import {
  mockAdminUser,
  mockAuthTokens,
  mockAlerts,
  mockDevices,
  mockKnownDevices,
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockAppSettings,
} from '@/mocks/data';
import { PERSONA_MACS } from '@/mocks/data/mockAlerts';
```

- [ ] **Step 2: Update generateMockPositions to use persona MACs**

Replace the existing `generateMockPositions` function with:

```typescript
function generateMockPositions(
  deviceId: string,
  centerLat: number,
  centerLng: number
): { positions: TriangulatedPosition[] } {
  const positions: TriangulatedPosition[] = [];
  // Use persona MACs for the first 6, then fill remaining with generated ones
  for (let i = 0; i < 8; i++) {
    const persona = PERSONA_MACS[i];
    const mac = persona
      ? persona.macAddress
      : `AA:BB:CC:DD:${i.toString(16).padStart(2, '0').toUpperCase()}:${deviceId.slice(-2)}`;
    const signalType = persona
      ? persona.signalType
      : (['wifi', 'bluetooth', 'cellular'] as const)[i % 3];

    positions.push({
      id: `pos-${deviceId}-${i}`,
      deviceId,
      fingerprintHash: `fp-${mac.replace(/:/g, '').slice(-6)}`,
      macAddress: mac,
      signalType,
      latitude: centerLat + (Math.random() - 0.5) * 0.002,
      longitude: centerLng + (Math.random() - 0.5) * 0.002,
      accuracyMeters: 5 + Math.random() * 20,
      confidence: 0.7 + Math.random() * 0.3,
      measurementCount: 3 + Math.floor(Math.random() * 5),
      updatedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });
  }
  return { positions };
}
```

- [ ] **Step 3: Also export PERSONA_MACS from the mocks data index**

Modify `src/mocks/data/index.ts` — add to the alerts export block:

```typescript
// Alerts
export {
  mockAlerts,
  mockUnreviewedAlerts,
  mockCriticalAlerts,
  mockHighAlerts,
  mockMediumAlerts,
  mockLowAlerts,
  mockMultibandAlerts,
  mockRecentAlerts,
  PERSONA_MACS,
} from './mockAlerts';
```

Then update the seedMockData import to use the barrel:

```typescript
import {
  mockAdminUser,
  mockAuthTokens,
  mockAlerts,
  mockDevices,
  mockKnownDevices,
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockAppSettings,
  PERSONA_MACS,
} from '@/mocks/data';
```

(Remove the separate `import { PERSONA_MACS } from '@/mocks/data/mockAlerts'` line.)

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep -E "seedMockData|mockAlerts"`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/utils/seedMockData.ts src/mocks/data/index.ts
git commit -m "feat(mock): use persona MACs in seeded positions for fingerprint linkage"
```

---

### Task 3: Verify end-to-end in simulator

- [ ] **Step 1: Clear cache and restart Metro**

Run: `npx expo start --clear`

- [ ] **Step 2: Verify persona alerts are seeded**

In the Metro console, confirm the log shows:
```
[MockData] Seeded:
  - 55+ alerts  (should be higher now, ~80-90)
```

The exact count depends on how many visit days fall in the 14-day window.

- [ ] **Step 3: Navigate to Radar > Live Map > tap a detected device marker**

Expected: FingerprintPeek bottom sheet shows a persona MAC address.

- [ ] **Step 4: Tap "View Full Profile"**

Expected: Device Fingerprint screen shows:
- Non-zero "Total visits" (e.g., 12 for mail carrier)
- Non-zero "This week"
- Populated "Most active days" (e.g., "Mon, Wed, Fri")
- Populated "Peak time window" (e.g., "10–11")
- Real "First seen" and "Last seen" dates
- AI Insight text that isn't "No detections recorded"

- [ ] **Step 5: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(mock): adjust persona alert generation for fingerprint display"
```
