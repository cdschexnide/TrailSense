# TrailSense Remaining Work Verification — Design Spec

Date: 2026-04-04

## Purpose

Independently verify the claims in `TRAILSENSE_REMAINING_WORK_2026-04-04.md` and produce an execution-ready assessment of what still needs to be done across the TrailSense stack (mobile app, backend, firmware).

This is an analysis-only task. No code changes are made.

## Repos

- **Mobile app:** `/Users/codyschexnider/Documents/Project/TrailSense`
- **Backend:** `/Users/codyschexnider/Documents/Project/trailsense-backend`
- **Firmware:** `/Users/codyschexnider/Documents/Project/TrailSenseDevice`

## Input Documents

1. `TRAILSENSE_REMAINING_WORK_2026-04-04.md` — Claims about what was done and what remains
2. `TRAILSENSE_STACK_CONTRACT_AUDIT_2026-04-04.md` — Original audit findings
3. `TRAILSENSE_STACK_CHANGE_LIST_2026-04-04.md` — Original change list
4. `TrailSense/docs/superpowers/specs/2026-04-04-alert-contract-alignment-design.md` — Design spec
5. `TrailSense/docs/superpowers/plans/2026-04-04-alert-contract-alignment.md` — Implementation plan

## Execution Architecture

### Hybrid parallel/sequential approach

**Phase 1 Agent (parallel):** Verify all "DONE" claims by reading the mobile codebase AND firmware.

- Finding 1 (raw detections by design): Verify that `maybe_send_wifi_diagnostic`, `maybe_send_bt_diagnostic`, and `maybe_send_cellular_diagnostic` in `TrailSenseDevice/main/main.c` are gated behind `s_diagnostic_logging_enabled` and confirm the default state of that flag. Verify that the active data path uses the `positions` + `heartbeat` contract, not raw detection uploads.
- Finding 2 (mobile Alert contract): Confirm `rssi`/`macAddress` removed from `src/types/alert.ts`, grep entire `src/` AND `__tests__/` AND `src/mocks/` for zero remaining `.rssi`, `.macAddress`, `interpretRSSI`, `RSSIInterpretation`, `PERSONA_MACS`, `mac_address` references. Spot-check 10 claimed file changes by reading current code. Verify test fixtures have been updated (confidence 0-100, no macAddress).
- Finding 3 (visitor identity): Confirm `DeviceFingerprintScreen` uses `fingerprintHash` route param, `useTimeBucketing` joins by `fingerprintHash`, `ProximityHeatmapScreen` deduplicates by `fingerprintHash`, navigation types and deep links use `fingerprintHash`.
- Finding 5 mobile (analytics): Confirm `getDeviceHistory` accepts `fingerprintHash`, query key uses `fingerprintHash`, `AnalyticsData.topDetectedDevices` uses `fingerprintHash`.
- Finding 9 (replay/radar): Confirm `BucketEntry` has no `macAddress`, `useReplayPath` groups by `fingerprintHash`.

**Phase 2 Agent (parallel):** Verify all "TODO" claims against the backend repo.

- Finding 2 backend (alert DTO mapper): Read `alertsController.ts` — check for mapper, `location` object handling, exact response fields.
- Finding 4 (whitelist/known-device): Search for any `/whitelist` or `/known-devices` routes or models.
- Finding 5 backend (analytics endpoints): Read `analyticsController.ts` — check `topDetectedDevices` shape, `getDeviceHistory` path param, response shape vs mobile `DeviceFingerprint` type.
- Finding 6 (detectionCount): Read `goliothWebhookController.ts` — search for increment logic. Read Prisma schema for `detectionCount` on Device model.
- Finding 7 (replay history timestamp): Read `positionsController.ts` — check `updatedAt` vs `observedAt` in responses.
- Finding 8 (WebSocket production): Read `App.tsx` for connection mode, `websocketService.ts` for broadcast events.

**Phase 3 (sequential, after agents):** Look for issues the remaining work doc missed.

- Grep for any remaining `macAddress` or `rssi` references in mobile `src/`, `__tests__/`, and `src/mocks/` that were missed.
- Inventory ALL mobile API calls (not just migration-related ones) by reading every file in `src/api/` and `src/api/endpoints/`. Cross-reference each against `trailsense-backend/src/routes/index.ts` to find endpoints the mobile calls that the backend doesn't serve (e.g., `/settings/*`).
- Compare mock data shapes field-by-field against the `Alert` type definition.
- Verify confidence values are consistently 0-100 in all mock data AND test fixtures.
- Run `npm run type-check` in the TrailSense directory.
- Run `npm test` in the TrailSense directory, capturing full output (not truncated) to check for new test failures beyond the 6 pre-existing ones.
- Confirm `TriangulatedPosition` still has optional `macAddress` (intentionally kept).

**Phase 4 (sequential, after Phase 3):** Synthesize all findings into the output document.

- For each remaining backend item: assess if actually needed, exact scope (files/lines/functions), risk if deployed without backend change, priority order.
- Build contract gap matrix.

## Verification Criteria

### For "DONE" claims

- **Zero grep hits** for removed identifiers (`macAddress`, `rssi`, `PERSONA_MACS`, `interpretRSSI`, `RSSIInterpretation`, `mac_address`) in `src/`, `__tests__/`, and mock data files
- **Positive confirmation** of new identifiers (`fingerprintHash`, `confidence`, `accuracyMeters`, `interpretAccuracy`) at expected file locations — read actual implementation code, not just type signatures
- **Mock data consistency** — confidence values in 0-100 range (not fractional 0-1), fingerprint format matches `/^[wbc]_[0-9a-f]{4,10}$/`

### For "TODO" claims

- **Actual code reading** of the backend file cited, not just existence check
- **Precise delta** between what the backend returns today and what the mobile app expects
- **Risk classification per gap:**
  - **Crash** — type mismatch at runtime (e.g., accessing `.location.latitude` when backend returns flat `latitude`)
  - **Empty data** — missing field renders as blank/undefined in UI
  - **Silent** — works on mocks but fails on real API responses

## Output Document

Single markdown file: `TRAILSENSE_VERIFICATION_REPORT_2026-04-04.md` in the project root.

### Sections

1. **Verification Results** — Per "DONE" finding: Confirmed / Partially Done / Not Done, with file:line evidence.
2. **Backend Current State** — Per "TODO" item: what the backend actually does today with exact code references.
3. **Issues Found** — New problems, inconsistencies, or gaps not covered in the remaining work doc.
4. **Revised Remaining Work** — Prioritized list with: exact files and line numbers, mobile vs backend, risk assessment (crash/empty/silent), suggested implementation order.
5. **Contract Gap Matrix** — Table: mobile API call | what it sends | what it expects back | whether the backend satisfies that contract today.

## Constraints

- Read-only. No code changes.
- Cite exact file and line number for every confirmation or gap.
- When claiming something is missing, cite where you looked.
- Be skeptical of claims in the remaining work doc — verify everything independently.
- If a backend directory doesn't exist at the expected path, state so and explain implications.
