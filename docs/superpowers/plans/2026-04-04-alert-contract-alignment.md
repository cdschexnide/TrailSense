# Alert Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the mobile Alert type, UI, services, and mock data with the backend's fingerprint-first data model.

**Architecture:** Replace `rssi`/`macAddress` with `fingerprintHash`/`confidence`/`accuracyMeters` across the full consumer surface (~46 files). `confidence` (0-100) measures fingerprint certainty. `accuracyMeters` measures position accuracy and drives proximity labels. These are separate concepts — never collapse them.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Redux Toolkit, React Query, Jest

**Spec:** `docs/superpowers/specs/2026-04-04-alert-contract-alignment-design.md`

---

## File Map

| Action | File | Category |
|--------|------|----------|
| Modify | `src/types/alert.ts` | types |
| Modify | `src/types/knownDevice.ts` | types |
| Modify | `src/types/replay.ts` | types |
| Modify | `src/navigation/types.ts` | navigation |
| Modify | `src/navigation/linking.ts` | navigation |
| Modify | `src/utils/visualEffects.ts` | utilities |
| Modify | `src/utils/rssiUtils.ts` | utilities |
| Modify | `src/components/organisms/AlertCard/AlertCard.tsx` | alert-ui |
| Modify | `src/screens/alerts/AlertDetailScreen.tsx` | alert-ui |
| Modify | `src/screens/alerts/AlertListScreen.tsx` | alert-ui |
| Modify | `src/screens/fingerprint/DeviceFingerprintScreen.tsx` | alert-ui |
| Modify | `src/screens/home/PropertyCommandCenter.tsx` | alert-ui |
| Modify | `src/hooks/usePropertyStatus.ts` | alert-ui |
| Modify | `src/components/ai/cards/AlertBriefingCard.tsx` | ai-cards |
| Modify | `src/components/ai/cards/SitrepCard.tsx` | ai-cards |
| Modify | `src/services/llm/FocusedContextBuilder.ts` | llm |
| Modify | `src/services/llm/ResponseProcessor.ts` | llm |
| Modify | `src/services/llm/templates/AlertSummaryTemplate.ts` | llm |
| Modify | `src/services/llm/templates/PatternAnalysisTemplate.ts` | llm |
| Modify | `src/services/threatClassifier.ts` | services |
| Modify | `src/services/deviceFingerprinting.ts` | services |
| Modify | `src/services/patternDetection.ts` | services |
| Modify | `src/services/fingerprintStore.ts` | services |
| Modify | `src/store/slices/blockedDevicesSlice.ts` | state |
| Modify | `src/hooks/useBlockedDevices.ts` | state |
| Modify | `src/hooks/useSecurityContext.ts` | llm |
| Modify | `src/api/analytics.ts` | analytics |
| Modify | `src/hooks/useAnalytics.ts` | analytics |
| Modify | `src/hooks/useTimeBucketing.ts` | replay |
| Modify | `src/hooks/useReplayPath.ts` | replay |
| Modify | `src/screens/radar/ProximityHeatmapScreen.tsx` | replay |
| Modify | `src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx` | replay |
| Modify | `src/components/molecules/FingerprintPeek/FingerprintPeek.tsx` | replay |
| Modify | `src/screens/settings/AddKnownDeviceScreen.tsx` | known-devices |
| Modify | `src/screens/settings/KnownDevicesScreen.tsx` | known-devices |
| Modify | `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx` | known-devices |
| Modify | `src/mocks/data/mockAlerts.ts` | mock-data |
| Modify | `src/mocks/data/mockAnalytics.ts` | mock-data |
| Modify | `src/mocks/data/mockKnownDevices.ts` | mock-data |
| Modify | `src/mocks/data/mockReplayPositions.ts` | mock-data |
| Modify | `src/mocks/mockWebSocket.ts` | mock-data |
| Modify | `src/utils/seedMockData.ts` | mock-data |
| Modify | `__tests__/hooks/useAlerts.test.tsx` | tests |

**Backend (separate repo, coordination only):**
| Modify | `trailsense-backend/src/controllers/alertsController.ts` | backend |

---

### Task 1: Update Alert, AlertMetadata, DeviceFingerprint, and AnalyticsData Types

**Files:**
- Modify: `src/types/alert.ts`

- [ ] **Step 1: Update AlertMetadata interface**

Replace the `AlertMetadata` interface (lines 8-44) with:

```typescript
export interface AlertMetadata {
  // Location/distance info
  zone?: number;
  distance?: number;

  // Summary-specific fields
  source?: 'legacy' | 'summary' | 'positions';
  signalCount?: number;
  windowDuration?: number;
  measurementCount?: number;

  // Triangulation-specific fields
  triangulatedPosition?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    confidence: number;
  };
}
```

- [ ] **Step 2: Update Alert interface**

Replace the `Alert` interface (lines 46-69) with:

```typescript
export interface Alert {
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
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: AlertMetadata;
}
```

- [ ] **Step 3: Update DeviceFingerprint type**

Replace the `DeviceFingerprint` interface (lines 122-140) with:

```typescript
export interface DeviceFingerprint {
  id: string;
  fingerprintHash: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  detections: Array<{
    timestamp: string;
    confidence: number;
    location?: {
      latitude: number;
      longitude: number;
    };
    type: string;
  }>;
  averageDuration: number;
  commonHours: number[];
  category: string;
}
```

- [ ] **Step 4: Update AnalyticsData type**

In the `AnalyticsData` interface, change `topDetectedDevices` (line 100):

```typescript
topDetectedDevices: Array<{ fingerprintHash: string; count: number }>;
```

- [ ] **Step 5: Run type-check to see all downstream breakages**

Run: `npm run type-check 2>&1 | head -120`

Expected: TypeScript errors across ~40 files. These are fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/types/alert.ts
git commit -m "refactor: update Alert types to fingerprint-first model

Remove rssi, macAddress, cellularStrength and detection-era booleans.
Add fingerprintHash, confidence, accuracyMeters as required fields.
Update AlertMetadata, DeviceFingerprint, and AnalyticsData."
```

---

### Task 2: Update KnownDevice and Replay Types

**Files:**
- Modify: `src/types/knownDevice.ts`
- Modify: `src/types/replay.ts`

- [ ] **Step 1: Update KnownDevice types**

In `src/types/knownDevice.ts`, replace `macAddress: string` with `fingerprintHash: string` in both `KnownDevice` and `CreateKnownDeviceDTO` interfaces.

- [ ] **Step 2: Update replay types**

In `src/types/replay.ts`:

Remove `macAddress: string` from `BucketEntry` (line 7). It already has `fingerprintHash` on line 6.

Update `FingerprintPeekProps` (lines 34-40):
```typescript
export interface FingerprintPeekProps {
  fingerprintHash: string;
  scrubTimestamp: number;
  onViewProfile: (fingerprintHash: string) => void;
  onDismiss: () => void;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/knownDevice.ts src/types/replay.ts
git commit -m "refactor: update KnownDevice and replay types to use fingerprintHash"
```

---

### Task 3: Replace interpretRSSI with interpretAccuracy in visualEffects

**Files:**
- Modify: `src/utils/visualEffects.ts:240-268`

- [ ] **Step 1: Replace the RSSI interpretation section**

Replace lines 240-268 (the `RSSIInterpretation` interface and `interpretRSSI` function) with:

```typescript
// =============================================================================
// ACCURACY INTERPRETATION
// =============================================================================

export interface AccuracyInterpretation {
  label: string;
  color: string;
  percentage: number; // For progress bar visualization (0-100)
}

/**
 * Interpret position accuracy (meters) into human-readable proximity form.
 * Lower accuracy value = closer/more precise position.
 */
export const interpretAccuracy = (
  accuracyMeters: number
): AccuracyInterpretation => {
  if (accuracyMeters < 5) {
    return { label: 'Very Close', color: '#FF453A', percentage: 95 };
  }
  if (accuracyMeters < 10) {
    return { label: 'Close', color: '#FF9F0A', percentage: 75 };
  }
  if (accuracyMeters < 25) {
    return { label: 'Nearby', color: '#FFCC00', percentage: 55 };
  }
  if (accuracyMeters < 50) {
    return { label: 'Moderate', color: '#30D158', percentage: 35 };
  }
  return { label: 'Distant', color: '#8E8E93', percentage: 15 };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/visualEffects.ts
git commit -m "refactor: replace interpretRSSI with interpretAccuracy"
```

---

### Task 4: Replace rssiUtils with fingerprint-based utilities

**Files:**
- Modify: `src/utils/rssiUtils.ts`

- [ ] **Step 1: Rewrite the file**

Replace the entire file with:

```typescript
/**
 * Calculates a pseudo-random but deterministic angle for a device
 * based on its fingerprint hash. Provides consistent positioning
 * for radar display.
 *
 * @param fingerprintHash - Device fingerprint hash (e.g., w_3a7fb2e1)
 * @returns Angle in degrees (0-360)
 */
export const calculateAngleFromHash = (fingerprintHash: string): number => {
  let hash = 0;
  for (let i = 0; i < fingerprintHash.length; i++) {
    hash = (hash << 5) - hash + fingerprintHash.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 360);
};
```

Remove `estimateDistance` (backend provides `accuracyMeters` directly) and `getSignalStrength` (replaced by `interpretAccuracy`).

- [ ] **Step 2: Update any imports of removed functions**

Search for imports of `estimateDistance`, `getSignalStrength`, or `calculateAngleFromMAC` and update them to use `calculateAngleFromHash` or remove the import if the function is no longer needed.

Run: `npm run type-check 2>&1 | grep rssiUtils`

- [ ] **Step 3: Commit**

```bash
git add src/utils/rssiUtils.ts
git commit -m "refactor: replace rssiUtils with fingerprint-based utilities"
```

---

### Task 5: Update AlertCard Component

**Files:**
- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

- [ ] **Step 1: Update imports**

```typescript
// Old:
import { interpretRSSI, getThreatColor } from '@utils/visualEffects';
// New:
import { interpretAccuracy, getThreatColor } from '@utils/visualEffects';
```

- [ ] **Step 2: Update props interface**

```typescript
// Old:
onAddToKnown?: (macAddress: string) => void;
// New:
onAddToKnown?: (fingerprintHash: string) => void;
```

- [ ] **Step 3: Update proximity interpretation**

Replace line 159:
```typescript
// Old:
const rssiInfo = interpretRSSI(alert.rssi);
// New:
const accuracyInfo = interpretAccuracy(alert.accuracyMeters);
```

- [ ] **Step 4: Update all rssiInfo references**

Throughout the component:
- `rssiInfo.color` → `accuracyInfo.color`
- `rssiInfo.label` → `accuracyInfo.label`

- [ ] **Step 5: Update the signal metric display**

Replace the `{alert.rssi} dBm` text (around line 221) with:
```typescript
{alert.confidence}%
```

- [ ] **Step 6: Update the identifier display**

Replace the macAddress conditional block (around lines 254-270) with:
```typescript
<View style={styles.metadataItem}>
  <Text variant="caption2" color="secondaryLabel">
    Fingerprint
  </Text>
  <Text variant="caption2" weight="semibold" color="label">
    {alert.fingerprintHash}
  </Text>
</View>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/organisms/AlertCard/AlertCard.tsx
git commit -m "refactor: update AlertCard to use confidence, accuracyMeters, fingerprintHash"
```

---

### Task 6: Update AlertDetailScreen

**Files:**
- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

- [ ] **Step 1: Replace getProximityLabel helper**

```typescript
// Old:
const getProximityLabel = (rssi: number): string => {
  if (rssi > -60) return 'Strong';
  if (rssi > -70) return 'Moderate';
  return 'Weak';
};
// New:
const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 80) return 'High';
  if (confidence >= 50) return 'Moderate';
  return 'Low';
};
```

- [ ] **Step 2: Update heroMetrics**

```typescript
const heroMetrics = [
  `${alert.confidence}%`,
  getConfidenceLabel(alert.confidence),
  deviceName || alert.deviceId,
];
```

- [ ] **Step 3: Update Signal section rows**

Replace RSSI row with Confidence row:
```typescript
<GroupedListRow
  icon="cellular"
  iconColor={colors.systemBlue}
  title="Confidence"
  value={`${alert.confidence}%`}
/>
```

Replace Proximity row with Estimated Accuracy row:
```typescript
<GroupedListRow
  icon="locate-outline"
  iconColor={colors.systemGreen}
  title="Estimated Accuracy"
  value={`~${alert.accuracyMeters.toFixed(1)}m`}
/>
```

- [ ] **Step 4: Update fingerprint display and navigation**

Replace MAC Address row:
```typescript
<GroupedListRow
  icon="qr-code-outline"
  iconColor={colors.systemPurple}
  title="Fingerprint ID"
  value={alert.fingerprintHash}
/>
```

Replace DeviceFingerprint navigation:
```typescript
<GroupedListRow
  icon="analytics-outline"
  iconColor={colors.systemBlue}
  title="Open fingerprint"
  subtitle="View visits, patterns, and actions"
  showChevron
  onPress={() =>
    (navigation as any).navigate('DeviceFingerprint', {
      fingerprintHash: alert.fingerprintHash,
    })
  }
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/alerts/AlertDetailScreen.tsx
git commit -m "refactor: update AlertDetailScreen to fingerprint-first"
```

---

### Task 7: Update AlertListScreen, PropertyCommandCenter, usePropertyStatus

**Files:**
- Modify: `src/screens/alerts/AlertListScreen.tsx`
- Modify: `src/screens/home/PropertyCommandCenter.tsx`
- Modify: `src/hooks/usePropertyStatus.ts`

- [ ] **Step 1: Update AlertListScreen search filter**

Replace macAddress search (lines 101-102):
```typescript
alert.fingerprintHash.toLowerCase().includes(search.toLowerCase())
```

- [ ] **Step 2: Update AlertListScreen blocked device filter**

Replace line 119:
```typescript
result = result.filter((alert: Alert) => !isBlocked(alert.fingerprintHash));
```

- [ ] **Step 3: Update AlertListScreen handleAddToKnown**

```typescript
const handleAddToKnown = (fingerprintHash: string) => {
  navigation.getParent()?.navigate('MoreTab', {
    screen: 'AddKnownDevice',
    params: { fingerprintHash },
  });
};
```

- [ ] **Step 4: Update PropertyCommandCenter**

Replace `recentAlerts[0]?.macAddress` (line 254) with `recentAlerts[0]?.fingerprintHash`. Update the navigation param from `macAddress` to `fingerprintHash` (lines 257, 379).

- [ ] **Step 5: Update usePropertyStatus**

Replace line 81:
```typescript
const uniqueVisitors = new Set(todayAlerts.map(alert => alert.fingerprintHash));
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/alerts/AlertListScreen.tsx src/screens/home/PropertyCommandCenter.tsx src/hooks/usePropertyStatus.ts
git commit -m "refactor: update alert list, home screen, and property status to use fingerprintHash"
```

---

### Task 8: Update Navigation Types and Deep Links

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/linking.ts`

- [ ] **Step 1: Update DeviceFingerprint route params**

In `src/navigation/types.ts`, replace all `DeviceFingerprint: { macAddress: string }` with `DeviceFingerprint: { fingerprintHash: string }` (lines 31, 38, 44, 50, 77).

- [ ] **Step 2: Update AddKnownDevice params**

Replace both `AddKnownDevice: { macAddress?: string; deviceId?: string } | undefined` (lines 76, 91) with:
```typescript
AddKnownDevice: { fingerprintHash?: string; deviceId?: string } | undefined;
```

- [ ] **Step 3: Update deep links**

In `src/navigation/linking.ts`, replace all 5 occurrences of `:macAddress` with `:fingerprintHash`:
- Line 20: `DeviceFingerprint: 'home/fingerprint/:fingerprintHash',`
- Line 28: `DeviceFingerprint: 'alerts/fingerprint/:fingerprintHash',`
- Line 40: `DeviceFingerprint: 'radar/fingerprint/:fingerprintHash',`
- Line 48: `DeviceFingerprint: 'devices/fingerprint/:fingerprintHash',`
- Line 68: `DeviceFingerprint: 'more/fingerprint/:fingerprintHash',`

- [ ] **Step 4: Commit**

```bash
git add src/navigation/types.ts src/navigation/linking.ts
git commit -m "refactor: update navigation params and deep links to use fingerprintHash"
```

---

### Task 9: Update DeviceFingerprintScreen

**Files:**
- Modify: `src/screens/fingerprint/DeviceFingerprintScreen.tsx`

- [ ] **Step 1: Replace all macAddress references with fingerprintHash**

This is a global find-replace within the file. Every `macAddress` becomes `fingerprintHash`:
- Line 21: `const { fingerprintHash } = route.params;`
- Line 27: `computeVisitPattern(alerts, fingerprintHash)`
- Line 34: `alert.fingerprintHash === fingerprintHash`
- Line 42: `device.fingerprintHash === fingerprintHash`
- Line 44: `isBlocked(fingerprintHash)`
- Line 47: `logEvent(AnalyticsEvents.FINGERPRINT_VIEWED, { fingerprintHash })`
- Line 66: `params: { fingerprintHash }`
- Line 72: `unblock(fingerprintHash)`
- Line 76: `block(fingerprintHash)`
- Line 83: `subtitle: fingerprintHash`

- [ ] **Step 2: Commit**

```bash
git add src/screens/fingerprint/DeviceFingerprintScreen.tsx
git commit -m "refactor: update DeviceFingerprintScreen to use fingerprintHash"
```

---

### Task 10: Update AI Cards

**Files:**
- Modify: `src/components/ai/cards/AlertBriefingCard.tsx`
- Modify: `src/components/ai/cards/SitrepCard.tsx`

- [ ] **Step 1: Update AlertBriefingCard**

In `src/components/ai/cards/AlertBriefingCard.tsx`:
- Update import: remove `rssiToZone`, `formatMac` if no longer needed, or update to new function names
- Line 113: Replace `{alert.rssi} dBm · {rssiToZone(alert.rssi).split(' ')[0]}` with `{alert.confidence}% · ~{alert.accuracyMeters.toFixed(0)}m`
- Replace `formatMac(alert.macAddress)` with `alert.fingerprintHash`

- [ ] **Step 2: Update SitrepCard**

In `src/components/ai/cards/SitrepCard.tsx`:
- Update import: remove `rssiToZone`, `formatMac` references
- Line 95: Same replacement as AlertBriefingCard — `{alert.confidence}% · ~{alert.accuracyMeters.toFixed(0)}m`
- Replace `formatMac(alert.macAddress)` with `alert.fingerprintHash`

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/cards/AlertBriefingCard.tsx src/components/ai/cards/SitrepCard.tsx
git commit -m "refactor: update AI cards to use confidence/accuracyMeters/fingerprintHash"
```

---

### Task 11: Update LLM Services

**Files:**
- Modify: `src/services/llm/FocusedContextBuilder.ts`
- Modify: `src/services/llm/ResponseProcessor.ts`
- Modify: `src/services/llm/templates/AlertSummaryTemplate.ts`
- Modify: `src/services/llm/templates/PatternAnalysisTemplate.ts`

- [ ] **Step 1: Update FocusedContextBuilder**

Replace `rssiToZone` function (lines 42-52) with accuracy-based zone:
```typescript
function accuracyToZone(accuracyMeters: number): string {
  if (accuracyMeters < 5) {
    return 'IMMEDIATE (within 15 feet)';
  }
  if (accuracyMeters < 10) {
    return 'CLOSE (15-30 feet)';
  }
  if (accuracyMeters < 25) {
    return 'NEARBY (30-80 feet)';
  }
  return 'FAR (80+ feet)';
}
```

Replace `formatMac` function (lines 133-136) with:
```typescript
function formatFingerprint(fingerprintHash: string): string {
  return fingerprintHash;
}
```

Update alert grouping (line 274, 439-440): group by `alert.fingerprintHash` instead of `alert.macAddress`.

Update alert formatting (line 177): replace `Signal: ${alert.rssi} dBm (${rssiToZone(alert.rssi)})` with `Confidence: ${alert.confidence}% (${accuracyToZone(alert.accuracyMeters)})`.

Update known-device matching (line 166): `candidate.fingerprintHash === alert.fingerprintHash`.

Update exports (line 333): export `accuracyToZone` and `formatFingerprint` instead of `rssiToZone` and `formatMac`.

- [ ] **Step 2: Update ResponseProcessor**

Line 79: Replace `signal ${alert.rssi} dBm` with `confidence ${alert.confidence}%`.

- [ ] **Step 3: Update AlertSummaryTemplate**

Replace RSSI zone mapping (lines 101-105) with accuracy-based zone mapping. Replace MAC display (lines 134-139) with fingerprint display. Replace signal strength display (line 79) with confidence display.

- [ ] **Step 4: Update PatternAnalysisTemplate**

Line 54: Replace `mac_address` reference with `fingerprintHash`.

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/FocusedContextBuilder.ts src/services/llm/ResponseProcessor.ts src/services/llm/templates/AlertSummaryTemplate.ts src/services/llm/templates/PatternAnalysisTemplate.ts
git commit -m "refactor: update LLM services to use confidence/accuracyMeters/fingerprintHash"
```

---

### Task 12: Rewrite ThreatClassifier

**Files:**
- Modify: `src/services/threatClassifier.ts`

- [ ] **Step 1: Rewrite classifyAlert**

The current implementation uses `rssi`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration` — all removed. Rewrite:

```typescript
import { Alert, ThreatLevel } from '@types';

export class ThreatClassifier {
  static classifyAlert(alert: Alert): ThreatLevel {
    let score = 0;

    // High confidence = more certain detection
    if (alert.confidence >= 80) {
      score += 30;
    } else if (alert.confidence >= 60) {
      score += 15;
    }

    // Close proximity = higher threat
    if (alert.accuracyMeters < 10) {
      score += 30;
    } else if (alert.accuracyMeters < 25) {
      score += 15;
    }

    // Cellular-only detection (potential stealth)
    if (alert.detectionType === 'cellular') {
      score += 20;
    }

    // Time of day (nighttime is higher threat)
    const hour = new Date(alert.timestamp).getHours();
    if (hour >= 22 || hour <= 6) {
      score += 20;
    }

    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  static categorizeDevice(_alert: Alert): string {
    return 'Unknown';
  }

  static analyzePattern(alerts: Alert[]): {
    isRecurring: boolean;
    commonTimes: number[];
    averageDuration: number;
  } {
    if (alerts.length === 0) {
      return { isRecurring: false, commonTimes: [], averageDuration: 0 };
    }

    const hourCounts: Record<number, number> = {};
    alerts.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const commonTimes = Object.entries(hourCounts)
      .filter(([, count]) => count >= 2)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => hourCounts[b] - hourCounts[a]);

    const dates = new Set(
      alerts.map(alert => new Date(alert.timestamp).toDateString())
    );

    return {
      isRecurring: dates.size >= 3,
      commonTimes,
      averageDuration: 0,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/threatClassifier.ts
git commit -m "refactor: rewrite ThreatClassifier for fingerprint-first alert model"
```

---

### Task 13: Update deviceFingerprinting, patternDetection, and fingerprintStore

**Files:**
- Modify: `src/services/deviceFingerprinting.ts`
- Modify: `src/services/patternDetection.ts`
- Modify: `src/services/fingerprintStore.ts`

- [ ] **Step 1: Update deviceFingerprinting**

Replace all `macAddress` params with `fingerprintHash`. Replace `rssi: alert.rssi` with `confidence: alert.confidence` in detection tracking. Update `findOne({ macAddress })` calls to `findOne({ fingerprintHash })`.

- [ ] **Step 2: Update patternDetection**

Replace `computeVisitPattern(allAlerts, macAddress)` with `computeVisitPattern(allAlerts, fingerprintHash)`. Update the filter: `alert.fingerprintHash === fingerprintHash`.

- [ ] **Step 3: Update fingerprintStore**

Update `FingerprintRepository` interface: `findOne(query: { fingerprintHash: string })`. Update in-memory map to key by `fingerprintHash`.

- [ ] **Step 4: Commit**

```bash
git add src/services/deviceFingerprinting.ts src/services/patternDetection.ts src/services/fingerprintStore.ts
git commit -m "refactor: update fingerprint services to use fingerprintHash"
```

---

### Task 14: Update Blocked Devices (Redux Slice + Hook)

**Files:**
- Modify: `src/store/slices/blockedDevicesSlice.ts`
- Modify: `src/hooks/useBlockedDevices.ts`

- [ ] **Step 1: Update BlockedDevice interface**

```typescript
interface BlockedDevice {
  fingerprintHash: string;
  blockedAt: string;
  reason?: string;
}
```

- [ ] **Step 2: Update blockDevice reducer**

Replace `action.payload.macAddress` with `action.payload.fingerprintHash`. Update the PayloadAction type accordingly.

- [ ] **Step 3: Update isDeviceBlocked selector**

Replace `macAddress` param with `fingerprintHash`.

- [ ] **Step 4: Update useBlockedDevices hook**

Replace all `macAddress` params with `fingerprintHash` in `isBlocked`, `block`, and `unblock` callbacks.

- [ ] **Step 5: Commit**

```bash
git add src/store/slices/blockedDevicesSlice.ts src/hooks/useBlockedDevices.ts
git commit -m "refactor: update blocked devices to key by fingerprintHash"
```

---

### Task 15: Update useSecurityContext

**Files:**
- Modify: `src/hooks/useSecurityContext.ts`

- [ ] **Step 1: Update the context string builder**

Replace lines 190-197 in the recent alerts formatter:
```typescript
// Old:
const rssi = a.rssi ? `${a.rssi} dBm` : 'N/A';
const mac = a.macAddress || 'N/A';
...
- Signal strength: ${rssi}
- MAC: ${mac}

// New:
const confidence = a.confidence != null ? `${a.confidence}%` : 'N/A';
const fingerprint = a.fingerprintHash || 'N/A';
...
- Confidence: ${confidence}
- Fingerprint: ${fingerprint}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSecurityContext.ts
git commit -m "refactor: update useSecurityContext to use confidence/fingerprintHash"
```

---

### Task 16: Update Analytics API and Hook

**Files:**
- Modify: `src/api/analytics.ts`
- Modify: `src/hooks/useAnalytics.ts`

- [ ] **Step 1: Update analytics API**

In `src/api/analytics.ts`:
- Line 37: `async getDeviceHistory(fingerprintHash: string)` — update param name and URL path
- Update `getTopDevices` return type: `macAddress` → `fingerprintHash`

- [ ] **Step 2: Update useAnalytics hook**

In `src/hooks/useAnalytics.ts`:
- Line 50: `export const useDeviceHistory = (fingerprintHash: string) =>`
- Update query key: `['device-history', fingerprintHash]`
- Update queryFn: `analyticsApi.getDeviceHistory(fingerprintHash)`
- Update enabled: `!!fingerprintHash`

- [ ] **Step 3: Commit**

```bash
git add src/api/analytics.ts src/hooks/useAnalytics.ts
git commit -m "refactor: update analytics API and hook to use fingerprintHash"
```

---

### Task 17: Update Replay/Radar Hooks and Screens

**Files:**
- Modify: `src/hooks/useTimeBucketing.ts`
- Modify: `src/hooks/useReplayPath.ts`
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`
- Modify: `src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx`
- Modify: `src/components/molecules/FingerprintPeek/FingerprintPeek.tsx`

- [ ] **Step 1: Update useTimeBucketing**

Replace macAddress-based alert-position joining:
- Line 32: `if (position.fingerprintHash) {` (was `position.macAddress`)
- Line 34: `alert.fingerprintHash !== position.fingerprintHash` (was `alert.macAddress !== position.macAddress`)
- Line 106: `fingerprintHash: matchingAlert?.fingerprintHash ?? position.fingerprintHash ?? ''` (remove macAddress fallback)

- [ ] **Step 2: Update useReplayPath**

Replace all macAddress-based grouping with fingerprintHash:
- Line 15, 23, 32: interface fields `macAddress` → `fingerprintHash`
- Line 66: `deviceMinutes.get(entry.fingerprintHash)`
- Line 69: `deviceMinutes.set(entry.fingerprintHash, minuteMap)`
- Line 83: `([fingerprintHash, minuteMap])` in map callback
- Line 90: `fingerprintHash,` in returned object
- Line 194, 214: `fingerprintHash: path.fingerprintHash`

- [ ] **Step 3: Update ProximityHeatmapScreen**

Replace all macAddress references:
- Line 278: `fingerprintHash={selectedPosition.fingerprintHash || ''}`
- Line 281-283: `onViewProfile={fingerprintHash => navigation.navigate('DeviceFingerprint', { fingerprintHash })}`
- Lines 358-361: dedup by `e.fingerprintHash` instead of `e.macAddress`
- Lines 558-563: navigation uses `alerts[0]?.fingerprintHash`
- Lines 674-716: trail keys and IDs use `trail.fingerprintHash`, `entry.fingerprintHash`
- Line 722: `setPeekMac` → `setPeekFingerprint` (rename state variable)
- Lines 792-799: FingerprintPeek props use `fingerprintHash`

- [ ] **Step 4: Update ReplayRadarDisplay**

- Line 34: `onDotTap?: (fingerprintHash: string) => void;`
- Line 80: `if (!dot.fingerprintHash) {`
- Line 87: `onDotTap?.(dot.fingerprintHash);`

- [ ] **Step 5: Update FingerprintPeek**

Replace `macAddress` prop usage with `fingerprintHash`:
- Line 7: `fingerprintHash` prop (type already updated in Task 2)
- Line 11: display `fingerprintHash` substring instead of macAddress
- Line 53-56: button disabled check and onPress use `fingerprintHash`

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTimeBucketing.ts src/hooks/useReplayPath.ts src/screens/radar/ProximityHeatmapScreen.tsx src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx src/components/molecules/FingerprintPeek/FingerprintPeek.tsx
git commit -m "refactor: update replay/radar to use fingerprintHash instead of macAddress"
```

---

### Task 18: Update Known Device Screens and Components

**Files:**
- Modify: `src/screens/settings/AddKnownDeviceScreen.tsx`
- Modify: `src/screens/settings/KnownDevicesScreen.tsx`
- Modify: `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx`

- [ ] **Step 1: Update AddKnownDeviceScreen**

- Route param: `fingerprintHash: initialFingerprint` instead of `macAddress: initialMac`
- State: `const [fingerprintHash, setFingerprintHash] = useState(initialFingerprint || '')`
- Validation: replace MAC regex with fingerprint format check: `/^[wbc]_[0-9a-f]{4,10}$/`
- Input label: "Fingerprint ID", placeholder: "e.g., w_3a7fb2e1"
- Help card: explain fingerprint format instead of MAC format
- Submit payload: `fingerprintHash` instead of `macAddress`

- [ ] **Step 2: Update KnownDevicesScreen**

- `KnownDeviceItemCardProps.macAddress` → `fingerprintHash`
- All `device.macAddress` → `device.fingerprintHash`

- [ ] **Step 3: Update KnownDeviceItem**

```typescript
interface KnownDeviceItemProps {
  name: string;
  fingerprintHash: string;
  category: string;
  onDelete: () => void;
}
```

Update destructuring and `subtitle={fingerprintHash}`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/settings/AddKnownDeviceScreen.tsx src/screens/settings/KnownDevicesScreen.tsx src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx
git commit -m "refactor: update known device screens to use fingerprintHash"
```

---

### Task 19: Update Mock Alerts Data

**Files:**
- Modify: `src/mocks/data/mockAlerts.ts`

- [ ] **Step 1: Replace generateMac with generateFingerprintHash**

```typescript
const generateFingerprintHash = (type: DetectionType): string => {
  const prefix = type === 'wifi' ? 'w' : type === 'bluetooth' ? 'b' : 'c';
  const hash = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${hash}`;
};
```

- [ ] **Step 2: Update persona definitions**

Replace `macAddress` with `fingerprintHash` using backend prefix format:
```typescript
// Example: { macAddress: 'AA:1A:28:3C:46:50', signalType: 'cellular' }
// Becomes: { fingerprintHash: 'c_3c4650', signalType: 'cellular' }
```

- [ ] **Step 3: Update all mock alert objects**

For each alert:
- Remove: `rssi`, `macAddress`, `cellularStrength`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration`
- Add: `fingerprintHash`, `confidence` (0-100 integer), `accuracyMeters` (3-30 float)

- [ ] **Step 4: Update PERSONA_MACS → PERSONA_FINGERPRINTS**

```typescript
export const PERSONA_FINGERPRINTS: Array<{
  fingerprintHash: string;
  signalType: DetectionType;
}> = personas.map(p => ({
  fingerprintHash: p.fingerprintHash,
  signalType: p.signalType,
}));
```

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/mockAlerts.ts
git commit -m "refactor: update mock alerts to fingerprint-first shape"
```

---

### Task 20: Update Mock Analytics, Known Devices, and WebSocket

**Files:**
- Modify: `src/mocks/data/mockAnalytics.ts`
- Modify: `src/mocks/data/mockKnownDevices.ts`
- Modify: `src/mocks/mockWebSocket.ts`

- [ ] **Step 1: Update mockAnalytics**

- `uniqueMacAddresses` → `uniqueFingerprints` from `alert.fingerprintHash`
- `topDetectedDevices` maps `fingerprintHash`
- `generateDeviceFingerprint` takes `fingerprintHash`, returns updated shape with `confidence` in detections (not `rssi`)

- [ ] **Step 2: Update mockKnownDevices**

Replace all `macAddress` values with `fingerprintHash` values using prefix format.

- [ ] **Step 3: Update mockWebSocket**

- Replace `generateRandomMAC()` with `generateRandomFingerprint(type)` returning `${prefix}_${hash}`
- Replace `rssi` generation with `confidence` (20-80 integer) and `accuracyMeters` (3-28 float)
- Remove `cellularStrength`, detection-era booleans from generated alerts
- Update metadata to use `source: 'positions'`

- [ ] **Step 4: Commit**

```bash
git add src/mocks/data/mockAnalytics.ts src/mocks/data/mockKnownDevices.ts src/mocks/mockWebSocket.ts
git commit -m "refactor: update mock analytics, known devices, and WebSocket for fingerprint-first"
```

---

### Task 21: Update Seed Data, Replay Positions, and Fix Confidence Scale

**Files:**
- Modify: `src/utils/seedMockData.ts`
- Modify: `src/mocks/data/mockReplayPositions.ts`

- [ ] **Step 1: Update seedMockData**

- Replace `PERSONA_MACS` import with `PERSONA_FINGERPRINTS`
- Update fingerprint generation to use `w_`/`b_`/`c_` prefix format
- Fix confidence scale: replace `confidence: 0.7 + Math.random() * 0.3` with `confidence: 70 + Math.floor(Math.random() * 30)` (0-100 integer)
- Update fingerprint seeding: key by `fingerprint.fingerprintHash` instead of `fingerprint.macAddress`

- [ ] **Step 2: Update mockReplayPositions**

- Remove `macAddress` from `ScenarioDefinition` interface
- Update `createScenarioAlert()`: `fingerprintHash: scenario.fingerprintHash`, `confidence: 75`, `accuracyMeters: 8.5` (remove `rssi`, `macAddress`)
- Fix confidence scale in position generation: multiply existing 0-1 values by 100 to get 0-100 integers
- Remove detection-era booleans from generated alerts

- [ ] **Step 3: Commit**

```bash
git add src/utils/seedMockData.ts src/mocks/data/mockReplayPositions.ts
git commit -m "refactor: update seed data and replay positions, fix confidence to 0-100 scale"
```

---

### Task 22: Update Tests

**Files:**
- Modify: `__tests__/hooks/useAlerts.test.tsx`

- [ ] **Step 1: Verify existing tests still pass**

Run: `npx jest __tests__/hooks/useAlerts.test.tsx --verbose`

The test mocks use generic objects (`type`, `severity`, `message`) that don't match the Alert type. They test the hook, not the shape. They should still pass.

- [ ] **Step 2: Fix if needed**

If tests fail due to type changes, update mock objects to include `fingerprintHash`, `confidence`, `accuracyMeters`.

- [ ] **Step 3: Commit if changes were needed**

```bash
git add __tests__/hooks/useAlerts.test.tsx
git commit -m "test: update alert test fixtures for fingerprint-first model"
```

---

### Task 23: Full Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full type-check**

Run: `npm run type-check`

Expected: Zero TypeScript errors. If any remain, they indicate missed `rssi`/`macAddress`/`RSSIInterpretation` references.

- [ ] **Step 2: Search for any remaining old references**

Run:
```bash
grep -r '\.rssi\b' src/ --include='*.ts' --include='*.tsx' -l
grep -r '\.macAddress\b' src/ --include='*.ts' --include='*.tsx' -l
grep -r 'interpretRSSI\|RSSIInterpretation' src/ --include='*.ts' --include='*.tsx' -l
grep -r 'estimateDistance\|calculateAngleFromMAC\|getSignalStrength' src/ --include='*.ts' --include='*.tsx' -l
```

Expected: No results for any of these. If found, fix the remaining references.

- [ ] **Step 3: Run full test suite**

Run: `npm test`

Expected: All tests pass.

- [ ] **Step 4: Run lint**

Run: `npm run lint:fix`

Expected: Clean or auto-fixed.

- [ ] **Step 5: Smoke-check key screens**

Start the app and verify these screens render without crashes:
- Alert list screen (search, filter)
- Alert detail screen (signal tab, location tab)
- Device fingerprint screen (from alert navigation)
- Home/PropertyCommandCenter (recent visitor display)
- Radar/replay (dot tap, fingerprint peek)
- Known devices list
- Add known device screen
- AI briefing card

Run: `npm start` and open in simulator.

- [ ] **Step 6: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: resolve remaining issues from alert contract alignment"
```

---

### Task 24: Backend Response Mapper (Separate Repository)

**This task is executed in the `trailsense-backend` repository, NOT this workspace.**

- [ ] **Step 1: Add toAlertDTO function**

In `trailsense-backend/src/controllers/alertsController.ts`:

```typescript
interface AlertDTO {
  id: string;
  deviceId: string;
  timestamp: Date;
  threatLevel: string;
  detectionType: string;
  fingerprintHash: string;
  confidence: number;
  accuracyMeters: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  location?: { latitude: number; longitude: number };
  metadata: any;
}

function toAlertDTO(alert: any): AlertDTO {
  return {
    id: alert.id,
    deviceId: alert.deviceId,
    timestamp: alert.timestamp,
    threatLevel: alert.threatLevel,
    detectionType: alert.detectionType,
    fingerprintHash: alert.fingerprintHash,
    confidence: alert.confidence,
    accuracyMeters: alert.accuracyMeters,
    isReviewed: alert.isReviewed,
    isFalsePositive: alert.isFalsePositive,
    location:
      alert.latitude != null && alert.longitude != null
        ? { latitude: alert.latitude, longitude: alert.longitude }
        : undefined,
    metadata: alert.metadata,
  };
}
```

- [ ] **Step 2: Apply mapper in getAlerts and getAlertById**

```typescript
// getAlerts:
res.json(alerts.map(toAlertDTO));

// getAlertById:
res.json(toAlertDTO(alert));
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add alert response mapper (toAlertDTO) for stable API contract"
```
