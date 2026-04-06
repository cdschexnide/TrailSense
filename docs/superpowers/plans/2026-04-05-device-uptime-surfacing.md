# Device Uptime Surfacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface real device uptime and last-reboot data from backend heartbeats in the mobile app, replacing the hardcoded placeholder.

**Architecture:** Add `uptimeSeconds` and `lastBootAt` to the `Device` type, add a `formatUptime` formatter in `DeviceDetailScreen`, update the Status and History tabs to render real data, and update mock data to include uptime values.

**Tech Stack:** TypeScript, React Native, React Query (cache flows automatically via existing WebSocket spread merge)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/device.ts` | Modify | Add `uptimeSeconds` and `lastBootAt` fields |
| `src/screens/devices/DeviceDetailScreen.tsx` | Modify | Add `formatUptime`, update Status tab row, add History tab row |
| `src/mocks/data/mockDevices.ts` | Modify | Add uptime values to online mock devices |
| `src/mocks/mockWebSocket.ts` | Modify | Include `uptimeSeconds` in mock status emissions |
| `__tests__/screens/devices/DeviceDetailScreen.test.tsx` | Create | Test `formatUptime` and uptime rendering |

---

### Task 1: Add fields to Device type

**Files:**
- Modify: `src/types/device.ts:1-16`

- [ ] **Step 1: Add `uptimeSeconds` and `lastBootAt` to the Device interface**

In `src/types/device.ts`, add the two new optional fields after `firmwareVersion`:

```typescript
export interface Device {
  id: string;
  name: string;
  online: boolean;
  batteryPercent?: number;
  battery?: number; // Legacy field
  signalStrength?: string;
  alertCount?: number;
  latitude?: number; // GPS latitude from device (null if no fix yet)
  longitude?: number; // GPS longitude from device (null if no fix yet)
  lastSeen?: string;
  firmwareVersion?: string;
  firmware?: string; // Legacy field
  uptimeSeconds?: number; // Seconds since last boot, from heartbeat
  lastBootAt?: string; // ISO 8601 timestamp of last boot
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Run type-check to verify no regressions**

Run: `npm run type-check`
Expected: PASS (fields are optional, no existing code breaks)

- [ ] **Step 3: Commit**

```bash
git add src/types/device.ts
git commit -m "feat: add uptimeSeconds and lastBootAt to Device type"
```

---

### Task 2: Add formatUptime and update DeviceDetailScreen

**Files:**
- Modify: `src/screens/devices/DeviceDetailScreen.tsx:63-81` (add formatter after existing `formatRelativeTime`)
- Modify: `src/screens/devices/DeviceDetailScreen.tsx:165-170` (Status tab Uptime row)
- Modify: `src/screens/devices/DeviceDetailScreen.tsx:301-320` (History tab Detection Summary section)
- Create: `__tests__/screens/devices/DeviceDetailScreen.test.tsx`

- [ ] **Step 1: Write failing tests for formatUptime**

Create `__tests__/screens/devices/DeviceDetailScreen.test.tsx`:

```typescript
/**
 * We test formatUptime as an exported helper. To keep DeviceDetailScreen
 * focused, we extract it just enough to test — the function is defined
 * in the screen file and re-exported for testing.
 */
import { formatUptime } from '@screens/devices/DeviceDetailScreen';

describe('formatUptime', () => {
  it('returns "< 1m" for seconds under 60', () => {
    expect(formatUptime(0)).toBe('< 1m');
    expect(formatUptime(59)).toBe('< 1m');
  });

  it('returns "Xm Ys" for seconds between 60 and 3599', () => {
    expect(formatUptime(60)).toBe('1m 0s');
    expect(formatUptime(754)).toBe('12m 34s');
    expect(formatUptime(3599)).toBe('59m 59s');
  });

  it('returns "Xh Ym" for seconds between 3600 and 86399', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
    expect(formatUptime(9240)).toBe('2h 34m');
    expect(formatUptime(86399)).toBe('23h 59m');
  });

  it('returns "Xd Yh" for seconds >= 86400', () => {
    expect(formatUptime(86400)).toBe('1d 0h');
    expect(formatUptime(131400)).toBe('1d 12h');
    expect(formatUptime(604800)).toBe('7d 0h');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/screens/devices/DeviceDetailScreen.test.tsx --no-coverage`
Expected: FAIL — `formatUptime` is not exported from `DeviceDetailScreen`

- [ ] **Step 3: Add formatUptime to DeviceDetailScreen and export it**

In `src/screens/devices/DeviceDetailScreen.tsx`, add the `formatUptime` function after the existing `formatRelativeTime` function (after line 81):

```typescript
// Format uptime seconds into compact two-unit string
export const formatUptime = (seconds: number): string => {
  if (seconds < 60) return '< 1m';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${secs}s`;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/screens/devices/DeviceDetailScreen.test.tsx --no-coverage`
Expected: PASS — all 4 test cases green

- [ ] **Step 5: Update the Status tab Uptime row**

In `src/screens/devices/DeviceDetailScreen.tsx`, replace the Uptime row (lines 165-170):

Replace:
```typescript
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemOrange}
          title="Uptime"
          value={(device as any).uptime || '24h 32m'}
        />
```

With:
```typescript
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemOrange}
          title="Uptime"
          value={
            device.uptimeSeconds != null
              ? formatUptime(device.uptimeSeconds)
              : '--'
          }
        />
```

- [ ] **Step 6: Add Last Reboot row to History tab**

In `src/screens/devices/DeviceDetailScreen.tsx`, in the `renderHistoryTab` function, add a new `GroupedListRow` after the "This Week" row (after line 319) and before the closing `</GroupedListSection>`:

```typescript
          <GroupedListRow
            icon="refresh-outline"
            iconColor={colors.systemOrange}
            title="Last Reboot"
            value={
              device.lastBootAt
                ? formatRelativeTime(device.lastBootAt)
                : '--'
            }
          />
```

The Detection Summary section should now look like:

```typescript
        <GroupedListSection title="Detection Summary">
          <GroupedListRow
            icon="pulse-outline"
            iconColor={colors.systemTeal}
            title="Total Detections"
            value={String(alertCount)}
          />
          <GroupedListRow
            icon="today-outline"
            iconColor={colors.systemBlue}
            title="Today"
            value={String(todayDetections)}
          />
          <GroupedListRow
            icon="calendar-outline"
            iconColor={colors.systemPurple}
            title="This Week"
            value={String(weekDetections)}
          />
          <GroupedListRow
            icon="refresh-outline"
            iconColor={colors.systemOrange}
            title="Last Reboot"
            value={
              device.lastBootAt
                ? formatRelativeTime(device.lastBootAt)
                : '--'
            }
          />
        </GroupedListSection>
```

- [ ] **Step 7: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Run tests**

Run: `npx jest __tests__/screens/devices/DeviceDetailScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx __tests__/screens/devices/DeviceDetailScreen.test.tsx
git commit -m "feat: replace placeholder uptime with real formatted data and add Last Reboot row"
```

---

### Task 3: Update mock data

**Files:**
- Modify: `src/mocks/data/mockDevices.ts:5-76`
- Modify: `src/mocks/mockWebSocket.ts:198-220`

- [ ] **Step 1: Add uptimeSeconds and lastBootAt to online mock devices**

In `src/mocks/data/mockDevices.ts`, add uptime fields to the three online devices. Offline devices (device-004, device-005) get no uptime fields.

Device `device-001` (North Gate Sensor, online):
```typescript
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    alertCount: 142,
    latitude: 30.396526,
    longitude: -94.317806,
    lastSeen: '2025-12-16T09:45:00Z',
    firmwareVersion: 'v2.1.3',
    uptimeSeconds: 88200, // ~1d 0h 30m
    lastBootAt: '2025-12-15T09:15:00Z',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-12-16T09:45:00Z',
  },
```

Device `device-002` (South Boundary, online):
```typescript
  {
    id: 'device-002',
    name: 'South Boundary',
    online: true,
    batteryPercent: 92,
    signalStrength: 'good',
    alertCount: 87,
    latitude: 30.3943,
    longitude: -94.3191,
    lastSeen: '2025-12-16T09:47:00Z',
    firmwareVersion: 'v2.1.3',
    uptimeSeconds: 259200, // ~3d 0h
    lastBootAt: '2025-12-13T09:47:00Z',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-12-16T09:47:00Z',
  },
```

Device `device-003` (East Trail Monitor, online):
```typescript
  {
    id: 'device-003',
    name: 'East Trail Monitor',
    online: true,
    batteryPercent: 65,
    signalStrength: 'fair',
    alertCount: 213,
    latitude: 30.397,
    longitude: -94.3155,
    lastSeen: '2025-12-16T09:44:00Z',
    firmwareVersion: 'v2.1.2',
    uptimeSeconds: 43500, // ~12h 5m
    lastBootAt: '2025-12-15T21:39:00Z',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-12-16T09:44:00Z',
  },
```

Devices `device-004` and `device-005` remain unchanged (offline, no uptime data).

- [ ] **Step 2: Update generateMockDeviceStatus to include uptimeSeconds**

In `src/mocks/mockWebSocket.ts`, update the `generateMockDeviceStatus` method. Replace the `statusUpdate` object (lines 209-214):

Replace:
```typescript
    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5, // Go offline if battery too low
    };
```

With:
```typescript
    const uptimeSeconds =
      device.uptimeSeconds != null
        ? device.uptimeSeconds + Math.floor(Math.random() * 300) + 60
        : undefined;

    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5, // Go offline if battery too low
      ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
    };
```

This gives online devices (which have `uptimeSeconds` in mock data) a slowly incrementing uptime value each status tick. Offline devices (no `uptimeSeconds`) emit no uptime field.

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `npm test -- --no-coverage`
Expected: PASS (no regressions)

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/mockDevices.ts src/mocks/mockWebSocket.ts
git commit -m "feat: add uptime data to mock devices and WebSocket status emissions"
```

---

### Task 4: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass with no regressions

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint:fix`
Expected: No errors (auto-fix any formatting issues)

- [ ] **Step 4: Start the app and verify visually**

Run: `npm start`
Open the app in the iOS simulator. Navigate to Devices > tap any online device:
- **Status tab:** Uptime row should show formatted value like `1d 0h` (not `24h 32m`)
- **History tab:** "Last Reboot" row should appear in Detection Summary showing relative time like `1d ago`
- Tap an offline device: both should show `--`
