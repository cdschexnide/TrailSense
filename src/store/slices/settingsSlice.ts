import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  radarUpdateInterval: number; // in seconds
  alertSeverityFilter: string[];
  mapStyle: 'standard' | 'satellite' | 'terrain';
  distanceUnit: 'miles' | 'kilometers';
  temperatureUnit: 'fahrenheit' | 'celsius';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

interface SettingsState {
  settings: AppSettings;
}

const initialState: SettingsState = {
  settings: {
    theme: 'auto',
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    radarUpdateInterval: 60,
    alertSeverityFilter: [],
    mapStyle: 'standard',
    distanceUnit: 'miles',
    temperatureUnit: 'fahrenheit',
    autoRefresh: true,
    refreshInterval: 300,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.settings.theme = action.payload;
    },
    toggleNotifications: state => {
      state.settings.notificationsEnabled =
        !state.settings.notificationsEnabled;
    },
    toggleSound: state => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
    },
    toggleVibration: state => {
      state.settings.vibrationEnabled = !state.settings.vibrationEnabled;
    },
    setRadarUpdateInterval: (state, action: PayloadAction<number>) => {
      state.settings.radarUpdateInterval = action.payload;
    },
    setAlertSeverityFilter: (state, action: PayloadAction<string[]>) => {
      state.settings.alertSeverityFilter = action.payload;
    },
    setMapStyle: (
      state,
      action: PayloadAction<'standard' | 'satellite' | 'terrain'>
    ) => {
      state.settings.mapStyle = action.payload;
    },
    setDistanceUnit: (state, action: PayloadAction<'miles' | 'kilometers'>) => {
      state.settings.distanceUnit = action.payload;
    },
    setTemperatureUnit: (
      state,
      action: PayloadAction<'fahrenheit' | 'celsius'>
    ) => {
      state.settings.temperatureUnit = action.payload;
    },
    toggleAutoRefresh: state => {
      state.settings.autoRefresh = !state.settings.autoRefresh;
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.settings.refreshInterval = action.payload;
    },
    resetSettings: state => {
      state.settings = initialState.settings;
    },
  },
});

export const {
  updateSettings,
  setTheme,
  toggleNotifications,
  toggleSound,
  toggleVibration,
  setRadarUpdateInterval,
  setAlertSeverityFilter,
  setMapStyle,
  setDistanceUnit,
  setTemperatureUnit,
  toggleAutoRefresh,
  setRefreshInterval,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
