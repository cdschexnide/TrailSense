import { AuthService } from '@services/authService';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/authService', () => ({
  AuthService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getTokens: jest.fn(),
  },
}));
jest.mock('@/config/demoMode', () => ({
  setDemoMode: jest.fn().mockResolvedValue(undefined),
  isDemoMode: jest.fn().mockReturnValue(false),
}));
jest.mock('@api/websocket', () => ({
  websocketService: {
    disconnect: jest.fn(),
  },
}));

const {
  default: authReducer,
  login,
  register,
  logout,
  checkAuth,
  setBiometricEnabled,
  clearAuth,
  setCredentials,
} = require('@store/slices/authSlice');

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('reducers', () => {
    it('should handle setBiometricEnabled', () => {
      store.dispatch(setBiometricEnabled(true));

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(true);
    });

    it('should handle clearAuth', () => {
      store.dispatch(clearAuth());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle setCredentials', () => {
      const payload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: '2025-01-01',
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          expiresIn: 900,
        },
      };

      store.dispatch(setCredentials(payload));

      const state = store.getState().auth;
      expect(state.user).toEqual(payload.user);
      expect(state.tokens).toEqual(payload.tokens);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('login thunk', () => {
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

      await store.dispatch(
        login({ email: 'test@example.com', password: 'password' })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockData.user);
      expect(state.tokens).toEqual(mockData.tokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      mockedAuthService.login.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await store.dispatch(
        login({ email: 'test@example.com', password: 'wrong' })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during login', () => {
      mockedAuthService.login.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  user: {} as any,
                  tokens: {} as any,
                }),
              100
            )
          )
      );

      store.dispatch(
        login({ email: 'test@example.com', password: 'password' })
      );

      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
    });
  });

  describe('register thunk', () => {
    it('should handle successful registration', async () => {
      const mockData = {
        user: {
          id: '1',
          email: 'new@example.com',
          name: 'New User',
          role: 'user' as const,
          createdAt: '2025-01-01',
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          expiresIn: 900,
        },
      };

      mockedAuthService.register.mockResolvedValueOnce(mockData);

      await store.dispatch(
        register({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockData.user);
      expect(state.tokens).toEqual(mockData.tokens);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout thunk', () => {
    it('should clear auth state on logout', async () => {
      mockedAuthService.logout.mockResolvedValueOnce(undefined);

      // First login
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
      await store.dispatch(
        login({ email: 'test@example.com', password: 'password' })
      );

      // Then logout
      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.biometricEnabled).toBe(false);
    });
  });

  describe('checkAuth thunk', () => {
    it('should return tokens if available', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      };

      mockedAuthService.getTokens.mockResolvedValueOnce(mockTokens);

      const result = await store.dispatch(checkAuth());

      expect(result.payload).toEqual({ tokens: mockTokens });
    });

    it('should return null if no tokens available', async () => {
      mockedAuthService.getTokens.mockResolvedValueOnce(null);

      const result = await store.dispatch(checkAuth());

      expect(result.payload).toBeNull();
    });
  });
});
