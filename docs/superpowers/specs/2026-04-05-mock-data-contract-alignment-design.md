# Mock Data Contract Alignment Design

**Date:** 2026-04-05
**Status:** Draft
**Scope:** Align all mock/demo mode data with current backend API contracts

## Problem

The mock data system that powers "Explore Demo Mode" has drifted from the
backend API contracts. This causes demo mode to misrepresent what real data
looks like, and code written against mock data may break when connected to
the real API. Ten specific gaps were identified:

1. Fingerprint hash format (`fp-visitor-XXXX` vs backend `w_xxxx`/`b_xxxx`/`c_xxxx`)
2. Stale hardcoded timestamps (Dec 2025) — all devices calculate as offline
3. Device `signalStrength: 'offline'` is not a valid backend enum value
4. Missing `positions-updated` WebSocket event in mock
5. Incomplete `device-status` WebSocket event (missing 4 fields)
6. Alert metadata missing `presenceCertainty`, `proximity`, `triangulatedPosition`
7. Auth/User mock data includes fields backend doesn't return (`phone`, `role`, `lastLogin`)
8. Analytics response shape diverges (extra fields, wrong `topDevices` structure)
9. DeviceFingerprint type mismatches (`detections[]` vs `totalSamples`/`totalAlerts`)
10. Device `metadata` field omitted

## Approach

**Centralized Contract Layer + Mock Data Alignment** (Approach 2 from brainstorming):

Create shared helper modules for fingerprint formatting and dynamic timestamps,
then update all mock data files to use them. This ensures consistency by
construction — impossible for fingerprint formats to drift between alerts,
positions, replay, and WebSocket.

## Design Decisions

- **Dynamic timestamps** generated relative to `Date.now()` at seed time (not static)
- **User type**: Keep `phone`, `role`, `lastLogin` as optional in the type; stop populating in mock data
- **Analytics**: Core fields match backend shape; extra convenience fields computed from alerts at seed time (not fabricated)
- **KnownDevices**: No changes — whitelist is frontend-only, no backend contract to align to
- **Settings**: No changes — frontend-only configuration

---

## Section 1: Shared Helpers

Two new modules in `src/mocks/helpers/`.

### `src/mocks/helpers/timestamps.ts`

Dynamic timestamp generator. All functions return ISO 8601 strings.

```typescript
now(): string
// Current time

minutesAgo(n: number): string
// n minutes before now — for online device lastSeen (1-3 min)

hoursAgo(n: number): string
// n hours before now — for offline devices, recent alerts

daysAgo(n: number): string
// n days before now — for older alerts, createdAt fields

todayAt(hour: number, minute: number): string
// Today's date at specific time — for replay positions
```

All mock data files call these instead of hardcoding ISO strings. Timestamps
are generated fresh each time `seedMockData` runs.

### `src/mocks/helpers/fingerprints.ts`

Backend-format fingerprint generator.

```typescript
// Prefix constants
const FINGERPRINT_PREFIX: Record<DetectionType, string> = {
  wifi: 'w_',
  bluetooth: 'b_',
  cellular: 'c_',
};

wifiFingerprint(hash: string): string
// Returns 'w_' + hash

bleFingerprint(hash: string): string
// Returns 'b_' + hash

cellularFingerprint(hash: string): string
// Returns 'c_' + hash

randomFingerprint(type: DetectionType): string
// Generates random 8-char hex hash with correct prefix

fingerprintForType(type: DetectionType, hash: string): string
// Generic: applies correct prefix for any detection type
```

### Shared persona fingerprints

Exported from `fingerprints.ts` for use by alerts, replay, and positions:

```typescript
const PERSONA_FINGERPRINTS = {
  delivery: 'c_a1b2c3',   // cellular (hex-valid)
  visitor: 'w_d4e5f6',    // wifi (hex-valid)
  loiterer: 'b_a7b8c9',   // bluetooth (hex-valid)
  vehicle: 'c_d0e1f2',    // cellular (hex-valid)
};
```

---

## Section 2: Mock Device Data

**File:** `src/mocks/data/mockDevices.ts`

### Changes

| Field | Before | After |
|-------|--------|-------|
| `lastSeen` (online) | `'2025-12-16T09:45:00Z'` | `minutesAgo(1)` to `minutesAgo(3)` |
| `lastSeen` (offline) | `'2025-12-14T16:22:00Z'` | `daysAgo(2)` to `daysAgo(5)` |
| `updatedAt` | Hardcoded | Same value as `lastSeen` |
| `lastBootAt` | Hardcoded | `hoursAgo(uptimeSeconds / 3600)` |
| `signalStrength` (device-005) | `'offline'` | `'poor'` |
| `metadata` | Absent | `null` (explicit) |

### Unchanged

- Device names, IDs, coordinates, battery levels, firmware versions, `alertCount`
- `createdAt` stays static (account creation doesn't need to be dynamic)

### Implementation

Mock devices export a factory function `getMockDevices()` instead of a static
array, so timestamps are fresh each call.

---

## Section 3: Mock Alert Data

**File:** `src/mocks/data/mockAlerts.ts`

### Fingerprint format

All `fingerprintHash` values switch to backend-prefixed format, where prefix
matches the alert's `detectionType`:

- `cellular` alerts: `c_` prefix
- `wifi` alerts: `w_` prefix
- `bluetooth` alerts: `b_` prefix

Example: `fp-visitor-d4e5f6` (wifi) becomes `w_d4e5f6`.

### Timestamps

- 10 seeded alerts: spread across the last 48 hours using `hoursAgo(n)`
- 45 generated alerts: spread across the last 7 days using `daysAgo(n)` and `hoursAgo(n)`
- `createdAt` set equal to `timestamp` (matches backend behavior)

### Metadata enrichment

Alerts with metadata gain backend-contract fields:

```typescript
metadata: {
  source: 'positions',
  signalCount: 1-6,
  measurementCount: 3-8,
  presenceCertainty: number,       // 0-100, scaled by threat level
  proximity: number,                // 0-100, scaled by threat level
  triangulatedPosition: {           // derived from alert location + offset
    latitude: number,
    longitude: number,
    accuracyMeters: number,
    confidence: number,
  },
}
```

`presenceCertainty` and `proximity` values are reasonable for the alert's
threat level, following the backend's 4x4 threat matrix:

| Threat Level | Presence Range | Proximity Range |
|-------------|----------------|-----------------|
| critical | 70-95 | 70-95 |
| high | 50-80 | 50-80 |
| medium | 30-60 | 30-60 |
| low | 10-35 | 10-35 |

### Persona fingerprints

Updated to backend format via shared constants:

| Before | After | Type |
|--------|-------|------|
| `fp-delivery-a1b2c3` | `c_a1b2c3` | cellular |
| `fp-visitor-d4e5f6` | `w_d4e5f6` | wifi |
| `fp-loiterer-g7h8i9` | `b_a7b8c9` | bluetooth |
| `fp-vehicle-j0k1l2` | `c_d0e1f2` | cellular |

### Implementation

Alerts export a factory function `getMockAlerts()` for dynamic timestamps.

---

## Section 4: Mock WebSocket

**File:** `src/mocks/mockWebSocket.ts`

### `device-status` event — add missing fields

Current payload:

```typescript
{ id, name, battery, lastSeen, online, alertCount, uptimeSeconds }
```

Updated payload (matches backend `device-status` event post-mapping):

```typescript
{
  id, name, batteryPercent, lastSeen, online, alertCount,
  uptimeSeconds, signalStrength, lastBootAt, latitude, longitude
}
```

- `signalStrength`: carried from device state, with occasional drift between adjacent values
- `lastBootAt`: carried from device state
- `latitude`/`longitude`: carried from device GPS coordinates
- `battery` field kept as `battery` (not renamed) — the mock events are forwarded through `WebSocketService.mapDeviceStatusEvent()` at `src/api/websocket.ts:94`, which handles field normalization. The mock should emit the raw backend shape so the normalization path is exercised in demo mode.

### New `positions-updated` event

Emitted on a 10-second interval. Payload matches backend shape:

```typescript
{
  deviceId: string,
  positions: [
    {
      id: string,
      fingerprintHash: string,       // backend-format via shared helper
      signalType: string,
      latitude: number,
      longitude: number,
      accuracyMeters: number,
      confidence: number,
      measurementCount: number,
      updatedAt: string,             // current ISO timestamp
      presenceCertainty: number | null,
      proximity: number | null,
      threatLevel: string | null,
    }
  ]
}
```

- Picks a random online device
- Generates 2-4 positions near the device's GPS coordinates
- Uses `randomFingerprint(type)` from shared helper

### `alert` event — fix fingerprint format

- Replace `fp-live-{random}` with `randomFingerprint(detectionType)`
- Add `createdAt` field (set equal to `timestamp`)

---

## Section 5: Mock Analytics & Fingerprint Alignment

**File:** `src/mocks/data/mockAnalytics.ts`

### Core fields (aligned to backend)

These fields match the backend `GET /api/analytics` response exactly:

- `period`, `startDate`, `endDate`, `totalAlerts` — `startDate`/`endDate` become dynamic
- `threatLevelDistribution: [{ level, count }]` — already matches
- `detectionTypeDistribution: [{ type, count }]` — already matches
- `deviceDistribution: [{ deviceId, count }]` — already matches
- `dailyTrend: [{ date, count }]` — already matches
- `topDetectedDevices` — changes from `[{ deviceId, deviceName, alertCount, criticalCount, lastDetection }]` to `[{ fingerprintHash, count }]`

### Derived extras (computed at seed time)

Computed from the mock alerts array, clearly separated from backend-contract
fields:

- `totalDetections` — `alerts.length`
- `unknownDevices` — unique non-false-positive fingerprints count
- `cellularCount`, `wifiCount`, `bluetoothCount` — filtered from alerts
- `hourlyDistribution` — computed from alert timestamps
- `criticalCount`, `highCount`, `mediumCount`, `lowCount` — filtered from alerts

### `mockDeviceFingerprints` — introduce `BackendDeviceFingerprint` type

The existing `DeviceFingerprint` type in `src/types/alert.ts` is actively used
by `src/services/deviceFingerprinting.ts` (reads `detections` array,
`averageDuration`). We must NOT remove those fields.

Instead, introduce a new `BackendDeviceFingerprint` type for the API response
shape from `/analytics/devices/:fingerprintHash`. The mock analytics produces
objects of this backend type. A mapping layer would convert to the app-internal
`DeviceFingerprint` when needed (out of scope for this task).

```typescript
// New type — backend API response shape
interface BackendDeviceFingerprint {
  id: string;
  fingerprintHash: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalSamples: number;
  totalAlerts: number;
  commonHours: number[];
  category: string; // signal type: 'wifi' | 'bluetooth' | 'cellular'
}
```

The existing `DeviceFingerprint` interface is left unchanged.

| Field | Mock Before | Mock After |
|-------|-------------|------------|
| Type | `DeviceFingerprint` | `BackendDeviceFingerprint` |
| `category` | `'unknown'` / `'known'` | Signal type: `'wifi'` / `'bluetooth'` / `'cellular'` |
| `fingerprintHash` | `fp-*` format | Backend-prefixed format |

### `mockHeatmapPoints`

Fingerprint-related fields updated to backend format. Structure already matches.

### `mockThreatTimeline`

Timestamps become dynamic. Structure already matches backend.

---

## Section 6: Mock Replay Data

**File:** `src/mocks/data/mockReplayPositions.ts`

### Changes

- **Persona fingerprints**: Use shared `PERSONA_FINGERPRINTS` constants (backend format)
- **`observedAt` timestamps**: Switch to `todayAt(hour, minute)` so replay always represents today
- **No structural changes** — position fields already include `presenceCertainty`, `proximity`, `threatLevel`

---

## Section 7: Mock User Data

**File:** `src/mocks/data/mockUsers.ts`

### Mock user object

Remove populated values for fields the backend doesn't return, but keep
`role` because `src/store/slices/userSlice.ts` has it as a required field:

```typescript
// Before
{ id, email, name, phone, role, createdAt, lastLogin }

// After
{ id, email, name, role, createdAt, updatedAt }
```

`phone` and `lastLogin` are removed. `role` is kept because it's required by
the Redux store's `User` interface. `updatedAt` is added to match backend shape.

### Mock auth tokens

Remove `expiresIn` — backend token response only returns
`{ accessToken, refreshToken }`.

---

## Section 8: Seed Function & Type Updates

### `src/utils/seedMockData.ts`

- Call factory functions (`getMockDevices()`, `getMockAlerts()`) instead of
  importing static arrays — ensures fresh timestamps per seed
- Call `getAnalyticsData(freshAlerts)`, `getHeatmapPoints(freshAlerts)`,
  `getDeviceFingerprints(freshAlerts)` with the fresh alerts so analytics
  caches are consistent with the freshly-timestamped alert data
- Position generation uses `randomFingerprint()` from shared helper

### `src/types/auth.ts`

- Ensure `phone`, `role`, `lastLogin` are optional (`?`) fields
- Add optional `updatedAt?: string` field (backend returns this)
- Ensure `AuthTokens.expiresIn` is optional

### `src/types/alert.ts`

- Add `presenceCertainty` and `proximity` to `AlertMetadata` interface if not
  already present
- Add optional `createdAt?: string` to `Alert` interface (backend always
  returns this field)
- Add new `BackendDeviceFingerprint` interface (backend API shape, separate
  from the existing `DeviceFingerprint` which is used by app-internal services)

### `src/api/websocket.ts`

- Ensure `WebSocketEventMap` includes `'positions-updated'` with correct payload
  type (may already exist — mock just wasn't emitting it)

---

## Files Touched

| Area | Files | Change Type |
|------|-------|-------------|
| Shared helpers | `src/mocks/helpers/timestamps.ts` | New |
| Shared helpers | `src/mocks/helpers/fingerprints.ts` | New |
| Mock data | `src/mocks/data/mockDevices.ts` | Edit |
| Mock data | `src/mocks/data/mockAlerts.ts` | Edit |
| Mock data | `src/mocks/data/mockAnalytics.ts` | Edit |
| Mock data | `src/mocks/data/mockReplayPositions.ts` | Edit |
| Mock data | `src/mocks/data/mockUsers.ts` | Edit |
| Mock WebSocket | `src/mocks/mockWebSocket.ts` | Edit |
| Seed function | `src/utils/seedMockData.ts` | Edit |
| Types | `src/types/auth.ts` | Edit |
| Types | `src/types/alert.ts` | Edit |
| WebSocket | `src/api/websocket.ts` | Edit |

**Not touched:** `mockSettings.ts`, `mockKnownDevices.ts`, screen components,
React Query hooks, API endpoint modules.

## Out of Scope

- Screen component refactoring
- React Query hook changes
- Backend API changes
- KnownDevices/whitelist mock data
- Settings mock data
- Narrowing TypeScript types to strict backend shapes
