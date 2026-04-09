# TrailSense Mobile Repo Audit

Date: 2026-04-02

Scope:

- Static review of app config, navigation, auth/session flows, data layer, settings screens, and notification/location surfaces
- Validation runs: `npm run type-check`, `npm run lint`, `npm test -- --runInBand`

Executive summary:

- I found 14 material areas of concern across security, navigation, configuration, state persistence, and engineering quality.
- The highest-risk items are: a committed Mapbox secret token, hardcoded production networking, broken release gates (`tsc`/`eslint`/`jest` all failing), and missing dependencies/aliases that block clean builds.
- There are also multiple direct user-facing navigation issues: dead route targets, non-working back buttons, and a filter screen that opens but cannot actually apply filters.

Validation snapshot:

- `npm run type-check` failed with a large set of TypeScript errors across screens, services, and hook layers.
- `npm run lint` reported `1236` problems (`1153` errors, `83` warnings).
- `npm test -- --runInBand` failed `12/22` suites. The failures include real regressions plus test infrastructure breakage around ESM transforms and AsyncStorage mocking.

## 1. Hardcoded Mapbox secret token is committed in app config

Severity: High

Evidence:

- `app.json:54-58` embeds `RNMapboxMapsDownloadToken` directly in source, and the token is a secret-style `sk.*` value.

Why I flagged it:

- This is a direct secret-management issue. A committed secret in a mobile repo is high-cost because it is visible to anyone with repo access and can also leak via build artifacts or screenshots.
- This is not just a local dev convenience value; it sits in shipping app config.

Recommended path:

- Revoke and rotate the exposed Mapbox secret immediately.
- Move the download token to a build-time secret source such as EAS secrets or CI environment injection.
- Keep only a public runtime token on-device if the app needs one at runtime.
- Add a secret scan step to CI so new committed tokens fail fast.

## 2. Production networking is hardcoded and split across multiple HTTP clients

Severity: High

Evidence:

- `src/constants/config.ts:5-24` hardcodes production API and WebSocket URLs and logs them on import.
- `src/services/authService.ts:11-35` uses raw `axios` against `API_BASE_URL`.
- `src/api/axiosInstance.ts:8-71` creates a second Axios client with its own interceptors and timeout.
- `src/screens/auth/ForgotPasswordScreen.tsx:12,40-52` uses `axiosInstance`, not the mock-aware `apiClient`.

Why I flagged it:

- The repo does not have a trustworthy environment boundary. Local, staging, demo, and production traffic are not centrally controlled.
- Because auth and forgot-password use different clients from the rest of the app, some flows can bypass mock/demo behavior and hit production unexpectedly.
- This also creates drift in timeout, interceptor, retry, and token-refresh behavior.

Recommended path:

- Replace hardcoded URLs with a single environment source of truth using Expo config or `EXPO_PUBLIC_*` values.
- Standardize on one HTTP client factory and remove direct `axios` usage from feature code.
- Make mock/demo mode an explicit client configuration, not an adapter applied to only one client.
- Remove boot-time logging of endpoint values.

## 3. Alert filter screen is effectively non-functional

Severity: Medium

Evidence:

- `src/screens/alerts/AlertFilterScreen.tsx:13-15` expects an `onApplyFilters` callback in route params.
- `src/screens/alerts/AlertFilterScreen.tsx:53-57` only applies filters if that callback exists.
- `src/screens/alerts/AlertListScreen.tsx:173-176` navigates to `AlertFilter` without passing any callback or filter state.

Why I flagged it:

- This is a visible user flow that opens successfully but cannot actually change the alert list.
- It is the kind of bug users experience as “the UI lets me do work, but nothing happens.”

Recommended path:

- Stop passing functions through route params.
- Move filter state into the alert screen state, URL params, or a small store/query-key model.
- Have `AlertFilterScreen` return a typed filter payload through navigation params or shared state.
- Add an integration test that opens filters, applies one, and confirms the list changes.

## 4. Several screens render back buttons that do nothing

Severity: Medium

Evidence:

- `src/components/organisms/Header/Header.tsx:111-137` renders the back button with `onPress={onBackPress}` and no default fallback.
- These screens set `showBack: true` without providing `onBackPress`:
  - `src/screens/alerts/AlertFilterScreen.tsx:68-77`
  - `src/screens/radar/ProximityHeatmapScreen.tsx:513-531`
  - `src/screens/fingerprint/DeviceFingerprintScreen.tsx:75-80`
  - `src/screens/settings/AddKnownDeviceScreen.tsx:86-88`

Why I flagged it:

- A visible back affordance that does nothing is a high-friction UX regression.
- It is especially problematic on root-style screens like radar, where the header suggests a navigation stack that is not actually wired.

Recommended path:

- Either require `onBackPress` whenever `showBack` is true, or make `Header` fall back to `navigation.goBack()` automatically.
- Add a lint rule or unit test around header usage so future screens cannot render a dead back button.

## 5. Navigation targets and auth affordances do not match the registered routes

Severity: Medium

Evidence:

- `src/screens/settings/ProfileScreen.tsx:36-39` navigates to `ChangePassword`, but `src/navigation/types.ts:54-73` does not define that route.
- `src/screens/devices/DeviceDetailScreen.tsx:95-106` navigates to `Map` and `DeviceSettings`.
- `src/navigation/stacks/DevicesStack.tsx:20-39` does not register `DeviceSettings`, and there is no `Map` route in the declared stacks.
- `src/screens/auth/LoginScreen.tsx:82-85` shows an alert for forgot password instead of navigating.
- `src/navigation/AuthNavigator.tsx:19-21` already registers a `ForgotPassword` screen that the login screen never uses.

Why I flagged it:

- These are direct runtime dead ends, not just architectural imperfections.
- The type system is not preventing them because many screens use `any` navigation props, so mistakes are surfacing only at runtime.

Recommended path:

- Remove or disable actions for unimplemented destinations until the routes exist.
- Convert screen navigation props to typed React Navigation props so nonexistent routes fail at compile time.
- Wire `LoginScreen` to `navigation.navigate('ForgotPassword')` and add a navigation smoke test.

## 6. Some reachable screens are still using stale UI contracts and are partially detached from the current app shell

Severity: Medium

Evidence:

- `src/screens/settings/SensitivityScreen.tsx:48-72` passes only `title` to `ScreenLayout` even though the shared layout only shows headers when `header` or `showHeader` is provided. The screen also uses outdated `Button`/`Text` props like `title`, `variant`, and `caption`.
- `src/screens/settings/VacationModeScreen.tsx:14-71` renders a raw `ScrollView` with no shared header, no back action, and no theme integration.
- `src/screens/devices/AddDeviceScreen.tsx:40-52,90-113` shows the same pattern of obsolete `Button`/`Text` API usage.

Why I flagged it:

- These screens are reachable from the current navigation graph, but they are not aligned with the current design system or component contracts.
- This is one reason the repo is failing type-checks on user-facing screens, not just experimental code.

Recommended path:

- Refactor these screens onto the current `ScreenLayout` header API and the current atom interfaces.
- Add a small “navigable screens compile and render” test suite covering every route exposed from Settings and Devices.
- Delete or quarantine screens that are still mid-migration instead of leaving them live in the navigator.

## 7. The inactivity/session-timeout feature is both unwired and logically incorrect

Severity: Medium

Evidence:

- `src/hooks/useAuth.ts:10-22` is the only place that starts `inactivityService`.
- Repo-wide search found no app-level usage of `useAuth()`.
- `src/services/inactivityService.ts:11-27` starts a one-shot timer.
- `src/services/inactivityService.ts:51-64` only resets that timer on app state changes, not on user touches, navigation, or API activity.

Why I flagged it:

- Right now the feature appears to exist, but it is not actually mounted anywhere in the app.
- If someone wires it in later without changing the logic, active users can still be logged out after 30 minutes because “activity” is not being tracked.

Recommended path:

- Mount session/inactivity handling once near the app root.
- Reset activity on navigation changes and user interaction, not just foreground/background transitions.
- Add deterministic timer tests for active use, background use, and timeout behavior.

## 8. Redux persistence is configured in a way that likely does not do what the codebase expects

Severity: Medium

Evidence:

- `src/store/index.ts:10-16` sets `whitelist: ['auth', 'settings']`.
- `src/store/index.ts:16` applies that config only to `authReducer`.
- `src/store/index.ts:26-33` mounts `settingsReducer` without persistence.

Why I flagged it:

- `redux-persist` whitelists are evaluated against the reducer state being wrapped. Here, the wrapped reducer is the auth slice, not the root reducer.
- That makes the configured whitelist suspicious on its face, and settings persistence is definitely not wired through the same persist wrapper.

Recommended path:

- Persist a combined root reducer if you want root-slice whitelisting, or create one correctly scoped persist config per slice.
- Add a rehydration test that verifies auth tokens, settings, and logout cleanup actually behave as intended.

## 9. Navigation state is persisted across logout/login boundaries and never cleared

Severity: Medium

Evidence:

- `src/navigation/RootNavigator.tsx:12,29-55` restores and saves `@trailsense:navigation_state` on every app run.
- The logout paths do not remove that key.

Why I flagged it:

- Persisting route state is fine for some apps, but here it is not tied to a user/session boundary.
- On shared devices or after demo/logout flows, the next user can be restored into stale nested routes and old params.

Recommended path:

- Clear persisted navigation state on logout and on demo-mode exit.
- If route persistence is still desired, scope it by authenticated user ID or disable it for protected routes.

## 10. There are two parallel data-hook layers for alerts and devices, and they have already drifted apart

Severity: Medium

Evidence:

- Legacy alert hooks: `src/hooks/useAlerts.ts:1-50`
- Canonical alert hooks: `src/hooks/api/useAlerts.ts:1-71`
- Legacy device hooks: `src/hooks/useDevices.ts:1-60`
- Canonical device hooks: `src/hooks/api/useDevices.ts:1-72`
- The legacy hooks call API members that do not exist anymore, such as `markMultipleReviewed`, `DeviceFilters`, `UpdateDevicePayload`, and `getDeviceAlerts`.

Why I flagged it:

- This is a textbook case of “multiple sources of truth” causing contract drift.
- The drift is no longer theoretical; it is already one of the reasons `tsc` is red and tests are importing the wrong layer.

Recommended path:

- Delete or archive the legacy hook modules under `src/hooks/` if `src/hooks/api/` is the intended public surface.
- Re-export one canonical API module and update all imports/tests to it.
- Add a small architecture note so contributors know which data layer is the supported one.

## 11. The build/test safety net is red, so regressions are currently cheap to introduce

Severity: High

Evidence:

- `npm run type-check` failed with many TypeScript errors across live screens, hooks, and services.
- `npm run lint` reported `1236` problems (`1153` errors, `83` warnings).
- `npm test -- --runInBand` failed `12/22` suites.
- `jest.config.js:4-27` does not fully account for current ESM packages and does not set up AsyncStorage mocks needed by the current code.

Why I flagged it:

- Once the baseline is already broken, teams stop trusting failures. Real regressions blend into background noise.
- This repo currently has both infrastructure failures and actual product regressions in the same output, which is exactly what makes code review and release hard.

Recommended path:

- Treat “green type-check, green lint, green tests” as a release requirement.
- Fix the Jest environment first: transform rules, AsyncStorage setup, and other required mocks.
- Then burn down the TypeScript and lint debt in focused slices, starting with reachable screens and shared services.

## 12. Missing dependencies and unresolved aliases block clean builds

Severity: High

Evidence:

- `src/services/notificationService.ts:1` and `src/services/deepLinking.ts:1` import `@react-native-firebase/messaging`, but `package.json:34-114` does not declare that dependency.
- `src/screens/settings/NotificationSettingsScreen.tsx:17`, `src/screens/settings/ProfileScreen.tsx:19`, and `src/screens/settings/SensitivityScreen.tsx:5` import `@store`, but the configured aliases only cover `@store/*`, not the root alias.
- `tsconfig.json:24-67` defines `@store/*` but not `@store`, and `jest.config.js:13-27` mirrors the same pattern.
- `src/services/deviceFingerprinting.ts:1` imports `@database`, which is not defined in the current alias maps.

Why I flagged it:

- These are hard build failures, not future cleanup work.
- They also signal that some code paths were added without being validated in the actual toolchain.

Recommended path:

- Decide whether these modules are supposed to ship. If yes, add the dependencies and alias mappings in TypeScript, Babel, and Jest together.
- If not, delete or quarantine the unfinished integration points so they stop poisoning the build.

## 13. The app requests background location privileges without clear implemented behavior

Severity: Medium

Evidence:

- `app.json:19-25` requests always/background location on iOS.
- `app.json:36-44` requests background location on Android.
- The only in-repo geofence/location logic I found is placeholder code in `src/services/vacationModeService.ts:48-78`.

Why I flagged it:

- Requesting privileged background permissions without a concrete shipped workflow is a privacy, trust, and review risk.
- It also adds user friction early for functionality that appears unfinished.

Recommended path:

- Remove background location until the feature is real.
- If the feature is intended for near-term release, implement the actual permission flow, rationale UI, geofence behavior, and tests before requesting the permission.

## 14. Sensitive operational data is written to logs

Severity: Low to Medium

Evidence:

- `src/hooks/useNotifications.ts:21-23` logs the raw FCM token.
- `src/api/client.ts:83-125` logs request params, request bodies, response bodies, and error payloads in development.
- `src/constants/config.ts:22-24` logs backend endpoint values on import.

Why I flagged it:

- Console output is often copied into CI logs, issue trackers, crash reports, and shared device logs.
- FCM tokens, alert payloads, and profile data should not be logged by default.

Recommended path:

- Replace ad hoc `console.log` calls with a centralized logger that supports redaction.
- Never log tokens or whole response bodies by default.
- Make verbose network logging opt-in and local-only.

## Suggested remediation order

1. Revoke the committed Mapbox secret and move all environment values behind a single config system.
2. Make the repo buildable again: fix missing dependencies/aliases, then repair Jest infrastructure.
3. Remove dead navigation targets and fix the shared-header back-button contract.
4. Collapse duplicate hook/API layers to one canonical data path.
5. Rework persistence and session handling so auth, navigation state, and demo/logout flows are coherent.

## Notes

- I intentionally prioritized issues that are either user-visible, security-sensitive, or likely to keep causing regressions.
- I did not treat every lint warning as a finding. The report focuses on the underlying patterns creating real product or maintenance risk.
