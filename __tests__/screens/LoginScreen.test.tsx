import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoginScreen } from '@screens/auth/LoginScreen';
import authReducer from '@store/slices/authSlice';
import { AuthService } from '@services/authService';
import { Alert } from 'react-native';

jest.mock('@services/authService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
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

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
    mockedAuthService.isBiometricEnabled.mockResolvedValue(false);
    mockedAuthService.checkBiometricSupport.mockResolvedValue(false);
  });

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should validate email field', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email')).toBeTruthy();
    });
  });

  it('should validate password field', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Password must be at least 6 characters')).toBeTruthy();
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

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

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

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

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
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should navigate to forgot password screen', () => {
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const forgotPasswordButton = getByText('Forgot Password?');
    fireEvent.press(forgotPasswordButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should prompt for biometric setup after successful login', async () => {
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
    mockedAuthService.checkBiometricSupport.mockResolvedValueOnce(true);

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Biometric Authentication?',
        expect.any(String),
        expect.any(Array)
      );
    });
  });
});
