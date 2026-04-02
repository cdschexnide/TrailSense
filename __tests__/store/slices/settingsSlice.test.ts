import reducer, {
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
} from '@store/slices/settingsSlice';

describe('settingsSlice', () => {
  const initialState = {
    settings: {
      theme: 'auto' as const,
      notificationsEnabled: true,
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      notifyCritical: true,
      notifyHigh: true,
      notifyMedium: true,
      notifyLow: false,
      notifyDeviceOffline: true,
      notifyLowBattery: true,
      radarUpdateInterval: 60,
      alertSeverityFilter: [],
      mapStyle: 'standard' as const,
      distanceUnit: 'miles' as const,
      temperatureUnit: 'fahrenheit' as const,
      autoRefresh: true,
      refreshInterval: 300,
      sensitivity: 'medium' as const,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      vacationMode: false,
    },
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle updateSettings', () => {
    const updates = { theme: 'dark' as const, soundEnabled: false };
    const actual = reducer(initialState, updateSettings(updates));
    expect(actual.settings.theme).toBe('dark');
    expect(actual.settings.soundEnabled).toBe(false);
    expect(actual.settings.notificationsEnabled).toBe(true);
  });

  it('should handle setTheme', () => {
    const actual = reducer(initialState, setTheme('dark'));
    expect(actual.settings.theme).toBe('dark');
  });

  it('should handle toggleNotifications', () => {
    const actual = reducer(initialState, toggleNotifications());
    expect(actual.settings.notificationsEnabled).toBe(false);
  });

  it('should handle toggleSound', () => {
    const actual = reducer(initialState, toggleSound());
    expect(actual.settings.soundEnabled).toBe(false);
  });

  it('should handle toggleVibration', () => {
    const actual = reducer(initialState, toggleVibration());
    expect(actual.settings.vibrationEnabled).toBe(false);
  });

  it('should handle setRadarUpdateInterval', () => {
    const actual = reducer(initialState, setRadarUpdateInterval(120));
    expect(actual.settings.radarUpdateInterval).toBe(120);
  });

  it('should handle setAlertSeverityFilter', () => {
    const filters = ['high', 'critical'];
    const actual = reducer(initialState, setAlertSeverityFilter(filters));
    expect(actual.settings.alertSeverityFilter).toEqual(filters);
  });

  it('should handle setMapStyle', () => {
    const actual = reducer(initialState, setMapStyle('satellite'));
    expect(actual.settings.mapStyle).toBe('satellite');
  });

  it('should handle setDistanceUnit', () => {
    const actual = reducer(initialState, setDistanceUnit('kilometers'));
    expect(actual.settings.distanceUnit).toBe('kilometers');
  });

  it('should handle setTemperatureUnit', () => {
    const actual = reducer(initialState, setTemperatureUnit('celsius'));
    expect(actual.settings.temperatureUnit).toBe('celsius');
  });

  it('should handle toggleAutoRefresh', () => {
    const actual = reducer(initialState, toggleAutoRefresh());
    expect(actual.settings.autoRefresh).toBe(false);
  });

  it('should handle setRefreshInterval', () => {
    const actual = reducer(initialState, setRefreshInterval(600));
    expect(actual.settings.refreshInterval).toBe(600);
  });

  it('should handle resetSettings', () => {
    const modifiedState = {
      settings: {
        ...initialState.settings,
        theme: 'dark' as const,
        soundEnabled: false,
      },
    };
    const actual = reducer(modifiedState, resetSettings());
    expect(actual).toEqual(initialState);
  });
});
