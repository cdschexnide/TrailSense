// Export all mock data from a single entry point

// Users and Auth
export {
  mockUsers,
  mockAdminUser,
  mockRegularUser,
  mockAuthTokens,
  mockCredentials,
} from './mockUsers';

// Devices
export {
  mockDevices,
  mockOnlineDevices,
  mockOfflineDevices,
} from './mockDevices';

// Alerts
export {
  mockAlerts,
  mockUnreviewedAlerts,
  mockCriticalAlerts,
  mockHighAlerts,
  mockMediumAlerts,
  mockLowAlerts,
  mockMultibandAlerts,
  mockRecentAlerts,
} from './mockAlerts';

// Whitelist
export {
  mockWhitelist,
  mockFamilyWhitelist,
  mockGuestsWhitelist,
  mockServiceWhitelist,
  mockOtherWhitelist,
  mockActiveWhitelist,
  mockExpiredWhitelist,
} from './mockWhitelist';

// Analytics
export {
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockComparisonData,
  mockThreatTimeline,
  mockTopDevices,
} from './mockAnalytics';

// Settings
export {
  mockAppSettings,
  mockNotificationSettings,
  mockDetectionSettings,
  mockVacationModeSettings,
  mockQuietHoursSettings,
  mockUserPreferences,
} from './mockSettings';
