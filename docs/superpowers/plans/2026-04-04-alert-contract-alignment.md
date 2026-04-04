# Alert Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the mobile Alert type, UI, and mock data with the backend's fingerprint-first data model.

**Architecture:** Replace `rssi`/`macAddress` with `fingerprintHash`/`confidence`/`accuracyMeters` across types, components, services, Redux slices, navigation params, and mock data. Add a backend response mapper to formalize the DTO contract.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Redux Toolkit, React Query, Jest

**Spec:** `docs/superpowers/specs/2026-04-04-alert-contract-alignment-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types/alert.ts` | Alert, AlertMetadata, DeviceFingerprint, AnalyticsData types |
| Modify | `src/utils/visualEffects.ts` | Replace `interpretRSSI` with `interpretConfidence` |
| Modify | `src/components/organisms/AlertCard/AlertCard.tsx` | Card display: confidence, accuracy, fingerprintHash |
| Modify | `src/screens/alerts/AlertDetailScreen.tsx` | Detail display: confidence, accuracy, fingerprintHash |
| Modify | `src/screens/alerts/AlertListScreen.tsx` | Search/filter by fingerprintHash |
| Modify | `src/screens/fingerprint/DeviceFingerprintScreen.tsx` | Route param + alert filtering by fingerprintHash |
| Modify | `src/navigation/types.ts` | Navigation param types: macAddress → fingerprintHash |
| Modify | `src/hooks/useBlockedDevices.ts` | Block/unblock by fingerprintHash |
| Modify | `src/store/slices/blockedDevicesSlice.ts` | Redux state keyed by fingerprintHash |
| Modify | `src/services/patternDetection.ts` | `computeVisitPattern` param: macAddress → fingerprintHash |
| Modify | `src/services/fingerprintStore.ts` | Repository keyed by fingerprintHash |
| Modify | `src/types/knownDevice.ts` | KnownDevice, CreateKnownDeviceDTO types |
| Modify | `src/screens/settings/AddKnownDeviceScreen.tsx` | Fingerprint input instead of MAC input |
| Modify | `src/screens/settings/KnownDevicesScreen.tsx` | Display fingerprintHash in device list |
| Modify | `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx` | Props: macAddress → fingerprintHash |
| Modify | `src/mocks/data/mockKnownDevices.ts` | Mock known devices with fingerprintHash |
| Modify | `src/mocks/data/mockAlerts.ts` | Mock alert objects with new shape |
| Modify | `src/mocks/data/mockAnalytics.ts` | Analytics grouping by fingerprintHash |
| Modify | `src/mocks/mockWebSocket.ts` | Live mock alert generation |
| Modify | `src/utils/seedMockData.ts` | Seed data with new alert shape |
| Modify | `src/mocks/data/mockReplayPositions.ts` | Replay alert pairing |
| Modify | `__tests__/hooks/useAlerts.test.tsx` | Update mock alert shapes in tests |
| Modify | `trailsense-backend/src/controllers/alertsController.ts` | Add `toAlertDTO` response mapper |

---

### Task 1: Update Alert and AlertMetadata Types

**Files:**
- Modify: `src/types/alert.ts`

- [ ] **Step 1: Update AlertMetadata interface**

In `src/types/alert.ts`, replace the `AlertMetadata` interface (lines 8-44) with:

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

In the `AnalyticsData` interface (line 100), change:

```typescript
// Old:
topDetectedDevices: Array<{ macAddress: string; count: number }>;
// New:
topDetectedDevices: Array<{ fingerprintHash: string; count: number }>;
```

- [ ] **Step 5: Run type-check to see all downstream breakages**

Run: `npm run type-check 2>&1 | head -80`

Expected: TypeScript errors in AlertCard, AlertDetailScreen, AlertListScreen, DeviceFingerprintScreen, mockAlerts, mockAnalytics, mockWebSocket, seedMockData, blockedDevicesSlice, patternDetection, fingerprintStore, visualEffects, useBlockedDevices. These will be fixed in subsequent tasks.

- [ ] **Step 6: Commit type changes**

```bash
git add src/types/alert.ts
git commit -m "refactor: update Alert types to fingerprint-first model

Remove rssi, macAddress, cellularStrength and detection-era booleans.
Add fingerprintHash, confidence, accuracyMeters as required fields.
Update AlertMetadata, DeviceFingerprint, and AnalyticsData accordingly."
```

---

### Task 2: Replace interpretRSSI with interpretConfidence in visualEffects

**Files:**
- Modify: `src/utils/visualEffects.ts:240-268`

- [ ] **Step 1: Replace the RSSI interpretation section**

In `src/utils/visualEffects.ts`, replace lines 240-268 (the `RSSIInterpretation` interface and `interpretRSSI` function) with:

```typescript
// =============================================================================
// CONFIDENCE INTERPRETATION
// =============================================================================

export interface ConfidenceInterpretation {
  label: string;
  color: string;
  percentage: number; // For progress bar visualization (0-100)
}

/**
 * Interpret confidence value (0-100) into human-readable proximity form
 */
export const interpretConfidence = (
  confidence: number
): ConfidenceInterpretation => {
  if (confidence >= 80) {
    return { label: 'Very Close', color: '#FF453A', percentage: 95 };
  }
  if (confidence >= 60) {
    return { label: 'Close', color: '#FF9F0A', percentage: 75 };
  }
  if (confidence >= 40) {
    return { label: 'Nearby', color: '#FFCC00', percentage: 55 };
  }
  if (confidence >= 20) {
    return { label: 'Moderate', color: '#30D158', percentage: 35 };
  }
  return { label: 'Distant', color: '#8E8E93', percentage: 15 };
};

```

- [ ] **Step 2: Commit**

```bash
git add src/utils/visualEffects.ts
git commit -m "refactor: replace interpretRSSI with interpretConfidence and interpretAccuracy"
```

---

### Task 3: Update AlertCard Component

**Files:**
- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

- [ ] **Step 1: Update the import**

Change the import from `interpretRSSI` to `interpretConfidence`:

```typescript
// Old:
import { interpretRSSI, getThreatColor } from '@utils/visualEffects';
// New:
import { interpretConfidence, getThreatColor } from '@utils/visualEffects';
```

- [ ] **Step 2: Update the props interface**

Change `onAddToKnown` callback parameter from `macAddress` to `fingerprintHash`:

```typescript
// Old:
onAddToKnown?: (macAddress: string) => void;
// New:
onAddToKnown?: (fingerprintHash: string) => void;
```

- [ ] **Step 3: Update RSSI interpretation call**

Replace line 159:

```typescript
// Old:
const rssiInfo = interpretRSSI(alert.rssi);
// New:
const confidenceInfo = interpretConfidence(alert.confidence);
```

- [ ] **Step 4: Update all references to rssiInfo**

Throughout the component, replace:
- `rssiInfo.color` → `confidenceInfo.color`
- `rssiInfo.label` → `confidenceInfo.label`

- [ ] **Step 5: Update the RSSI dBm display**

Replace the metadata row that shows `{alert.rssi} dBm` (around line 221) with:

```typescript
{alert.confidence}%
```

- [ ] **Step 6: Update the macAddress display**

Replace the macAddress conditional block (around lines 254-270) that shows the last 5 chars of `alert.macAddress`. Remove the conditional guard (fingerprintHash is always present) and display the full hash:

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

- [ ] **Step 7: Run type-check on this file**

Run: `npx tsc --noEmit 2>&1 | grep AlertCard`

Expected: No errors for AlertCard.

- [ ] **Step 8: Commit**

```bash
git add src/components/organisms/AlertCard/AlertCard.tsx
git commit -m "refactor: update AlertCard to use confidence and fingerprintHash"
```

---

### Task 4: Update AlertDetailScreen

**Files:**
- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

- [ ] **Step 1: Replace getProximityLabel helper**

Replace lines 46-50:

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

- [ ] **Step 2: Update heroMetrics array**

Replace lines 107-111:

```typescript
// Old:
const heroMetrics = [
  `${alert.rssi} dBm`,
  getProximityLabel(alert.rssi),
  deviceName || alert.deviceId,
];

// New:
const heroMetrics = [
  `${alert.confidence}%`,
  getConfidenceLabel(alert.confidence),
  deviceName || alert.deviceId,
];
```

- [ ] **Step 3: Update Signal Strength section**

Replace the RSSI GroupedListRow (around line 122) with:

```typescript
<GroupedListRow
  icon="cellular"
  iconColor={colors.systemBlue}
  title="Confidence"
  value={`${alert.confidence}%`}
/>
```

Replace the Proximity GroupedListRow (around line 128) with:

```typescript
<GroupedListRow
  icon="locate-outline"
  iconColor={colors.systemGreen}
  title="Estimated Accuracy"
  value={`~${alert.accuracyMeters.toFixed(1)}m`}
/>
```

- [ ] **Step 4: Update Device Fingerprint section**

Replace the macAddress display (around lines 134-140):

```typescript
// Old:
{alert.macAddress && (
  <GroupedListRow
    icon="qr-code-outline"
    iconColor={colors.systemPurple}
    title="MAC Address"
    value={alert.macAddress}
  />
)}

// New:
<GroupedListRow
  icon="qr-code-outline"
  iconColor={colors.systemPurple}
  title="Fingerprint ID"
  value={alert.fingerprintHash}
/>
```

- [ ] **Step 5: Update DeviceFingerprint navigation**

Replace lines 148-161:

```typescript
// Old:
{alert.macAddress && (
  <GroupedListRow
    ...
    onPress={() =>
      (navigation as any).navigate('DeviceFingerprint', {
        macAddress: alert.macAddress,
      })
    }
  />
)}

// New:
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

- [ ] **Step 6: Run type-check on this file**

Run: `npx tsc --noEmit 2>&1 | grep AlertDetailScreen`

Expected: No errors for AlertDetailScreen.

- [ ] **Step 7: Commit**

```bash
git add src/screens/alerts/AlertDetailScreen.tsx
git commit -m "refactor: update AlertDetailScreen to use confidence and fingerprintHash"
```

---

### Task 5: Update AlertListScreen Search and Filtering

**Files:**
- Modify: `src/screens/alerts/AlertListScreen.tsx`

- [ ] **Step 1: Update search filter**

Replace the macAddress search match (around lines 101-102):

```typescript
// Old:
(alert.macAddress &&
  alert.macAddress.toLowerCase().includes(search.toLowerCase()))

// New:
alert.fingerprintHash.toLowerCase().includes(search.toLowerCase())
```

- [ ] **Step 2: Update blocked device filtering**

Replace the blocked device filter (around line 119):

```typescript
// Old:
result = result.filter((alert: Alert) => !isBlocked(alert.macAddress));

// New:
result = result.filter((alert: Alert) => !isBlocked(alert.fingerprintHash));
```

- [ ] **Step 3: Update handleAddToKnown**

Replace the handleAddToKnown function (around lines 179-183):

```typescript
// Old:
const handleAddToKnown = (macAddress: string) => {
  navigation.getParent()?.navigate('MoreTab', {
    screen: 'AddKnownDevice',
    params: { macAddress },
  });
};

// New:
const handleAddToKnown = (fingerprintHash: string) => {
  navigation.getParent()?.navigate('MoreTab', {
    screen: 'AddKnownDevice',
    params: { fingerprintHash },
  });
};
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/alerts/AlertListScreen.tsx
git commit -m "refactor: update AlertListScreen search/filter to use fingerprintHash"
```

---

### Task 6: Update Navigation Types

**Files:**
- Modify: `src/navigation/types.ts`

- [ ] **Step 1: Update all DeviceFingerprint route params**

Replace all occurrences of `DeviceFingerprint: { macAddress: string }` with `DeviceFingerprint: { fingerprintHash: string }`. This appears on lines 31, 38, 44, 50, and 77.

- [ ] **Step 2: Update AddKnownDevice params**

Replace both occurrences of `AddKnownDevice: { macAddress?: string; deviceId?: string } | undefined` (lines 76 and 91) with:

```typescript
AddKnownDevice: { fingerprintHash?: string; deviceId?: string } | undefined;
```

- [ ] **Step 3: Commit**

```bash
git add src/navigation/types.ts
git commit -m "refactor: update navigation params from macAddress to fingerprintHash"
```

---

### Task 7: Update DeviceFingerprintScreen

**Files:**
- Modify: `src/screens/fingerprint/DeviceFingerprintScreen.tsx`

- [ ] **Step 1: Update route param destructuring**

Replace line 21:

```typescript
// Old:
const { macAddress } = route.params;
// New:
const { fingerprintHash } = route.params;
```

- [ ] **Step 2: Update all macAddress references throughout the file**

Replace every `macAddress` reference in this file with `fingerprintHash`. Specifically:

- Line 27: `computeVisitPattern(alerts, macAddress)` → `computeVisitPattern(alerts, fingerprintHash)`
- Line 34: `alert.macAddress === macAddress` → `alert.fingerprintHash === fingerprintHash`
- Line 39: `[alerts, macAddress]` → `[alerts, fingerprintHash]`
- Line 42: `device.macAddress === macAddress` → `device.fingerprintHash === fingerprintHash`
- Line 44: `isBlocked(macAddress)` → `isBlocked(fingerprintHash)`
- Line 47: `logEvent(AnalyticsEvents.FINGERPRINT_VIEWED, { macAddress })` �� `logEvent(AnalyticsEvents.FINGERPRINT_VIEWED, { fingerprintHash })`
- Line 48: `[macAddress]` → `[fingerprintHash]`
- Line 66: `params: { macAddress }` → `params: { fingerprintHash }`
- Line 72: `unblock(macAddress)` → `unblock(fingerprintHash)`
- Line 76: `block(macAddress)` → `block(fingerprintHash)`
- Line 83: `subtitle: macAddress` → `subtitle: fingerprintHash`

- [ ] **Step 3: Update knownDevices lookup**

The `knownDevices.find()` call on line 41-43 needs to match by `fingerprintHash`:

```typescript
// Old:
const knownDevice = knownDevices.find(
  device => device.macAddress === macAddress
);
// New:
const knownDevice = knownDevices.find(
  device => device.fingerprintHash === fingerprintHash
);
```

Note: This assumes the KnownDevice type also shifts to fingerprintHash. If the KnownDevice type still uses macAddress, this lookup should use whichever field KnownDevice carries. Check the `useKnownDevices` hook to confirm.

- [ ] **Step 4: Commit**

```bash
git add src/screens/fingerprint/DeviceFingerprintScreen.tsx
git commit -m "refactor: update DeviceFingerprintScreen to use fingerprintHash"
```

---

### Task 8: Update Blocked Devices (Redux Slice + Hook)

**Files:**
- Modify: `src/store/slices/blockedDevicesSlice.ts`
- Modify: `src/hooks/useBlockedDevices.ts`

- [ ] **Step 1: Update BlockedDevice interface in Redux slice**

In `src/store/slices/blockedDevicesSlice.ts`, replace lines 3-7:

```typescript
// Old:
interface BlockedDevice {
  macAddress: string;
  blockedAt: string;
  reason?: string;
}

// New:
interface BlockedDevice {
  fingerprintHash: string;
  blockedAt: string;
  reason?: string;
}
```

- [ ] **Step 2: Update blockDevice reducer**

Replace the `blockDevice` reducer (lines 21-29):

```typescript
blockDevice: (
  state,
  action: PayloadAction<{ fingerprintHash: string; reason?: string }>
) => {
  state.devices[action.payload.fingerprintHash] = {
    fingerprintHash: action.payload.fingerprintHash,
    blockedAt: new Date().toISOString(),
    reason: action.payload.reason,
  };
},
```

- [ ] **Step 3: Update the isDeviceBlocked selector**

Replace lines 45-48:

```typescript
// Old:
export const isDeviceBlocked = (
  state: { blockedDevices: BlockedDevicesState },
  macAddress: string
): boolean => macAddress in state.blockedDevices.devices;

// New:
export const isDeviceBlocked = (
  state: { blockedDevices: BlockedDevicesState },
  fingerprintHash: string
): boolean => fingerprintHash in state.blockedDevices.devices;
```

- [ ] **Step 4: Update useBlockedDevices hook**

In `src/hooks/useBlockedDevices.ts`, replace all `macAddress` parameter names with `fingerprintHash`:

```typescript
const isBlocked = useCallback(
  (fingerprintHash: string) => fingerprintHash in blockedDevices,
  [blockedDevices]
);

const block = useCallback(
  (fingerprintHash: string, reason?: string) => {
    dispatch(blockDevice({ fingerprintHash, reason }));
    logEvent(AnalyticsEvents.DEVICE_BLOCKED, { fingerprintHash });
    showToast(
      'Device blocked. Alerts from this device are now hidden.',
      'info'
    );
  },
  [dispatch, showToast]
);

const unblock = useCallback(
  (fingerprintHash: string) => {
    dispatch(unblockDevice(fingerprintHash));
    showToast('Device unblocked', 'success');
  },
  [dispatch, showToast]
);
```

- [ ] **Step 5: Commit**

```bash
git add src/store/slices/blockedDevicesSlice.ts src/hooks/useBlockedDevices.ts
git commit -m "refactor: update blocked devices to key by fingerprintHash"
```

---

### Task 9: Update Pattern Detection and Fingerprint Store Services

**Files:**
- Modify: `src/services/patternDetection.ts`
- Modify: `src/services/fingerprintStore.ts`

- [ ] **Step 1: Update computeVisitPattern**

In `src/services/patternDetection.ts`, update the function signature and filter (around lines 16-25):

```typescript
// Old:
export function computeVisitPattern(
  allAlerts: Alert[],
  macAddress: string
): VisitPattern {
  const deviceAlerts = allAlerts
    .filter(alert => alert.macAddress === macAddress)

// New:
export function computeVisitPattern(
  allAlerts: Alert[],
  fingerprintHash: string
): VisitPattern {
  const deviceAlerts = allAlerts
    .filter(alert => alert.fingerprintHash === fingerprintHash)
```

- [ ] **Step 2: Update FingerprintRepository**

In `src/services/fingerprintStore.ts`, update the repository interface and implementation (lines 3-23):

```typescript
// Old:
interface FingerprintRepository {
  findOne(query: { macAddress: string }): DeviceFingerprint | undefined;
  upsert(fingerprint: DeviceFingerprint): void;
  find(): DeviceFingerprint[];
}

// New:
interface FingerprintRepository {
  findOne(query: { fingerprintHash: string }): DeviceFingerprint | undefined;
  upsert(fingerprint: DeviceFingerprint): void;
  find(): DeviceFingerprint[];
}
```

Update the in-memory implementation to key by `fingerprintHash`:

```typescript
// Old:
inMemoryFingerprints.get(query.macAddress)
inMemoryFingerprints.set(fingerprint.macAddress, fingerprint)

// New:
inMemoryFingerprints.get(query.fingerprintHash)
inMemoryFingerprints.set(fingerprint.fingerprintHash, fingerprint)
```

- [ ] **Step 3: Commit**

```bash
git add src/services/patternDetection.ts src/services/fingerprintStore.ts
git commit -m "refactor: update patternDetection and fingerprintStore to use fingerprintHash"
```

---

### Task 10: Update KnownDevice Type, Screen, and Component

**Files:**
- Modify: `src/types/knownDevice.ts`
- Modify: `src/screens/settings/AddKnownDeviceScreen.tsx`
- Modify: `src/screens/settings/KnownDevicesScreen.tsx`
- Modify: `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx`
- Modify: `src/mocks/data/mockKnownDevices.ts`

- [ ] **Step 1: Update KnownDevice type**

In `src/types/knownDevice.ts`, replace `macAddress` with `fingerprintHash` in both interfaces:

```typescript
export interface KnownDevice {
  id: string;
  name: string;
  fingerprintHash: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnownDeviceDTO {
  name: string;
  fingerprintHash: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
}
```

- [ ] **Step 2: Update AddKnownDeviceScreen**

In `src/screens/settings/AddKnownDeviceScreen.tsx`:

Replace the route param destructuring (line 20):
```typescript
// Old:
const { macAddress: initialMac, deviceId: initialDeviceId } = route.params || {};
// New:
const { fingerprintHash: initialFingerprint, deviceId: initialDeviceId } = route.params || {};
```

Replace the state variable (line 25):
```typescript
// Old:
const [macAddress, setMacAddress] = useState(initialMac || '');
// New:
const [fingerprintHash, setFingerprintHash] = useState(initialFingerprint || '');
```

Replace the MAC validation function (lines 30-34) with fingerprint validation:
```typescript
const validateFingerprintHash = (hash: string): boolean => {
  // Fingerprint format: prefix_hexhash (e.g., w_3a7fb2e1)
  const fpRegex = /^[wbc]_[0-9a-f]{4,10}$/;
  return fpRegex.test(hash);
};
```

Update `handleAdd` (lines 36-83): replace all `macAddress` references with `fingerprintHash`, update validation call to `validateFingerprintHash(fingerprintHash)`, update error messages from "MAC address" to "Fingerprint ID".

Update the input field (lines 107-114):
```typescript
<Input
  label="Fingerprint ID"
  placeholder="e.g., w_3a7fb2e1"
  value={fingerprintHash}
  onChangeText={setFingerprintHash}
  autoCapitalize="none"
  style={styles.input}
/>
```

Replace the help card (lines 157-166):
```typescript
<Card style={styles.helpCard}>
  <Text variant="title3" style={styles.sectionTitle}>
    Fingerprint ID Format
  </Text>
  <Text variant="caption1">- Format: prefix_hexhash</Text>
  <Text variant="caption1">- Prefixes: w_ (WiFi), b_ (Bluetooth), c_ (Cellular)</Text>
  <Text variant="caption1">- Example: w_3a7fb2e1</Text>
  <Text variant="caption1">
    - Tip: Navigate from an alert to auto-fill this field
  </Text>
</Card>
```

- [ ] **Step 3: Update KnownDevicesScreen**

In `src/screens/settings/KnownDevicesScreen.tsx`, update the `KnownDeviceItemCardProps` interface (lines 46-51):

```typescript
// Old:
interface KnownDeviceItemCardProps {
  name: string;
  macAddress: string;
  category?: KnownDevice['category'];
  onDelete: () => void;
}

// New:
interface KnownDeviceItemCardProps {
  name: string;
  fingerprintHash: string;
  category?: KnownDevice['category'];
  onDelete: () => void;
}
```

Update all references to `device.macAddress` in the component to `device.fingerprintHash`.

- [ ] **Step 4: Update KnownDeviceItem component**

In `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx`, replace:

```typescript
// Old:
interface KnownDeviceItemProps {
  name: string;
  macAddress: string;
  category: string;
  onDelete: () => void;
}

export const KnownDeviceItem: React.FC<KnownDeviceItemProps> = ({
  name,
  macAddress,
  category,
  onDelete,
}) => {
  ...
  <ListRow
    title={name}
    subtitle={macAddress}
    ...

// New:
interface KnownDeviceItemProps {
  name: string;
  fingerprintHash: string;
  category: string;
  onDelete: () => void;
}

export const KnownDeviceItem: React.FC<KnownDeviceItemProps> = ({
  name,
  fingerprintHash,
  category,
  onDelete,
}) => {
  ...
  <ListRow
    title={name}
    subtitle={fingerprintHash}
    ...
```

- [ ] **Step 5: Update mockKnownDevices**

In `src/mocks/data/mockKnownDevices.ts`, replace every `macAddress` field with `fingerprintHash` using the prefix format:

```typescript
// Example:
// Old: macAddress: 'A8:5E:45:2B:1F:9C'
// New: fingerprintHash: 'w_5e451f9c'
```

Assign each device a realistic fingerprint hash using `w_`, `b_`, or `c_` prefix based on what kind of device it is (phones → `w_`, IoT → `b_`, etc.).

- [ ] **Step 6: Commit**

```bash
git add src/types/knownDevice.ts src/screens/settings/AddKnownDeviceScreen.tsx src/screens/settings/KnownDevicesScreen.tsx src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx src/mocks/data/mockKnownDevices.ts
git commit -m "refactor: update KnownDevice type and screens to use fingerprintHash"
```

---

### Task 11: Update Mock Alerts Data

**Files:**
- Modify: `src/mocks/data/mockAlerts.ts`

- [ ] **Step 1: Update persona definitions**

Each persona in the `personas` array (around lines 63-136) has a `macAddress` field. Replace with `fingerprintHash` using the backend's prefix format:

```typescript
// Example persona transformation:
// Old: { macAddress: 'AA:1A:28:3C:46:50', signalType: 'cellular', ... }
// New: { fingerprintHash: 'c_3c4650', signalType: 'cellular', ... }
```

For each persona, derive the fingerprintHash from the detection type prefix (`w_` for wifi, `b_` for bluetooth, `c_` for cellular) + a 6-character hex suffix.

- [ ] **Step 2: Update generateMac helper**

Replace the `generateMac()` helper with a `generateFingerprintHash()` helper:

```typescript
const generateFingerprintHash = (type: DetectionType): string => {
  const prefix = type === 'wifi' ? 'w' : type === 'bluetooth' ? 'b' : 'c';
  const hash = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${hash}`;
};
```

- [ ] **Step 3: Update all direct mock alert objects**

For each of the ~10 directly defined alert objects (around lines 249-487), replace:
- `rssi: <number>` → remove
- `macAddress: '<mac>'` → `fingerprintHash: '<prefix>_<hash>'`
- `cellularStrength: <number>` → remove
- Add `confidence: <number>` (0-100, use: critical=80-95, high=60-79, medium=40-59, low=20-39)
- Add `accuracyMeters: <number>` (use: critical=3-8, high=8-15, medium=15-25, low=20-30)
- Remove: `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration`

- [ ] **Step 4: Update generated alert objects**

The ~45 generated alerts and persona-based alerts follow the same pattern. Update the generation functions to produce `fingerprintHash`, `confidence`, and `accuracyMeters` instead of `rssi` and `macAddress`.

- [ ] **Step 5: Update PERSONA_MACS export**

Replace the `PERSONA_MACS` export (around line 503-506) with `PERSONA_FINGERPRINTS`:

```typescript
export const PERSONA_FINGERPRINTS: Array<{
  fingerprintHash: string;
  signalType: DetectionType;
}> = personas.map(p => ({
  fingerprintHash: p.fingerprintHash,
  signalType: p.signalType,
}));
```

- [ ] **Step 6: Commit**

```bash
git add src/mocks/data/mockAlerts.ts
git commit -m "refactor: update mock alerts to fingerprint-first shape"
```

---

### Task 12: Update Mock Analytics

**Files:**
- Modify: `src/mocks/data/mockAnalytics.ts`

- [ ] **Step 1: Update uniqueMacAddresses to uniqueFingerprints**

Replace line 105:

```typescript
// Old:
const uniqueMacAddresses = [...new Set(mockAlerts.map(a => a.macAddress))];
// New:
const uniqueFingerprints = [...new Set(mockAlerts.map(a => a.fingerprintHash))];
```

- [ ] **Step 2: Update topDetectedDevices**

Replace lines 74-79:

```typescript
// Old:
const topDetectedDevices = uniqueMacAddresses
  .slice(0, 10)
  .map(macAddress => ({
    macAddress,
    count: mockAlerts.filter(alert => alert.macAddress === macAddress).length,
  }));

// New:
const topDetectedDevices = uniqueFingerprints
  .slice(0, 10)
  .map(fingerprintHash => ({
    fingerprintHash,
    count: mockAlerts.filter(
      alert => alert.fingerprintHash === fingerprintHash
    ).length,
  }));
```

- [ ] **Step 3: Update generateDeviceFingerprint**

Replace the function (lines 127-185) to use `fingerprintHash`:

```typescript
const generateDeviceFingerprint = (
  fingerprintHash: string
): DeviceFingerprint => {
  const detections = mockAlerts.filter(
    a => a.fingerprintHash === fingerprintHash
  );

  if (detections.length === 0) {
    return {
      id: `fingerprint-${fingerprintHash}`,
      fingerprintHash,
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
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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
    detections: sortedDetections.map(d => ({
      timestamp: d.timestamp,
      confidence: d.confidence,
      location: d.location,
      type: d.detectionType,
    })),
    averageDuration: 0,
    commonHours,
    category: detections[0].isFalsePositive ? 'known' : 'unknown',
  };
};
```

- [ ] **Step 4: Update mockDeviceFingerprints export**

Replace line 188-190:

```typescript
// Old:
export const mockDeviceFingerprints: DeviceFingerprint[] = uniqueMacAddresses
  .slice(0, 10)
  .map(generateDeviceFingerprint);

// New:
export const mockDeviceFingerprints: DeviceFingerprint[] = uniqueFingerprints
  .slice(0, 10)
  .map(generateDeviceFingerprint);
```

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/mockAnalytics.ts
git commit -m "refactor: update mock analytics to group by fingerprintHash"
```

---

### Task 13: Update Mock WebSocket

**Files:**
- Modify: `src/mocks/mockWebSocket.ts`

- [ ] **Step 1: Replace generateRandomMAC with generateRandomFingerprint**

Replace the `generateRandomMAC()` method (around lines 258-270) with:

```typescript
private generateRandomFingerprint(type: string): string {
  const prefix = type === 'wifi' ? 'w' : type === 'bluetooth' ? 'b' : 'c';
  const hash = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${hash}`;
}
```

- [ ] **Step 2: Update generateMockAlert**

In the `generateMockAlert()` method (around lines 128-209), replace:

```typescript
// Old:
macAddress: this.generateRandomMAC(),
rssi: <value>,

// New:
fingerprintHash: this.generateRandomFingerprint(detectionType),
confidence: Math.floor(Math.random() * 60) + 20, // 20-80
accuracyMeters: Math.round((Math.random() * 25 + 3) * 10) / 10, // 3.0-28.0
```

Remove any `cellularStrength`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration` fields from the generated alert.

Update metadata to use `source: 'positions'` and `measurementCount` instead of raw-detection fields like `vendor`, `ssid`, `deviceName`, `provider`.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/mockWebSocket.ts
git commit -m "refactor: update mock WebSocket to emit fingerprint-first alerts"
```

---

### Task 14: Update Seed Data and Replay Positions

**Files:**
- Modify: `src/utils/seedMockData.ts`
- Modify: `src/mocks/data/mockReplayPositions.ts`

- [ ] **Step 1: Update seedMockData fingerprint generation**

In `src/utils/seedMockData.ts`, update `generateMockPositions()` (around lines 36-67):

- Replace the `PERSONA_MACS` import with `PERSONA_FINGERPRINTS`
- Update fingerprint generation for synthetic positions to use the `w_`/`b_`/`c_` prefix format instead of deriving from MAC addresses
- Replace line 55 `fingerprintHash: fp-${mac.replace(/:/g, '').slice(-6)}` with the actual fingerprintHash from the persona or a generated one

- [ ] **Step 2: Update fingerprint seeding**

Replace the fingerprint seeding loop (around lines 170-176):

```typescript
// Old:
mockDeviceFingerprints.forEach(fingerprint => {
  queryClient.setQueryData(
    [DEVICE_HISTORY_QUERY_KEY, fingerprint.macAddress],
    fingerprint
  );
});

// New:
mockDeviceFingerprints.forEach(fingerprint => {
  queryClient.setQueryData(
    [DEVICE_HISTORY_QUERY_KEY, fingerprint.fingerprintHash],
    fingerprint
  );
});
```

- [ ] **Step 3: Update mockReplayPositions**

In `src/mocks/data/mockReplayPositions.ts`:

- Remove `macAddress` from the `ScenarioDefinition` interface (line 22)
- Update `createScenarioAlert()` (lines 55-73): replace `macAddress: scenario.macAddress` and `rssi: -62` with `fingerprintHash: scenario.fingerprintHash`, `confidence: 75`, `accuracyMeters: 8.5`
- Remove any `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration` from generated alerts
- Update position generation (lines 227-239) to remove `macAddress` from position objects if they reference it

- [ ] **Step 4: Commit**

```bash
git add src/utils/seedMockData.ts src/mocks/data/mockReplayPositions.ts
git commit -m "refactor: update seed data and replay positions for fingerprint-first model"
```

---

### Task 15: Update Existing Tests

**Files:**
- Modify: `__tests__/hooks/useAlerts.test.tsx`

- [ ] **Step 1: Update mock alert objects in tests**

The test file at `__tests__/hooks/useAlerts.test.tsx` has mock alert objects that don't match either the old or new `Alert` type (they use `type`, `severity`, `message` instead). These are testing the hook, not the Alert shape, so they can stay as generic objects. However, confirm they still pass:

Run: `npx jest __tests__/hooks/useAlerts.test.tsx --verbose`

Expected: All tests pass (these tests mock the API layer and don't depend on specific Alert fields).

- [ ] **Step 2: Commit (if any fixes needed)**

```bash
git add __tests__/hooks/useAlerts.test.tsx
git commit -m "test: update alert test fixtures for fingerprint-first model"
```

---

### Task 16: Full Type-Check and Test Run

**Files:** None (verification only)

- [ ] **Step 1: Run full type-check**

Run: `npm run type-check`

Expected: No TypeScript errors. If there are errors, they indicate missed references to `rssi`, `macAddress`, or `RSSIInterpretation`. Fix any remaining references.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: All tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint:fix`

Expected: Clean or auto-fixed.

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: resolve remaining type errors from alert contract alignment"
```

---

### Task 17: Backend Response Mapper

**Files:**
- Modify: `trailsense-backend/src/controllers/alertsController.ts`

- [ ] **Step 1: Add toAlertDTO function**

At the top of `trailsense-backend/src/controllers/alertsController.ts`, after imports, add:

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

- [ ] **Step 2: Apply mapper in getAlerts**

In the `getAlerts` function (around lines 45-52), map the results:

```typescript
// Old:
res.json(alerts);
// New:
res.json(alerts.map(toAlertDTO));
```

- [ ] **Step 3: Apply mapper in getAlertById**

In the `getAlertById` function (around lines 61-66), map the result:

```typescript
// Old:
res.json(alert);
// New:
res.json(toAlertDTO(alert));
```

- [ ] **Step 4: Apply mapper in markAlertReviewed**

If this endpoint returns the updated alert, apply the mapper there too.

- [ ] **Step 5: Commit**

```bash
cd trailsense-backend
git add src/controllers/alertsController.ts
git commit -m "feat: add alert response mapper (toAlertDTO) for stable API contract"
```
