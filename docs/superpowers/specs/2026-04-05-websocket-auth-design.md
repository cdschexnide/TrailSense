# WebSocket Authenticated Connection — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Problem

In real (non-mock) mode the mobile app never establishes an authenticated WebSocket connection. `App.tsx` calls `websocketService.connect('mock-token-for-testing')` in demo/mock mode but only logs a comment in real mode. The dormant `useWebSocket` hook handles everything correctly but is never called. The result: `positions-updated`, `alert`, and `device-status` broadcasts from the backend are never received in production sessions. The radar screen falls back to 10-second REST polling instead of real-time push.

## Solution

Extract `AuthLifecycle` from `App.tsx` into its own file (`src/components/AuthLifecycle.tsx`) and wire `useWebSocket` into it, passing the access token from Redux auth state. Also remove the now-redundant `websocketService.connect('mock-token-for-testing')` calls from `App.tsx` — `useWebSocket` handles connection in both real and mock mode since `seedMockData` always populates Redux auth tokens with `mockAuthTokens`. No backend changes.

## Architecture

### New file — `src/components/AuthLifecycle.tsx`

```tsx
import { useAuth } from '@hooks/useAuth';
import { useAppSelector } from '@store/index';
import { useWebSocket } from '@hooks/useWebSocket';

export function AuthLifecycle() {
  useAuth();
  const token = useAppSelector(state => state.auth.tokens?.accessToken ?? null);
  useWebSocket(token);
  return null;
}
```

### Changes to `src/App.tsx`

1. Replace the inline `function AuthLifecycle()` with an import from `src/components/AuthLifecycle`
2. Remove both `websocketService.connect('mock-token-for-testing')` calls in the mock/demo branches of `initializeApp` — `useWebSocket` now handles connection once `AuthLifecycle` mounts

### No changes required elsewhere

- `src/hooks/useWebSocket.ts` — already correct
- `src/api/websocket.ts` — already correct
- `trailsense-backend/` — already correct
- `src/screens/radar/ProximityHeatmapScreen.tsx` — already listens to `positions-updated` via `websocketService.on`; works once socket is connected (see Double Handler note below)

## Structural Constraints

**`AuthLifecycle` must remain inside `PersistGate` in the component tree.** `PersistGate` delays rendering until redux-persist finishes rehydrating AsyncStorage. If `AuthLifecycle` is placed above `PersistGate`, it mounts with `tokens = null`, `useWebSocket(null)` no-ops, and no WebSocket connection is made on app resume even though valid persisted tokens exist.

**`AuthLifecycle` must remain inside `QueryClientProvider`.** `useWebSocket` calls `useQueryClient()` internally. Rendering it above the provider throws: `"No QueryClient set, use QueryClientProvider to set one"`.

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
  → queryClient.invalidateQueries([POSITIONS_QUERY_KEY, data.deviceId])
  → ProximityHeatmapScreen refetches live data
```

## Lifecycle Behaviour

| State                            | Token value                                          | WebSocket                                                                                                                           |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| App launch, not logged in        | `null`                                               | No connection — `useWebSocket` returns early                                                                                        |
| After login                      | `accessToken` string                                 | Connected with JWT                                                                                                                  |
| Token refresh (`setCredentials`) | New `accessToken` string                             | Old socket disconnected, new socket connected                                                                                       |
| Logout                           | `null` (after `logout.fulfilled`)                    | Disconnected by `authSlice` cleanup AND hook cleanup (both are safe — `disconnect()` is idempotent)                                 |
| Demo/mock mode                   | `mockAuthTokens.accessToken` (set by `seedMockData`) | `useWebSocket(token)` connects; previously `App.tsx` also called `connect()` first — those calls are removed as part of this change |
| App resume                       | Rehydrated `accessToken` (via `PersistGate`)         | `useWebSocket(token)` connects after `PersistGate` finishes rehydration                                                             |

## Disconnect Call Sites

There are three places that call `websocketService.disconnect()`:

1. `authSlice` `logout` thunk — explicit disconnect on user logout
2. `useWebSocket` cleanup (via `AuthLifecycle` unmount) — React effect cleanup fires when `token` changes or component unmounts
3. `App.tsx` `initializeApp` useEffect cleanup — fires on App component unmount (app exit)

All three are safe because `WebSocketService.disconnect()` is idempotent: in real mode it checks `if (this.socket)` before disconnecting; in mock mode `MockWebSocketService.disconnect()` checks `if (!this.isConnected) return`.

## Double Event Handler Note

After this change, `positions-updated` has two independent handlers:

1. **`useWebSocket`** (app-level, always active when authenticated): unconditionally invalidates `[POSITIONS_QUERY_KEY, data.deviceId]`
2. **`ProximityHeatmapScreen`** (screen-level, active only when radar screen is mounted): invalidates the same key but only if `data.deviceId === selectedDevice?.id`

When both are active (radar screen open), React Query receives two invalidations for the same key per event. React Query deduplicates in-flight requests, so this is functionally correct but redundant. The screen-level handler is intentionally left in place as a belt-and-suspenders fallback for cases where the app-level handler might not be connected (e.g., during initial authentication race).

## Event Handling (existing, unchanged)

All three events are handled by `useWebSocket`:

- `alert` — prepends to React Query alerts cache, then invalidates
- `device-status` — merges into React Query device and devices-list caches
- `positions-updated` — invalidates `[POSITIONS_QUERY_KEY, deviceId]`, triggering radar screen refetch

## Testing

- `useWebSocket` unit tests already exist (confirmed by coverage report)
- `ProximityHeatmapScreen` replay tests already cover the `positions-updated` handler
- **New test:** `__tests__/components/AuthLifecycle.test.tsx` — verify `useWebSocket` is called with `null` when `auth.tokens` is null, and with the access token string when `auth.tokens` is populated

## Scope

- Frontend: 2 files changed (`src/App.tsx` modifications, import cleanup), 1 new file (`src/components/AuthLifecycle.tsx`)
- Backend: 0 changes
