import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import blockedDevicesReducer from './slices/blockedDevicesSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedSettingsReducer = persistReducer(
  settingsPersistConfig,
  settingsReducer
);
const blockedDevicesPersistConfig = {
  key: 'blockedDevices',
  storage: AsyncStorage,
};
const persistedBlockedDevicesReducer = persistReducer(
  blockedDevicesPersistConfig,
  blockedDevicesReducer
);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    settings: persistedSettingsReducer,
    ui: uiReducer,
    blockedDevices: persistedBlockedDevicesReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
