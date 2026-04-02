# TrailSense Frontend Future Agent Reference

## Purpose

This is the canonical orientation and working guide for agents modifying the TrailSense mobile frontend in this repo:

- `/Users/codyschexnider/Documents/Project/TrailSense`

Read this first before making changes.

## System Context (Cross-Project)

TrailSense has three connected systems:

1. ESP32 firmware performs passive WiFi/BLE/cellular detection and triangulation.
2. Backend ingests payloads from Golioth, persists data, and exposes REST/WebSocket.
3. This frontend app renders alerts/devices/map/analytics and AI UX.

Cross-project reference files used during this analysis:

- Backend canonical reference: `/Users/codyschexnider/Documents/Project/trailsense-backend/docs/FUTURE-AGENT-BACKEND-REFERENCE.md`
- Backend endpoint audit vs app usage: `/Users/codyschexnider/Documents/Project/trailsense-backend/docs/analysis/mobile-app-endpoint-usage-audit.md`
- Firmware payload cross-reference: `/Users/codyschexnider/Documents/Project/trailsense-backend/docs/analysis/firmware-webhook-payload-cross-reference.md`
- Firmware review/remediation docs:
  - `/Users/codyschexnider/Documents/Project/TrailSenseDevice/docs/CODE_REVIEW_REPORT.md`
  - `/Users/codyschexnider/Documents/Project/TrailSenseDevice/docs/REMEDIATION_PROMPT.md`
  - `/Users/codyschexnider/Documents/Project/TrailSenseDevice/docs/REMEDIATION_CHECKLIST.md`

## Runtime Topology

Main app entry is `src/App.tsx`.

Provider stack order:

1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. `ThemeProvider`
4. Redux `Provider`
5. `PersistGate`
6. React Query `QueryClientProvider`
7. `AIProvider`
8. `RootNavigator`

Key startup behaviors in `src/App.tsx`:

- Initializes `react-native-executorch` on iOS/Android.
- Logs mock mode status (`logMockStatus`).
- If mock mode is enabled, seeds Redux + React Query cache (`seedMockData`) then connects mock WebSocket.
- If real mode is enabled, it logs that WebSocket should connect after auth, but no global real-socket connect occurs at app bootstrap.

## Navigation Architecture

Top-level:

- `RootNavigator` toggles `AuthNavigator` vs `MainNavigator` based on `state.auth.isAuthenticated`.
- Navigation state is persisted in AsyncStorage (`@trailsense:navigation_state`).

`MainNavigator` tabs:

- Alerts (`AlertsStack`)
- Devices (`DevicesStack`)
- Map (`RadarStack`)
- Analytics (`AnalyticsStack`)
- AI (`AIStack`)
- Settings (`SettingsStack`)

Deep-link configuration is in `src/navigation/linking.ts`.

Important: `RadarStack` route name `LiveRadar` currently points to `ProximityHeatmapScreen`, not `LiveRadarScreen`.

## State Management Model

The app uses **three state layers** in parallel.

1. Redux Toolkit (`src/store`)
- Global auth, user, settings, and UI slices.
- Persisted with `redux-persist`.

2. React Query (`@tanstack/react-query`)
- Server/cache data for alerts, devices, whitelist, analytics, positions.
- Polling used heavily (alerts/devices 30s, positions 10s).

3. Zustand stores (`src/store/zustand`)
- UI/radar/filter-local state.

### Current Ownership Pattern

- Server-sourced lists/details: React Query hooks under `src/hooks/api`.
- Authentication/session identity: Redux auth slice + `AuthService` (SecureStore tokens).
- Theme preference: Theme context + AsyncStorage (`@trailsense:theme`).
- Radar-local UX toggles: Zustand.

### Important Redux Caveats

- `persistReducer` is applied only to the `auth` reducer, but the persist config whitelist includes `auth` and `settings`; that whitelist does not behave as intended in the current shape.
- Several settings screens read `state.settings` as if flattened, but slice shape is `state.settings.settings`.

## Data Layer and API Surfaces

### API Clients

- `src/api/client.ts`: primary client used by endpoint modules.
- `src/api/axiosInstance.ts`: second axios instance with overlapping behavior (largely redundant).

### Endpoint Modules (active)

- `src/api/endpoints/alerts.ts`
- `src/api/endpoints/devices.ts`
- `src/api/endpoints/positions.ts`
- `src/api/endpoints/whitelist.ts`
- `src/api/analytics.ts`
- `src/api/settings.ts`

### Active Query Hooks (preferred)

- `src/hooks/api/useAlerts.ts`
- `src/hooks/api/useDevices.ts`
- `src/hooks/api/usePositions.ts`
- `src/hooks/api/useWhitelist.ts`
- `src/hooks/useAnalytics.ts`

## Real-Time Flow

WebSocket service is `src/api/websocket.ts`.

Supported events:

- `alert`
- `device-status`
- `positions-updated`

Real-time integration paths:

- Mock mode: connected automatically at startup.
- Real mode: expected after auth, but no consistent global connect hook is wired in default flow.
- `useWebSocket(token)` exists and updates/invalidate React Query caches, but has no active call sites in the current app flow.

Map screen (`ProximityHeatmapScreen`) subscribes to `positions-updated` and invalidates positions query for selected device.

## Mock Mode Architecture

Mock toggle:

- `src/config/mockConfig.ts`
- `isMockMode = process.env.USE_MOCK_API === 'true' || FORCE_MOCK_MODE`

Mock flow:

1. `seedMockData` writes mock entities into React Query cache and dispatches Redux actions.
2. Mock socket emits synthetic alerts/device status.

Critical caveat:

- `seedMockData` dispatches `auth/setCredentials`, but `authSlice` has no `setCredentials` reducer.
- This means claimed auto-login behavior is inconsistent with current reducer definitions.

## UI/System Design Conventions

Component architecture follows atomic layering:

- `atoms/`
- `molecules/`
- `organisms/`
- `templates/`

Most modernized screens use:

- `ScreenLayout` template
- iOS semantic color tokens (`theme.colors.*`)
- `Button` atom with `buttonStyle` (`filled|tinted|gray|plain`) and children-based label
- `Text` atom variants aligned to iOS typography semantics

### Screen Pattern Summary

- Alerts tab: list + hero + search + pull-to-refresh + threat filtering in-memory.
- Devices tab: sorted by calculated online status from `lastSeen`, not raw `online` boolean.
- Map tab: Mapbox satellite/dark map, device marker + triangulated markers.
- Analytics tab: chart-heavy view from `/api/analytics` with period switch.
- Settings tab: mostly UI-first composition; many actions are still placeholders.
- AI tab: on-device model provider + chat UX with contextual suggestions.

## AI/LLM Subsystem

Main modules:

- `src/services/llm/AIProvider.tsx`
- `src/services/llm/modelManager.ts`
- `src/services/llm/LLMService.ts`
- `src/services/llm/inferenceEngine.ts`
- `src/config/featureFlags.ts`
- `src/config/llmConfig.ts`

Current behavior notes:

- Feature flags gate LLM features.
- `FEATURE_FLAGS.LLM_MOCK_MODE` defaults to `true`; inference engine returns mock text while this is true.
- App logs in `App.tsx` claim real model usage, but feature flag defaults still indicate mock inference unless changed.
- Model strategy is download-based and large (~1.5GB model), with ExecuTorch integration.

## Backend Contract Alignment (What Actually Matches)

From current frontend usage and backend routes, these are the stable/shared endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `GET /api/alerts`
- `GET /api/alerts/:id`
- `GET /api/devices`
- `GET /api/devices/:id`
- `GET /api/analytics`
- `GET /api/positions`

Important backend implementation detail:

- Backend `/api/alerts` is currently a compatibility layer over `TriangulatedPosition`, not the historical `Alert` table.

## Known Mismatches and Sharp Edges

This section is the highest-value part for future agents.

1. Duplicate hook families with drift
- Newer active hooks are in `src/hooks/api/*`.
- Legacy duplicates exist in `src/hooks/useAlerts.ts`, `src/hooks/useDevices.ts`, `src/hooks/useWhitelist.ts` with stale API signatures (`DeviceFilters`, `markMultipleReviewed`, etc.) that do not match endpoint modules.
- `WhitelistScreen` currently imports the legacy hook path (`@hooks/useWhitelist`).

2. Legacy screens using outdated atom APIs
- `AddDeviceScreen`, `AddWhitelistScreen`, `SensitivityScreen` use old `Button`/`Text` prop contracts (`title`, `variant`, legacy text variants) inconsistent with current atoms.
- These files represent partial migration leftovers and are high regression risk.

3. Settings state shape inconsistency
- Redux slice shape: `state.settings.settings`.
- Several settings screens/selectors read flattened keys (`state.settings?.sensitivity`, `quietHoursEnabled`, etc.) and may not reflect persisted settings correctly.

4. Mock seed action mismatch
- `seedMockData` dispatches nonexistent `auth/setCredentials` action.

5. Endpoint gaps vs backend
- App modules reference backend routes that are not implemented in current backend:
  - `/whitelist*`
  - `/settings/*`
  - `/auth/refresh`
  - `/analytics/*` (non-`/api` routes)
  - `/devices/fcm-token`
- See backend audit doc for route-by-route matrix.

6. Real WebSocket lifecycle gap
- Real API mode logs intent to connect post-auth, but no default global connection path is guaranteed.

7. Navigation target mismatches in some handlers
- Example: `DeviceDetailScreen` navigates to route names not present in current typed stacks (`Map`, `DeviceSettings`).

8. Mixed service maturity
- Many screens contain UI TODO/log stubs instead of wired mutations (e.g., mark reviewed, delete, add device, add whitelist).

9. Config/documentation version drift
- README claims React Native/Expo versions that do not match `package.json` values.

## End-to-End Data Flow (Device -> App)

Nominal flow:

1. ESP32 sends `positions` and `heartbeat` payloads to Golioth.
2. Backend ingests payloads via webhook/polling service.
3. Backend upserts `Device` and `TriangulatedPosition`.
4. Backend REST serves `/api/devices`, `/api/positions`, `/api/alerts` (derived).
5. Frontend React Query polling fetches these datasets.
6. Backend emits `positions-updated`/`device-status` WebSocket events.
7. Frontend invalidates query caches and rerenders.

Current practical caveat:

- Alerts semantics are currently triangulation-derived on backend, so frontend alert UX should not assume historical alert-review persistence semantics.

## Working Rules for Future Agents

1. Prefer `src/hooks/api/*` over legacy hooks.
2. Before adding endpoints client-side, verify backend route exists in `trailsense-backend/src/routes/index.ts`.
3. Treat `ProximityHeatmapScreen` and positions flow as core path; avoid breaking query keys/events (`positions`, `positions-updated`).
4. Keep query key shapes stable when possible; cache invalidation depends on exact keys.
5. If touching settings, normalize selector usage to one consistent state shape.
6. If touching auth/mock bootstrap, reconcile `seedMockData` with actual auth reducers before relying on auto-login assumptions.
7. If enabling real-time features, wire a single authoritative real-socket connect lifecycle after authentication.
8. When editing older screens, check atom/molecule APIs first; many files are in partial migration state.

## Suggested Stabilization Order

If asked to harden the app, this order yields fastest risk reduction:

1. Remove/replace legacy hook duplicates and update all imports to `src/hooks/api/*`.
2. Fix mock auth seed (`setCredentials` mismatch).
3. Resolve settings selector/state-shape inconsistencies.
4. Align frontend endpoint surface to currently implemented backend routes (or implement missing backend endpoints deliberately).
5. Standardize real WebSocket connection lifecycle in real mode.
6. Modernize legacy screens (`AddDevice`, `AddWhitelist`, `Sensitivity`) to current atom API contracts.

## Useful File Map

Core app shell:

- `src/App.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/MainNavigator.tsx`
- `src/navigation/linking.ts`

Data and network:

- `src/api/client.ts`
- `src/api/websocket.ts`
- `src/api/endpoints/*`
- `src/hooks/api/*`
- `src/hooks/useWebSocket.ts`

State:

- `src/store/index.ts`
- `src/store/slices/*`
- `src/store/zustand/*`

Map/radar:

- `src/screens/radar/ProximityHeatmapScreen.tsx`
- `src/hooks/api/usePositions.ts`

AI:

- `src/services/llm/*`
- `src/config/featureFlags.ts`
- `src/config/llmConfig.ts`

Mock mode:

- `src/config/mockConfig.ts`
- `src/utils/seedMockData.ts`
- `src/mocks/*`

## Verification Notes

This reference is based on static code analysis of frontend + referenced backend/firmware docs.

Not executed in this pass:

- Type check/test/build commands (dependencies were not installed in this workspace snapshot).

