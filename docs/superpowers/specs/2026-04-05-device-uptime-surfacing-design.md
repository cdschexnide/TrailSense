# Device Uptime Surfacing Design

**Date:** 2026-04-05
**Status:** Approved
**Severity:** Medium

## Problem

The backend persists and broadcasts real `uptimeSeconds` and `lastBootAt` from
device heartbeats, but the mobile app does not consume these fields. The
`Device` type lacks both fields, and `DeviceDetailScreen` falls back to a
hardcoded `'24h 32m'` placeholder via `(device as any).uptime`.

## Solution

Surface real uptime data in the mobile app with minimal changes across four
areas: types, display formatting, UI placement, and mock data.

## Design

### 1. Type Changes — `src/types/device.ts`

Add two optional fields to the `Device` interface:

```typescript
uptimeSeconds?: number;   // Seconds since last boot, from heartbeat
lastBootAt?: string;      // ISO 8601 timestamp of last boot
```

Both optional because offline devices or devices that haven't sent a heartbeat
yet won't have them. No other type changes needed — `DeviceStatusEvent` in
`websocket.ts` is `Partial<Device> & { id: string }`, so these flow through
the WebSocket layer and React Query cache automatically.

### 2. Uptime Formatter — `DeviceDetailScreen.tsx`

A pure function `formatUptime(seconds: number): string` added in
`DeviceDetailScreen.tsx` alongside the existing `formatRelativeTime` helper:

| Condition | Output |
|-----------|--------|
| `>= 86400` (1 day) | `Xd Yh` (e.g., `3d 12h`) |
| `>= 3600` (1 hour) | `Xh Ym` (e.g., `2h 34m`) |
| `>= 60` (1 minute) | `Xm Ys` (e.g., `45m 12s`) |
| `< 60` | `< 1m` |

The Status tab Uptime row changes from:

```typescript
value={(device as any).uptime || '24h 32m'}
```

to:

```typescript
value={device.uptimeSeconds != null ? formatUptime(device.uptimeSeconds) : '--'}
```

`--` means "no data yet" (distinct from `< 1m` which means "just booted").

### 3. UI Placement

**Status tab** — Existing Uptime row updated to use real formatted data.

**History tab** — New "Last Reboot" row added to the "Detection Summary"
section:

```typescript
<GroupedListRow
  icon="refresh-outline"
  iconColor={colors.systemOrange}
  title="Last Reboot"
  value={device.lastBootAt ? formatRelativeTime(device.lastBootAt) : '--'}
/>
```

Reuses the existing `formatRelativeTime` function for consistency with the
"Last seen" display. Placed in Detection Summary since it's a device-level
event alongside detection counts.

### 4. Mock Data Updates

**`src/mocks/data/mockDevices.ts`:**
- Online devices get realistic `uptimeSeconds` and `lastBootAt` values
- Offline devices leave both fields `undefined`

**`src/mocks/mockWebSocket.ts`:**
- `generateMockDeviceStatus()` includes a random `uptimeSeconds` value in
  status emissions so the Status tab shows changing values in dev/demo mode

No changes to the real WebSocket layer — `useWebSocket` already spreads
incoming fields into the React Query cache.

## Files Changed

| File | Change |
|------|--------|
| `src/types/device.ts` | Add `uptimeSeconds` and `lastBootAt` fields |
| `src/screens/devices/DeviceDetailScreen.tsx` | Add `formatUptime`, update Status tab, add History tab row |
| `src/mocks/data/mockDevices.ts` | Add uptime values to online mock devices |
| `src/mocks/mockWebSocket.ts` | Include `uptimeSeconds` in mock status emissions |

## What Does NOT Change

- Backend — already broadcasts both fields correctly
- `src/api/websocket.ts` — `DeviceStatusEvent` is `Partial<Device>`, auto-includes new fields
- `src/hooks/useWebSocket.ts` — spread merge already preserves new fields in cache
