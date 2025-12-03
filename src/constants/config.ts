// Configuration constants
// NOTE: process.env doesn't work in React Native without react-native-dotenv
// Using hardcoded defaults for now

// PRODUCTION: Using Railway backend
const DEFAULT_API_URL = 'https://trailsense-production.up.railway.app';
const DEFAULT_WS_URL = 'wss://trailsense-production.up.railway.app';

// LOCAL DEVELOPMENT (commented out):
// const DEFAULT_API_URL = 'http://192.168.12.63:3000';
// const DEFAULT_WS_URL = 'ws://192.168.12.63:3000';

export const Config = {
  apiBaseUrl: DEFAULT_API_URL,
  wsUrl: DEFAULT_WS_URL,
};

// Direct exports for backwards compatibility
export const API_BASE_URL = DEFAULT_API_URL;
export const WS_URL = DEFAULT_WS_URL;

// Log configuration on load
console.log('[Config] API Base URL:', API_BASE_URL);
console.log('[Config] WebSocket URL:', WS_URL);
