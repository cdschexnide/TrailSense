import type { AppSettings } from '@store/slices/settingsSlice';

export const mockAppSettings: AppSettings = {
  theme: 'auto',
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  radarUpdateInterval: 30, // 30 seconds for more frequent updates in demo
  alertSeverityFilter: [], // Show all alerts
  mapStyle: 'satellite',
  distanceUnit: 'miles',
  temperatureUnit: 'fahrenheit',
  autoRefresh: true,
  refreshInterval: 180, // 3 minutes
};

// Notification settings for the notification settings screen
export const mockNotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  criticalAlerts: true,
  highAlerts: true,
  mediumAlerts: true,
  lowAlerts: false,
  deviceOffline: true,
  deviceLowBattery: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  geofencingEnabled: true,
  geofenceRadius: 100, // miles
};

// Detection sensitivity settings
export const mockDetectionSettings = {
  cellularSensitivity: 'medium', // 'low' | 'medium' | 'high'
  wifiSensitivity: 'high',
  bluetoothSensitivity: 'medium',
  minimumRssi: -75,
  minimumDuration: 30, // seconds
  whitelistEnabled: true,
  alertCooldown: 300, // seconds between duplicate alerts
};

// Vacation mode settings
export const mockVacationModeSettings = {
  enabled: false,
  startDate: null,
  endDate: null,
  increaseAlertSensitivity: true,
  notifyAllDevices: true,
  autoArm: true,
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+1-555-0123',
    email: 'emergency@example.com',
  },
};

// Quiet hours configuration
export const mockQuietHoursSettings = {
  enabled: true,
  schedule: [
    {
      id: 'quiet-1',
      name: 'Nighttime',
      startTime: '22:00',
      endTime: '07:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
      enabled: true,
      allowCritical: true, // Critical alerts still come through
    },
    {
      id: 'quiet-2',
      name: 'Work Hours (Weekdays)',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      enabled: false,
      allowCritical: true,
    },
  ],
};

// User preferences
export const mockUserPreferences = {
  language: 'en',
  timezone: 'America/Chicago',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h', // '12h' | '24h'
  firstDayOfWeek: 0, // 0 = Sunday
  compactMode: false,
  showTutorials: true,
  analytics: true,
};
