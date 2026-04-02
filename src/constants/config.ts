const DEFAULT_API_URL = 'https://trailsense-production.up.railway.app';
const DEFAULT_WS_URL = 'wss://trailsense-production.up.railway.app';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_URL;
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || DEFAULT_WS_URL;

export const Config = {
  apiBaseUrl,
  wsUrl,
};

// Direct exports for backwards compatibility
export const API_BASE_URL = apiBaseUrl;
export const WS_URL = wsUrl;
