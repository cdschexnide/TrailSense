# Device Status Real-Time Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the contract gap between the backend `device-status` WebSocket payload and the frontend device cache so `alertCount`, `name`, and new devices propagate in real time.

**Architecture:** Expand the backend `DeviceStatus` type to include `detectionCount` and `name`, add a `mapDeviceStatusEvent` mapper at the frontend WebSocket boundary in `websocket.ts` (paralleling the REST mapper pattern), and add unknown-device invalidation in `useWebSocket.ts`.

**Tech Stack:** TypeScript, Prisma (backend), Socket.IO, React Query (frontend), Vitest (backend tests), Jest (frontend tests)

---

## File Map

| File                                                         | Repo     | Action | Responsibility                                                        |
| ------------------------------------------------------------ | -------- | ------ | --------------------------------------------------------------------- |
| `src/types/index.ts`                                         | Backend  | Modify | Add `detectionCount` and `name` to `DeviceStatus`                     |
| `src/controllers/goliothWebhookController.ts`                | Backend  | Modify | Add fields to `deviceToBroadcast()`                                   |
| `src/controllers/__tests__/goliothWebhookController.test.ts` | Backend  | Modify | Assert new fields in broadcast                                        |
| `src/api/websocket.ts`                                       | Frontend | Modify | Add `detectionCount` to event type, add `mapDeviceStatusEvent` mapper |
| `src/hooks/useWebSocket.ts`                                  | Frontend | Modify | Add unknown-device invalidation                                       |
| `src/mocks/mockWebSocket.ts`                                 | Frontend | Modify | Include `alertCount` and `name` in mock status emissions              |
| `__tests__/api/websocket.test.ts`                            | Frontend | Create | Test `mapDeviceStatusEvent` mapper                                    |
| `__tests__/hooks/useWebSocket.test.ts`                       | Frontend | Create | Test upsert/invalidation logic                                        |

---

### Task 1: Backend — Expand DeviceStatus type and deviceToBroadcast()

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/trailsense-backend/src/types/index.ts:91-100`
- Modify: `/Users/codyschexnider/Documents/Project/trailsense-backend/src/controllers/goliothWebhookController.ts:65-85`

- [ ] **Step 1: Add `detectionCount` and `name` to the `DeviceStatus` interface**

In `trailsense-backend/src/types/index.ts`, replace the `DeviceStatus` interface (lines 91-100):

```typescript
export interface DeviceStatus {
  online: boolean;
  battery?: number | null;
  signalStrength?: string | null;
  lastSeen?: string | null;
  uptimeSeconds?: number | null;
  lastBootAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  detectionCount?: number | null;
  name?: string | null;
}
```

- [ ] **Step 2: Update `deviceToBroadcast()` to include the new fields**

In `trailsense-backend/src/controllers/goliothWebhookController.ts`, replace the `deviceToBroadcast` function (lines 65-85):

```typescript
function deviceToBroadcast(device: {
  online: boolean;
  batteryPercent: number | null;
  signalStrength: string | null;
  lastSeen: Date | null;
  uptimeSeconds: number | null;
  lastBootAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  detectionCount: number;
  name: string;
}): DeviceStatus {
  return {
    online: device.online,
    battery: device.batteryPercent,
    signalStrength: device.signalStrength,
    lastSeen: device.lastSeen?.toISOString() ?? null,
    uptimeSeconds: device.uptimeSeconds,
    lastBootAt: device.lastBootAt?.toISOString() ?? null,
    latitude: device.latitude,
    longitude: device.longitude,
    detectionCount: device.detectionCount,
    name: device.name,
  };
}
```

Note: `detectionCount` is `number` (not nullable) because Prisma defines it as `Int @default(0)`. `name` is `string` (not nullable) because Prisma defines it as `String`.

- [ ] **Step 3: Run backend type-check**

Run: `cd /Users/codyschexnider/Documents/Project/trailsense-backend && npx tsc --noEmit`
Expected: PASS — the Prisma device record already has `detectionCount` (number) and `name` (string), so both call sites (`processPositionsBatch` line 229 and `handleHeartbeat` line 293) pass the full device record which includes these fields.

- [ ] **Step 4: Update backend test to assert new fields**

In `trailsense-backend/src/controllers/__tests__/goliothWebhookController.test.ts`, find the `expect(broadcastDeviceStatus)` assertion around lines 93-104. Update it to include the new fields:

```typescript
expect(broadcastDeviceStatus).toHaveBeenCalledWith(
  'dev-1',
  expect.objectContaining({
    online: true,
    battery: 85,
    signalStrength: 'good',
    uptimeSeconds: 3600,
    lastBootAt: expect.any(String),
    latitude: 37.77,
    longitude: -122.42,
    detectionCount: 0,
    name: 'dev-1',
  })
);
```

The `makeDevice()` helper already includes `detectionCount: 0` and `name: 'dev-1'` (lines 38-57), so the mock device record flows through `deviceToBroadcast()` correctly.

- [ ] **Step 5: Run backend tests**

Run: `cd /Users/codyschexnider/Documents/Project/trailsense-backend && npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/trailsense-backend
git add src/types/index.ts src/controllers/goliothWebhookController.ts src/controllers/__tests__/goliothWebhookController.test.ts
git commit -m "feat: include detectionCount and name in device-status broadcast"
```

---

### Task 2: Frontend — Add mapDeviceStatusEvent mapper to websocket.ts

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/api/websocket.ts:9-16` (type), `:78-79` (mock handler), `:122-124` (real handler)
- Create: `/Users/codyschexnider/Documents/Project/TrailSense/__tests__/api/websocket.test.ts`

- [ ] **Step 1: Write failing tests for mapDeviceStatusEvent**

Create `__tests__/api/websocket.test.ts`:

```typescript
/**
 * Tests for the WebSocket device-status mapper.
 * The mapper is exported from websocket.ts for testing.
 */
import { mapDeviceStatusEvent } from '@api/websocket';

describe('mapDeviceStatusEvent', () => {
  it('maps detectionCount to alertCount when alertCount is absent', () => {
    const raw = { id: 'dev-1', online: true, detectionCount: 42 };
    const mapped = mapDeviceStatusEvent(raw);
    expect(mapped.alertCount).toBe(42);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('passes through when alertCount is already present', () => {
    const raw = { id: 'dev-1', online: true, alertCount: 10 };
    const mapped = mapDeviceStatusEvent(raw);
    expect(mapped.alertCount).toBe(10);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('passes through when neither field is present', () => {
    const raw = { id: 'dev-1', online: true };
    const mapped = mapDeviceStatusEvent(raw);
    expect(mapped.alertCount).toBeUndefined();
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('prefers existing alertCount and strips detectionCount', () => {
    const raw = {
      id: 'dev-1',
      online: true,
      alertCount: 10,
      detectionCount: 42,
    };
    const mapped = mapDeviceStatusEvent(raw);
    expect(mapped.alertCount).toBe(10);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('preserves all other fields', () => {
    const raw = {
      id: 'dev-1',
      online: true,
      detectionCount: 5,
      name: 'North Gate',
      battery: 87,
      lastSeen: '2026-04-05T12:00:00Z',
    };
    const mapped = mapDeviceStatusEvent(raw);
    expect(mapped).toEqual({
      id: 'dev-1',
      online: true,
      alertCount: 5,
      name: 'North Gate',
      battery: 87,
      lastSeen: '2026-04-05T12:00:00Z',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/api/websocket.test.ts --no-coverage`
Expected: FAIL — `mapDeviceStatusEvent` is not exported from `@api/websocket`

- [ ] **Step 3: Add `detectionCount` to `DeviceStatusEvent` and implement the mapper**

In `src/api/websocket.ts`, update the `DeviceStatusEvent` type (lines 9-16) to add `detectionCount`:

```typescript
// id is always present — backend sends { id: deviceId, ...status }
type DeviceStatusEvent = Partial<Device> & {
  id: string;
  detectionCount?: number;
  friendly_name?: string;
  whitelisted?: boolean;
  metadata?: {
    device_name?: string;
  };
};
```

Add the mapper function immediately after the type definition (after line 16):

```typescript
/**
 * Normalizes backend device-status events to frontend shape.
 * Maps `detectionCount` (backend) to `alertCount` (frontend).
 * Always strips `detectionCount` so consumers never see it.
 */
export function mapDeviceStatusEvent(
  raw: DeviceStatusEvent
): DeviceStatusEvent {
  const { detectionCount, ...rest } = raw;
  if (detectionCount != null && rest.alertCount === undefined) {
    return { ...rest, alertCount: detectionCount };
  }
  return rest;
}
```

- [ ] **Step 4: Wire the mapper into both socket handlers**

In the mock handler (around line 78), change:

```typescript
this.mockDeviceStatusHandler = status => {
  this.emit('device-status', status);
};
```

to:

```typescript
this.mockDeviceStatusHandler = status => {
  this.emit('device-status', mapDeviceStatusEvent(status));
};
```

In the real socket handler (around line 122), change:

```typescript
this.socket.on('device-status', (status: DeviceStatusEvent) => {
  this.emit('device-status', status);
});
```

to:

```typescript
this.socket.on('device-status', (status: DeviceStatusEvent) => {
  this.emit('device-status', mapDeviceStatusEvent(status));
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/api/websocket.test.ts --no-coverage`
Expected: PASS — all 5 tests green

- [ ] **Step 6: Run type-check**

Run: `npm run type-check`
Expected: PASS (same baseline errors, no new ones)

- [ ] **Step 7: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/api/websocket.ts __tests__/api/websocket.test.ts
git commit -m "feat: add mapDeviceStatusEvent mapper at WebSocket boundary"
```

---

### Task 3: Frontend — Patch individual device + invalidate all device queries in useWebSocket

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/hooks/useWebSocket.ts:30-47`
- Create: `/Users/codyschexnider/Documents/Project/TrailSense/__tests__/hooks/useWebSocket.test.ts`

- [ ] **Step 1: Write failing tests for the invalidation logic**

Create `__tests__/hooks/useWebSocket.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Device } from '@/types/device';

const DEVICES_QUERY_KEY = 'devices';

// Mock websocketService
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('@api/websocket', () => ({
  websocketService: {
    connect: (...args: unknown[]) => mockConnect(...args),
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
    on: (...args: unknown[]) => mockOn(...args),
    off: (...args: unknown[]) => mockOff(...args),
  },
}));

import { useWebSocket } from '@hooks/useWebSocket';

const baseDevice: Device = {
  id: 'device-001',
  name: 'North Gate',
  online: true,
  alertCount: 10,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function createWrapper(queryClient: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('useWebSocket handleDeviceStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  function getDeviceStatusHandler(): (
    status: Partial<Device> & { id: string }
  ) => void {
    renderHook(() => useWebSocket('test-token'), {
      wrapper: createWrapper(queryClient),
    });
    const deviceStatusCall = mockOn.mock.calls.find(
      ([event]: [string]) => event === 'device-status'
    );
    return deviceStatusCall[1];
  }

  it('patches individual device cache instantly', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY, 'device-001'], baseDevice);

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-001', alertCount: 15, online: false });

    const single = queryClient.getQueryData<Device>([
      DEVICES_QUERY_KEY,
      'device-001',
    ]);
    expect(single!.alertCount).toBe(15);
    expect(single!.online).toBe(false);
    expect(single!.name).toBe('North Gate');
  });

  it('invalidates all device queries on every device-status event', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY], [baseDevice]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-001', alertCount: 15 });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [DEVICES_QUERY_KEY],
    });
  });

  it('invalidates for unknown device IDs too', () => {
    queryClient.setQueryData([DEVICES_QUERY_KEY], [baseDevice]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const handler = getDeviceStatusHandler();
    handler({ id: 'device-NEW', online: true });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [DEVICES_QUERY_KEY],
    });
  });

  it('does not patch individual cache for unknown device', () => {
    const handler = getDeviceStatusHandler();
    handler({ id: 'device-NEW', online: true });

    const single = queryClient.getQueryData<Device>([
      DEVICES_QUERY_KEY,
      'device-NEW',
    ]);
    expect(single).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/hooks/useWebSocket.test.ts --no-coverage`
Expected: FAIL — "invalidates all device queries" fails because the current handler uses `setQueryData` instead of `invalidateQueries`.

- [ ] **Step 3: Replace handleDeviceStatus with patch + invalidate pattern**

In `src/hooks/useWebSocket.ts`, replace the `handleDeviceStatus` function (lines 30-47):

```typescript
// Handle device status updates
const handleDeviceStatus = (status: Partial<Device> & { id: string }) => {
  // Patch individual device cache instantly
  queryClient.setQueryData<Device>([DEVICES_QUERY_KEY, status.id], oldData => {
    if (!oldData) return oldData;
    return { ...oldData, ...status };
  });

  // Invalidate all device queries (lists, filtered lists, detail views)
  // Uses prefix matching: [DEVICES_QUERY_KEY] matches [devices],
  // [devices, filters], [devices, id], etc.
  queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/hooks/useWebSocket.test.ts --no-coverage`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/hooks/useWebSocket.ts __tests__/hooks/useWebSocket.test.ts
git commit -m "feat: patch individual device + invalidate all device queries on device-status"
```

---

### Task 4: Frontend — Include live alertCount and name in mock WebSocket emissions

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/mocks/mockWebSocket.ts:14-24` (class properties), `:133-198` (generateMockAlert), `:203-239` (generateMockDeviceStatus)

- [ ] **Step 1: Add `alertCountState` Map to MockWebSocketService**

In `src/mocks/mockWebSocket.ts`, add a new Map after the existing `uptimeState` declaration (after line 24):

```typescript
  private alertCountState = new Map(
    mockDevices
      .filter(device => device.alertCount != null)
      .map(device => [device.id, device.alertCount!] as const)
  );
```

- [ ] **Step 2: Increment alertCountState in generateMockAlert**

In `generateMockAlert()`, after the `this.emit('alert', alert);` line (line 197), add:

```typescript
// Increment alert count for the device that produced this alert
const currentCount = this.alertCountState.get(device.id) ?? 0;
this.alertCountState.set(device.id, currentCount + 1);
```

- [ ] **Step 3: Update generateMockDeviceStatus to include tracked alertCount and name**

In `generateMockDeviceStatus()`, replace the `statusUpdate` object (lines 228-234):

```typescript
const statusUpdate: Partial<Device> & { id: string } = {
  id: device.id,
  battery: newBattery,
  lastSeen: new Date().toISOString(),
  online: newBattery > 5, // Go offline if battery too low
  ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
};
```

with:

```typescript
const statusUpdate: Partial<Device> & { id: string } = {
  id: device.id,
  name: device.name,
  battery: newBattery,
  lastSeen: new Date().toISOString(),
  online: newBattery > 5, // Go offline if battery too low
  alertCount: this.alertCountState.get(device.id) ?? device.alertCount,
  ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
};
```

This reads the tracked alert count (which increments as mock alerts fire every 5s) rather than the static `device.alertCount` from the mock data array.

- [ ] **Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Run all frontend tests**

Run: `npm test -- --no-coverage`
Expected: PASS (no regressions)

- [ ] **Step 6: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/mocks/mockWebSocket.ts
git commit -m "feat: include live alertCount and name in mock device-status emissions"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full frontend test suite**

Run: `cd /Users/codyschexnider/Documents/Project/TrailSense && npm test`
Expected: All tests pass

- [ ] **Step 2: Run frontend type-check**

Run: `cd /Users/codyschexnider/Documents/Project/TrailSense && npm run type-check`
Expected: PASS (same baseline errors, no new ones)

- [ ] **Step 3: Run frontend lint (non-mutating)**

Run: `cd /Users/codyschexnider/Documents/Project/TrailSense && npx eslint src/ --ext .ts,.tsx --quiet`
Expected: No errors

- [ ] **Step 4: Run backend tests**

Run: `cd /Users/codyschexnider/Documents/Project/trailsense-backend && npm test`
Expected: All tests pass

- [ ] **Step 5: Start the app and verify visually (mock mode)**

Run: `cd /Users/codyschexnider/Documents/Project/TrailSense && npm start`
Open the app in the iOS simulator:

- Navigate to **Devices** tab — device cards should show alert counts incrementing over time as mock alerts fire (every 5s) and device-status events propagate the tracked count (every 15s)
- Tap an online device — **Status tab** should show live-updating data, **History tab** alert count should match the card
- Check the console for `[MockWebSocket] 🔋 Device Status:` logs — they should still appear as before

**Note:** This mock-mode verification exercises the `alertCountState` tracker and the `name` field propagation, but does NOT exercise the `detectionCount` -> `alertCount` mapping path (mock data emits `alertCount` directly). The mapper is covered by unit tests in `__tests__/api/websocket.test.ts`. Full end-to-end contract validation requires a running backend.

**Known limitation:** The unknown-device invalidation path cannot be visually verified in mock mode because `mockApiAdapter` returns the current cache contents on refetch — a genuinely new device would not materialize. This is a pre-existing mock architecture limitation.
