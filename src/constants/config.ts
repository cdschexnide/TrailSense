// Configuration constants
// NOTE: process.env doesn't work in React Native without react-native-dotenv
// Using hardcoded defaults for now - these work for local development

// IMPORTANT: When using Expo Go on a physical device (scanning QR code),
// you MUST use your Mac's local IP address, NOT localhost!
//
// For physical Android device via Expo Go: use Mac's IP (192.168.12.63)
// For iOS simulator: use localhost
// For Android emulator: use 10.0.2.2
const DEFAULT_API_URL = 'http://192.168.12.63:3000';
const DEFAULT_WS_URL = 'ws://192.168.12.63:3000';

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
