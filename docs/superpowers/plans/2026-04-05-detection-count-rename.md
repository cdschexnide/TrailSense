# Rename detectionCount to alertCount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename `Device.detectionCount` to `Device.alertCount` across the frontend to match backend semantics (incremented per alert, not per raw signal).

**Architecture:** Rename the field on the `Device` TypeScript interface, add an idempotent read mapper and a write mapper in the API layer (safe for both real and mock/demo flows), update UI labels from "Detections" to "Alerts" where backed by real data, and update mock data and tests.

**Tech Stack:** TypeScript, React Native, React Query, Jest

---

## File Map

| File                                                   | Action | Responsibility                                                                |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| `src/types/device.ts`                                  | Modify | Rename field on `Device` interface                                            |
| `src/api/endpoints/devices.ts`                         | Modify | Add idempotent read mapper + write request mapper                             |
| `src/mocks/data/mockDevices.ts`                        | Modify | Rename field on mock device objects                                           |
| `src/mocks/data/mockAnalytics.ts`                      | Modify | Rename field on derived analytics objects                                     |
| `src/components/organisms/DeviceCard/DeviceCard.tsx`   | Modify | Update field ref + label                                                      |
| `src/components/ai/cards/DeviceStatusCard.tsx`         | Modify | Update field ref + display text                                               |
| `src/screens/devices/DeviceDetailScreen.tsx`           | Modify | Update field ref + hero label only (history tab unchanged)                    |
| `src/hooks/useSecurityContext.ts`                      | Modify | Update field ref + output string                                              |
| `src/services/llm/FocusedContextBuilder.ts`            | Modify | Update field ref + output string                                              |
| `__tests__/services/llm/FocusedContextBuilder.test.ts` | Modify | Update device fixtures                                                        |
| `__tests__/services/llm/buildStructuredData.test.ts`   | Modify | Update `makeDevice` helper                                                    |
| `__tests__/api/devicesApiMapper.test.ts`               | Create | Regression tests for API read/write mappers (mocks apiClient, not devicesApi) |

---

### Task 1: Rename type, add API mappers, update mock data

All type-and-data changes in one commit so the repo never has a broken intermediate state.

**Files:**

- Modify: `src/types/device.ts:8`
- Modify: `src/api/endpoints/devices.ts`
- Modify: `src/mocks/data/mockDevices.ts:12,26,40,54,68`
- Modify: `src/mocks/data/mockAnalytics.ts:237,248`

- [ ] **Step 1: Rename the Device type field**

In `src/types/device.ts`, change line 8 from:

```typescript
  detectionCount?: number;
```

to:

```typescript
  alertCount?: number;
```

- [ ] **Step 2: Add idempotent read mapper and write request mapper to the API layer**

In `src/api/endpoints/devices.ts`, add two helpers before the `devicesApi` export and apply them to the relevant endpoints. Use targeted edits, not a full file replacement.

Add after the imports (after line 3):

```typescript
/**
 * Idempotent read mapper: translates backend `detectionCount` to frontend
 * `alertCount`. Safe for mock/demo mode where seedMockData() populates the
 * React Query cache with frontend-shaped objects that already have `alertCount`.
 * If the object already has `alertCount`, it passes through unchanged.
 */
function mapDeviceResponse(raw: any): Device {
  if (raw.alertCount !== undefined || raw.detectionCount === undefined) {
    return raw;
  }
  const { detectionCount, ...rest } = raw;
  return { ...rest, alertCount: detectionCount };
}

/**
 * Write mapper: translates frontend `alertCount` back to backend
 * `detectionCount` for PATCH requests, since the backend Prisma schema
 * expects `detectionCount`.
 */
function mapDeviceRequest(updates: Partial<Device>): Record<string, unknown> {
  const { alertCount, ...rest } = updates;
  if (alertCount !== undefined) {
    return { ...rest, detectionCount: alertCount };
  }
  return rest;
}
```

Then update the four endpoints that return `Device`:

In `getDevices`, change line 10 from:

```typescript
return data;
```

to:

```typescript
return data.map(mapDeviceResponse);
```

In `getDeviceById`, change line 14 from:

```typescript
return data;
```

to:

```typescript
return mapDeviceResponse(data);
```

In `addDevice`, change line 19 from:

```typescript
return data;
```

to:

```typescript
return mapDeviceResponse(data);
```

In `updateDevice`, change lines 27-28 from:

```typescript
const { data } = await apiClient.patch(`/api/devices/${id}`, updates);
return data;
```

to:

```typescript
const { data } = await apiClient.patch(
  `/api/devices/${id}`,
  mapDeviceRequest(updates)
);
return mapDeviceResponse(data);
```

- [ ] **Step 3: Rename field on all 5 mock devices**

In `src/mocks/data/mockDevices.ts`, replace every occurrence of `detectionCount:` with `alertCount:` (5 occurrences on lines 12, 26, 40, 54, 68). The values stay the same:

- Line 12: `alertCount: 142,`
- Line 26: `alertCount: 87,`
- Line 40: `alertCount: 213,`
- Line 54: `alertCount: 45,`
- Line 68: `alertCount: 156,`

- [ ] **Step 4: Rename field in mockAnalytics derived data**

In `src/mocks/data/mockAnalytics.ts`, change line 237 from:

```typescript
    detectionCount: mockAlerts.filter(a => a.deviceId === device.id).length,
```

to:

```typescript
    alertCount: mockAlerts.filter(a => a.deviceId === device.id).length,
```

And change line 248 from:

```typescript
  .sort((a, b) => b.detectionCount - a.detectionCount);
```

to:

```typescript
  .sort((a, b) => b.alertCount - a.alertCount);
```

- [ ] **Step 5: Update the DeviceCard component comment**

In `src/components/organisms/DeviceCard/DeviceCard.tsx`, change line 7 from:

```typescript
 * - Horizontal metrics bar (signal | detections | location)
```

to:

```typescript
 * - Horizontal metrics bar (signal | alerts | location)
```

- [ ] **Step 6: Commit**

```bash
git add src/types/device.ts src/api/endpoints/devices.ts src/mocks/data/mockDevices.ts src/mocks/data/mockAnalytics.ts src/components/organisms/DeviceCard/DeviceCard.tsx
git commit -m "refactor: rename Device.detectionCount to Device.alertCount

The backend increments this field per alert creation (with 5-min dedup),
not per raw signal. Rename the frontend type to match actual semantics.

Adds idempotent API read mapper (safe for mock/demo flow where cache
holds frontend-shaped objects) and write request mapper for PATCH."
```

---

### Task 2: Update DeviceCard component

**Files:**

- Modify: `src/components/organisms/DeviceCard/DeviceCard.tsx:144-146`

- [ ] **Step 1: Update field reference and label**

Change lines 144-146 from:

```typescript
    {
      value: (device.detectionCount || 0).toLocaleString(),
      label: 'Detections',
    },
```

to:

```typescript
    {
      value: (device.alertCount || 0).toLocaleString(),
      label: 'Alerts',
    },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/organisms/DeviceCard/DeviceCard.tsx
git commit -m "fix: rename Detections label to Alerts on DeviceCard"
```

---

### Task 3: Update DeviceStatusCard component

**Files:**

- Modify: `src/components/ai/cards/DeviceStatusCard.tsx:52,72`

- [ ] **Step 1: Update local variable and display text**

Change line 52 from:

```typescript
const detections = device.detectionCount ?? data.alertCounts[device.id] ?? 0;
```

to:

```typescript
const alerts = device.alertCount ?? data.alertCounts[device.id] ?? 0;
```

Change line 72 from:

```typescript
                BAT {battery ?? '?'}% · {detections} det
```

to:

```typescript
                BAT {battery ?? '?'}% · {alerts} alerts
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai/cards/DeviceStatusCard.tsx
git commit -m "fix: rename detections to alerts in DeviceStatusCard"
```

---

### Task 4: Update DeviceDetailScreen (hero only — history tab unchanged)

The history tab (lines 294-349) uses fabricated data: arbitrary percentage breakdowns and hardcoded recent rows. Relabeling those as "Alert Summary" / "Recent Alerts" would present invented data as authoritative. Only the local variable and hero metric are updated here.

**Files:**

- Modify: `src/screens/devices/DeviceDetailScreen.tsx:100,153`

- [ ] **Step 1: Rename the local variable**

Change line 100 from:

```typescript
const detectionCount = device.detectionCount || 0;
```

to:

```typescript
const alertCount = device.alertCount || 0;
```

- [ ] **Step 2: Update hero metrics**

Change line 153 from:

```typescript
const heroMetrics = [signalLabel, `${detectionCount} Detections`];
```

to:

```typescript
const heroMetrics = [signalLabel, `${alertCount} Alerts`];
```

- [ ] **Step 3: Update history tab variable references only (not labels)**

The history tab code references the local variable that was just renamed. Update the variable references but leave the section titles and row titles unchanged.

Change lines 296-297 from:

```typescript
const todayDetections = Math.floor(detectionCount * 0.15);
const weekDetections = Math.floor(detectionCount * 0.4);
```

to:

```typescript
const todayDetections = Math.floor(alertCount * 0.15);
const weekDetections = Math.floor(alertCount * 0.4);
```

Change line 306 from:

```typescript
            value={String(detectionCount)}
```

to:

```typescript
            value={String(alertCount)}
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx
git commit -m "fix: rename detectionCount to alertCount in DeviceDetailScreen

Updates hero metric and local variable references. History tab section
titles left unchanged — they use fabricated demo data and should not be
relabeled as alert analytics until backed by real data."
```

---

### Task 5: Update useSecurityContext hook

**Files:**

- Modify: `src/hooks/useSecurityContext.ts:171,176`

- [ ] **Step 1: Update local variable and output string**

Change line 171 from:

```typescript
const detections = d.detectionCount || 0;
```

to:

```typescript
const alerts = d.alertCount || 0;
```

Change line 176 from:

```typescript
return `  - ${d.name} [${status}]: Battery ${battery}%, Signal: ${signal}, Detections: ${detections} ${location}`;
```

to:

```typescript
return `  - ${d.name} [${status}]: Battery ${battery}%, Signal: ${signal}, Alerts: ${alerts} ${location}`;
```

**Note:** `deviceList` is typed as `any[]` (line 35), so TypeScript will not catch stale `detectionCount` accesses here. The grep-based verification in Task 8 covers this.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSecurityContext.ts
git commit -m "fix: rename Detections to Alerts in security context output"
```

---

### Task 6: Update FocusedContextBuilder

**Files:**

- Modify: `src/services/llm/FocusedContextBuilder.ts:215,220`

- [ ] **Step 1: Update local variable and output string**

Change line 215 from:

```typescript
const detectionCount =
  device.detectionCount ?? deviceAlertCounts[device.id] ?? 0;
```

to:

```typescript
const alertCount = device.alertCount ?? deviceAlertCounts[device.id] ?? 0;
```

Change line 220 from:

```typescript
Detections: ${detectionCount}`;
```

to:

```typescript
Alerts: ${alertCount}`;
```

- [ ] **Step 2: Commit**

```bash
git add src/services/llm/FocusedContextBuilder.ts
git commit -m "fix: rename Detections to Alerts in LLM device context"
```

---

### Task 7: Update tests

**Files:**

- Modify: `__tests__/services/llm/FocusedContextBuilder.test.ts:12,23`
- Modify: `__tests__/services/llm/buildStructuredData.test.ts:32`

- [ ] **Step 1: Update FocusedContextBuilder test fixtures**

In `__tests__/services/llm/FocusedContextBuilder.test.ts`, change line 12 from:

```typescript
    detectionCount: 142,
```

to:

```typescript
    alertCount: 142,
```

Change line 23 from:

```typescript
    detectionCount: 156,
```

to:

```typescript
    alertCount: 156,
```

- [ ] **Step 2: Update buildStructuredData test helper**

In `__tests__/services/llm/buildStructuredData.test.ts`, change line 32 from:

```typescript
  detectionCount: 3,
```

to:

```typescript
  alertCount: 3,
```

- [ ] **Step 3: Commit**

```bash
git add __tests__/services/llm/FocusedContextBuilder.test.ts __tests__/services/llm/buildStructuredData.test.ts
git commit -m "test: update device fixtures from detectionCount to alertCount"
```

---

### Task 8: Add regression tests for API mapper

The `mapDeviceResponse()` and `mapDeviceRequest()` helpers introduced in Task 1 are the highest-risk part of this change. The existing `mockModeDataFlow.test.tsx` mocks the entire `@api/endpoints/devices` module (line 28), which bypasses the real `devicesApi` implementation and therefore cannot exercise the mappers. Instead, create a new dedicated test file that mocks `apiClient` (the axios instance) so the real `devicesApi` methods — including `mapDeviceResponse()` and `mapDeviceRequest()` — execute.

**Files:**

- Create: `__tests__/api/devicesApiMapper.test.ts`

- [ ] **Step 1: Create the test file**

Create `__tests__/api/devicesApiMapper.test.ts` with:

```typescript
import { devicesApi } from '@api/endpoints/devices';
import { apiClient } from '@api/client';

jest.mock('@api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

describe('devicesApi mapper', () => {
  afterEach(() => jest.resetAllMocks());

  it('remaps backend detectionCount to frontend alertCount', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'd1',
          name: 'North Gate',
          detectionCount: 42,
          createdAt: '',
          updatedAt: '',
        },
      ],
    });

    const result = await devicesApi.getDevices();

    expect(result[0].alertCount).toBe(42);
    expect((result[0] as any).detectionCount).toBeUndefined();
  });

  it('passes through frontend-shaped alertCount without zeroing it', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'd1',
          name: 'North Gate',
          alertCount: 99,
          createdAt: '',
          updatedAt: '',
        },
      ],
    });

    const result = await devicesApi.getDevices();

    expect(result[0].alertCount).toBe(99);
  });

  it('remaps alertCount to detectionCount on PATCH request', async () => {
    mockPatch.mockResolvedValue({
      data: {
        id: 'd1',
        name: 'North Gate',
        detectionCount: 10,
        createdAt: '',
        updatedAt: '',
      },
    });

    const result = await devicesApi.updateDevice('d1', { alertCount: 10 });

    // Verify the request body sent to apiClient.patch
    const requestBody = mockPatch.mock.calls[0][1];
    expect(requestBody.detectionCount).toBe(10);
    expect(requestBody.alertCount).toBeUndefined();

    // Verify the response is mapped back to frontend shape
    expect(result.alertCount).toBe(10);
    expect((result as any).detectionCount).toBeUndefined();
  });

  it('maps single device response in getDeviceById', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 'd1',
        name: 'North Gate',
        detectionCount: 7,
        createdAt: '',
        updatedAt: '',
      },
    });

    const result = await devicesApi.getDeviceById('d1');

    expect(result.alertCount).toBe(7);
    expect((result as any).detectionCount).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the new test to verify it passes**

Run: `npx jest __tests__/api/devicesApiMapper.test.ts -v`
Expected: All 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/devicesApiMapper.test.ts
git commit -m "test: add regression tests for devicesApi mapper

Tests the real mapDeviceResponse() and mapDeviceRequest() by mocking
apiClient instead of devicesApi. Covers:
- backend detectionCount → frontend alertCount remapping
- frontend alertCount passthrough (idempotency for mock/demo mode)
- PATCH write mapper (alertCount → detectionCount in request body)
- single device response mapping"
```

---

### Task 9: Verify

**Note:** `npm run type-check` is not reliable as sole verification. The repo has pre-existing type errors in unrelated files, `tsconfig.json` excludes test files, and `useSecurityContext.ts` uses `any[]` so stale `detectionCount` accesses won't produce type errors. Use targeted grep instead.

- [ ] **Step 1: Targeted grep on all touched files**

Run:

```bash
grep -rn "detectionCount" \
  src/types/device.ts \
  src/mocks/data/mockDevices.ts \
  src/mocks/data/mockAnalytics.ts \
  src/components/organisms/DeviceCard/DeviceCard.tsx \
  src/components/ai/cards/DeviceStatusCard.tsx \
  src/screens/devices/DeviceDetailScreen.tsx \
  src/hooks/useSecurityContext.ts \
  src/services/llm/FocusedContextBuilder.ts \
  __tests__/services/llm/FocusedContextBuilder.test.ts \
  __tests__/services/llm/buildStructuredData.test.ts
```

Expected: Zero hits. None of these files should reference `detectionCount` after the rename.

- [ ] **Step 2: Broad grep for stale property accesses**

Run:

```bash
grep -rn "\.detectionCount" src/
```

Expected: Only these out-of-scope results:

- `src/api/endpoints/devices.ts` — inside `mapDeviceResponse()` / `mapDeviceRequest()` where we translate the backend field
- No other files should access `.detectionCount`

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: No new failures in touched areas. The repo may have pre-existing test failures in unrelated files — those are not blockers for this change.

- [ ] **Step 4: Run lint**

Run: `npm run lint:fix`
Expected: No errors in touched files.
