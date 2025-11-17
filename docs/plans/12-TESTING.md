# TrailSense Mobile App - Testing Strategy

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [11-DATA-PERSISTENCE.md](./11-DATA-PERSISTENCE.md)

---

## Testing Pyramid

```
         E2E Tests (10%)
       ──────────────────
      Integration Tests (20%)
    ────────────────────────
   Unit Tests (70%)
  ────────────────────────────
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Happy paths + edge cases

---

## Unit Testing (Jest + Testing Library)

### Test Setup

```typescript
// jest.config.js (already created in setup)

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/setup.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

```typescript
// __tests__/setup.ts

import '@testing-library/jest-native/extend-expect';
import { server } from './mocks/server';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Firebase
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  }),
}));

// Start MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Tests

```typescript
// src/components/atoms/Button/__tests__/Button.test.tsx

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Press Me" onPress={jest.fn()} />);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPress} />);

    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPress} loading />
    );

    fireEvent.press(getByText('Press Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies correct styles for variant', () => {
    const { getByTestId } = render(
      <Button title="Test" onPress={jest.fn()} variant="primary" testID="button" />
    );

    const button = getByTestId('button');
    expect(button).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('is accessible', () => {
    const { getByRole } = render(<Button title="Test" onPress={jest.fn()} />);

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });
});
```

### Hook Tests

```typescript
// src/hooks/__tests__/useAlerts.test.ts

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAlerts } from '../useAlerts';
import { server } from '../../__tests__/mocks/server';
import { rest } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAlerts Hook', () => {
  it('fetches alerts successfully', async () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0]).toHaveProperty('id');
    expect(result.current.data[0]).toHaveProperty('threatLevel');
  });

  it('handles error state', async () => {
    server.use(
      rest.get('*/alerts', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
```

### Redux Tests

```typescript
// src/store/slices/__tests__/authSlice.test.ts

import authReducer, { login, logout } from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
  };

  it('handles login.pending', () => {
    const state = authReducer(initialState, login.pending);
    expect(state.isLoading).toBe(true);
  });

  it('handles login.fulfilled', () => {
    const payload = {
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      tokens: { accessToken: 'token', refreshToken: 'refresh' },
    };

    const state = authReducer(initialState, {
      type: login.fulfilled.type,
      payload,
    });

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(payload.user);
    expect(state.isLoading).toBe(false);
  });

  it('handles logout', () => {
    const authenticatedState = {
      ...initialState,
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
    };

    const state = authReducer(authenticatedState, logout.fulfilled);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
```

---

## Integration Testing

```typescript
// __tests__/integration/login-flow.test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@store';
import { LoginScreen } from '@screens/auth/LoginScreen';

const queryClient = new QueryClient();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>{component}</NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Login Flow Integration', () => {
  it('completes full login flow', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Submit login
    fireEvent.press(getByText('Login'));

    // Wait for success
    await waitFor(() => {
      // Verify navigation to main app or check auth state
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });

  it('displays error on invalid credentials', async () => {
    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
      <LoginScreen />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Login'));

    const errorMessage = await findByText(/invalid credentials/i);
    expect(errorMessage).toBeTruthy();
  });
});
```

---

## E2E Testing (Detox)

### Detox Configuration

```json
// .detoxrc.json

{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/TrailSense.app",
      "build": "xcodebuild -workspace ios/TrailSense.xcworkspace -scheme TrailSense -configuration Release -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 14 Pro"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_6_API_33"
      }
    }
  }
}
```

### E2E Tests

```typescript
// e2e/auth.e2e.ts

describe('Authentication E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('main-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to alerts after login', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('alerts-tab'))).toBeVisible();
    await element(by.id('alerts-tab')).tap();

    await expect(element(by.id('alert-list'))).toBeVisible();
  });
});

// e2e/alerts.e2e.ts

describe('Alerts E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Auto-login helper
    await loginHelper();
  });

  it('should display alert list', async () => {
    await element(by.id('alerts-tab')).tap();
    await expect(element(by.id('alert-list'))).toBeVisible();
  });

  it('should open alert detail on tap', async () => {
    await element(by.id('alerts-tab')).tap();
    await element(by.id('alert-card-0')).tap();
    await expect(element(by.id('alert-detail-screen'))).toBeVisible();
  });

  it('should mark alert as reviewed', async () => {
    await element(by.id('alerts-tab')).tap();
    await element(by.id('alert-card-0')).tap();
    await element(by.id('dismiss-button')).tap();

    // Verify alert updated
    await expect(element(by.id('reviewed-badge'))).toBeVisible();
  });
});
```

---

## API Mocking (MSW)

```typescript
// __tests__/mocks/handlers.ts

import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('*/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    );
  }),

  // Alerts endpoints
  rest.get('*/alerts', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          deviceId: 'device-1',
          timestamp: '2025-11-16T10:00:00Z',
          detectionType: 'cellular',
          threatLevel: 'high',
          rssi: -55,
          macAddress: 'AA:BB:CC:DD:EE:FF',
        },
      ])
    );
  }),

  // Devices endpoints
  rest.get('*/devices', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'device-1',
          name: 'Front Gate',
          online: true,
          battery: 85,
          location: { latitude: 37.7749, longitude: -122.4194 },
        },
      ])
    );
  }),
];
```

```typescript
// __tests__/mocks/server.ts

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## TODO Checklist

### Unit Testing Setup

- [ ] **1.1** Configure Jest
- [ ] **1.2** Setup Testing Library
- [ ] **1.3** Create test setup file
- [ ] **1.4** Configure MSW for API mocking
- [ ] **1.5** Add test scripts to package.json

### Component Tests

- [ ] **2.1** Test all atom components
- [ ] **2.2** Test all molecule components
- [ ] **2.3** Test all organism components
- [ ] **2.4** Test accessibility
- [ ] **2.5** Add snapshot tests

### Hook Tests

- [ ] **3.1** Test useAlerts hook
- [ ] **3.2** Test useDevices hook
- [ ] **3.3** Test useAuth hook
- [ ] **3.4** Test useTheme hook

### Redux Tests

- [ ] **4.1** Test authSlice
- [ ] **4.2** Test userSlice
- [ ] **4.3** Test settingsSlice
- [ ] **4.4** Test Redux thunks

### Integration Tests

- [ ] **5.1** Test login flow
- [ ] **5.2** Test alert management flow
- [ ] **5.3** Test device management flow
- [ ] **5.4** Test offline scenarios

### E2E Setup

- [ ] **6.1** Install Detox
- [ ] **6.2** Configure Detox for iOS
- [ ] **6.3** Configure Detox for Android
- [ ] **6.4** Create test helpers

### E2E Tests

- [ ] **7.1** Test authentication flow
- [ ] **7.2** Test alert viewing
- [ ] **7.3** Test device management
- [ ] **7.4** Test critical user journeys

### Coverage

- [ ] **8.1** Achieve 80%+ unit test coverage
- [ ] **8.2** Generate coverage reports
- [ ] **8.3** Add coverage to CI/CD

---

**Next Document**: [13-DEPLOYMENT.md](./13-DEPLOYMENT.md)
