// Configuration constants
export const Config = {
  apiBaseUrl: process.env.API_BASE_URL || '',
  wsUrl: process.env.WS_URL || '',
};

// Direct exports for backwards compatibility
export const API_BASE_URL =
  process.env.API_BASE_URL || 'http://localhost:3000/api';
export const WS_URL = process.env.WS_URL || 'ws://localhost:3000';
