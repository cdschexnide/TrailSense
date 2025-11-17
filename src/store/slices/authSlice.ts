import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '@services/authService';
import type {
  AuthState,
  LoginCredentials,
  RegisterData,
} from '../../types/auth';

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
