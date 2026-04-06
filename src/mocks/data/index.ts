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
  getMockDevices,
  mockDevices,
  mockOnlineDevices,
  mockOfflineDevices,
} from './mockDevices';

// Alerts
export {
  getMockAlerts,
  mockAlerts,
  mockUnreviewedAlerts,
  mockCriticalAlerts,
  mockHighAlerts,
  mockMediumAlerts,
  mockLowAlerts,
  mockMultibandAlerts,
  mockRecentAlerts,
  PERSONA_FINGERPRINTS,
} from './mockAlerts';

// Known devices
export {
  mockKnownDevices,
  mockFamilyKnownDevices,
  mockGuestsKnownDevices,
  mockServiceKnownDevices,
  mockOtherKnownDevices,
  mockActiveKnownDevices,
  mockExpiredKnownDevices,
} from './mockKnownDevices';

// Analytics
export {
  getAnalyticsData,
  getHeatmapPoints,
  getDeviceFingerprints,
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

// Replay radar
export {
  mockReplayData,
  mockReplayPositions,
  generateReplayData,
  generateReplayPositions,
} from './mockReplayPositions';
