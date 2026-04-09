# WebSocket Authenticated Connection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `useWebSocket` into `AuthLifecycle` so that the real mobile app establishes an authenticated WebSocket connection after login, enabling real-time `positions-updated`, `alert`, and `device-status` broadcasts in production.

**Architecture:** Extract `AuthLifecycle` into `src/components/AuthLifecycle.tsx` with two new lines: a `useAppSelector` call to read the current access token from Redux, and a `useWebSocket(token)` call to manage the socket lifecycle. Update `App.tsx` to import from the new file and remove the now-redundant `websocketService.connect('mock-token-for-testing')` calls.

**Tech Stack:** React Native / Expo, Redux Toolkit, React Query, socket.io-client, Jest + Testing Library

---

## File Map

| File                                          | Action     | Responsibility                                                                               |
| --------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `src/components/AuthLifecycle.tsx`            | **Create** | Auth lifecycle side-effects: inactivity monitoring + WebSocket connection                    |
| `src/App.tsx`                                 | **Modify** | Remove inline `AuthLifecycle`, import from new file, remove redundant mock `connect()` calls |
| `__tests__/components/AuthLifecycle.test.tsx` | **Create** | Verify `useWebSocket` is called with correct token from Redux auth state                     |

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
import authReducer, { setCredentials } from '@store/slices/authSlice';

// All mocks must be declared before imports that depend on them (Jest hoists jest.mock)
jest.mock('@hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));
jest.mock('@services/inactivityService', () => ({
  inactivityService: { start: jest.fn(), stop: jest.fn() },
}));
// authSlice imports these at module level:
jest.mock('@/config/demoMode', () => ({
  setDemoMode: jest.fn().mockResolvedValue(undefined),
  isDemoMode: jest.fn().mockReturnValue(false),
}));
jest.mock('@api/websocket', () => ({
  websocketService: { connect: jest.fn(), disconnect: jest.fn() },
}));

import { useWebSocket } from '@hooks/useWebSocket';
// AuthLifecycle is imported from its own file — NOT from App.tsx,
// which would pull in RootNavigator, AIProvider, and other heavy modules.
import { AuthLifecycle } from '../../src/components/AuthLifecycle';

const mockUseWebSocket = useWebSocket as jest.Mock;

function makeStore(accessToken: string | null) {
  // Use raw authReducer (without persistReducer wrapper) for test isolation.
  // State shape { auth: AuthState } is compatible with useAppSelector's
  // state.auth.tokens?.accessToken access.
  const store = configureStore({ reducer: { auth: authReducer } });
  if (accessToken) {
    store.dispatch(
      setCredentials({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'user',
          createdAt: '2025-01-01',
        },
        tokens: { accessToken, refreshToken: 'refresh', expiresIn: 900 },
      })
    );
  }
  return store;
}

function renderWithProviders(store: ReturnType<typeof makeStore>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

Expected: FAIL with `Cannot find module '../../src/components/AuthLifecycle'` — the file does not exist yet.

---

### Task 2: Implement the changes and make the test pass

**Files:**

- Create: `src/components/AuthLifecycle.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/AuthLifecycle.tsx`**

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

- [ ] **Step 2: Read the current `src/App.tsx`**

Open `src/App.tsx`. Locate three things:

1. The import block at the top
2. The two `websocketService.connect('mock-token-for-testing')` calls inside `initializeApp` (one in the `isDemoMode()` branch, one in the `getIsMockMode()` branch)
3. The `function AuthLifecycle()` definition near the bottom of the file

- [ ] **Step 3: Replace the App.tsx import block additions**

Add this import to the existing import block in `src/App.tsx` (the `websocketService` import that is already there can be removed since it's no longer called directly — but verify by checking if it's used elsewhere in the file first):

```tsx
import { AuthLifecycle } from '@components/AuthLifecycle';
```

Remove the existing `import { websocketService } from '@api/websocket';` line **only if** `websocketService` is not referenced anywhere else in `App.tsx` after removing the connect calls in the next step. (If the disconnect in the cleanup useEffect still references it, keep the import.)

- [ ] **Step 4: Remove the two redundant mock connect calls from `initializeApp`**

In the `isDemoMode()` branch, remove:

```tsx
websocketService.connect('mock-token-for-testing');
```

In the `getIsMockMode()` branch, remove:

```tsx
websocketService.connect('mock-token-for-testing');
```

These are no longer needed: `useWebSocket` inside `AuthLifecycle` handles connection for both real and mock mode (in mock mode, `seedMockData` populates `state.auth.tokens` with `mockAuthTokens` before the component tree renders, so `useWebSocket` receives a non-null token).

- [ ] **Step 5: Remove the inline `AuthLifecycle` function from `App.tsx`**

Delete this function from the bottom of `App.tsx`:

```tsx
function AuthLifecycle() {
  useAuth();
  return null;
}
```

The `useAuth` import at the top of App.tsx can also be removed — it is now only used inside `src/components/AuthLifecycle.tsx`.

- [ ] **Step 6: Verify `App.tsx` still renders `<AuthLifecycle />` in the JSX tree**

Confirm that the JSX in `App.tsx` still contains:

```tsx
<AuthLifecycle />
```

at the same position inside `QueryClientProvider`, inside `PersistGate`, inside `ReduxProvider`. It must remain in this position — see spec structural constraints.

- [ ] **Step 7: Run the new test to confirm it passes**

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

- [ ] **Step 8: Run the TypeScript compiler to catch any type errors**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npm run type-check
```

Expected: No new TypeScript errors. If there are errors about `useAppSelector` types (because the test store uses raw `authReducer` instead of `persistedAuthReducer`), they will appear in the test file — add `as any` cast to the `store` passed to `<Provider>` in the test's `renderWithProviders` function only if TypeScript requires it.

- [ ] **Step 9: Run the full test suite to confirm no regressions**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx jest --no-coverage
```

Expected: all previously passing tests continue to pass.

- [ ] **Step 10: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/components/AuthLifecycle.tsx src/App.tsx __tests__/components/AuthLifecycle.test.tsx
git commit -m "$(cat <<'EOF'
feat: wire useWebSocket into AuthLifecycle for real-mode socket connection

Extract AuthLifecycle to src/components/AuthLifecycle.tsx, add
useWebSocket wiring with Redux access token. Remove redundant mock
websocketService.connect calls from App.tsx initializeApp — useWebSocket
now handles connection in both real and mock mode.

Add AuthLifecycle integration test.
EOF
)"
```
