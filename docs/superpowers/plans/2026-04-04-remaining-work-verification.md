# TrailSense Remaining Work Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Independently verify every claim in `TRAILSENSE_REMAINING_WORK_2026-04-04.md` and produce a single execution-ready report (`TRAILSENSE_VERIFICATION_REPORT_2026-04-04.md`) documenting what's confirmed, what's actually still broken, and what was missed.

**Architecture:** Hybrid parallel/sequential — two parallel agents handle Phase 1 (verify DONE claims on mobile) and Phase 2 (verify TODO claims on backend) simultaneously. Phase 3 (new issue discovery) and Phase 4 (synthesis into report) run sequentially after, using findings from both agents.

**Tech Stack:** TypeScript/React Native (mobile), Node.js/Express/Prisma (backend), ESP-IDF C (firmware — read-only reference)

**Important:** This is an analysis-only plan. No code changes are made. Every task produces verification notes, not code commits. The only file written is the final report.

---

## File Map

**Files to read (firmware — `TrailSenseDevice/`):**

- `main/main.c` — `maybe_send_*_diagnostic` functions, `s_diagnostic_logging_enabled` flag, active data path

**Files to read (mobile — `TrailSense/`):**

- `src/types/alert.ts` — Alert, AlertMetadata, DeviceFingerprint, AnalyticsData types
- `src/types/replay.ts` — BucketEntry, FingerprintPeekProps
- `src/types/knownDevice.ts` — KnownDevice, CreateKnownDeviceDTO
- `src/types/triangulation.ts` — TriangulatedPosition (check optional macAddress)
- `src/types/cardData.ts` — PatternData visitors
- `src/types/llm.ts` — AlertContext, DeviceContext
- `src/api/analytics.ts` — getDeviceHistory signature and URL
- `src/api/settings.ts` — settings API calls (no backend routes exist)
- `src/api/endpoints/user.ts` — user API calls
- `src/api/endpoints/alerts.ts` — alert API calls
- `src/api/endpoints/devices.ts` — device API calls
- `src/api/endpoints/positions.ts` — position API calls
- `src/api/endpoints/knownDevices.ts` — known device API calls
- `src/hooks/useAnalytics.ts` — useDeviceHistory query key
- `src/hooks/useTimeBucketing.ts` — join logic
- `src/hooks/useReplayPath.ts` — grouping logic
- `src/screens/fingerprint/DeviceFingerprintScreen.tsx` — route param
- `src/screens/radar/ProximityHeatmapScreen.tsx` — deduplication logic
- `src/navigation/types.ts` — DeviceFingerprint param types
- `src/navigation/linking.ts` — deep link paths
- `src/components/organisms/AlertCard/AlertCard.tsx` — display fields
- `src/services/threatClassifier.ts` — scoring inputs
- `src/services/notificationService.ts` — FCM token API calls
- `src/App.tsx` — WebSocket connection mode
- `src/mocks/data/mockAlerts.ts` — confidence scale, fingerprint format
- `src/mocks/data/mockAnalytics.ts` — topDetectedDevices shape
- `src/mocks/data/mockReplayPositions.ts` — confidence scale
- `src/utils/seedMockData.ts` — confidence scale
- `__tests__/hooks/useReplayPositions.test.tsx` — stale macAddress/confidence fixture

**Files to read (backend — `trailsense-backend/`):**

- `src/controllers/alertsController.ts` — response shape, DTO mapper presence
- `src/controllers/analyticsController.ts` — topDetectedDevices, getDeviceFingerprint
- `src/controllers/goliothWebhookController.ts` — detectionCount increment logic
- `src/controllers/positionsController.ts` — updatedAt vs observedAt
- `src/routes/index.ts` — whitelist/known-device routes
- `src/services/websocketService.ts` — broadcast events
- `prisma/schema.prisma` — Device.detectionCount, Alert model, PositionSample model

**File to write:**

- `TRAILSENSE_VERIFICATION_REPORT_2026-04-04.md` (project root)

---

## Task 1: Verify DONE Claims — Mobile + Firmware (Phase 1 Agent)

> **Dispatch as:** Parallel agent targeting the mobile repo at `TrailSense/` and firmware repo at `TrailSenseDevice/`

**Files to read:** All mobile and firmware files listed in File Map above.

- [ ] **Step 1: Verify Finding 1 — Raw detections not preserved (by design)**

Read `TrailSenseDevice/main/main.c`. Verify:

1. Find `s_diagnostic_logging_enabled` — what is its default value? Is it `false`?
2. Find `maybe_send_wifi_diagnostic`, `maybe_send_bt_diagnostic`, `maybe_send_cellular_diagnostic` — confirm each is gated by `if (!s_diagnostic_logging_enabled ...) return;`
3. Confirm these functions ARE called from the active detection handlers (lines ~882, ~949, ~1006) — meaning they execute at runtime but are no-ops when diagnostics are disabled
4. Confirm the active data path sends positions via the position queue (`position_queue.c`), NOT raw detections via `golioth_send_wifi_detection` / `golioth_send_ble_detection` / `golioth_send_cellular_detection`
5. Search for any code that sets `s_diagnostic_logging_enabled = true` — is this toggleable via Golioth remote config, serial command, or Kconfig?

Record: default state of the flag, gating pattern, whether it's runtime-toggleable, and what the active data path actually sends. This is important because the remaining work doc says "no action needed by design" but the diagnostic sends are runtime-gated, not compiled out.

- [ ] **Step 2: Verify Finding 2 — Alert contract migration (negative grep)**

Search `TrailSense/src/`, `TrailSense/src/mocks/`, and `TrailSense/__tests__/` using ripgrep. Each pattern must return **zero** matches:

```bash
rg '\.rssi' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg '\.macAddress' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg 'macAddress:' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg 'interpretRSSI' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg 'RSSIInterpretation' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg 'PERSONA_MACS' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
rg 'mac_address' --glob '*.{ts,tsx}' TrailSense/src/ TrailSense/__tests__/
```

Note: `src/mocks/` is a subdirectory of `src/`, so the `TrailSense/src/` target covers it.

Record: hit count per pattern per directory. Any non-zero count is a finding.

**Exceptions:**

- `TriangulatedPosition.macAddress` in `src/types/triangulation.ts` is intentionally kept as an optional field. This single occurrence in `src/` is expected and should be noted but is NOT a failure.
- Any `macAddress` hits in `__tests__/` ARE failures — the remaining work doc claims all test fixtures were updated.

- [ ] **Step 2: Verify Finding 2 — Alert contract migration (positive confirmation)**

Read `src/types/alert.ts` and confirm:

- `Alert` interface has `fingerprintHash: string`, `confidence: number`, `accuracyMeters: number`
- `Alert` interface does NOT have `rssi`, `macAddress`, `cellularStrength`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration`
- `AlertMetadata` has `measurementCount` and `source` includes `'positions'`
- `AlertMetadata` does NOT have `channel`, `deviceName`, `ssid`, `vendor`, `band`, `provider`, `cellularPeak`, `cellularAvg`, `cellularDelta`, `burstCount`, `clusterIndex`
- `DeviceFingerprint` uses `fingerprintHash` (not `macAddress`) and `detections[].confidence` (not `detections[].rssi`)
- `AnalyticsData.topDetectedDevices` uses `fingerprintHash` (not `macAddress`)

Record: file path, line numbers, and exact field names found for each confirmation.

- [ ] **Step 3: Spot-check 10 claimed file changes**

Read the **current implementation** (not just types) of these 10 files and confirm the claimed changes are present:

1. `src/components/organisms/AlertCard/AlertCard.tsx` — uses `interpretAccuracy(alert.accuracyMeters)` not `interpretRSSI(alert.rssi)`, displays `confidence%` not `rssi dBm`, passes `fingerprintHash` to `onAddToKnown`
2. `src/screens/alerts/AlertDetailScreen.tsx` — hero metrics use `confidence%` and `interpretAccuracy`, fingerprint ID row not MAC Address row
3. `src/services/threatClassifier.ts` — scores on `confidence`, `accuracyMeters`, `detectionType`, time of day (NOT `rssi`, `wifiDetected`, `bluetoothDetected`, `multiband`, `isStationary`, `seenCount`, `duration`)
4. `src/services/deviceFingerprinting.ts` — `trackDevice(fingerprintHash)` not `trackDevice(macAddress)`, uses `alert.confidence` not `alert.rssi`
5. `src/store/slices/blockedDevicesSlice.ts` — `BlockedDevice.fingerprintHash` not `.macAddress`
6. `src/hooks/usePropertyStatus.ts` — unique visitors counted by `alert.fingerprintHash` not `alert.macAddress`
7. `src/services/llm/FocusedContextBuilder.ts` — `accuracyToZone()` not `rssiToZone()`, `formatFingerprint()` not `formatMac()`, groups by `fingerprintHash`
8. `src/mocks/data/mockAlerts.ts` — uses `generateFingerprintHash` not `generateMac`, `PERSONA_FINGERPRINTS` not `PERSONA_MACS`, confidence values are 0-100 integers
9. `src/utils/visualEffects.ts` — exports `AccuracyInterpretation`/`interpretAccuracy` not `RSSIInterpretation`/`interpretRSSI`
10. `src/components/molecules/KnownDeviceItem/KnownDeviceItem.tsx` — props use `fingerprintHash` not `macAddress`

Record: for each file, confirmed/not confirmed with line numbers.

- [ ] **Step 4: Verify Finding 3 — Visitor identity**

Read each file and confirm `fingerprintHash` is used:

1. `src/screens/fingerprint/DeviceFingerprintScreen.tsx` — route param is `fingerprintHash` (check `route.params.fingerprintHash`), alert filtering by `fingerprintHash`, analytics logging uses `fingerprintHash`
2. `src/hooks/useTimeBucketing.ts` — alert-position join uses `fingerprintHash` (look for the matching logic where alerts are paired with positions)
3. `src/screens/radar/ProximityHeatmapScreen.tsx` — deduplication logic uses `fingerprintHash` (check Set/Map keys and filter predicates)
4. `src/navigation/types.ts` — all `DeviceFingerprint` screen params use `{ fingerprintHash: string }` (search for all 5 occurrences across tab stacks)
5. `src/navigation/linking.ts` — all deep link paths use `:fingerprintHash` not `:macAddress` (search for all 5 fingerprint deep link paths)

Record: for each file, confirmed/not confirmed with line numbers and the exact code pattern found.

- [ ] **Step 5: Verify Finding 5 (mobile) — Analytics**

Read each file and confirm:

1. `src/api/analytics.ts` — `getDeviceHistory` function signature accepts `fingerprintHash: string`, URL is `/analytics/devices/${fingerprintHash}`
2. `src/hooks/useAnalytics.ts` — `useDeviceHistory` accepts `fingerprintHash`, query key is `['device-history', fingerprintHash]`
3. `src/types/alert.ts` — `AnalyticsData.topDetectedDevices` is `Array<{ fingerprintHash: string; count: number }>` (already checked in Step 2 but confirm the exact array element shape here)

Record: for each, confirmed/not confirmed with line numbers.

- [ ] **Step 6: Verify Finding 9 — Replay/radar**

Read each file and confirm:

1. `src/types/replay.ts` — `BucketEntry` interface has NO `macAddress` field, uses `fingerprintHash`
2. `src/hooks/useReplayPath.ts` — device path grouping uses `fingerprintHash` as the Map key (look for `Map<string, ...>` keyed by `fingerprintHash`)
3. `src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx` — `onDotTap` passes `fingerprintHash`
4. `src/components/molecules/FingerprintPeek/FingerprintPeek.tsx` — props use `fingerprintHash`, display shows `fingerprintHash`

Record: for each, confirmed/not confirmed with line numbers.

- [ ] **Step 7: Compile Phase 1 results**

Write a structured summary with this format for each finding:

```
Finding N: [name]
Status: Confirmed / Partially Done / Not Done
Evidence:
  - [file:line] — [what was confirmed]
  - [file:line] — [what was confirmed]
Gaps (if any):
  - [description of what's missing or wrong]
```

---

## Task 2: Verify TODO Claims — Backend Codebase (Phase 2 Agent)

> **Dispatch as:** Parallel agent targeting the backend repo at `trailsense-backend/`

**Files to read:** All backend files listed in File Map above.

- [ ] **Step 1: Verify Finding 2 backend — Alert DTO mapper**

Read `trailsense-backend/src/controllers/alertsController.ts` fully. Answer these questions:

1. Is there a `toAlertDTO` function or any response mapping function? (Search for `function to`, `const to`, `=> ({`)
2. Does `getAlerts()` return raw Prisma rows via `res.json(alerts)` or does it transform them?
3. Does `getAlertById()` return raw Prisma rows or transformed?
4. Are `latitude` and `longitude` returned as flat fields, or mapped into a `location: { latitude, longitude }` object?
5. What exact fields does the response include? List every field name.

Record: exact line numbers for `getAlerts()` response and `getAlertById()` response, and the answer to each question.

- [ ] **Step 2: Verify Finding 4 — Whitelist/known-device backend**

Search the entire `trailsense-backend/` repo:

1. Read `src/routes/index.ts` — search for any route containing `whitelist`, `known-device`, `known_device`, or `knownDevice`
2. Search all `src/controllers/` files for any whitelist controller
3. Search `prisma/schema.prisma` for any `Whitelist` or `KnownDevice` model
4. Search all `.ts` files for any `whitelist` or `knownDevice` string

Record: confirmed missing (with list of files searched) or found (with exact location).

- [ ] **Step 3: Verify Finding 5 backend — Analytics endpoints**

Read `trailsense-backend/src/controllers/analyticsController.ts` fully. Answer:

1. Does `getAnalytics()` return `topDetectedDevices`? If so, what is the shape of each element — `{ fingerprintHash, count }` or `{ macAddress, count }` or something else? Cite the exact code that builds this array.
2. Is there a `getDeviceHistory` or `getDeviceFingerprint` function? What path parameter does it accept — `fingerprintHash` or `macAddress` or `id`?
3. What does that function return? List every field in the response object.
4. Compare the response shape to the mobile `DeviceFingerprint` type:
   ```typescript
   {
     id: string;
     fingerprintHash: string;
     firstSeen: string;
     lastSeen: string;
     totalVisits: number;
     detections: Array<{ timestamp: string; confidence: number; location?: {...}; type: string }>;
     averageDuration: number;
     commonHours: number[];
     category: string;
   }
   ```
   Which fields match? Which are missing from the backend response? Which does the backend return that the mobile doesn't expect?

Record: exact line numbers and field-by-field comparison.

- [ ] **Step 4: Verify Finding 6 — detectionCount**

1. Read `trailsense-backend/src/controllers/goliothWebhookController.ts` fully
2. Search for any `detectionCount` string in the file — is it ever incremented (`increment`, `update`, `+=`, `+ 1`)?
3. Search for `detectionCount` across the entire `trailsense-backend/src/` directory
4. Read `prisma/schema.prisma` — find the `Device` model, confirm `detectionCount` exists, note its type and default

Record: exact line numbers where `detectionCount` appears (or doesn't), and whether any code path increments it.

- [ ] **Step 5: Verify Finding 7 — Replay history timestamp**

Read `trailsense-backend/src/controllers/positionsController.ts` fully. Answer:

1. What function handles current positions? What timestamp field does it return — `updatedAt`, `observedAt`, both, or neither?
2. What function handles position history? What timestamp field does it return?
3. Are these the same field name or different?
4. Read `src/routes/index.ts` — what are the exact route paths for current positions and position history?

Record: exact line numbers for each response, the field names returned, and the route paths.

- [ ] **Step 6: Verify Finding 8 — WebSocket production mode**

1. Read `TrailSense/src/App.tsx` — find the WebSocket connection logic. Is `websocketService.connect()` called unconditionally, or only in mock/demo mode? What token is passed?
2. Read `trailsense-backend/src/services/websocketService.ts` — list every event name the server broadcasts (search for `emit(` or `broadcast(`)
3. Does the mobile app have any production WebSocket connection code (outside of mock mode)?

Record: exact line numbers for connection logic and each broadcast event.

- [ ] **Step 7: Compile Phase 2 results**

Write a structured summary with this format for each finding:

```
Finding N: [name]
Claimed Status: [what the remaining work doc says]
Actual Status: [what the backend code actually shows]
Evidence:
  - [file:line] — [what was found]
Delta (if any):
  - [what needs to change, or "confirmed as claimed"]
Risk if not addressed:
  - Crash / Empty Data / Silent failure — [explanation]
```

---

## Task 3: Discover New Issues (Phase 3 — Sequential)

> **Runs after Tasks 1 and 2 complete.** Uses their findings as input.

**Files to read:** Mock data files, test output, type definitions.

- [ ] **Step 1: Check for stale macAddress/rssi references across the entire repo**

Search ALL of `TrailSense/` (not just `src/` or `__tests__/`) using ripgrep. This catches stale references in test fixtures, mock data, config files, and documentation:

```bash
rg 'macAddress' --glob '*.{ts,tsx}' TrailSense/
rg '\.rssi' --glob '*.{ts,tsx}' TrailSense/
rg 'PERSONA_MACS' --glob '*.{ts,tsx}' TrailSense/
rg 'confidence:\s*0\.\d' --glob '*.{ts,tsx}' TrailSense/
```

**Known issue from review:** `__tests__/hooks/useReplayPositions.test.tsx:17` has `macAddress: 'AA:BB:CC:DD:EE:01'` and `confidence: 0.8` — this is a stale fixture that was missed by the migration.

Any additional hits indicate further missed files.

- [ ] **Step 2: Verify mock data matches Alert type**

Read `src/mocks/data/mockAlerts.ts`. Pick 3 mock alert objects and compare them field-by-field against the `Alert` interface from `src/types/alert.ts`:

For each mock alert, check:

- Has `fingerprintHash` (string, matches `[wbc]_[hex]` format)?
- Has `confidence` (number, 0-100 range, not 0-1)?
- Has `accuracyMeters` (number)?
- Has `location` as `{ latitude, longitude }` object (or undefined)?
- Does NOT have `rssi`, `macAddress`, `cellularStrength`, or any removed fields?

Record: any field mismatches.

- [ ] **Step 3: Verify confidence scale consistency**

Read these files and check that confidence values are 0-100 integers (not 0.0-1.0 floats):

1. `src/mocks/data/mockAlerts.ts` — check confidence values in generated alerts
2. `src/mocks/data/mockReplayPositions.ts` — check confidence in position data
3. `src/utils/seedMockData.ts` — check confidence in seeded data
4. `src/mocks/data/mockAnalytics.ts` — check confidence in device fingerprint detections

Record: any file where confidence is fractional (0-1) instead of percentage (0-100).

- [ ] **Step 4: Verify TriangulatedPosition retains optional macAddress**

Read `src/types/triangulation.ts`. Confirm:

- `macAddress` exists as an optional field (`macAddress?: string`)
- This is intentional (the remaining work doc says it was kept on purpose)

Record: line number and exact type annotation.

- [ ] **Step 5: Run TypeScript type checker**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense && npm run type-check
```

Expected: zero errors (clean exit). If there are errors, record each one with file path and error message. Type errors indicate contract mismatches between files that were updated and files that weren't.

- [ ] **Step 6: Run test suite**

Run the full test suite and capture complete output (do NOT truncate):

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense && npx jest --no-coverage --verbose 2>&1
```

Use the `--verbose` flag to get per-test pass/fail lines. Capture the full output — do not pipe through `tail` or truncate, as failure details at the top would be lost.

The remaining work doc claims 6 pre-existing test failures:

1. `__tests__/screens/LoginScreen.test.tsx`
2. `__tests__/services/llm/modelManagerLoad.test.ts`
3. `__tests__/hooks/useKnownDevices.test.tsx`
4. `__tests__/screens/ProximityHeatmapScreen.replay.test.tsx`
5. `__tests__/architecture/startupImportGraph.test.ts` (x2)

Record: total test suites, total pass/fail counts, and the name of every failing test. If there are MORE than 6 failures, the additional ones are new regressions from the migration — list each new failure with the test name and error message. If output is very long, save it to a temp file and read the summary section.

- [ ] **Step 7: Full mobile API endpoint inventory**

Read EVERY file in `TrailSense/src/api/` and `TrailSense/src/api/endpoints/` to build a complete inventory of API calls. Also check `src/services/notificationService.ts` for FCM token calls. For each endpoint found:

1. Record: HTTP method, URL path, request body/params, expected response type
2. Cross-reference against `trailsense-backend/src/routes/index.ts` to determine if the backend serves this route

**Known API files to check:**

- `src/api/endpoints/alerts.ts` — alert CRUD
- `src/api/endpoints/devices.ts` — device CRUD
- `src/api/endpoints/positions.ts` — positions + history
- `src/api/endpoints/knownDevices.ts` — known device / whitelist calls
- `src/api/endpoints/user.ts` — user profile, password change, account deletion
- `src/api/analytics.ts` — analytics, heatmap, device history, export, comparison
- `src/api/settings.ts` — vacation mode, notification settings, detection settings, export/import (these have NO backend routes — this is a real gap)
- `src/services/notificationService.ts` — FCM token registration
- `src/api/websocket.ts` — WebSocket event subscriptions

**Known gap from review:** `src/api/settings.ts` calls 8 `/settings/*` endpoints (vacation-mode, notifications, detection, reset, export, import) but `trailsense-backend/src/routes/index.ts` has zero `/settings` routes.

Record: each API call, what it sends, what it expects, and whether the backend satisfies it. This data feeds directly into the Contract Gap Matrix in Task 4.

- [ ] **Step 8: Compile Phase 3 findings**

Write a structured list of all new issues found:

```
Issue N: [title]
Severity: High / Medium / Low
Location: [file:line]
Description: [what's wrong]
Impact: [what breaks or degrades]
```

---

## Task 4: Synthesize Final Report (Phase 4 — Sequential)

> **Runs after Task 3 completes.** Uses findings from all three prior tasks.

**File to write:** `TRAILSENSE_VERIFICATION_REPORT_2026-04-04.md` in the project root.

- [ ] **Step 1: Write Section 1 — Verification Results**

For each "DONE" claim (Findings 1, 2 mobile, 3, 5 mobile, 9), write:

| Finding   | Claimed | Verified                     | Evidence          |
| --------- | ------- | ---------------------------- | ----------------- |
| Finding N | DONE    | Confirmed/Partially/Not Done | file:line summary |

Use the data from Task 1.

- [ ] **Step 2: Write Section 2 — Backend Current State**

For each "TODO" item (Findings 2 backend, 4, 5 backend, 6, 7, 8), write:

| Item | What the doc claims | What the backend actually does | Code reference |
| ---- | ------------------- | ------------------------------ | -------------- |

Use the data from Task 2. Include exact response shapes.

- [ ] **Step 3: Write Section 3 — Issues Found**

List all new issues from Task 3 that weren't in the remaining work doc. Include:

- TypeScript errors (if any)
- New test failures (beyond the 6 pre-existing)
- Mock data inconsistencies
- Contract mismatches between mobile API calls and backend responses
- Any stale references found in tests or mocks

- [ ] **Step 4: Write Section 4 — Revised Remaining Work**

Create a prioritized list of all actual remaining work items. For each:

```markdown
### Priority N: [Item Name]

**Repo:** mobile / backend / both
**Files:**

- `exact/path/to/file.ts:line-range` — [what needs to change]

**Risk if not addressed:** Crash / Empty Data / Silent failure
[Explanation of what breaks]

**Effort:** Small / Medium / Large
```

Order by: Crash risks first, then Empty Data, then Silent failures. Within each tier, order by effort (smallest first).

- [ ] **Step 5: Write Section 5 — Contract Gap Matrix**

Build this table using data from Task 3 Step 7:

| Mobile API Call | Method | URL | Request Body/Params | Expected Response Shape | Backend Satisfies? | Gap Description |
| --------------- | ------ | --- | ------------------- | ----------------------- | ------------------ | --------------- |

Cover EVERY API endpoint discovered in Task 3 Step 7. At minimum:

- `GET /api/alerts` and `GET /api/alerts/:id`, `PATCH /api/alerts/:id/reviewed`, `DELETE /api/alerts/:id`
- `GET /api/devices` and device CRUD (`POST`, `PATCH`, `DELETE`)
- `GET /api/positions` and `GET /api/positions/history`, `DELETE /api/positions`
- `GET /api/analytics`
- `GET /analytics/devices/:fingerprintHash`
- `GET /analytics/heatmap`
- `GET /analytics/threat-timeline`
- `GET /analytics/top-devices`
- `GET /analytics/comparison`
- `GET /analytics/export`
- `GET /user/profile`, `PATCH /user/profile`, `POST /user/change-password`, `DELETE /user/account`
- `GET /settings/vacation-mode`, `PUT /settings/vacation-mode`, `GET /settings/notifications`, `PUT /settings/notifications`, `GET /settings/detection`, `PUT /settings/detection`, `POST /settings/reset`, `GET /settings/export`, `POST /settings/import`
- `POST /devices/fcm-token`
- WebSocket events: `alert`, `device-status`, `positions-updated`
- Any `/whitelist` or `/known-devices` calls

**Note:** The `/settings/*` and `/whitelist` or `/known-devices` endpoints are expected to show as gaps (no backend routes). The `/user/*` endpoints DO have backend routes.

- [ ] **Step 6: Final review of the report**

Read the completed report. Check:

- Every "Confirmed" has a file:line citation
- Every "Missing" states where you looked
- No TBDs or placeholders
- Contract gap matrix covers all endpoints
- Priority ordering makes sense (crash > empty > silent)

- [ ] **Step 7: Save the report**

Write the completed report to:

```
/Users/codyschexnider/Documents/Project/TRAILSENSE_VERIFICATION_REPORT_2026-04-04.md
```

No git commit needed — this is an analysis artifact, not source code.
