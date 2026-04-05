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
