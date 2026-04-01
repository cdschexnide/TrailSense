# Workstream 3: Device Fingerprints & Behavioral Intelligence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename Whitelist to Known Devices throughout the app, add a Device Fingerprint screen with visit patterns and AI insight cards, add block device functionality, and create the client-side pattern detection engine.

**Architecture:** The rename is an isolated atomic commit touching ~30 files. Known Devices data continues to live in React Query (backed by the existing `/whitelist` API endpoint — only UI strings change, not API paths). Blocked devices use a new Redux slice persisted via Redux Persist. Pattern detection is computed client-side from alert history via a new `patternDetection` service. The Device Fingerprint screen is accessible from the home screen visitor chips, radar peek cards, and alert details.

**Tech Stack:** React Native 0.76, Expo SDK 52, TypeScript strict, Redux Toolkit + Redux Persist, React Query, existing atomic component system, HMAC-SHA256 via crypto-js (already in package.json)

## Autoplan Decisions Incorporated

| Decision | Source | Task |
|----------|--------|------|
| Whitelist rename as isolated atomic commit | Design D15, Eng E13 | Task 1 |
| Delete duplicate broken hook (src/hooks/useWhitelist.ts) | Codex Eng #5 | Task 1 |
| New Redux slices: knownDevices is unnecessary (data in React Query), blockedDevices needed | Eng E1 | Task 3 |
| Add blockedDevices to Redux Persist whitelist | Eng E1 | Task 3 |
| Block device is UI-only suppression; push still arrives | Codex Eng #2 | Task 3 |
| MAC hashes use HMAC with per-user key | Eng E8 | Deferred (no key source exists yet; document as TODO) |
| Pattern detection extends existing deviceFingerprinting.ts | Codex review finding #1 | Task 4 |
| AI Insight fallback templates (pattern-based text) | Design doc | Task 5 |
| Auto-suggestion banner at 10+ visits (on Home/Fingerprint, not push) | Design doc | Task 7 |
| Replace DeviceHistoryScreen with DeviceFingerprintScreen | Codex review finding #7 | Task 5 |
| Wire fingerprint into AlertsStack and RadarStack too | Codex review finding #2 | Task 6 |
| Fix ScreenLayout prop: showBack not showBackButton | Codex review finding #4 | Task 5 |
| blockedDevices needs separate persistReducer wrapping | Codex review finding #3 | Task 2 |
| Block toast should NOT claim grey radar dot (no radar code modified) | Codex review finding #5 | Task 3 |
| Deep link path rename: settings/whitelist → settings/known-devices (old path stops working, no redirect) | Design doc | Task 1 |

## Important Note: Two Duplicate Whitelist Hook Files

The codebase has TWO whitelist hook files:
- `src/hooks/useWhitelist.ts` — **BROKEN**. Imports `WhitelistFilters` and `AddWhitelistPayload` which don't exist in `api/endpoints/whitelist.ts`. **However, `src/screens/settings/WhitelistScreen.tsx:14` imports from this path.** So deletion must be paired with repairing that import to point at the working hook.
- `src/hooks/api/useWhitelist.ts` — **WORKING**. Uses correct types.

Task 1 repairs the WhitelistScreen import, deletes the broken hook, and renames the working one.

## Existing Fingerprint Infrastructure (DO NOT DUPLICATE)

The codebase already has server-backed fingerprint/history plumbing:
- `src/services/deviceFingerprinting.ts` — `DeviceFingerprintingService` with `trackDevice`, `getDeviceHistory`, pattern computation
- `src/api/analytics.ts:37` — `getDeviceHistory(macAddress)` API endpoint returning `DeviceFingerprint`
- `src/hooks/useAnalytics.ts` — `useDeviceHistory(macAddress)` hook
- `src/screens/devices/DeviceHistoryScreen.tsx` — Existing fingerprint display screen (uses mock data)

**The new DeviceFingerprintScreen REPLACES DeviceHistoryScreen, not duplicates it.** The pattern detection service EXTENDS `deviceFingerprinting.ts`, not creates a parallel service.

## Existing Route Bug

`DevicesStackParamList` defines `DeviceHistory: { id: string }` but `DeviceHistoryScreen.tsx:10` reads `macAddress` from params. This workstream fixes this by replacing `DeviceHistory` with `DeviceFingerprint: { macAddress: string }` across all stacks.

---

### Task 1: Whitelist → Known Devices Rename (Isolated Atomic Commit)

> **This is the highest-risk task. Do it in isolation. Run the full test suite after. Do NOT interleave with feature work.**

**Files to rename/modify (complete list):**

**Types:**
- Rename: `src/types/whitelist.ts` → `src/types/knownDevice.ts`
- Modify: `src/types/index.ts`

**API endpoints (keep API path as `/whitelist` for backend compat, rename only the TS exports):**
- Rename: `src/api/endpoints/whitelist.ts` → `src/api/endpoints/knownDevices.ts`
- Modify: `src/api/endpoints/index.ts`

**Hooks:**
- Delete: `src/hooks/useWhitelist.ts` (broken duplicate)
- Rename: `src/hooks/api/useWhitelist.ts` → `src/hooks/api/useKnownDevices.ts`
- Modify: `src/hooks/api/index.ts`

**Mock data:**
- Rename: `src/mocks/data/mockWhitelist.ts` → `src/mocks/data/mockKnownDevices.ts`
- Modify: `src/mocks/data/index.ts`
- Modify: `src/utils/seedMockData.ts`

**Screens:**
- Rename: `src/screens/settings/WhitelistScreen.tsx` → `src/screens/settings/KnownDevicesScreen.tsx`
- Rename: `src/screens/settings/AddWhitelistScreen.tsx` → `src/screens/settings/AddKnownDeviceScreen.tsx`
- Modify: `src/screens/settings/index.ts`
- Modify: `src/screens/settings/SettingsScreen.tsx` (row label + navigation)
- Modify: `src/screens/alerts/AlertListScreen.tsx` (handleWhitelist → handleAddToKnown)
- Modify: `src/screens/alerts/AlertDetailScreen.tsx` (whitelist action reference)

**Components:**
- Rename: `src/components/molecules/WhitelistItem/WhitelistItem.tsx` → keep file but rename component to `KnownDeviceItem`
- Modify: `src/components/molecules/WhitelistItem/index.ts`

**Navigation:**
- Modify: `src/navigation/types.ts` (Whitelist → KnownDevices, AddWhitelist → AddKnownDevice)
- Modify: `src/navigation/stacks/SettingsStack.tsx`
- Modify: `src/navigation/stacks/MoreStack.tsx`
- Modify: `src/navigation/linking.ts` (rename route path from `settings/whitelist` to `settings/known-devices`; old path stops working)

**Tests:**
- Rename: `__tests__/hooks/useWhitelist.test.tsx` → `__tests__/hooks/useKnownDevices.test.tsx`

**LLM templates (UI strings only, keep internal logic stable):**
- Modify: `src/services/llm/templates/ConversationalTemplate.ts` (change "whitelist" user-facing strings)
- Modify: `src/services/llm/templates/PatternAnalysisTemplate.ts`
- Modify: `src/services/llm/templates/AlertSummaryTemplate.ts`
- Modify: `src/services/llm/LLMService.ts`
- Modify: `src/services/llm/inferenceEngine.ts`

**Step 1: Rename type file and update types**

Rename `src/types/whitelist.ts` to `src/types/knownDevice.ts`. Update the types:

```typescript
// src/types/knownDevice.ts
export type KnownDeviceCategory = 'family' | 'guests' | 'service' | 'other';

export interface KnownDevice {
  id: string;
  name: string;
  macAddress: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnownDeviceDTO {
  name: string;
  macAddress: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
}
```

Update `src/types/index.ts`: replace `export * from './whitelist'` with `export * from './knownDevice'`.

**Step 2: Rename API endpoint file**

Rename `src/api/endpoints/whitelist.ts` to `src/api/endpoints/knownDevices.ts`. Update exports but keep API paths as `/whitelist` for backend compatibility:

```typescript
// src/api/endpoints/knownDevices.ts
import { apiClient } from '../client';
import { KnownDevice, CreateKnownDeviceDTO } from '@types';

export const knownDevicesApi = {
  getKnownDevices: async (): Promise<KnownDevice[]> => {
    const { data } = await apiClient.get('/whitelist'); // Keep API path for backend compat
    return data;
  },
  getKnownDeviceById: async (id: string): Promise<KnownDevice> => {
    const { data } = await apiClient.get(`/whitelist/${id}`);
    return data;
  },
  addKnownDevice: async (entry: CreateKnownDeviceDTO): Promise<KnownDevice> => {
    const { data } = await apiClient.post('/whitelist', entry);
    return data;
  },
  updateKnownDevice: async (id: string, updates: Partial<KnownDevice>): Promise<KnownDevice> => {
    const { data } = await apiClient.patch(`/whitelist/${id}`, updates);
    return data;
  },
  deleteKnownDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/whitelist/${id}`);
  },
};
```

Update `src/api/endpoints/index.ts`: replace `export * from './whitelist'` with `export * from './knownDevices'`.

**Step 3: Repair WhitelistScreen import, delete broken hook, rename working hook**

`src/screens/settings/WhitelistScreen.tsx:14` imports from `@hooks/useWhitelist` (the broken duplicate). Before deleting that file, update this import to point at the working API hook:

In `WhitelistScreen.tsx` (which you're about to rename to `KnownDevicesScreen.tsx`), change:
```typescript
import { useWhitelist } from '@hooks/useWhitelist';
```
to:
```typescript
import { useKnownDevices } from '@hooks/api/useKnownDevices';
```

Then delete `src/hooks/useWhitelist.ts`.

Rename `src/hooks/api/useWhitelist.ts` to `src/hooks/api/useKnownDevices.ts`. Update all internal references:

```typescript
// src/hooks/api/useKnownDevices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knownDevicesApi } from '@api/endpoints';
import { KnownDevice, CreateKnownDeviceDTO } from '@types';

export const KNOWN_DEVICES_QUERY_KEY = 'knownDevices';

export const useKnownDevices = () => {
  return useQuery({
    queryKey: [KNOWN_DEVICES_QUERY_KEY],
    queryFn: () => knownDevicesApi.getKnownDevices(),
  });
};

export const useKnownDevice = (id: string) => {
  return useQuery({
    queryKey: [KNOWN_DEVICES_QUERY_KEY, id],
    queryFn: () => knownDevicesApi.getKnownDeviceById(id),
    enabled: !!id,
  });
};

export const useAddKnownDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: CreateKnownDeviceDTO) => knownDevicesApi.addKnownDevice(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};

export const useUpdateKnownDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<KnownDevice> }) =>
      knownDevicesApi.updateKnownDevice(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<KnownDevice>([KNOWN_DEVICES_QUERY_KEY, variables.id], data);
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};

export const useDeleteKnownDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knownDevicesApi.deleteKnownDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KNOWN_DEVICES_QUERY_KEY] });
    },
  });
};
```

Update `src/hooks/api/index.ts`: replace `export * from './useWhitelist'` with `export * from './useKnownDevices'`.

**Step 4: Rename mock data**

Rename `src/mocks/data/mockWhitelist.ts` to `src/mocks/data/mockKnownDevices.ts`. Update all variable names (`mockWhitelist` → `mockKnownDevices`, etc.) and the type import (`WhitelistEntry` → `KnownDevice`).

Update `src/mocks/data/index.ts` to import from `./mockKnownDevices`.

Update `src/utils/seedMockData.ts`: replace `WHITELIST_QUERY_KEY` with `'knownDevices'`, update imports.

**Step 5: Rename screens**

Rename `src/screens/settings/WhitelistScreen.tsx` → `src/screens/settings/KnownDevicesScreen.tsx`. Update:
- Component name: `WhitelistScreen` → `KnownDevicesScreen`
- Import: `useWhitelist` → `useKnownDevices` from `@hooks/api/useKnownDevices`
- All UI strings: "Whitelist" → "Known Devices", "whitelisted" → "known"
- `WhitelistItemCard` → `KnownDeviceItemCard`
- `EmptyWhitelist` → `EmptyKnownDevices`

Rename `src/screens/settings/AddWhitelistScreen.tsx` → `src/screens/settings/AddKnownDeviceScreen.tsx`. Update component name and UI strings.

Update `src/screens/settings/index.ts` exports.

Update `src/screens/settings/SettingsScreen.tsx`: change the "Whitelist" row to "Known Devices" and update navigation target.

Update `src/screens/alerts/AlertListScreen.tsx`: rename `handleWhitelist` → `handleAddToKnown`.

**Step 6: Update navigation**

In `src/navigation/types.ts`: rename `Whitelist` → `KnownDevices` and `AddWhitelist` → `AddKnownDevice` in both `SettingsStackParamList` and `MoreStackParamList`.

In `src/navigation/stacks/SettingsStack.tsx` and `src/navigation/stacks/MoreStack.tsx`: update screen names and component imports.

In `src/navigation/linking.ts`: rename the route path from `'settings/whitelist'` to `'settings/known-devices'` for `KnownDevices`. Add `'settings/known-devices/add'` for `AddKnownDevice`.

Note: React Navigation's linking config does not support redirects natively. The old `settings/whitelist` deep link will simply stop working. This is acceptable since the app is pre-release and no external systems depend on the old URL. If backward compat is needed later, a custom `getStateFromPath` handler can be added.

**Step 7: Update LLM templates**

Change user-facing strings in the 4 LLM template files and LLMService.ts. Replace "whitelist" → "known devices" in prompts and user-facing output. Keep internal variable names if they don't appear in UI.

**Step 8: Rename test file and update**

Rename `__tests__/hooks/useWhitelist.test.tsx` → `__tests__/hooks/useKnownDevices.test.tsx`. Update imports and mock references.

**Step 9: Run full test suite**

Run: `npm test 2>&1 | tail -20`
Expected: All tests pass

Run: `npx tsc --noEmit 2>&1 | grep -i "whitelist\|knownDevice" | head -20`
Expected: No new errors from the rename

**Step 10: Commit**

```bash
git add -A
git commit -m "refactor: rename Whitelist to Known Devices throughout the app

Atomic rename across types, API endpoints, hooks, screens, navigation,
mock data, tests, and LLM templates. API paths unchanged for backend
compatibility. Deep link path renamed: settings/whitelist → settings/known-devices (old path stops working).
Deleted broken duplicate hook (src/hooks/useWhitelist.ts)."
```

---

### Task 2: blockedDevices Redux Slice

**Files:**
- Create: `src/store/slices/blockedDevicesSlice.ts`
- Modify: `src/store/index.ts`

> **Autoplan decision (Eng E1):** New slice added to persistConfig whitelist so blocks survive app restart.
> **Autoplan decision (Codex Eng #2):** Blocking is UI-only suppression. Push notifications still arrive. Document this.

**Step 1: Create the slice**

```typescript
// src/store/slices/blockedDevicesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BlockedDevice {
  macAddress: string;
  blockedAt: string;
  reason?: string;
}

interface BlockedDevicesState {
  devices: Record<string, BlockedDevice>; // keyed by macAddress
}

const initialState: BlockedDevicesState = {
  devices: {},
};

const blockedDevicesSlice = createSlice({
  name: 'blockedDevices',
  initialState,
  reducers: {
    blockDevice: (
      state,
      action: PayloadAction<{ macAddress: string; reason?: string }>
    ) => {
      state.devices[action.payload.macAddress] = {
        macAddress: action.payload.macAddress,
        blockedAt: new Date().toISOString(),
        reason: action.payload.reason,
      };
    },
    unblockDevice: (state, action: PayloadAction<string>) => {
      delete state.devices[action.payload];
    },
  },
});

export const { blockDevice, unblockDevice } = blockedDevicesSlice.actions;

/**
 * Check if a MAC address is blocked.
 * NOTE: Blocking is UI-only suppression. Server-generated push notifications
 * will still arrive for blocked devices. Backend sync for push suppression
 * is deferred to a future workstream.
 */
export const isDeviceBlocked = (
  state: { blockedDevices: BlockedDevicesState },
  macAddress: string
): boolean => {
  return macAddress in state.blockedDevices.devices;
};

export default blockedDevicesSlice.reducer;
```

**Step 2: Add to store with persistence**

> **CRITICAL (Codex finding #3):** The current store only wraps `authReducer` with `persistReducer`. Adding `blockedDevices` to the existing `persistConfig.whitelist` does nothing because that config only applies to the auth reducer. You MUST create a separate `persistReducer` wrapper.

In `src/store/index.ts`:

1. Import the new reducer: `import blockedDevicesReducer from './slices/blockedDevicesSlice';`
2. Create a **separate** persist config for blockedDevices:

```typescript
const blockedDevicesPersistConfig = {
  key: 'blockedDevices',
  storage: AsyncStorage,
};

const persistedBlockedDevicesReducer = persistReducer(
  blockedDevicesPersistConfig,
  blockedDevicesReducer
);
```

3. Add to the store's reducer map using the persisted version:

```typescript
reducer: {
  auth: persistedAuthReducer,
  user: userReducer,
  settings: settingsReducer,
  ui: uiReducer,
  blockedDevices: persistedBlockedDevicesReducer,
},
```

4. Add `'persist/PERSIST'` and `'persist/REHYDRATE'` to the serializable check ignore list (already partially there).

**Verification:** After implementation, test persistence by blocking a device, killing the app, and restarting. The blocked device should still be blocked.

**Step 3: Commit**

```bash
git add src/store/slices/blockedDevicesSlice.ts src/store/index.ts
git commit -m "feat(store): add blockedDevices Redux slice with persistence"
```

---

### Task 3: useBlockedDevices Hook + Alert Filtering

**Files:**
- Create: `src/hooks/useBlockedDevices.ts`
- Modify: `src/screens/alerts/AlertListScreen.tsx`

**Step 1: Create the hook**

```typescript
// src/hooks/useBlockedDevices.ts
import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@store/index';
import {
  blockDevice,
  unblockDevice,
} from '@store/slices/blockedDevicesSlice';
import { useToast } from '@components/templates';
import { logEvent, AnalyticsEvents } from '@services/analyticsEvents';

export function useBlockedDevices() {
  const dispatch = useAppDispatch();
  const blockedDevices = useAppSelector(
    state => state.blockedDevices?.devices ?? {}
  );
  const { showToast } = useToast();

  const isBlocked = useCallback(
    (macAddress: string) => macAddress in blockedDevices,
    [blockedDevices]
  );

  const block = useCallback(
    (macAddress: string, reason?: string) => {
      dispatch(blockDevice({ macAddress, reason }));
      logEvent(AnalyticsEvents.DEVICE_BLOCKED, { macAddress });
      showToast('Device blocked. Alerts from this device are now hidden.', 'info');
    },
    [dispatch, showToast]
  );

  const unblock = useCallback(
    (macAddress: string) => {
      dispatch(unblockDevice(macAddress));
      showToast('Device unblocked', 'success');
    },
    [dispatch, showToast]
  );

  const blockedCount = Object.keys(blockedDevices).length;

  return { isBlocked, block, unblock, blockedDevices, blockedCount };
}
```

**Step 2: Filter blocked devices from AlertListScreen**

In `src/screens/alerts/AlertListScreen.tsx`, import `useBlockedDevices` and filter blocked device alerts from the list:

```typescript
import { useBlockedDevices } from '@hooks/useBlockedDevices';

// Inside the component:
const { isBlocked } = useBlockedDevices();

// In the filteredAlerts useMemo, add a blocked filter after search/threat filters:
result = result.filter((alert: Alert) => !isBlocked(alert.macAddress));
```

**Step 3: Commit**

```bash
git add src/hooks/useBlockedDevices.ts src/screens/alerts/AlertListScreen.tsx
git commit -m "feat(hooks): add useBlockedDevices with alert filtering"
```

---

### Task 4: Extend Pattern Detection in Existing Service

**Files:**
- Modify: `src/services/deviceFingerprinting.ts` (add pattern computation methods)
- Create: `src/services/patternDetection.ts` (pure functions only, consumed by the existing service)

> **Codex finding #1:** DO NOT create a parallel fingerprint implementation. The existing `src/services/deviceFingerprinting.ts` already has `trackDevice`, `getDeviceHistory`, `calculateAverageDuration`, `findCommonHours`. The new pattern detection adds `computeVisitPattern` and `generateInsightText` as pure functions in a separate file (`patternDetection.ts`) that the existing service and the new screen can both consume.
>
> **Data flow clarification (Codex finding #3 remaining):** The DeviceFingerprintScreen uses `useAlerts()` + `computeVisitPattern(alerts, macAddress)` as its canonical data path. This is intentional: alerts are already in the React Query cache from the home screen, so there's no extra network call. The existing `useDeviceHistory(macAddress)` hook (which calls the server-backed `/analytics/devices/:macAddress` endpoint) is NOT used by this screen because it requires a backend endpoint that may not exist in mock mode. `useDeviceHistory` is left in place for the analytics screens that use it, but it is not the data source for the fingerprint screen. If the backend history endpoint provides richer data in the future, the screen can be updated to prefer it.
>
> **HMAC per-user key (Eng E8):** Deferred. No key source or crypto plumbing exists in the codebase. Added as TODO in the service file.

**Step 1: Create the service**

```typescript
// src/services/patternDetection.ts
import { Alert } from '@types';

export interface VisitPattern {
  totalVisits: number;
  visitsThisWeek: number;
  averageArrivalHour: number | null;
  dayOfWeekFrequency: Record<string, number>; // 'Mon' -> 3
  timeOfDayClusters: { start: number; end: number; count: number }[];
  firstSeen: string;
  lastSeen: string;
  isNew: boolean; // fewer than 3 visits
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Compute visit patterns for a device identified by MAC address.
 * Groups alerts by macAddress and analyzes temporal patterns.
 */
export function computeVisitPattern(
  allAlerts: Alert[],
  macAddress: string
): VisitPattern {
  const deviceAlerts = allAlerts
    .filter(a => a.macAddress === macAddress)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (deviceAlerts.length === 0) {
    return {
      totalVisits: 0,
      visitsThisWeek: 0,
      averageArrivalHour: null,
      dayOfWeekFrequency: {},
      timeOfDayClusters: [],
      firstSeen: '',
      lastSeen: '',
      isNew: true,
    };
  }

  // Day-of-week frequency
  const dayFreq: Record<string, number> = {};
  DAY_NAMES.forEach(d => (dayFreq[d] = 0));
  deviceAlerts.forEach(a => {
    const day = DAY_NAMES[new Date(a.timestamp).getDay()];
    dayFreq[day]++;
  });

  // Average arrival hour
  const hours = deviceAlerts.map(a => new Date(a.timestamp).getHours());
  const avgHour = Math.round(hours.reduce((s, h) => s + h, 0) / hours.length);

  // Time-of-day clusters (group hours within 2h of each other)
  const sortedHours = [...hours].sort((a, b) => a - b);
  const clusters: { start: number; end: number; count: number }[] = [];
  let clusterStart = sortedHours[0];
  let clusterEnd = sortedHours[0];
  let clusterCount = 1;

  for (let i = 1; i < sortedHours.length; i++) {
    if (sortedHours[i] - clusterEnd <= 2) {
      clusterEnd = sortedHours[i];
      clusterCount++;
    } else {
      clusters.push({ start: clusterStart, end: clusterEnd, count: clusterCount });
      clusterStart = sortedHours[i];
      clusterEnd = sortedHours[i];
      clusterCount = 1;
    }
  }
  clusters.push({ start: clusterStart, end: clusterEnd, count: clusterCount });

  // Visits this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const visitsThisWeek = deviceAlerts.filter(
    a => new Date(a.timestamp) >= weekAgo
  ).length;

  return {
    totalVisits: deviceAlerts.length,
    visitsThisWeek,
    averageArrivalHour: avgHour,
    dayOfWeekFrequency: dayFreq,
    timeOfDayClusters: clusters.sort((a, b) => b.count - a.count),
    firstSeen: deviceAlerts[0].timestamp,
    lastSeen: deviceAlerts[deviceAlerts.length - 1].timestamp,
    isNew: deviceAlerts.length < 3,
  };
}

/**
 * Generate AI Insight fallback text from a visit pattern.
 * Pattern-based templates until Expo SDK 54+ enables real LLM inference.
 */
export function generateInsightText(pattern: VisitPattern): string {
  if (pattern.isNew) {
    return `First detected ${_formatDate(pattern.firstSeen)}. No established pattern yet.`;
  }

  const lines: string[] = [];

  // Day pattern
  const activeDays = Object.entries(pattern.dayOfWeekFrequency)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (activeDays.length <= 3 && activeDays.length > 0) {
    const dayNames = activeDays.map(([day]) => day).join(' and ');
    const cluster = pattern.timeOfDayClusters[0];
    if (cluster) {
      lines.push(
        `Visits most often on ${dayNames}, typically between ${_formatHour(cluster.start)}-${_formatHour(cluster.end)}.`
      );
    } else {
      lines.push(`Visits most often on ${dayNames}.`);
    }
  }

  // Frequency change
  if (pattern.visitsThisWeek > pattern.totalVisits / 4) {
    lines.push(
      `Visit frequency increased: ${pattern.visitsThisWeek} visits in the last week vs ${pattern.totalVisits} total.`
    );
  }

  if (lines.length === 0) {
    return `Detected ${pattern.totalVisits} times since ${_formatDate(pattern.firstSeen)}.`;
  }

  return lines.join(' ');
}

function _formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function _formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return timestamp;
  }
}
```

**Step 2: Commit**

```bash
git add src/services/patternDetection.ts
git commit -m "feat(services): add client-side pattern detection with visit analysis and insight text"
```

---

### Task 5: DeviceFingerprintScreen (REPLACES DeviceHistoryScreen)

**Files:**
- Create: `src/screens/fingerprint/DeviceFingerprintScreen.tsx`
- Create: `src/screens/fingerprint/index.ts`
- Delete: `src/screens/devices/DeviceHistoryScreen.tsx` (replaced by this screen)
- Modify: `src/screens/devices/index.ts` (remove DeviceHistoryScreen export)

> **Codex finding #7:** The existing `DeviceHistoryScreen` is a mock-data fingerprint display. This screen replaces it entirely with the real pattern-powered version. The `DeviceHistory` route is replaced with `DeviceFingerprint` in all stacks (Task 6).
> **Codex finding #4:** ScreenLayout uses `showBack` not `showBackButton`. AddKnownDevice route needs `{ macAddress?: string }` params, not `undefined`.

**Step 1: Create the screen**

This screen shows the behavioral profile of a detected device. It receives `macAddress` as a route param and computes patterns from alert history.

```typescript
// src/screens/fingerprint/DeviceFingerprintScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Icon, Badge } from '@components/atoms';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useAlerts } from '@hooks/api/useAlerts';
import { useKnownDevices } from '@hooks/api/useKnownDevices';
import { useBlockedDevices } from '@hooks/useBlockedDevices';
import { computeVisitPattern, generateInsightText } from '@services/patternDetection';
import { useToast } from '@components/templates';
import { logEvent, AnalyticsEvents } from '@services/analyticsEvents';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DeviceFingerprintScreen = ({ route, navigation }: any) => {
  const { macAddress } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: alerts } = useAlerts();
  const { data: knownDevices } = useKnownDevices();
  const { isBlocked, block, unblock } = useBlockedDevices();
  const { showToast } = useToast();

  const pattern = React.useMemo(
    () => computeVisitPattern(alerts || [], macAddress),
    [alerts, macAddress]
  );

  const insightText = React.useMemo(
    () => generateInsightText(pattern),
    [pattern]
  );

  // Check if this device is in Known Devices
  const knownDevice = knownDevices?.find(
    (d: any) => d.macAddress === macAddress
  );
  const blocked = isBlocked(macAddress);

  // Determine manufacturer from first alert's detection type
  const deviceAlerts = (alerts || []).filter(
    (a: any) => a.macAddress === macAddress
  );
  const primaryDetectionType = deviceAlerts[0]?.detectionType || 'unknown';

  React.useEffect(() => {
    logEvent(AnalyticsEvents.FINGERPRINT_VIEWED, { macAddress });
  }, [macAddress]);

  const handleAddToKnown = () => {
    // NOTE: AddKnownDevice route params must be updated to accept { macAddress?: string }
    // in types.ts (both SettingsStackParamList and MoreStackParamList)
    navigation.navigate('MoreTab', {
      screen: 'AddKnownDevice',
      params: { macAddress },
    });
  };

  const handleBlock = () => {
    if (blocked) {
      unblock(macAddress);
    } else {
      block(macAddress);
    }
  };

  // Weekly frequency chart data
  const maxDayCount = Math.max(
    ...DAY_KEYS.map(k => pattern.dayOfWeekFrequency[k] || 0),
    1
  );

  return (
    <ScreenLayout
      header={{
        title: knownDevice ? knownDevice.name : 'Unknown Device',
        showBack: true,
      }}
      scrollable={true}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: knownDevice
                ? 'rgba(90, 138, 90, 0.12)'
                : 'rgba(184, 74, 66, 0.12)',
            },
          ]}
        >
          <Text
            variant="title1"
            weight="bold"
            style={{
              color: knownDevice ? colors.systemGreen : colors.systemRed,
            }}
          >
            {knownDevice ? knownDevice.name[0] : '?'}
          </Text>
        </View>
        <Text variant="title1" weight="bold" align="center">
          {knownDevice ? knownDevice.name : 'Unknown Device'}
        </Text>
        <Text variant="subheadline" color="secondaryLabel" align="center">
          {primaryDetectionType.charAt(0).toUpperCase() + primaryDetectionType.slice(1)}
        </Text>
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: knownDevice
                  ? 'rgba(90, 138, 90, 0.1)'
                  : 'rgba(184, 74, 66, 0.1)',
              },
            ]}
          >
            <Text
              variant="caption1"
              weight="semibold"
              style={{
                color: knownDevice ? colors.systemGreen : colors.systemRed,
              }}
            >
              {knownDevice ? 'Known' : 'Unknown'}
            </Text>
          </View>
          {blocked && (
            <View
              style={[styles.badge, { backgroundColor: 'rgba(107,107,78,0.1)' }]}
            >
              <Text variant="caption1" weight="semibold" color="secondaryLabel">
                Blocked
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Visit Pattern Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        <Text
          variant="caption1"
          weight="semibold"
          color="secondaryLabel"
          style={styles.cardTitle}
        >
          VISIT PATTERN
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="title1" weight="bold">
              {pattern.totalVisits}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Total visits
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="title1" weight="bold">
              {pattern.visitsThisWeek}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              This week
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text
              variant="title1"
              weight="bold"
              style={{
                color:
                  pattern.averageArrivalHour !== null &&
                  (pattern.averageArrivalHour < 6 || pattern.averageArrivalHour >= 22)
                    ? colors.systemRed
                    : colors.label,
              }}
            >
              {pattern.averageArrivalHour !== null
                ? `${pattern.averageArrivalHour > 12 ? pattern.averageArrivalHour - 12 : pattern.averageArrivalHour || 12}:00`
                : '—'}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Avg. time ({pattern.averageArrivalHour !== null && pattern.averageArrivalHour < 12 ? 'AM' : 'PM'})
            </Text>
          </View>
        </View>

        {/* Weekly frequency chart */}
        <Text
          variant="caption2"
          color="secondaryLabel"
          style={{ marginTop: 12, marginBottom: 8 }}
        >
          Weekly pattern
        </Text>
        <View style={styles.weekChart}>
          {DAY_KEYS.map((key, i) => {
            const count = pattern.dayOfWeekFrequency[key] || 0;
            const height = count === 0 ? 0 : Math.max(4, (count / maxDayCount) * 24);
            return (
              <View key={key} style={styles.dayColumn}>
                <View style={styles.dayBarContainer}>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        height,
                        backgroundColor:
                          count > 0
                            ? knownDevice
                              ? colors.systemGreen
                              : colors.systemRed
                            : 'transparent',
                      },
                    ]}
                  />
                </View>
                <Text variant="caption2" color="tertiaryLabel">
                  {DAY_LABELS[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* AI Insight Card */}
      {!pattern.isNew && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text variant="caption1" weight="semibold" color="secondaryLabel">
              ✦ AI INSIGHT
            </Text>
          </View>
          <Text variant="subheadline" color="label" style={{ lineHeight: 22 }}>
            {insightText}
          </Text>
        </View>
      )}

      {/* Signal Details */}
      <GroupedListSection title="SIGNAL DETAILS">
        <GroupedListRow title="Detection type" value={primaryDetectionType} />
        <GroupedListRow
          title="First seen"
          value={pattern.firstSeen ? new Date(pattern.firstSeen).toLocaleDateString() : '—'}
        />
        <GroupedListRow
          title="Last seen"
          value={pattern.lastSeen ? new Date(pattern.lastSeen).toLocaleDateString() : '—'}
        />
        <GroupedListRow
          title="MAC (hashed)"
          value={macAddress.substring(0, 8) + '...'}
        />
      </GroupedListSection>

      {/* Actions */}
      <View style={styles.actions}>
        {!knownDevice && (
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
            onPress={handleAddToKnown}
          >
            <Text
              variant="subheadline"
              weight="semibold"
              style={{ color: colors.systemGreen }}
            >
              Add to Known
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
          onPress={handleBlock}
        >
          <Text
            variant="subheadline"
            weight="semibold"
            style={{ color: blocked ? colors.systemBlue : colors.systemRed }}
          >
            {blocked ? 'Unblock Device' : 'Block Device'}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { letterSpacing: 0.3, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statItem: {},
  weekChart: { flexDirection: 'row', gap: 4 },
  dayColumn: { flex: 1, alignItems: 'center' },
  dayBarContainer: {
    height: 24,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
    width: '100%',
  },
  dayBar: { borderRadius: 4, width: '100%' },
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 184, 150, 0.25)',
    backgroundColor: 'rgba(201, 184, 150, 0.06)',
  },
  insightHeader: { marginBottom: 8 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
```

**Step 2: Create barrel export**

```typescript
// src/screens/fingerprint/index.ts
export { DeviceFingerprintScreen } from './DeviceFingerprintScreen';
```

**Step 3: Commit**

```bash
git add src/screens/fingerprint/ src/services/patternDetection.ts
git commit -m "feat(fingerprint): add DeviceFingerprintScreen with visit patterns and AI insight"
```

---

### Task 6: Wire Fingerprint Screen into ALL Navigation Stacks

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/stacks/HomeStack.tsx`
- Modify: `src/navigation/stacks/MoreStack.tsx`
- Modify: `src/navigation/stacks/AlertsStack.tsx`
- Modify: `src/navigation/stacks/DevicesStack.tsx`
- Modify: `src/navigation/stacks/RadarStack.tsx`
- Modify: `src/navigation/linking.ts`
- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

> **Codex finding #2:** The plan promises fingerprint access from home visitor chips, radar peek cards, and alert details. ALL stacks that could navigate to the fingerprint screen need the route registered.
> **Codex finding #7:** Replace `DeviceHistory` route with `DeviceFingerprint` in DevicesStackParamList.

**Step 1: Update navigation types**

In `src/navigation/types.ts`:

Add `DeviceFingerprint: { macAddress: string }` to ALL stack param lists that need it:
- `HomeStackParamList`
- `AlertsStackParamList`
- `DevicesStackParamList` (replace `DeviceHistory: { id: string }` with `DeviceFingerprint: { macAddress: string }`)
- `RadarStackParamList`
- `MoreStackParamList`

Also update `AddKnownDevice` (was `AddWhitelist`) to accept optional params:
```typescript
AddKnownDevice: { macAddress?: string } | undefined;
```

**Step 2: Register DeviceFingerprintScreen in ALL stacks**

In each of HomeStack, AlertsStack, DevicesStack, RadarStack, MoreStack:

```typescript
import { DeviceFingerprintScreen } from '@screens/fingerprint';

<Stack.Screen name="DeviceFingerprint" component={DeviceFingerprintScreen} />
```

In DevicesStack, remove the `DeviceHistory` screen registration (replaced by DeviceFingerprint).

**Step 3: Wire AlertDetailScreen to fingerprint**

In `src/screens/alerts/AlertDetailScreen.tsx`, replace the TODO at line 127:

```typescript
const handleMorePress = () => {
  if (alert.macAddress) {
    navigation.navigate('DeviceFingerprint', { macAddress: alert.macAddress });
  }
};
```

**Step 4: Wire radar entry point**

> **Codex finding #2 (remaining):** Registering a route in RadarStack is not the same as wiring a UI trigger. The radar "peek card" entry point is a Workstream 2 feature (FingerprintPeek component, shown when tapping a detection dot on the Replay Radar). That component does not exist yet. However, the LiveRadarScreen already shows detected devices. Add a simple navigation action there.

In `src/screens/radar/LiveRadarScreen.tsx`, find where detected devices are rendered (the RadarDisplay or detection list). Add an `onDevicePress` callback that navigates to the fingerprint:

```typescript
const handleDevicePress = (macAddress: string) => {
  navigation.navigate('DeviceFingerprint', { macAddress });
};
```

Wire this to the appropriate touch handler on detection dots or the detection list. The exact integration point depends on the RadarDisplay component's API. If RadarDisplay doesn't expose an `onDevicePress` prop, add one as a pass-through.

**Note:** The full "radar peek card" UX (FingerprintPeek floating card) is a WS2 deliverable. This task adds the basic tap-to-navigate wiring.

**Step 5: Add deep links**

In `src/navigation/linking.ts`, add `DeviceFingerprint: 'fingerprint/:macAddress'` under AlertsTab, DevicesTab, RadarTab, HomeTab, and MoreTab.

**Step 6: Commit**

```bash
git add src/navigation/ src/screens/alerts/AlertDetailScreen.tsx src/screens/radar/LiveRadarScreen.tsx
git commit -m "feat(nav): wire DeviceFingerprintScreen into all stacks with alert detail and radar entry points"
```

---

### Task 7: Wire Fingerprint into Home Screen (Visitor Chips Placeholder)

**Files:**
- Modify: `src/screens/home/PropertyCommandCenter.tsx`
- Modify: `src/hooks/usePropertyStatus.ts`

> **Autoplan decision:** Auto-suggestion banner when device seen 10+ times, shown on Home and Fingerprint screens (not push notification).

**Step 1: Add visitor navigation from home screen**

The PropertyCommandCenter already shows "Visitors Today" in the stats row. Add a "Recent Visitors" section after the stats that links to DeviceFingerprint. Use unique MACs from today's alerts:

In `src/hooks/usePropertyStatus.ts`, add `recentVisitorMacs` to the interface and computation:

```typescript
// Add to the PropertyStatus interface:
recentVisitorMacs: string[];

// In the useMemo computation, after the todayAlerts filter (which already computes uniqueMacs as a Set):
// The current code has:
//   const uniqueMacs = new Set(todayAlerts.map((a: Alert) => a.macAddress));
//   const visitorsToday = uniqueMacs.size;
// Add after those lines:
const recentVisitorMacs = Array.from(uniqueMacs).slice(0, 10);

// Add to the return object:
recentVisitorMacs,
```

The `uniqueMacs` Set already exists in the hook (computed from `todayAlerts` at the local midnight boundary). This just exposes the actual MAC strings for the visitor chips.

In `PropertyCommandCenter.tsx`, add a visitors section after the stats row that lets users tap to view fingerprints:

```tsx
{/* Recent Visitors */}
{status.recentVisitorMacs.length > 0 && (
  <View>
    <View style={styles.sectionHeader}>
      <Text variant="title3" weight="bold">Recent Visitors</Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.visitorsScroll}
    >
      {status.recentVisitorMacs.map(mac => (
        <Pressable
          key={mac}
          style={[styles.visitorChip, { backgroundColor: colors.secondarySystemBackground }]}
          onPress={() => navigation.navigate('DeviceFingerprint', { macAddress: mac })}
        >
          <View style={[styles.visitorDot, { backgroundColor: colors.systemRed }]} />
          <Text variant="caption1" weight="semibold" numberOfLines={1}>
            {mac.substring(0, 8)}...
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
)}
```

Add styles for `visitorsScroll`, `visitorChip`, `visitorDot`.

**Step 2: Commit**

```bash
git add src/screens/home/PropertyCommandCenter.tsx src/hooks/usePropertyStatus.ts
git commit -m "feat(home): add recent visitors section linking to DeviceFingerprintScreen"
```

---

### Task 8: Final Verification

**Step 1: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No new errors from WS3 changes

**Step 2: Run tests**

Run: `npm test 2>&1 | tail -20`
Expected: All tests pass (the renamed test file should work)

**Step 3: Run lint**

Run: `npm run lint 2>&1 | head -30`

**Step 4: Verify no remaining "whitelist" in UI strings**

Run: `grep -rn "whitelist\|Whitelist" src/screens/ src/components/ --include="*.tsx" | grep -v "// " | head -20`
Expected: Zero matches in screen/component files. The only acceptable remaining references are in `src/api/endpoints/knownDevices.ts` (API paths kept as `/whitelist` for backend compat) and `src/store/index.ts` (Redux Persist `whitelist` array key, which is a Redux Persist config keyword, not our domain term).

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and type errors from device fingerprints workstream"
```

---

## Summary of Deliverables

| Component | Type | Path |
|-----------|------|------|
| Known Device types | Type rename | `src/types/knownDevice.ts` |
| Known Devices API | API rename | `src/api/endpoints/knownDevices.ts` |
| useKnownDevices | Hook rename | `src/hooks/api/useKnownDevices.ts` |
| KnownDevicesScreen | Screen rename | `src/screens/settings/KnownDevicesScreen.tsx` |
| AddKnownDeviceScreen | Screen rename | `src/screens/settings/AddKnownDeviceScreen.tsx` |
| blockedDevicesSlice | Redux slice | `src/store/slices/blockedDevicesSlice.ts` |
| useBlockedDevices | Hook | `src/hooks/useBlockedDevices.ts` |
| patternDetection | Service | `src/services/patternDetection.ts` |
| DeviceFingerprintScreen | Screen | `src/screens/fingerprint/DeviceFingerprintScreen.tsx` |
| Navigation updates | Nav mod | `types.ts`, `HomeStack.tsx`, `MoreStack.tsx`, `linking.ts` |
| Visitor section on Home | Screen mod | `PropertyCommandCenter.tsx` |
| Mock data rename | Mock mod | `src/mocks/data/mockKnownDevices.ts` |

**8 tasks, ~8 commits, estimated ~2-3 sessions with Claude Code.**
