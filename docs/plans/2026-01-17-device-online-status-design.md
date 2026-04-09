# Device Online/Offline Status - Design Document

> **Status:** Implemented

## Problem

The mobile app was showing devices as "online" even when the physical ESP32 device was powered off. The `online` field from the backend was not being calculated from actual heartbeat data.

## Solution

Calculate device online/offline status in the mobile app based on the `lastSeen` timestamp from the backend.

## How It Works

### ESP32 Firmware (TrailSenseDevice)

- Sends heartbeat to Golioth every **60 seconds**
- Payload: `{"did":"...", "ts":..., "health":{...}, "loc":{...}}`

### Backend (trailsense-backend)

- Receives heartbeat via Golioth webhook or polling
- Updates `device.lastSeen` timestamp in database
- Returns `lastSeen` field in GET /api/devices response

### Mobile App (TrailSense)

- Calculates online status: `online = (now - lastSeen) < 5 minutes`
- 5-minute threshold = ~5 missed heartbeats (accounts for network delays)

## Implementation

### Utility Function

```typescript
// src/utils/dateUtils.ts
export const DEVICE_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const isDeviceOnline = (lastSeen?: string | null): boolean => {
  if (!lastSeen) return false;
  const lastSeenDate = parseISO(lastSeen);
  const timeSinceLastSeen = Date.now() - lastSeenDate.getTime();
  return timeSinceLastSeen < DEVICE_OFFLINE_THRESHOLD_MS;
};
```

### Files Updated

- `src/utils/dateUtils.ts` - Added `isDeviceOnline()` utility
- `src/components/organisms/DeviceCard/DeviceCard.tsx` - Uses calculated status
- `src/screens/devices/DeviceListScreen.tsx` - Stats and sorting use calculated status
- `src/screens/devices/DeviceDetailScreen.tsx` - Status display uses calculated status

## Why Mobile App Calculates (Not Backend)

1. **No backend changes required** - Works with existing API
2. **Real-time accuracy** - Status updates on each render, not stale from API cache
3. **Consistent threshold** - Single source of truth in mobile app
4. **Future flexibility** - Can adjust threshold without backend deployment

## Threshold Decision

| Interval  | Missed Heartbeats | Rationale                      |
| --------- | ----------------- | ------------------------------ |
| 60s       | 0                 | Too aggressive - would flicker |
| 3 min     | 3                 | Aggressive                     |
| **5 min** | **5**             | **Balanced - chosen**          |
| 10 min    | 10                | Too lenient                    |

5 minutes chosen to account for:

- LTE network variability
- Golioth processing delays
- Backend polling intervals (60 seconds)
- Occasional missed heartbeats
