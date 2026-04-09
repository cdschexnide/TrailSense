# TrailSense Frontend/Backend Compatibility Analysis

Date: 2026-04-01

Frontend repo: `/Users/codyschexnider/Documents/Project/TrailSense`
Backend repo: `/Users/codyschexnider/Documents/Project/trailsense-backend`

Frontend latest commit reviewed: `97376a0` on 2026-04-01 (`command center and replay radar features complete`)
Backend latest commit reviewed: `b96186b` on 2026-03-07 (`latest`)

## Executive Summary

The frontend moved materially ahead of the backend after March 7, 2026. The largest drift is not just missing routes; it is that the backend no longer models the same data semantics the frontend now depends on.

The newest mobile work on April 1, 2026 added or solidified:

- Property Command Center
- Device Fingerprints / behavioral intelligence
- Replay Radar with time-based scrubbing
- Known Devices flows using real MAC addresses

Those features require:

- real historical alerts
- real historical triangulated positions
- stable visitor identity (`macAddress`, not just `fingerprintHash`)
- a backend alert pipeline that actually writes alert/analytics data

The current backend does not provide that. It currently treats `/api/alerts` as a compatibility view over `TriangulatedPosition`, stores only one current position per `(deviceId, fingerprintHash)`, and ignores `detections` payloads in the active webhook route. That means the frontend’s newest screens can render, but they cannot be correct against the current backend.

## Methodology

I reviewed:

- frontend API, hooks, types, and screens in `src/`
- frontend planning docs for the April 1 workstreams
- backend routes, controllers, Prisma schema, and existing backend analysis docs
- recent git history in both repos to anchor the comparison to exact dates

Most relevant frontend files:

- `src/screens/home/PropertyCommandCenter.tsx`
- `src/screens/radar/ProximityHeatmapScreen.tsx`
- `src/hooks/api/useReplayPositions.ts`
- `src/hooks/useTimeBucketing.ts`
- `src/screens/fingerprint/DeviceFingerprintScreen.tsx`
- `src/screens/settings/AddKnownDeviceScreen.tsx`
- `src/api/endpoints/*`
- `src/services/authService.ts`
- `src/services/notificationService.ts`

Most relevant backend files:

- `src/routes/index.ts`
- `src/controllers/alertsController.ts`
- `src/controllers/positionsController.ts`
- `src/controllers/goliothWebhookController.ts`
- `src/controllers/analyticsController.ts`
- `src/controllers/authController.ts`
- `prisma/schema.prisma`

## Highest-Impact Findings

### 1. `/api/alerts` is no longer an alert-history API

Frontend usage:

- Property status, active alerts, recent visitors, and recent alerts all derive from `useAlerts()`:
  - `src/hooks/usePropertyStatus.ts:33-148`
  - `src/screens/home/PropertyCommandCenter.tsx:27-260`
- Device Fingerprint derives visit patterns from `useAlerts()` filtered by `macAddress`:
  - `src/screens/fingerprint/DeviceFingerprintScreen.tsx:18-179`
- Replay Radar fetches alerts in parallel with replay positions to assign threat levels and visitor identity:
  - `src/hooks/api/useReplayPositions.ts:10-38`
  - `src/hooks/useTimeBucketing.ts:23-122`
- Alerts list and alert detail use the same alert contract:
  - `src/api/endpoints/alerts.ts:4-21`

Current backend behavior:

- `/api/alerts` reads `TriangulatedPosition`, not `Alert`:
  - `src/controllers/alertsController.ts:1-119`
- It maps `position.fingerprintHash` into `macAddress`:
  - `src/controllers/alertsController.ts:43-64`
- It synthesizes `threatLevel` from position confidence/accuracy instead of using the detection threat-classification pipeline:
  - `src/controllers/alertsController.ts:25-38`
- Review is a no-op:
  - `src/controllers/alertsController.ts:146-175`
- Delete removes the current triangulated position:
  - `src/controllers/alertsController.ts:177-195`
- It returns top-level `latitude` / `longitude` rather than the frontend’s `location` object and does not populate `metadata.triangulatedPosition`:
  - `src/controllers/alertsController.ts:43-64`

Why this breaks the latest frontend:

- Alert history is really a list of current positions, not historical alert events.
- Visitor identity is wrong because `fingerprintHash` is returned as `macAddress`.
- Threat severity in the UI is no longer the product of the real alert-classification path.
- Device fingerprint patterns become meaningless or incomplete.
- Command Center counts “active alerts” from a current-position snapshot, not from real alerts.
- Alert location rendering is partially broken because the response shape does not match the frontend alert type.
- If alert actions are wired later, “mark reviewed” will not persist and “delete alert” will erase a live position, not dismiss a historical alert.

Required backend modification:

- Make `Alert` or a new alert-event table the source of truth for `/api/alerts`.
- Return real visitor identity, not `fingerprintHash` masquerading as a MAC.
- Persist `isReviewed`.
- Delete or dismiss alert records without deleting the live position snapshot.
- Revisit the default `limit=50` in `getAlerts`; the frontend currently assumes a broader history than 50 rows.

### 2. Replay Radar requires a real position-history API, and the backend cannot satisfy it with the current schema

Frontend usage:

- Replay data fetch:
  - `src/hooks/api/useReplayPositions.ts:10-38`
- The frontend explicitly calls `GET /api/positions/history?deviceId=...&from=...&to=...`:
  - `src/api/endpoints/positions.ts:26-35`
- Replay buckets assume many time-sliced position samples across the day:
  - `src/screens/radar/ProximityHeatmapScreen.tsx:303-340`
  - `src/types/replay.ts:5-18`

Current backend behavior:

- There is no `/api/positions/history` route:
  - `src/routes/index.ts:151-186`
- Current positions come from `TriangulatedPosition.findMany(...)` only:
  - `src/controllers/positionsController.ts:17-51`
- `TriangulatedPosition` is unique on `(deviceId, fingerprintHash)`:
  - `prisma/schema.prisma:83-102`
- Position ingestion uses `upsert`, so each new observation overwrites the prior sample:
  - `src/controllers/goliothWebhookController.ts:231-299`
  - `src/controllers/goliothWebhookController.ts:568-647`

Why this breaks the latest frontend:

- Replay Radar needs a time series.
- The backend currently stores only the latest point per fingerprint for a device.
- Even if `/api/positions/history` were added tomorrow, the current table cannot replay the last 24h because the historical samples are already gone.

Required backend modification:

- Add historical position storage.
- Best option: keep `TriangulatedPosition` as the current snapshot and add a separate `TriangulatedPositionHistory` or `PositionSample` table with:
  - `deviceId`
  - `fingerprintHash`
  - `macAddress?`
  - `signalType`
  - `latitude`
  - `longitude`
  - `accuracyMeters`
  - `confidence`
  - `measurementCount`
  - `observedAt`
  - `ingestedAt`
- Implement `GET /api/positions/history`.
- Keep `/api/positions` as the “latest snapshot” endpoint if that is still useful for live map rendering.

### 3. The latest frontend expects stable visitor identity, but the backend does not persist it through triangulation

Frontend expectations:

- `TriangulatedPosition` now includes optional `macAddress`:
  - `src/types/triangulation.ts:9-21`
- Replay buckets want `macAddress` for profile navigation:
  - `src/types/replay.ts:5-13`
- Replay bucket matching uses `position.macAddress` first:
  - `src/hooks/useTimeBucketing.ts:23-63`
- Device Fingerprint navigation and Known Devices flows operate on `macAddress`:
  - `src/screens/fingerprint/DeviceFingerprintScreen.tsx:18-179`
  - `src/screens/settings/AddKnownDeviceScreen.tsx:19-83`

Current backend behavior:

- Live positions response omits `macAddress` entirely:
  - `src/controllers/positionsController.ts:25-43`
- Position ingestion stores only `fingerprintHash`:
  - `prisma/schema.prisma:83-102`
  - `src/controllers/goliothWebhookController.ts:231-299`
- `/api/alerts` invents `macAddress` by copying `fingerprintHash`:
  - `src/controllers/alertsController.ts:43-64`

Why this breaks the latest frontend:

- “Add to Known Devices” validates full MAC format (`XX:XX:XX:XX:XX:XX`), so a `fingerprintHash` cannot be used:
  - `src/screens/settings/AddKnownDeviceScreen.tsx:30-50`
- Device fingerprint screens and recent visitor chips may navigate using the wrong identifier.
- Replay Radar can only do weak timestamp-based correlation when `macAddress` is missing.

Required backend modification:

- Persist a real stable identifier that the frontend can use for known-device and fingerprint features.
- If the backend truly intends to use `fingerprintHash` as the canonical identifier instead of MAC, then the frontend contract, validation, and known-device schema would all need to be changed. That would be a frontend re-design, not a backend catch-up.
- The simpler alignment path is: backend should expose real `macAddress` where the frontend expects it.

Important implementation note:

- The standalone `positions` payload does not currently appear to contain a raw MAC. If that is true, backend alignment likely requires one of:
  - re-enabling detection/summary ingestion and maintaining a `fingerprintHash -> macAddress` correlation table
  - extending firmware/Golioth payloads so positions can carry or be joined to real MAC identity
  - explicitly redesigning the frontend to use fingerprint hashes everywhere instead of MACs

### 4. The backend’s live data pipeline does not feed the analytics and alert features the frontend is using

Current backend behavior:

- The active webhook route ignores `detections`:
  - `src/controllers/goliothWebhookController.ts:88-104`
- The detection handlers that create `Alert` and `DetectionWindow` still exist but are not called by the active route:
  - `src/controllers/goliothWebhookController.ts:115-225`
  - `src/controllers/goliothWebhookController.ts:372-534`
- `/api/analytics` reads from the `Alert` table:
  - `src/controllers/analyticsController.ts:17-154`

Why this breaks the latest frontend:

- Analytics dashboard depends on real alert history:
  - `src/api/analytics.ts:15-25`
  - `src/screens/analytics/DashboardScreen.tsx`
- Command Center and Device Fingerprint also depend on alert history.
- If the backend ignores `detections`, `Alert` and `DetectionWindow` stop representing live reality.

Required backend modification:

- Re-enable the detection pipeline in the active webhook route, or explicitly replace it with a new alert/event generation path.
- Ensure `Alert` and `DetectionWindow` stay in sync with the same data the app surfaces.

### 5. Analytics period support no longer matches the frontend UI

Frontend behavior:

- Dashboard period selector offers `day`, `week`, `month`, and `year`:
  - `src/screens/analytics/DashboardScreen.tsx:24-35`
- `useAnalytics` passes the selected period directly to the backend:
  - `src/hooks/useAnalytics.ts:9-30`

Current backend behavior:

- `getAnalytics()` only handles `day`, `week`, and `month`; `year` falls through to the default `week` branch:
  - `src/controllers/analyticsController.ts:19-41`
- Trend data is always grouped by date, regardless of period:
  - `src/controllers/analyticsController.ts:89-104`

Why this breaks the latest frontend:

- Selecting “year” in the analytics UI will return week-sized data.
- “day” mode expects finer granularity than daily aggregation.

Required backend modification:

- Support `period=year`.
- Align trend aggregation to the UI:
  - `day`: hourly
  - `week` / `month`: daily
  - `year`: monthly

### 6. The backend route surface is missing several endpoints that are now active or close to active in the frontend

Missing or incomplete active surfaces:

1. `POST /auth/refresh`

- Frontend expects it in auth interceptors:
  - `src/services/authService.ts:31-37`
- Backend routes do not define it:
  - `src/routes/index.ts:23-188`

2. `GET/POST/PATCH/DELETE /whitelist*`

- Frontend Known Devices uses these now:
  - `src/api/endpoints/knownDevices.ts:4-33`
  - `src/screens/fingerprint/DeviceFingerprintScreen.tsx:21-23`
  - `src/screens/settings/KnownDevicesScreen.tsx`
- Backend has a `Whitelist` model but no routes:
  - `prisma/schema.prisma:117-128`
  - `src/routes/index.ts:23-188`

3. `GET/PUT /settings/vacation-mode`

- Vacation Mode screen calls these today:
  - `src/api/settings.ts:32-47`
  - `src/screens/settings/VacationModeScreen.tsx`
- Backend does not implement them.

4. `POST /api/devices`

- Frontend endpoint exists:
  - `src/api/endpoints/devices.ts:15-18`
- Backend route is missing:
  - `src/routes/index.ts:113-135`

5. `POST /devices/fcm-token`

- Notification registration expects it:
  - `src/services/notificationService.ts:22-25`
- Backend route is missing.

Lower-priority missing surfaces:

- `/user/profile`
- `/user/change-password`
- `/user/account`
- `/analytics/heatmap`
- `/analytics/devices/:macAddress`
- `/analytics/export`
- `/analytics/comparison`
- `/analytics/threat-timeline`
- `/analytics/top-devices`
- `/settings/notifications`
- `/settings/detection`
- `/settings/reset`
- `/settings/export`
- `/settings/import`

Some of those are not fully wired in the UI yet, but they remain frontend/backend contract drift.

## Detailed Backend Changes Needed

## P0: Required for the April 1 frontend work to be correct

### A. Restore a real alert pipeline

Backend changes:

- Route `detections` to `handleDetection()` / `handleDetectionSummary()` again, or replace with an equivalent new pipeline.
- Make `/api/alerts` read real alert history, not `TriangulatedPosition`.
- Persist review state and implement a real alert-delete/dismiss behavior.
- Return a frontend-compatible alert shape.

Recommended response shape for alert APIs:

```ts
{
  id: string
  deviceId: string
  timestamp: string
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  detectionType: 'wifi' | 'bluetooth' | 'cellular'
  rssi: number
  macAddress: string
  isReviewed: boolean
  isFalsePositive: boolean
  location?: {
    latitude: number
    longitude: number
  }
  metadata?: {
    distance?: number
    signalCount?: number
    windowDuration?: number
    triangulatedPosition?: {
      latitude: number
      longitude: number
      accuracyMeters: number
      confidence: number
    }
  }
}
```

Why include `location` and `metadata.triangulatedPosition`:

- `AlertDetailScreen` checks those fields explicitly.
- The current backend puts `latitude` and `longitude` at the top level, which does not match the frontend alert type.

### B. Add historical positions storage plus `/api/positions/history`

Backend changes:

- Add a time-series position history model.
- Implement `GET /api/positions/history`.
- Return the same `TriangulatedPosition` shape the frontend already expects, including `macAddress` when known.
- Use an observation timestamp, not just the row `updatedAt`.

Recommended split:

- `TriangulatedPosition`: latest/current snapshot per device + fingerprint
- `TriangulatedPositionHistory` or `PositionSample`: append-only history used for replay

### C. Add visitor identity enrichment to positions and alerts

Backend changes:

- Persist `macAddress` alongside `fingerprintHash` wherever possible.
- Include `macAddress` in:
  - `/api/positions`
  - `/api/positions/history`
  - `positions-updated` websocket payload
  - `/api/alerts`
- Define how `fingerprintHash` is correlated to `macAddress` if the raw positions payload does not carry it.

### D. Fix analytics period/granularity and reactivate live analytics data

Backend changes:

- Support `period=year`.
- Use hourly aggregation for `day`.
- Use monthly aggregation for `year`.
- Ensure `Alert` and `DetectionWindow` are being populated from live ingress again.

## P1: Required for current navigable screens to stop failing

### E. Implement refresh-token rotation or refresh-token exchange

Frontend dependency:

- `src/services/authService.ts:31-37`

Backend changes:

- Add `POST /auth/refresh`.
- Validate refresh tokens against the refresh secret.
- Return the same token envelope the frontend already expects.
- Optional but recommended: include `expiresIn`.

### F. Implement Known Devices (`/whitelist`) properly, not just routes

Frontend dependency:

- `src/api/endpoints/knownDevices.ts:4-33`
- `src/screens/settings/AddKnownDeviceScreen.tsx:57-83`

Backend changes:

- Add CRUD routes for `/whitelist`.
- Resolve schema mismatch:
  - frontend expects `name`
  - current Prisma model stores `deviceName`
- Add `expiresAt` support if temporary-access UX is meant to work.
- Return `createdAt` / `updatedAt`.

Likely Prisma changes:

- rename `deviceName` to `name` in schema or map it in the API layer
- add `expiresAt DateTime?`

### G. Implement Vacation Mode settings if that screen is meant to be functional

Frontend dependency:

- `src/api/settings.ts:32-47`
- `src/screens/settings/VacationModeScreen.tsx`

Backend changes:

- Add a user-scoped settings model or equivalent storage.
- Implement:
  - `GET /settings/vacation-mode`
  - `PUT /settings/vacation-mode`

## P2: Important follow-up work

### H. Implement `POST /api/devices`

Why:

- The frontend has a device-create endpoint defined.
- The Property Command Center empty state routes users to Add Device.

Backend note:

- Frontend contracts around device creation are not fully settled yet:
  - `CreateDeviceDTO` in `src/types/device.ts` expects `location` and `deviceKey`
  - `AddDeviceScreen` currently collects `deviceName` and `deviceId`

This needs a shared product/API decision before implementation.

### I. Implement FCM token registration

Frontend dependency:

- `src/services/notificationService.ts:22-25`

Backend changes:

- Add `POST /devices/fcm-token` or a more clearly named user notification-token route.
- Store tokens on `User.fcmTokens`.

### J. Implement user profile/account routes if the app intends to keep those hooks

Frontend contracts:

- `src/api/endpoints/user.ts:4-28`

Current status:

- hooks exist
- backend routes do not
- some current screens are still UI-only

### K. Decide whether the extra analytics routes remain part of the product

Frontend contracts:

- `src/api/analytics.ts:27-116`

Backend decision needed:

- either implement them
- or remove/deprecate them in the frontend so the contract is smaller and clearer

## Data-Model Changes Required

Before implementing new routes, the backend schema likely needs structural changes.

### 1. `TriangulatedPosition` cannot serve both “current snapshot” and “replay history”

Current problem:

- `@@unique([deviceId, fingerprintHash])` prevents historical replay storage.

Recommended change:

- Keep snapshot semantics in `TriangulatedPosition`.
- Add a new append-only history table for replay.

### 2. `Whitelist` does not match the frontend Known Devices model

Current Prisma model:

- `deviceName`
- no `expiresAt`

Frontend model:

- `name`
- `expiresAt?`

Recommended change:

- align the DB model or do explicit API-layer mapping

### 3. Schema/migration drift must be corrected before adding more position work

The backend’s own analysis already notes Prisma schema vs migration drift around `TriangulatedPosition`. That should be fixed before adding history storage or changing the live snapshot model further.

## Ingestion Pipeline Changes Required

### 1. Stop discarding `detections`

This is the single highest-value backend pipeline fix. Without it:

- `Alert` history is stale or empty
- analytics drift from live data
- fingerprint behavior and command-center visitor logic degrade

### 2. Use source timestamps for replay/history data

Current behavior:

- standalone position ingestion uses `new Date()` as canonical time:
  - `src/controllers/goliothWebhookController.ts:238-240`
  - `src/controllers/goliothWebhookController.ts:586-588`

Why this matters:

- replay should reflect when the device was observed, not when the backend processed it
- polling delays will distort playback if processing time is used as observation time

Recommended change:

- store both:
  - `observedAt` from payload or stream record time
  - `ingestedAt` from server time

### 3. Update device GPS from position payloads when location is present

Current behavior:

- `processPositionData()` accepts `loc` but does not use it:
  - `src/controllers/goliothWebhookController.ts:568-647`

Why it matters:

- the frontend centers live map and mini property map on `Device.latitude` / `Device.longitude`
- if heartbeat is stale or absent, device map position can lag behind live data

Recommended change:

- when position payloads include `loc`, update the device record too

## Non-Backend Notes

These are not backend modifications, but they matter for rollout planning.

1. Real WebSocket lifecycle is still incomplete on the frontend

- In real API mode, `App.tsx` logs that WebSocket will connect after authentication, but no global real socket connection is started there.
- Backend fixes alone will not make live alerts appear if the frontend never mounts the real connection path.

2. Some settings/device screens are still partially UI-only

- Example: Add Device and several profile/security actions still contain placeholder behavior.
- Backend routes can be prepared now, but some screens still need frontend wiring.

## Recommended Backend Implementation Order

1. Fix schema/migration drift around triangulated-position storage.
2. Re-enable the detection pipeline and make `/api/alerts` query real alert history.
3. Add position history storage and implement `/api/positions/history`.
4. Add `macAddress` enrichment to positions, alerts, and websocket payloads.
5. Fix analytics to use live alert/detection-window data and support all frontend periods.
6. Implement `/auth/refresh`.
7. Implement `/whitelist*` with schema/API alignment for Known Devices.
8. Implement `/settings/vacation-mode`.
9. Implement `/api/devices` create flow and `/devices/fcm-token`.
10. Decide whether to implement or retire the remaining `/user/*`, `/settings/*`, and `/analytics/*` holdovers.

## Bottom Line

The backend does not just need a few route additions. To properly support the latest frontend, it needs:

- a real alert-history source of truth
- a real position-history source of truth
- stable visitor identity across alerts, replay, and known-device flows
- reactivated ingestion for alerts/analytics
- a smaller set of missing but important auth/settings/known-device routes

If only one thing is fixed first, it should be the alert/position data model split:

- current snapshot for live map
- append-only history for replay and behavior analysis

That change unlocks most of the April 1 frontend work. Everything else layers on top of it.
