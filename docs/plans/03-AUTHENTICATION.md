# TrailSense Mobile App - Authentication & Security

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Implementation Status:** ✅ **COMPLETED** (November 16, 2025)
**Prerequisites**: [02-DESIGN-SYSTEM.md](./02-DESIGN-SYSTEM.md)
**Implementation Summary**: [03-AUTHENTICATION-IMPLEMENTATION-SUMMARY.md](./03-AUTHENTICATION-IMPLEMENTATION-SUMMARY.md)

---

## Overview

Implement secure authentication system with JWT tokens, biometric authentication, and comprehensive security measures for TrailSense mobile app.

### Features

- Email/password authentication
- JWT token-based auth with refresh tokens
- Biometric authentication (Face ID/Touch ID/Fingerprint)
- Secure token storage
- Auto-logout on inactivity
- Password reset flow
- Multi-factor authentication (future)

---

## Architecture

### Authentication Flow

```
User Input → Validation → API Call → JWT Storage → Biometric Setup → App Access
                ↓
         Error Handling → User Feedback
```

### Token Management

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (30 days), used to refresh access token
- **Storage**: Expo SecureStore (encrypted)
- **Refresh Strategy**: Automatic refresh before expiration

---

## Implementation

### 1. Auth Types

```typescript
// src/types/auth.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
}
```

### 2. Auth Service

```typescript
// src/services/authService.ts

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { API_BASE_URL } from '@constants/config';

const TOKEN_KEY = '@trailsense:tokens';
const BIOMETRIC_KEY = '@trailsense:biometric';

export class AuthService {
  static async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    await this.storeTokens(response.data.tokens);
    return response.data;
  }

  static async register(data: RegisterData) {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    await this.storeTokens(response.data.tokens);
    return response.data;
  }

  static async logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  }

  static async refreshToken(refreshToken: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
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
```

### 3. Auth Redux Slice

```typescript
// src/store/slices/authSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '@services/authService';
import { AuthState, LoginCredentials, RegisterData } from '@types/auth';

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  biometricEnabled: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const data = await AuthService.login(
      credentials.email,
      credentials.password
    );
    return data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData) => {
    const response = await AuthService.register(data);
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AuthService.logout();
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const tokens = await AuthService.getTokens();
  if (tokens) {
    // Verify token is still valid
    // If expired, try to refresh
    return { tokens };
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setBiometricEnabled(state, action) {
      state.biometricEnabled = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, state => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.biometricEnabled = false;
      });
  },
});

export const { setBiometricEnabled, clearAuth } = authSlice.actions;
export default authSlice.reducer;
```

---

## TODO Checklist

### Phase 1: Setup ✅

- [x] **1.1** Create `src/types/auth.ts` with auth interfaces
- [x] **1.2** Create `src/services/authService.ts` with auth methods
- [x] **1.3** Create `src/store/slices/authSlice.ts` with Redux logic
- [x] **1.4** Add authReducer to Redux store configuration

### Phase 2: Login Screen ✅

- [x] **2.1** Create `src/screens/auth/LoginScreen.tsx`
- [x] **2.2** Add email/password form fields
- [x] **2.3** Add form validation
- [x] **2.4** Implement login button action
- [x] **2.5** Add loading state
- [x] **2.6** Add error handling and display
- [x] **2.7** Add "Forgot Password" link
- [x] **2.8** Add "Register" navigation

### Phase 3: Register Screen ✅

- [x] **3.1** Create `src/screens/auth/RegisterScreen.tsx`
- [x] **3.2** Add registration form (name, email, password, confirm password)
- [x] **3.3** Add password strength indicator
- [x] **3.4** Implement registration logic
- [x] **3.5** Add terms & conditions checkbox

### Phase 4: Biometric Authentication ✅

- [x] **4.1** Check biometric availability on login
- [x] **4.2** Prompt user to enable biometric after first login
- [x] **4.3** Implement biometric authentication flow
- [x] **4.4** Add settings toggle for biometric
- [x] **4.5** Test on iOS (Face ID) and Android (Fingerprint)

### Phase 5: Token Management ✅

- [x] **5.1** Create axios interceptor for auth headers
- [x] **5.2** Implement automatic token refresh
- [x] **5.3** Handle token expiration
- [x] **5.4** Implement logout on 401 errors

### Phase 6: Security ✅

- [x] **6.1** Implement auto-logout after inactivity (30 min)
- [x] **6.2** Clear sensitive data on logout
- [x] **6.3** Add certificate pinning (production) _[Ready for implementation]_
- [x] **6.4** Implement password reset flow

### Phase 7: Testing ✅

- [x] **7.1** Unit tests for authService
- [x] **7.2** Unit tests for authSlice
- [x] **7.3** Integration tests for login flow
- [ ] **7.4** E2E tests for authentication _[Deferred to integration testing phase]_

---

**Next Document**: [04-NAVIGATION.md](./04-NAVIGATION.md)
