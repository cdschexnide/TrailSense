# Rename detectionCount to alertCount: Frontend Alignment Spec

**Date:** 2026-04-05
**Status:** Draft (revised after code review)
**Approach:** Option A — rename the frontend field and labels to match backend semantics; add API mapping layer for backend compatibility

## Problem

The backend increments `Device.detectionCount` only when a new alert is created (high/critical severity positions). The backend deduplicates by suppressing alerts for the same deviceId/fingerprintHash pair if an unreviewed alert already exists within five minutes, so this is a deduped alert-record count — not a guaranteed unique-visit count. However, the mobile UI labels this value as "Detections", which implies total signal observations rather than alerts. This causes users to misinterpret the metric.

## Key Decision

**`detectionCount` is a deduped alert count.** The backend increments it per alert creation (with 5-minute same-fingerprint dedup). The frontend should call it what it is: `alertCount`, labeled "Alerts."

The backend Prisma schema retains `detectionCount` for now. The frontend maps the field at the API boundary, following the same mobile-first pattern established in the alert contract alignment spec (2026-04-04).

## Scope

### 1. Type & API Boundary

**`src/types/device.ts`**
- Rename `detectionCount?: number` to `alertCount?: number` on the `Device` interface

**`src/api/endpoints/devices.ts`**
- Add an idempotent `mapDeviceResponse()` helper: if the object has `detectionCount` but not `alertCount`, remap it; if it already has `alertCount` (e.g. mock/demo cache returns frontend-shaped objects), pass through unchanged. This prevents zeroing out counts in mock mode where `seedMockData()` seeds the React Query cache directly with frontend-shaped `mockDevices`.
- Add a `mapDeviceRequest()` helper for the PATCH write path: translates `alertCount` back to `detectionCount` before sending to the backend, since the backend Prisma schema expects `detectionCount`.
- Apply response mapper in `getDevices`, `getDeviceById`, `addDevice`, `updateDevice`. Apply request mapper in `updateDevice`.

**`src/mocks/data/mockDevices.ts`**
- Rename `detectionCount` to `alertCount` on all 5 mock device objects

**`src/mocks/data/mockAnalytics.ts`**
- Rename `detectionCount` to `alertCount` on `mockTopDevices` derived objects
- Update sort comparator to use `alertCount`

### 2. UI Labels

**`src/components/organisms/DeviceCard/DeviceCard.tsx`** (lines 145-146)
- Field reference: `device.detectionCount` → `device.alertCount`
- Metrics bar label: `"Detections"` → `"Alerts"`

**`src/screens/devices/DeviceDetailScreen.tsx`** (lines 100, 153)
- Local variable: `detectionCount` → `alertCount`
- Hero metric string: `"X Detections"` → `"X Alerts"`
- **History tab left unchanged:** The history tab (lines 294-349) currently uses fabricated data — arbitrary percentage breakdowns and hardcoded recent rows. Relabeling these as "Alert Summary" / "Recent Alerts" would present invented data as authoritative alert analytics. The history tab labels ("Detection Summary", "Recent Detections") remain as-is until backed by real alert/history data in a separate change.

**`src/components/ai/cards/DeviceStatusCard.tsx`** (line 52, 72)
- Local variable: `detections` → `alerts`
- Display text: `{detections} det` → `{alerts} alerts`

### 3. LLM Context & Hooks

**`src/hooks/useSecurityContext.ts`** (lines 171, 176)
- Local variable: `detections` → `alerts`
- Output string: `"Detections: X"` → `"Alerts: X"`

**`src/services/llm/FocusedContextBuilder.ts`** (lines 215, 220)
- Local variable: `detectionCount` → `alertCount`
- Output string: `"Detections: X"` → `"Alerts: X"`

### 4. Tests

**`__tests__/services/llm/FocusedContextBuilder.test.ts`**
- Update device fixtures: `detectionCount` → `alertCount`
- Update assertion strings: `"Detections:"` → `"Alerts:"`

**`__tests__/services/llm/buildStructuredData.test.ts`**
- Update `makeDevice` helper: `detectionCount: 3` → `alertCount: 3`

## Explicitly Out of Scope

- **Backend Prisma schema** — `detectionCount` stays on the backend; the API mapping layer handles translation. A backend rename is a separate coordination task.
- **`countByDetection()` in FocusedContextBuilder** (line 227) — counts alerts by detection *type* (wifi/bluetooth/cellular). Different concept, semantically correct.
- **`DETECTION TYPES` string in FocusedContextBuilder** (line 258) — same as above, describes signal type breakdown.
- **`context.detectionHistory.length` in LLMService.ts** (lines 151, 161) — fingerprint pattern analysis history array, unrelated to the Device field.
- **`detectionType` enum/field** — signal classification (wifi/bluetooth/cellular), unrelated.
- **`alertCounts` in `src/types/cardData.ts`** — this is the fallback `Record<string, number>` on `DeviceStatusData`. Already correctly named; no change needed.
- **DeviceDetailScreen history tab** (lines 294-349) — section titles ("Detection Summary", "Recent Detections"), percentage breakdowns, and hardcoded recent rows are all fabricated demo data. Relabeling without real data backing would be misleading. Left for a separate change that wires real alert history.

## Verification

**Note:** `npm run type-check` is not reliable as a sole verification method here. The repo has pre-existing type errors in unrelated files, `tsconfig.json` excludes test files from tsc, and `useSecurityContext.ts` uses `any[]` typing so stale `detectionCount` accesses won't produce type errors.

1. **Targeted grep on touched files** — run `grep -rn "detectionCount" src/types/device.ts src/mocks/data/mockDevices.ts src/mocks/data/mockAnalytics.ts src/components/organisms/DeviceCard/ src/components/ai/cards/DeviceStatusCard.tsx src/screens/devices/DeviceDetailScreen.tsx src/hooks/useSecurityContext.ts src/services/llm/FocusedContextBuilder.ts` and confirm zero hits. (`src/api/endpoints/devices.ts` is excluded because the mappers legitimately reference `detectionCount`.)
2. **Broad grep for stale references** — run `grep -rn "\.detectionCount" src/` and confirm only out-of-scope usages remain: `src/services/llm/LLMService.ts` (detectionHistory length), `src/api/endpoints/devices.ts` (inside mapper)
3. **`npm test`** — no new failures in touched areas (the repo may have pre-existing test failures in unrelated files)
4. **`npm run lint:fix`** — catches unused variables or import issues
