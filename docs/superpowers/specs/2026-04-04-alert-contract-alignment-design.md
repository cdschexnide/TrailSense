# Alert Contract Alignment: Fingerprint-First Mobile Alert Model

**Date:** 2026-04-04
**Status:** Approved
**Approach:** Mobile-first (Approach 1) — update mobile types, UI, and mocks first; backend DTO mapper second

## Problem

The backend creates alerts from triangulated positions and persists `fingerprintHash`, `confidence`, and `accuracyMeters`. The mobile app's `Alert` type requires `rssi` (number) and `macAddress` (string) — fields the backend does not produce. This breaks core alert UX: hero metrics, proximity labels, fingerprint navigation, and analytics grouping all reference fields that don't exist in the active system.

## Decision

Make the alert self-contained and fingerprint-first. The mobile `Alert` type, UI components, mock data, and analytics shift to match the backend's actual data model. A thin backend response mapper formalizes the contract.

## Scope

- Mobile `Alert`, `AlertMetadata`, `DeviceFingerprint`, `AnalyticsData` types
- `AlertCard` component
- `AlertDetailScreen` screen
- `AlertListScreen` search/filter logic
- `DeviceFingerprintScreen` route params
- All mock data generators (mockAlerts, mockAnalytics, mockWebSocket, seedMockData, mockReplayPositions)
- Backend alert response mapper (thin DTO layer, no schema migration)

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
- `confidence: number` (required) — 0-100 signal confidence, replaces RSSI as primary metric
- `accuracyMeters: number` (required) — position accuracy in meters, replaces RSSI-derived proximity

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

- `macAddress: string` becomes `fingerprintHash: string`
- `detections[].rssi: number` becomes `detections[].confidence: number`

### `AnalyticsData` type

- `topDetectedDevices` changes from `Array<{ macAddress: string; count: number }>` to `Array<{ fingerprintHash: string; count: number }>`

## Section 2: UI Component Changes

### AlertCard (`src/components/organisms/AlertCard/AlertCard.tsx`)

| Current | New |
|---------|-----|
| RSSI value in dBm | Confidence as percentage |
| Proximity label from RSSI ranges | Proximity label from `accuracyMeters` (<10m = "Close", 10-25m = "Nearby", >25m = "Far") |
| Last 5 chars of `macAddress` | Full `fingerprintHash` (already short) |
| `onAddToKnown` passes `macAddress` | `onAddToKnown` passes `fingerprintHash` |

`metadata.signalCount` display unchanged.

### AlertDetailScreen (`src/screens/alerts/AlertDetailScreen.tsx`)

**Signal Tab:**
- RSSI row becomes "Confidence" row (percentage display)
- RSSI-derived proximity becomes "Estimated Accuracy" row (`~Xm` format)
- "Device Fingerprint" shows `fingerprintHash` instead of `macAddress`
- Navigation to DeviceFingerprintScreen passes `fingerprintHash`

**Location Tab:** Unchanged (`location`, `metadata.triangulatedPosition`).

**History Tab:** Unchanged (`timestamp`, `metadata.signalCount`, `isReviewed`).

**Header/Hero:**
- RSSI in hero metrics becomes `confidence` as percentage
- `threatLevel`, `timestamp`, `detectionType`, `deviceId` fallback unchanged

### AlertListScreen (`src/screens/alerts/AlertListScreen.tsx`)

- Search matches against `fingerprintHash` instead of `macAddress`
- Blocked device filtering uses `fingerprintHash` instead of `macAddress`
- All other filters unchanged

### DeviceFingerprintScreen

- Route param changes from `macAddress` to `fingerprintHash`
- Navigation type in `src/navigation/types.ts` updated to match

## Section 3: Mock Data & Analytics

### mockAlerts.ts

All ~55 mock alert objects:
- Remove: `rssi`, `macAddress`, `cellularStrength`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration`
- Add: `fingerprintHash` (type-prefixed hash, e.g. `w_3a7fb2e1`), `confidence` (0-100, spread by threat level), `accuracyMeters` (3-30m float)
- Update metadata to include `measurementCount` and `source: 'positions'` where appropriate

### mockAnalytics.ts

- `uniqueMacAddresses` becomes `uniqueFingerprints` (from `alert.fingerprintHash`)
- `topDetectedDevices` maps `fingerprintHash` instead of `macAddress`
- `generateDeviceFingerprint` takes `fingerprintHash`, returns updated `DeviceFingerprint` shape with `confidence` in detections

### mockWebSocket.ts

- Generated live alerts use new shape: `fingerprintHash`, `confidence`, `accuracyMeters`

### seedMockData.ts

- Fingerprint generation uses `w_`/`b_`/`c_` prefix format matching backend

### mockReplayPositions.ts

- Alert objects paired with positions use new shape

## Section 4: Backend Response Mapper

Single function in `trailsense-backend/src/controllers/alertsController.ts`:

```typescript
function toAlertDTO(alert: PrismaAlert) {
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
    location: alert.latitude != null && alert.longitude != null
      ? { latitude: alert.latitude, longitude: alert.longitude }
      : undefined,
    metadata: alert.metadata,
  };
}
```

Applied in `getAlerts()` and `getAlertById()`. No schema migration, no new endpoints.

## Out of Scope

- Backend Prisma schema changes (already correct)
- New API endpoints
- Shared types package between backend and mobile
- LLM prompt template changes (separate concern)
- Radar/triangulation screens (use `TriangulatedPosition` type, not `Alert`)
