import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicApiClient } from '@api/client';
import { NAVIGATION_STATE_KEY } from '@navigation/persistence';
import type { AuthTokens, RegisterData } from '../types/auth';

const TOKEN_KEY = 'trailsense.tokens';
const BIOMETRIC_KEY = 'trailsense.biometric';

export class AuthService {
  static async login(email: string, password: string) {
    const response = await publicApiClient.post('/auth/login', {
      email,
      password,
    });
    await this.storeTokens(response.data.tokens);
    return response.data;
  }

  static async register(data: RegisterData) {
    const response = await publicApiClient.post('/auth/register', data);
    await this.storeTokens(response.data.tokens);
    return response.data;
  }

  static async logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
  }

  static async refreshToken(refreshToken: string) {
    const response = await publicApiClient.post('/auth/refresh', {
      refreshToken,
    });
    await this.storeTokens(response.data.tokens);
    return response.data.tokens;
  }

  static async storeTokens(tokens: AuthTokens) {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  }

  static async getTokens(): Promise<AuthTokens | null> {
    const tokens = await SecureStore.getItemAsync(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  }

  static async checkBiometricSupport() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  static async authenticateWithBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access TrailSense',
      disableDeviceFallback: false,
    });
    return result.success;
  }

  static async enableBiometric() {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, 'enabled');
  }

  static async isBiometricEnabled() {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    return enabled === 'enabled';
  }
}
