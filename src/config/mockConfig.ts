/**
 * Mock Mode Configuration
 *
 * Controls whether the app uses mock data or connects to a real backend API.
 */
import { isDemoMode } from './demoMode';

// Check environment variable for mock mode
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

// Mock mode can also be forced for development
// Set to true to use mock data without a backend
const FORCE_MOCK_MODE = false;

export const getIsMockMode = (): boolean =>
  USE_MOCK_API || FORCE_MOCK_MODE || isDemoMode();

interface MockConfig {
  readonly enabled: boolean;
  // Auto-login in mock mode (bypass login screen)
  autoLogin: boolean;

  // Log mock API calls to console
  logMockCalls: boolean;

  // Delay for simulated API calls (ms)
  apiDelay: number;

  // Mock WebSocket events (enabled by default in mock mode)
  readonly mockWebSocket: boolean;

  // WebSocket event interval (ms) - alerts generated every 5 seconds
  wsEventInterval: number;

  // Device status update interval (ms) - every 15 seconds
  wsDeviceStatusInterval: number;
}

export const mockConfig: MockConfig = {
  get enabled() {
    return getIsMockMode();
  },
  autoLogin: true,
  logMockCalls: __DEV__,
  apiDelay: 300,
  get mockWebSocket() {
    return getIsMockMode();
  },
  wsEventInterval: 5000,
  wsDeviceStatusInterval: 15000,
};

/**
 * Logs mock mode status on app startup
 */
export const logMockStatus = (): void => {
  if (getIsMockMode()) {
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

/**
 * Static snapshot of mock mode at module load time.
 * Used by client.ts for baseURL and interceptor setup.
 * Demo mode changes require app restart to take effect.
 * Prefer getIsMockMode() for runtime checks.
 */
export const isMockMode = getIsMockMode();

export default mockConfig;
