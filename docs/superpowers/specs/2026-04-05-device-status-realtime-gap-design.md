# Device Status Real-Time Gap Design

**Date:** 2026-04-05
**Status:** Approved
**Severity:** Medium

## Problem

The `device-status` WebSocket path does not keep device cards and detail
screens fully current in real time. Two specific gaps:

1. **`alertCount` never updates via WebSocket.** The backend increments
   `detectionCount` in the database when alerts are created
   (`goliothWebhookController.ts:212-214`) but the `DeviceStatus` broadcast
   payload (`types/index.ts:91-100`) does not include `detectionCount` or
   `name`. Even if it did, the frontend has no `detectionCount` ->
   `alertCount` mapper on the WebSocket path — the REST mapper in
   `devices.ts:15-22` only applies to REST responses.

2. **New devices are silently dropped.** `useWebSocket.ts:36` returns
   `undefined` for unknown device IDs, and line 44's `.map()` only updates
   existing list entries. A device-status event for a newly discovered device
   is ignored entirely.

The 30-second REST polling (`useDevices.ts:19`) catches up eventually, but
this is not true real-time propagation. In mock mode, polling is disabled
entirely, making WebSocket the only update path.

## Solution

Close the contract gap on both sides: expand the backend `DeviceStatus`
payload, add a mapper at the frontend WebSocket boundary, and handle unknown
devices via cache invalidation.

## Design

### 1. Backend: Expand DeviceStatus Payload

Add `detectionCount` and `name` to the `DeviceStatus` type and the
`deviceToBroadcast()` function.

**`trailsense-backend/src/types/index.ts`** — Add to `DeviceStatus`:

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

**`trailsense-backend/src/controllers/goliothWebhookController.ts`** — Update
`deviceToBroadcast()` to include `detectionCount` and `name` from the Prisma
device record. No new database queries needed — the device record is already
fetched/updated before broadcasting.

### 2. Frontend: Map device-status Events at the WebSocket Boundary

**`TrailSense/src/api/websocket.ts`** — Add `detectionCount` to the
`DeviceStatusEvent` type and a mapper function that normalizes backend
`detectionCount` to frontend `alertCount` before emitting:

```typescript
type DeviceStatusEvent = Partial<Device> & {
  id: string;
  detectionCount?: number;
  friendly_name?: string;
  whitelisted?: boolean;
  metadata?: {
    device_name?: string;
  };
};

function mapDeviceStatusEvent(raw: DeviceStatusEvent): DeviceStatusEvent {
  const { detectionCount, ...rest } = raw;
  if (detectionCount != null && rest.alertCount === undefined) {
    return { ...rest, alertCount: detectionCount };
  }
  return rest;
}
```

The mapper always strips `detectionCount` from the output — even when
`alertCount` is already present. This guarantees consumers never see
`detectionCount`. Call `mapDeviceStatusEvent` in both the real socket
handler and the mock handler before emitting. Same contract as REST.

### 3. Frontend: Upsert Logic in useWebSocket

**`TrailSense/src/hooks/useWebSocket.ts`** — Two changes to
`handleDeviceStatus`:

**Individual device cache patched instantly.** The spread merge
(`{ ...oldData, ...status }`) patches `[DEVICES_QUERY_KEY, id]` for
the specific device — now including `alertCount` and `name` since the
backend sends them. Components using `useDevice(id)` update immediately.

**All device queries invalidated.** After patching the individual cache,
invalidate all queries prefixed with `[DEVICES_QUERY_KEY]`. This covers
the unfiltered list, filtered lists (e.g.,
`[DEVICES_QUERY_KEY, { status: ['online'] }]`), and individual detail
queries (`[DEVICES_QUERY_KEY, id]`). React Query's `invalidateQueries`
uses prefix matching, so `{ queryKey: [DEVICES_QUERY_KEY] }` hits all
of them.

The invalidation triggers a background refetch for every mounted device
query — both lists and detail views. This is less efficient than the
previous `setQueryData` patch (one REST call per mounted query per
status event vs. zero), but it is correct for all query key shapes and
eliminates the bug where filtered lists or unmounted unfiltered lists
silently miss updates. Given that device-status events fire every 15
seconds, this is acceptable. The individual `setQueryData` patch above
ensures detail screens update instantly while the background refetch
is in flight.

For unknown devices (ID not in any cache), the same invalidation path
applies — the refetch returns the new device with full data including
`name`. No partial/placeholder entries.

```typescript
const handleDeviceStatus = (status: Partial<Device> & { id: string }) => {
  // Patch individual device cache instantly
  queryClient.setQueryData<Device>(
    [DEVICES_QUERY_KEY, status.id],
    oldData => {
      if (!oldData) return oldData;
      return { ...oldData, ...status };
    }
  );

  // Invalidate all device list queries (unfiltered, filtered, etc.)
  queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
};
```

### 4. Mock Data: Include alertCount and name in Mock WebSocket Emissions

**`TrailSense/src/mocks/mockWebSocket.ts`** — Two changes:

1. Add an `alertCountState` Map (similar to the existing `uptimeState`)
   initialized from `mockDevices`. `generateMockAlert()` increments the
   count for the device that produced the alert.
2. `generateMockDeviceStatus()` reads the tracked count from
   `alertCountState` and includes it as `alertCount` along with `name`
   in the status emission.

This makes mock alert counts actually move over time as mock alerts fire,
matching the real backend behavior where `detectionCount` increments on
alert creation.

**Known limitation:** In mock mode, the unknown-device invalidation path
triggers a REST refetch via `mockApiAdapter`, which returns the current
React Query cache contents. A genuinely new device would not materialize
from this refetch unless the mock layer maintained a mutable device store.
This is a pre-existing mock architecture limitation and is not addressed
in this spec.

### 5. What Does NOT Change

- **`src/types/device.ts`** — `Device` already has `alertCount` and `name`.
- **`src/api/endpoints/devices.ts`** — REST mapper stays as-is; each
  boundary handles its own mapping.
- **`src/hooks/api/useDevices.ts`** — 30s polling remains as a correctness
  backstop.
- **`DeviceCard.tsx`** and **`DeviceDetailScreen.tsx`** — Already read
  `device.alertCount` and `device.name` from the cache. Once the cache
  updates correctly, the UI just works.

## Files Changed

| File | Side | Change |
|------|------|--------|
| `trailsense-backend/src/types/index.ts` | Backend | Add `detectionCount` and `name` to `DeviceStatus` |
| `trailsense-backend/src/controllers/goliothWebhookController.ts` | Backend | Add fields to `deviceToBroadcast()` |
| `TrailSense/src/api/websocket.ts` | Frontend | Add `detectionCount` to event type, add `mapDeviceStatusEvent` mapper |
| `TrailSense/src/hooks/useWebSocket.ts` | Frontend | Add unknown-device invalidation to `handleDeviceStatus` |
| `TrailSense/src/mocks/mockWebSocket.ts` | Frontend | Include `alertCount` and `name` in mock status emissions |
