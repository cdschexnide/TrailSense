# Alert Contract Alignment: Fingerprint-First Mobile Alert Model

**Date:** 2026-04-04
**Status:** Approved (revised after code review)
**Approach:** Mobile-first (Approach 1) — update mobile types, UI, services, and mocks first; backend DTO mapper is a coordination task in a separate repo

## Problem

The backend creates alerts from triangulated positions and persists `fingerprintHash`, `confidence`, and `accuracyMeters`. The mobile app's `Alert` type requires `rssi` (number) and `macAddress` (string) — fields the backend does not produce. This breaks core alert UX: hero metrics, proximity labels, fingerprint navigation, and analytics grouping all reference fields that don't exist in the active system.

## Key Decisions

### 1. Confidence Scale: 0-100 everywhere

The backend Prisma schema defines `confidence Int` (0-100). All mobile code must use 0-100 integers. Existing position mocks (`seedMockData.ts`, `mockReplayPositions.ts`) use fractional 0-1 values — this is a pre-existing bug that gets fixed as part of this work.

**Rule:** Backend emits 0-100. Mobile stores 0-100. Mock data uses 0-100. UI displays with `%` suffix directly.

### 2. Identity Policy: fingerprintHash replaces macAddress in Alert flows

`fingerprintHash` is the canonical visitor identifier everywhere that consumes the `Alert` type: alert UI, alert services, blocked devices, known devices, analytics, LLM context, AI cards, home screen status.

`TriangulatedPosition` already uses `fingerprintHash` as its primary key with an optional `macAddress`. The optional `macAddress` on `TriangulatedPosition` stays for backwards compat with any existing persisted position data — this is the ONLY type that retains it.

`BucketEntry` in `replay.ts` is ephemeral (derived at runtime from positions). It currently carries both `fingerprintHash` and `macAddress`. Since it's not persisted, the `macAddress` field is removed — `BucketEntry` uses `fingerprintHash` only. All replay UI display and navigation uses `fingerprintHash`.

### 3. Proximity Semantics: confidence and accuracy are separate concepts

- **`confidence`** (0-100) = how certain we are about the fingerprint identity. Display as "Confidence: 85%". NOT a proximity indicator.
- **`accuracyMeters`** = position accuracy in meters. This IS the proximity indicator. Display as "Accuracy: ~8m" and derive proximity labels from it (<10m = "Close", 10-25m = "Nearby", >25m = "Far").

These must never be collapsed into a single concept. The AlertCard proximity pill uses `accuracyMeters`. The AlertDetailScreen shows both as separate rows.

## Scope — Full Blast Radius

### Types (5 files)

- `src/types/alert.ts` — Alert, AlertMetadata, DeviceFingerprint, AnalyticsData
- `src/types/knownDevice.ts` — KnownDevice, CreateKnownDeviceDTO
- `src/types/replay.ts` — FingerprintPeekProps (macAddress → fingerprintHash in callbacks)
- `src/types/triangulation.ts` — No changes (already fingerprintHash-first, macAddress optional)
- `src/navigation/types.ts` — DeviceFingerprint and AddKnownDevice route params

### Alert UI (6 files)

- `src/components/organisms/AlertCard/AlertCard.tsx`
- `src/screens/alerts/AlertDetailScreen.tsx`
- `src/screens/alerts/AlertListScreen.tsx`
- `src/screens/fingerprint/DeviceFingerprintScreen.tsx`
- `src/screens/home/PropertyCommandCenter.tsx` — `recentAlerts[0]?.macAddress` → `fingerprintHash`
- `src/hooks/usePropertyStatus.ts` — unique visitor count via `fingerprintHash`

### AI Cards (2 files)

- `src/components/ai/cards/AlertBriefingCard.tsx` — rssi/macAddress display
- `src/components/ai/cards/SitrepCard.tsx` — rssi/macAddress display

### LLM Services (4 files)

- `src/services/llm/FocusedContextBuilder.ts` — rssiToZone, formatMac, alert grouping by macAddress
- `src/services/llm/ResponseProcessor.ts` — alert.rssi in formatted strings
- `src/services/llm/templates/AlertSummaryTemplate.ts` — RSSI zone mapping, MAC display
- `src/services/llm/templates/PatternAnalysisTemplate.ts` — mac_address reference

### Alert Services (3 files)

- `src/services/threatClassifier.ts` — uses rssi, wifiDetected, bluetoothDetected, multiband, isStationary, seenCount, duration (full rewrite needed)
- `src/services/deviceFingerprinting.ts` — macAddress params, rssi in tracking
- `src/services/patternDetection.ts` — macAddress filter param

### State Management (2 files)

- `src/store/slices/blockedDevicesSlice.ts` — keyed by macAddress
- `src/hooks/useBlockedDevices.ts` — macAddress params

### Navigation & Deep Links (2 files)

- `src/navigation/types.ts` — route params
- `src/navigation/linking.ts` — `:macAddress` in 5 deep link paths

### Analytics (3 files)

- `src/api/analytics.ts` — getDeviceHistory(macAddress), getTopDevices return type
- `src/hooks/useAnalytics.ts` — useDeviceHistory(macAddress)
- `src/services/fingerprintStore.ts` — repository keyed by macAddress

### Replay/Radar (6 files)

- `src/types/replay.ts` — FingerprintPeekProps callbacks
- `src/hooks/useTimeBucketing.ts` — alert-position joining via macAddress
- `src/hooks/useReplayPath.ts` — device path grouping by macAddress
- `src/screens/radar/ProximityHeatmapScreen.tsx` — dedup by macAddress, navigation
- `src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx` — dot tap callback
- `src/components/molecules/FingerprintPeek/FingerprintPeek.tsx` — macAddress display

### Known Devices (3 files)

- `src/screens/settings/AddKnownDeviceScreen.tsx` — MAC input → fingerprint input
- `src/screens/settings/KnownDevicesScreen.tsx` — macAddress display
- `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx` — props

### Utilities (3 files)

- `src/utils/visualEffects.ts` — interpretRSSI → interpretAccuracy
- `src/utils/rssiUtils.ts` — estimateDistance, calculateAngleFromMAC, getSignalStrength (remove or replace)
- `src/hooks/useSecurityContext.ts` — rssi/macAddress in LLM context string

### Mock Data (6 files)

- `src/mocks/data/mockAlerts.ts`
- `src/mocks/data/mockAnalytics.ts`
- `src/mocks/data/mockKnownDevices.ts`
- `src/mocks/data/mockReplayPositions.ts`
- `src/mocks/mockWebSocket.ts`
- `src/utils/seedMockData.ts`

### Tests

- `__tests__/hooks/useAlerts.test.tsx`

### Backend (separate repository — coordination only)

- `trailsense-backend/src/controllers/alertsController.ts` — add `toAlertDTO` response mapper

**Total: ~46 files in this workspace + 1 in backend repo**

## Section 1: Mobile Alert Type Redesign

### `Alert` interface (`src/types/alert.ts`)

**Remove:**

- `rssi: number` (required)
- `macAddress: string` (required)
- `cellularStrength?: number`
- `wifiDetected?: boolean`
- `bluetoothDetected?: boolean`
- `multiband?: boolean`
- `isStationary?: boolean`
- `seenCount?: number`
- `duration?: number`

**Add:**

- `fingerprintHash: string` (required) — canonical visitor identifier (e.g. `w_3a7fb2e1`)
- `confidence: number` (required) — 0-100 fingerprint confidence score
- `accuracyMeters: number` (required) — position accuracy in meters

**Unchanged:**

- `id`, `deviceId`, `timestamp`, `threatLevel`, `detectionType`, `isReviewed`, `isFalsePositive`
- `location?: { latitude: number; longitude: number }`
- `metadata?: AlertMetadata`

### `AlertMetadata` interface

**Remove:**

- `channel`, `deviceName`, `ssid`, `vendor`, `band`, `provider`
- `cellularPeak`, `cellularAvg`, `cellularDelta`, `burstCount`, `clusterIndex`

**Keep:**

- `zone?`, `distance?`, `source?`, `signalCount?`, `windowDuration?`, `triangulatedPosition?`

**Add:**

- `measurementCount?: number`

**Update:**

- `source` type becomes `'legacy' | 'summary' | 'positions'`

### `DeviceFingerprint` type

- `macAddress: string` → `fingerprintHash: string`
- `detections[].rssi: number` → `detections[].confidence: number`

### `AnalyticsData` type

- `topDetectedDevices` changes from `Array<{ macAddress: string; count: number }>` to `Array<{ fingerprintHash: string; count: number }>`

### `KnownDevice` type

- `macAddress: string` → `fingerprintHash: string`
- `CreateKnownDeviceDTO.macAddress` → `CreateKnownDeviceDTO.fingerprintHash`

### `replay.ts` types

- `FingerprintPeekProps.macAddress` → `FingerprintPeekProps.fingerprintHash`
- `FingerprintPeekProps.onViewProfile(macAddress)` → `onViewProfile(fingerprintHash)`
- `BucketEntry.macAddress` removed (already has `fingerprintHash`)

## Section 2: UI Component Changes

### AlertCard

| Current                            | New                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| RSSI value in dBm                  | Confidence as percentage                                                                |
| Proximity label from RSSI ranges   | Proximity label from `accuracyMeters` (<10m = "Close", 10-25m = "Nearby", >25m = "Far") |
| Last 5 chars of `macAddress`       | Full `fingerprintHash`                                                                  |
| `onAddToKnown` passes `macAddress` | `onAddToKnown` passes `fingerprintHash`                                                 |

### AlertDetailScreen

**Signal Tab:**

- RSSI row → "Confidence" row (percentage)
- New "Estimated Accuracy" row (`~Xm` format) — separate from confidence
- "MAC Address" → "Fingerprint ID" showing `fingerprintHash`
- Navigation to DeviceFingerprintScreen passes `fingerprintHash`

**Header/Hero metrics array (3 items):**

1. `confidence` as percentage (e.g. "85%")
2. Proximity label derived from `accuracyMeters` via `interpretAccuracy()` (e.g. "Close") — NOT from confidence
3. Device name or device ID fallback

### AlertListScreen

- Search matches `fingerprintHash` instead of `macAddress`
- Blocked device filter uses `fingerprintHash`

### AI Cards (AlertBriefingCard, SitrepCard)

- Replace `alert.rssi` dBm display with `alert.confidence%`
- Replace `formatMac(alert.macAddress)` with `alert.fingerprintHash`
- Replace `rssiToZone(alert.rssi)` with accuracy-based label

### PropertyCommandCenter

- `recentAlerts[0]?.macAddress` → `recentAlerts[0]?.fingerprintHash`
- Navigation to DeviceFingerprint passes `fingerprintHash`

### Deep Links (linking.ts)

- All 5 `:macAddress` routes → `:fingerprintHash`

## Section 3: Service Changes

### ThreatClassifier (full rewrite)

Currently uses `rssi`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration` — all removed fields. Rewrite to score based on:

- `confidence` (higher = more certain threat)
- `accuracyMeters` (closer = higher threat)
- `detectionType` (cellular-only still suspicious)
- Time of day (night = higher threat)
- Backend `threatLevel` is authoritative; classifier is for mock/demo mode and local re-scoring

### LLM Services

- `FocusedContextBuilder`: replace `rssiToZone()` with accuracy-based zone, replace `formatMac()` with fingerprint display, group alerts by `fingerprintHash` instead of `macAddress`
- `ResponseProcessor`: replace `alert.rssi` dBm string with `alert.confidence%`
- `AlertSummaryTemplate`: replace RSSI zone mapping with accuracy-based zone, replace MAC display with fingerprint
- `PatternAnalysisTemplate`: replace `mac_address` reference with `fingerprintHash`

### deviceFingerprinting

- `trackDevice(macAddress)` → `trackDevice(fingerprintHash)`
- `rssi: alert.rssi` in detection tracking → `confidence: alert.confidence`

### useSecurityContext

- Context string: replace `rssi` dBm display with confidence%, replace MAC with fingerprintHash

### Analytics API

- `getDeviceHistory(macAddress)` → `getDeviceHistory(fingerprintHash)`
- `useDeviceHistory(macAddress)` → `useDeviceHistory(fingerprintHash)`
- Query key shifts from macAddress to fingerprintHash

## Section 4: Replay/Radar Changes

Replay types already have `fingerprintHash` on `BucketEntry` and `TriangulatedPosition`. The changes:

- `BucketEntry` in `replay.ts`: remove `macAddress` field (use `fingerprintHash`)
- `FingerprintPeekProps`: shift callbacks to `fingerprintHash`
- `useTimeBucketing`: join alerts to positions via `fingerprintHash` instead of `macAddress`
- `useReplayPath`: group device paths by `fingerprintHash` instead of `macAddress`
- `ProximityHeatmapScreen`: dedup by `fingerprintHash`, navigate with `fingerprintHash`
- `ReplayRadarDisplay`: dot tap passes `fingerprintHash`
- `FingerprintPeek`: display `fingerprintHash` instead of `macAddress`

## Section 5: Utility Changes

### visualEffects.ts

Replace `interpretRSSI` with `interpretAccuracy`:

```typescript
export const interpretAccuracy = (
  accuracyMeters: number
): { label: string; color: string; percentage: number } => {
  if (accuracyMeters < 5)
    return { label: 'Very Close', color: '#FF453A', percentage: 95 };
  if (accuracyMeters < 10)
    return { label: 'Close', color: '#FF9F0A', percentage: 75 };
  if (accuracyMeters < 25)
    return { label: 'Nearby', color: '#FFCC00', percentage: 55 };
  if (accuracyMeters < 50)
    return { label: 'Moderate', color: '#30D158', percentage: 35 };
  return { label: 'Distant', color: '#8E8E93', percentage: 15 };
};
```

### rssiUtils.ts

- `estimateDistance(rssi)` — remove (backend provides `accuracyMeters` directly)
- `calculateAngleFromMAC(macAddress)` — replace with `calculateAngleFromHash(fingerprintHash)` using same hash algorithm
- `getSignalStrength(rssi)` — remove (replaced by accuracy-based labels)

## Section 6: Mock Data & Confidence Fix

All mock alert objects shift shape per Section 1.

**Confidence normalization fix:** Position mocks in `seedMockData.ts` and `mockReplayPositions.ts` currently use fractional 0-1 confidence. Change to 0-100 integers to match backend schema and UI expectations.

## Section 7: Backend Response Mapper (Separate Repository)

The backend lives in a separate repository (`trailsense-backend`). The DTO shape is defined here for coordination:

```typescript
interface AlertDTO {
  id: string;
  deviceId: string;
  timestamp: Date;
  threatLevel: string;
  detectionType: string;
  fingerprintHash: string;
  confidence: number; // 0-100 integer
  accuracyMeters: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  location?: { latitude: number; longitude: number };
  metadata: any;
}
```

The `toAlertDTO` mapper maps `latitude`/`longitude` into the `location` object. Applied in `getAlerts()` and `getAlertById()`. No schema migration needed.

### Additional Backend Coordination Required

The mobile plan also changes API calls in `src/api/analytics.ts` and `src/api/endpoints/knownDevices.ts` to send/receive `fingerprintHash` instead of `macAddress`. This creates backend contract dependencies beyond the alerts DTO:

1. **Analytics device history:** `GET /analytics/devices/:macAddress` → must accept `:fingerprintHash` as the path param (or be renamed to `/analytics/devices/:fingerprintHash`)
2. **Analytics top devices:** `GET /api/analytics` response includes `topDetectedDevices[].macAddress` → must return `fingerprintHash` instead
3. **Known devices (whitelist):** `POST /whitelist` currently accepts `CreateKnownDeviceDTO` with `macAddress` → must accept `fingerprintHash`. Same for `PATCH /whitelist/:id`.

If the backend already handles these via fingerprintHash, no changes needed. If not, these are required backend changes to prevent production contract gaps.

**All backend tasks are tracked separately and not part of this workspace's implementation plan.**
