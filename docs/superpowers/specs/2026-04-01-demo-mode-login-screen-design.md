# Demo Mode on Login Screen

Move the demo mode entry point from Settings to the Login screen so users can explore the app without credentials.

## Decisions

- **Placement:** Divider section ("— or —") between Sign In button and Sign Up link, with an outlined "Explore Demo" button
- **Settings toggle:** Remove entirely — demo mode is only entered from the login screen
- **Exit demo:** Existing logout button in Settings clears demo state and returns to login
- **Entry behavior:** Instant — no app restart required
- **Demo vs dev mock:** These are separate concepts. `FORCE_MOCK_MODE` is a dev-only flag that auto-seeds at boot. Demo mode is user-facing, entered from the login screen. `FORCE_MOCK_MODE` must be set to `false` so the login screen is shown.

## Login Screen UI Changes

Add between the Sign In button and the "Don't have an account? Sign Up" link:

1. A horizontal divider with centered "or" text (thin lines on either side)
2. An outlined secondary button: `Explore Demo`
   - Styled with border (#444), light text, matching existing dark theme
   - Shows loading state while demo data seeds

## Demo Entry Flow

When "Explore Demo" is tapped:

1. Show loading state on the button
2. `setDemoMode(true)` — persist to AsyncStorage
3. `featureFlagsManager.updateFlags({ DEMO_MODE: true })`
4. Apply runtime mock configuration (see "Runtime mock reconfiguration" below)
5. `seedMockData({ queryClient, store })` — seeds:
   - Auth state via `setCredentials` reducer (must be added to `authSlice` — currently missing)
   - React Query cache (alerts, devices, positions, known devices, analytics, heatmap)
6. `websocketService.connect('mock-token-for-testing')` — start mock WebSocket
7. RootNavigator detects `isAuthenticated: true` → switches to MainNavigator

### Auth contract fix

`authSlice` currently has no `setCredentials` reducer. `seedMockData` dispatches `{ type: 'auth/setCredentials' }` which is a no-op. A `setCredentials` reducer must be added to `authSlice` that sets `user`, `tokens`, and `isAuthenticated: true`.

### Runtime mock reconfiguration

`client.ts` and `queryClient.ts` capture `isMockMode` as a static snapshot at module load time. When demo mode is entered (either from the login screen or on cold-start of a persisted demo session), these snapshots are already set. The same reconfiguration must happen in both paths:

- **`apiClient`**: Install the mock adapter dynamically on `apiClient.defaults.adapter`
- **`queryClient`**: Snapshot the full current `defaultOptions` object before overwriting (only if not already snapshotted — the helper must be idempotent), then set mock-mode defaults (`staleTime: Infinity`, `retry: false`, `refetchOnReconnect: false`, preserving other keys like `gcTime` and `refetchOnWindowFocus`). `setDefaultOptions` replaces the object — it does not merge — so the snapshot is needed for accurate restoration on exit.

This reconfiguration must be applied in two places:

1. `LoginScreen.handleExploreDemo` — when entering demo from the login screen
2. `App.tsx` init guard — when cold-starting with persisted demo mode

No explicit navigation calls needed. The auth-gated navigator handles the transition.

## Settings Screen Cleanup

- Remove demo mode toggle from "Appearance" section
- Remove `handleToggleDemo` function
- Wire up logout button to actually dispatch the `logout` thunk (currently it only logs to console)

## Exit / Cleanup Flow

On logout, the following must all happen:

1. `setDemoMode(false)` — clear persisted flag
2. `featureFlagsManager.updateFlags({ DEMO_MODE: false })` — reset feature flags
3. `websocketService.disconnect()` — stop mock WebSocket (also unregisters forwarder callbacks)
4. Remove the mock adapter from `apiClient` (`delete apiClient.defaults.adapter`)
5. Restore `queryClient` default options from the snapshot taken at entry
6. `queryClient.clear()` — flush seeded cache
7. `store.dispatch(clearUser())` — reset user slice
8. `store.dispatch(resetSettings())` — reset settings slice
9. Dispatch the `logout` thunk — clears auth state, persisted demo flag, and disconnects WebSocket

Note: Do NOT use `clearMockData` from `seedMockData.ts` for cleanup. It dispatches a plain `{ type: 'auth/logout' }` action, but `authSlice` only clears auth on `logout.fulfilled` (the thunk's fulfilled action type). The plan performs cleanup manually to avoid this mismatch.

## WebSocket Lifecycle

- `websocketService.connect()` registers anonymous forwarder callbacks from `mockWebSocketService` → `websocketService` listeners. These must be stored as named references so they can be removed via `mockWebSocketService.off()` on disconnect.
- A boolean guard alone is insufficient — if `disconnect()` resets the guard without removing the callbacks, the next `connect()` adds a second set of forwarders, causing duplicate events.
- On disconnect: call `mockWebSocketService.off()` for each stored handler reference, then reset the guard.

## Mock Config Changes

- Set `FORCE_MOCK_MODE = false` — dev mock mode should not auto-authenticate on boot
- `USE_MOCK_API` env var remains available for dev use but does not affect the login screen flow
- The `isMockMode` static snapshot in `client.ts` and `queryClient.ts` is addressed by runtime reconfiguration (see above), not by changing the snapshot mechanism itself

## App Initialization Guard

In `App.tsx` `initializeApp`:

- With `FORCE_MOCK_MODE = false`, the boot flow no longer auto-seeds unless `USE_MOCK_API=true` is set
- The cold-start guard must key on `isDemoMode()` (the persisted AsyncStorage flag) rather than `store.getState().auth.isAuthenticated`. Reason: `initializeApp` runs in a `useEffect` before `PersistGate` has finished rehydrating the Redux store, so `auth.isAuthenticated` may still be `false` at guard-check time even though the persisted state will eventually rehydrate to `true`.
- When `isDemoMode()` is true on cold-start: apply runtime mock reconfiguration (install mock adapter, set query defaults), reconnect the mock WebSocket, and skip re-seeding. Redux Persist will rehydrate the auth/settings state independently via `PersistGate`.
- Prevents duplicate data while ensuring the client/query layers behave correctly

## Verification Baseline

The current repo has pre-existing issues that affect verification:

- `npx tsc --noEmit` fails with ~20+ unrelated type errors (icon types, missing exports, etc.)
- `__tests__/screens/LoginScreen.test.tsx` fails before running due to a `react-redux` ESM transform issue in Jest

Verification steps in the plan should be scoped to: "no new errors introduced by these changes." Type-check and test commands are informational, not pass gates, until the existing repo issues are resolved separately.

## Files to Modify

| File                                      | Change                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/screens/auth/LoginScreen.tsx`        | Add divider + "Explore Demo" button, `handleExploreDemo` handler                                                           |
| `src/screens/settings/SettingsScreen.tsx` | Remove demo mode toggle, wire up logout to dispatch thunk with full cleanup                                                |
| `src/store/slices/authSlice.ts`           | Add `setCredentials` reducer, clear demo mode in `logout` thunk                                                            |
| `src/config/mockConfig.ts`                | Set `FORCE_MOCK_MODE = false`                                                                                              |
| `src/config/demoModeRuntime.ts`           | **Create** — shared helper for applying/reverting mock adapter + query defaults (idempotent snapshot/restore)              |
| `src/api/websocket.ts`                    | Store forwarder refs, remove on disconnect to prevent duplicate listeners                                                  |
| `src/App.tsx`                             | Guard re-seeding on `isDemoMode()` flag (not auth state) + apply runtime mock reconfiguration on persisted demo cold-start |
| `src/config/demoMode.ts`                  | No changes needed                                                                                                          |
