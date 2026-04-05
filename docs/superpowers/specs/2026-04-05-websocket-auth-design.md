# WebSocket Authenticated Connection — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Problem

In real (non-mock) mode the mobile app never establishes an authenticated WebSocket connection. `App.tsx` calls `websocketService.connect('mock-token-for-testing')` in demo/mock mode but only logs a comment in real mode. The dormant `useWebSocket` hook handles everything correctly but is never called. The result: `positions-updated`, `alert`, and `device-status` broadcasts from the backend are never received in production sessions. The radar screen falls back to 10-second REST polling instead of real-time push.

## Solution

Wire `useWebSocket` into the existing `AuthLifecycle` component in `App.tsx`, passing the access token from Redux auth state. No new files, no new abstractions, no backend changes.

## Architecture

### Change — `TrailSense/src/App.tsx`

`AuthLifecycle` gains one additional hook call:

```tsx
function AuthLifecycle() {
  const auth = useAuth();
  const token = useAppSelector(state => state.auth.tokens?.accessToken ?? null);
  useWebSocket(token);
  return null;
}
```

`AuthLifecycle` is already rendered inside both `ReduxProvider` and `QueryClientProvider` for the full app lifetime, making it the correct integration point.

Note: `App.tsx` will need `useAppSelector` imported from `@store/index` and `useWebSocket` imported from `@hooks/useWebSocket`.

### No changes required

- `src/hooks/useWebSocket.ts` — already correct, no changes
- `src/api/websocket.ts` — already correct, no changes
- `trailsense-backend/` — already correct, no changes
- `src/screens/radar/ProximityHeatmapScreen.tsx` — already listens to `positions-updated` via `websocketService.on`; works once socket is connected

## Data Flow

```
login.fulfilled
  → Redux tokens.accessToken set
  → AuthLifecycle re-renders
  → useWebSocket(token) effect runs
  → websocketService.connect(token)
  → socket.io handshake with JWT
  → backend auth middleware verifies JWT
  → connection established

backend ingestion pipeline
  → broadcastTriangulatedPositions()
  → socket.io emits 'positions-updated'
  → websocketService listener fires
  → useWebSocket handlePositionsUpdated()
  → queryClient.invalidateQueries([POSITIONS_QUERY_KEY, deviceId])
  → ProximityHeatmapScreen refetches live data
```

## Lifecycle Behaviour

| State | Token value | WebSocket |
|---|---|---|
| App launch, not logged in | `null` | No connection — `useWebSocket` returns early |
| After login | `accessToken` string | Connected with JWT |
| Token refresh (`setCredentials`) | New `accessToken` string | Old socket disconnected, new socket connected |
| Logout | `null` (after `logout.fulfilled`) | Disconnected by both `authSlice` and hook cleanup |
| Demo/mock mode | `null` in Redux | `useWebSocket(null)` is a no-op; mock socket already connected by `App.tsx` before `AuthLifecycle` renders |

## Event Handling (existing, unchanged)

All three events are handled by `useWebSocket`:

- `alert` — prepends to React Query alerts cache, then invalidates
- `device-status` — merges into React Query device and devices-list caches
- `positions-updated` — invalidates `[POSITIONS_QUERY_KEY, deviceId]`, triggering radar screen refetch

## Testing

- `useWebSocket` unit tests already exist (confirmed by coverage report)
- `ProximityHeatmapScreen` replay tests already cover the `positions-updated` handler
- **New test:** `AuthLifecycle` integration test — verify `websocketService.connect` is called when Redux auth state transitions from unauthenticated → authenticated, and is not called when `tokens` is null

## Scope

- Frontend: 1 file changed (`src/App.tsx`), ~4 lines
- Backend: 0 changes
- New files: 0
