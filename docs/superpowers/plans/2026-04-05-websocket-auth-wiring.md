# WebSocket Authenticated Connection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `useWebSocket` into `AuthLifecycle` so that the real mobile app establishes an authenticated WebSocket connection after login, enabling real-time `positions-updated`, `alert`, and `device-status` broadcasts in production.

**Architecture:** Export `AuthLifecycle` from `App.tsx` as a named export so it can be tested in isolation, then add two lines inside it: a `useAppSelector` call to read the current access token from Redux, and a `useWebSocket(token)` call to manage the socket lifecycle. No new files, no backend changes.

**Tech Stack:** React Native / Expo, Redux Toolkit, React Query, socket.io-client, Jest + Testing Library

---

### Task 1: Write and run the failing test

**Files:**
- Create: `__tests__/components/AuthLifecycle.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@store/slices/authSlice';

// Mock modules with side-effects before importing the component under test
jest.mock('@hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));
jest.mock('@services/inactivityService', () => ({
  inactivityService: { start: jest.fn(), stop: jest.fn() },
}));
jest.mock('@/config/demoMode', () => ({
  setDemoMode: jest.fn().mockResolvedValue(undefined),
  isDemoMode: jest.fn().mockReturnValue(false),
}));
jest.mock('@api/websocket', () => ({
  websocketService: { connect: jest.fn(), disconnect: jest.fn() },
}));

import { useWebSocket } from '@hooks/useWebSocket';
import { AuthLifecycle } from '../../src/App';
import { setCredentials } from '@store/slices/authSlice';

const mockUseWebSocket = useWebSocket as jest.Mock;

function makeStore(accessToken: string | null) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (accessToken) {
    store.dispatch(setCredentials({
      user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '2025-01-01' },
      tokens: { accessToken, refreshToken: 'refresh', expiresIn: 900 },
    }));
  }
  return store;
}

function renderWithProviders(store: ReturnType<typeof makeStore>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthLifecycle />
      </QueryClientProvider>
    </Provider>
  );
}

describe('AuthLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls useWebSocket with null when not authenticated', () => {
    const store = makeStore(null);
    renderWithProviders(store);
    expect(mockUseWebSocket).toHaveBeenCalledWith(null);
  });

  it('calls useWebSocket with the access token when authenticated', () => {
    const store = makeStore('real-access-token');
    renderWithProviders(store);
    expect(mockUseWebSocket).toHaveBeenCalledWith('real-access-token');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx jest __tests__/components/AuthLifecycle.test.tsx --no-coverage
```

Expected: FAIL — `AuthLifecycle` is not exported from `src/App.tsx`, so the import will throw.

---

### Task 2: Implement the wiring and make the test pass

**Files:**
- Modify: `TrailSense/src/App.tsx`

- [ ] **Step 1: Read the current `App.tsx`**

Open `src/App.tsx` and locate:
1. The import block at the top of the file
2. The `AuthLifecycle` function near the bottom

- [ ] **Step 2: Add the two new imports**

In `src/App.tsx`, add these two imports to the existing import block (after the existing `useAuth` import line):

```tsx
import { useAppSelector } from '@store/index';
import { useWebSocket } from '@hooks/useWebSocket';
```

- [ ] **Step 3: Export `AuthLifecycle` and wire the hook**

Change the `AuthLifecycle` function from:

```tsx
function AuthLifecycle() {
  useAuth();
  return null;
}
```

To:

```tsx
export function AuthLifecycle() {
  useAuth();
  const token = useAppSelector(state => state.auth.tokens?.accessToken ?? null);
  useWebSocket(token);
  return null;
}
```

- [ ] **Step 4: Run the new test to confirm it passes**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx jest __tests__/components/AuthLifecycle.test.tsx --no-coverage
```

Expected output:
```
PASS __tests__/components/AuthLifecycle.test.tsx
  AuthLifecycle
    ✓ calls useWebSocket with null when not authenticated
    ✓ calls useWebSocket with the access token when authenticated
```

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx jest --no-coverage
```

Expected: all previously passing tests continue to pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/App.tsx __tests__/components/AuthLifecycle.test.tsx
git commit -m "feat: wire useWebSocket into AuthLifecycle for real-mode socket connection"
```
