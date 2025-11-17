/**
 * Mock Mode Configuration
 *
 * Controls whether the app uses mock data or connects to a real backend API.
 */

// Check environment variable for mock mode
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

// Mock mode can also be forced for development
const FORCE_MOCK_MODE = __DEV__ && false; // Set to true to always use mock data in dev

export const isMockMode = USE_MOCK_API || FORCE_MOCK_MODE;

export const mockConfig = {
  // Enable/disable mock mode
  enabled: isMockMode,

  // Auto-login in mock mode (bypass login screen)
  autoLogin: true,

  // Log mock API calls to console
  logMockCalls: __DEV__,

  // Delay for simulated API calls (ms)
  apiDelay: 300,

  // Mock WebSocket events (enabled by default in mock mode)
  mockWebSocket: isMockMode,

  // WebSocket event interval (ms) - alerts generated every 5 seconds
  wsEventInterval: 5000,

  // Device status update interval (ms) - every 15 seconds
  wsDeviceStatusInterval: 15000,
};

/**
 * Logs mock mode status on app startup
 */
export const logMockStatus = (): void => {
  if (isMockMode) {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('          🎭 MOCK MODE ENABLED 🎭          ');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('  ✓ Static mock data loaded');
    console.log('  ✓ Mock WebSocket enabled');
    console.log('  ✓ Live radar events every 5 seconds');
    console.log('  ✓ No backend connection required');
    console.log('');
    console.log('  To disable: Set USE_MOCK_API=false in .env');
    console.log('═══════════════════════════════════════════');
    console.log('');
  } else {
    console.log('[Config] Mock mode disabled - using real API');
  }
};

export default mockConfig;
