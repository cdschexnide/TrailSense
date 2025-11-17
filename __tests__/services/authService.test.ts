import { AuthService } from '@services/authService';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';

jest.mock('expo-secure-store');
jest.mock('expo-local-authentication');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedLocalAuth = LocalAuthentication as jest.Mocked<
  typeof LocalAuthentication
>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await AuthService.login('test@example.com', 'password');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        {
          email: 'test@example.com',
          password: 'password',
        }
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on login failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        AuthService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'new@example.com',
            name: 'New User',
            role: 'user',
            createdAt: '2025-01-01',
          },
          tokens: {
            accessToken: 'access_token',
            refreshToken: 'refresh_token',
            expiresIn: 900,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await AuthService.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        {
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should delete stored tokens', async () => {
      mockedSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await AuthService.logout();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        '@trailsense:tokens'
      );
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        '@trailsense:biometric'
      );
    });
  });

  describe('getTokens', () => {
    it('should return tokens from secure store', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      };

      mockedSecureStore.getItemAsync.mockResolvedValueOnce(
        JSON.stringify(mockTokens)
      );

      const result = await AuthService.getTokens();

      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(
        '@trailsense:tokens'
      );
      expect(result).toEqual(mockTokens);
    });

    it('should return null if no tokens stored', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await AuthService.getTokens();

      expect(result).toBeNull();
    });
  });

  describe('checkBiometricSupport', () => {
    it('should return true if hardware is available and enrolled', async () => {
      mockedLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockedLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await AuthService.checkBiometricSupport();

      expect(result).toBe(true);
    });

    it('should return false if hardware is not available', async () => {
      mockedLocalAuth.hasHardwareAsync.mockResolvedValueOnce(false);
      mockedLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await AuthService.checkBiometricSupport();

      expect(result).toBe(false);
    });

    it('should return false if not enrolled', async () => {
      mockedLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockedLocalAuth.isEnrolledAsync.mockResolvedValueOnce(false);

      const result = await AuthService.checkBiometricSupport();

      expect(result).toBe(false);
    });
  });

  describe('authenticateWithBiometric', () => {
    it('should return true on successful authentication', async () => {
      mockedLocalAuth.authenticateAsync.mockResolvedValueOnce({
        success: true,
      } as any);

      const result = await AuthService.authenticateWithBiometric();

      expect(result).toBe(true);
      expect(mockedLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access TrailSense',
        disableDeviceFallback: false,
      });
    });

    it('should return false on failed authentication', async () => {
      mockedLocalAuth.authenticateAsync.mockResolvedValueOnce({
        success: false,
      } as any);

      const result = await AuthService.authenticateWithBiometric();

      expect(result).toBe(false);
    });
  });
});
