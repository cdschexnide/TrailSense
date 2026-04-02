import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginScreen } from '@screens/auth/LoginScreen';
import authReducer from '@store/slices/authSlice';
import { AuthService } from '@services/authService';
import { Alert } from 'react-native';
import { ThemeProvider } from '@theme/index';

jest.mock('@services/authService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));
jest.mock('@/config/demoMode', () => ({
  setDemoMode: jest.fn().mockResolvedValue(undefined),
  isDemoMode: jest.fn().mockReturnValue(false),
}));
jest.mock('@/config/featureFlags', () => ({
  featureFlagsManager: {
    updateFlags: jest.fn(),
  },
}));
jest.mock('@/utils/seedMockData', () => ({
  seedMockData: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@api/websocket', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));
jest.mock('@/config/demoModeRuntime', () => ({
  applyDemoModeConfig: jest.fn(),
  revertDemoModeConfig: jest.fn(),
}));

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

const mockNavigation = {
  navigate: jest.fn(),
};

describe('LoginScreen', () => {
  let store: ReturnType<typeof createMockStore>;
  let queryClient: QueryClient;

  const renderLoginScreen = (
    storeOverride: ReturnType<typeof createMockStore> = store
  ) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Provider store={storeOverride}>
            <LoginScreen navigation={mockNavigation} />
          </Provider>
        </ThemeProvider>
      </QueryClientProvider>
    );

  beforeEach(() => {
    store = createMockStore();
    queryClient = new QueryClient();
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should validate empty email field', async () => {
    const { getByText } = renderLoginScreen();
    const signInButton = getByText('Sign In');

    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Required',
        'Please enter your email address'
      );
    });
  });

  it('should validate empty password field', async () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    const emailInput = getByPlaceholderText('Enter your email');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Password Required',
        'Please enter your password'
      );
    });
  });

  it('should handle successful login', async () => {
    const mockData = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: '2025-01-01',
      },
      tokens: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      },
    };

    mockedAuthService.login.mockResolvedValueOnce(mockData);

    const { getByPlaceholderText, getByText } = renderLoginScreen();

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });
  });

  it('should handle login failure', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    const { getByPlaceholderText, getByText } = renderLoginScreen();

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        expect.any(String)
      );
    });
  });

  it('should navigate to register screen', () => {
    const { getByText } = renderLoginScreen();

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should handle forgot password', async () => {
    const { getByText } = renderLoginScreen();

    const forgotPasswordButton = getByText('Forgot?');
    fireEvent.press(forgotPasswordButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  it('should render and handle Explore Demo button', async () => {
    const { seedMockData } = jest.requireMock('@/utils/seedMockData');
    const { setDemoMode } = jest.requireMock('@/config/demoMode');
    const { featureFlagsManager } = jest.requireMock('@/config/featureFlags');
    const { websocketService } = jest.requireMock('@api/websocket');
    const { applyDemoModeConfig } = jest.requireMock(
      '@/config/demoModeRuntime'
    );

    const { getByText } = renderLoginScreen();

    const demoButton = getByText('Explore Demo');
    expect(demoButton).toBeTruthy();

    fireEvent.press(demoButton);

    await waitFor(() => {
      expect(setDemoMode).toHaveBeenCalledWith(true);
      expect(featureFlagsManager.updateFlags).toHaveBeenCalledWith({
        DEMO_MODE: true,
      });
      expect(applyDemoModeConfig).toHaveBeenCalledWith(queryClient);
      expect(seedMockData).toHaveBeenCalled();
      expect(websocketService.connect).toHaveBeenCalledWith(
        'mock-token-for-testing'
      );
    });
  });
});
