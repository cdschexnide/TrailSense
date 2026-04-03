/**
 * Mock Data Seeding Utility
 *
 * This utility injects mock data directly into React Query cache and Redux store
 * to enable development and testing without a backend API.
 */

import { QueryClient } from '@tanstack/react-query';
import { Store } from '@reduxjs/toolkit';
import {
  mockAdminUser,
  mockAuthTokens,
  mockAlerts,
  mockDevices,
  mockKnownDevices,
  mockAnalyticsData,
  mockHeatmapPoints,
  mockDeviceFingerprints,
  mockAppSettings,
  PERSONA_MACS,
} from '@/mocks/data';
import { TriangulatedPosition } from '@/types/triangulation';

// React Query keys
const ALERTS_QUERY_KEY = 'alerts';
const DEVICES_QUERY_KEY = 'devices';
const POSITIONS_QUERY_KEY = 'positions';
const KNOWN_DEVICES_QUERY_KEY = 'knownDevices';
const ANALYTICS_QUERY_KEY = 'analytics';
const HEATMAP_QUERY_KEY = 'heatmap';
const DEVICE_HISTORY_QUERY_KEY = 'device-history';

/**
 * Generate mock triangulated positions for a device
 */
function generateMockPositions(
  deviceId: string,
  centerLat: number,
  centerLng: number
): { positions: TriangulatedPosition[] } {
  const positions: TriangulatedPosition[] = [];
  // Use persona MACs for the first 6, then fill remaining with generated ones
  for (let i = 0; i < 8; i++) {
    const persona = PERSONA_MACS[i];
    const mac = persona
      ? persona.macAddress
      : `AA:BB:CC:DD:${i.toString(16).padStart(2, '0').toUpperCase()}:${deviceId.slice(-2)}`;
    const signalType = persona
      ? persona.signalType
      : (['wifi', 'bluetooth', 'cellular'] as const)[i % 3];

    positions.push({
      id: `pos-${deviceId}-${i}`,
      deviceId,
      fingerprintHash: `fp-${mac.replace(/:/g, '').slice(-6)}`,
      macAddress: mac,
      signalType,
      latitude: centerLat + (Math.random() - 0.5) * 0.002,
      longitude: centerLng + (Math.random() - 0.5) * 0.002,
      accuracyMeters: 5 + Math.random() * 20,
      confidence: 0.7 + Math.random() * 0.3,
      measurementCount: 3 + Math.floor(Math.random() * 5),
      updatedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });
  }
  return { positions };
}

interface SeedOptions {
  queryClient: QueryClient;
  store: Store;
  user?: 'admin' | 'user';
}

/**
 * Seeds the application with mock data
 * @param options - Seeding configuration
 * @returns Promise that resolves when seeding is complete
 */
export const seedMockData = async ({
  queryClient,
  store,
  user: _user = 'admin',
}: SeedOptions): Promise<void> => {
  console.log('[MockData] Starting mock data seeding...');

  try {
    // 1. Seed Redux Store
    console.log('[MockData] Seeding Redux store...');

    // Auth slice
    store.dispatch({
      type: 'auth/setCredentials',
      payload: {
        user: mockAdminUser, // Default to admin user
        tokens: mockAuthTokens,
      },
    });

    // User slice
    store.dispatch({
      type: 'user/setUser',
      payload: mockAdminUser,
    });

    // Settings slice
    store.dispatch({
      type: 'settings/updateSettings',
      payload: mockAppSettings,
    });

    // 2. Seed React Query Cache
    console.log('[MockData] Seeding React Query cache...');

    // Alerts
    queryClient.setQueryData([ALERTS_QUERY_KEY, undefined], mockAlerts);
    queryClient.setQueryData([ALERTS_QUERY_KEY], mockAlerts);

    // Individual alerts
    mockAlerts.forEach(alert => {
      queryClient.setQueryData([ALERTS_QUERY_KEY, alert.id], alert);
    });

    // Devices
    queryClient.setQueryData([DEVICES_QUERY_KEY], mockDevices);

    // Individual devices
    mockDevices.forEach(device => {
      queryClient.setQueryData([DEVICES_QUERY_KEY, device.id], device);
    });

    // Positions for each device with coordinates
    mockDevices.forEach(device => {
      if (
        typeof device.latitude === 'number' &&
        typeof device.longitude === 'number'
      ) {
        const posData = generateMockPositions(
          device.id,
          device.latitude,
          device.longitude
        );
        queryClient.setQueryData([POSITIONS_QUERY_KEY, device.id], posData);
      }
    });

    // Known devices
    queryClient.setQueryData([KNOWN_DEVICES_QUERY_KEY], mockKnownDevices);

    // Individual known devices
    mockKnownDevices.forEach(entry => {
      queryClient.setQueryData([KNOWN_DEVICES_QUERY_KEY, entry.id], entry);
    });

    // Analytics - seed multiple time periods
    const periods = ['day', 'week', 'month', 'year'] as const;
    periods.forEach(period => {
      queryClient.setQueryData(
        [ANALYTICS_QUERY_KEY, period, undefined, undefined],
        mockAnalyticsData
      );
    });

    // Heatmap data
    queryClient.setQueryData(
      [HEATMAP_QUERY_KEY, undefined, undefined],
      mockHeatmapPoints
    );

    // Device history/fingerprints
    mockDeviceFingerprints.forEach(fingerprint => {
      queryClient.setQueryData(
        [DEVICE_HISTORY_QUERY_KEY, fingerprint.macAddress],
        fingerprint
      );
    });

    // User profile
    queryClient.setQueryData(['user', 'profile'], mockAdminUser);

    console.log('[MockData] ✓ Mock data seeding complete!');
    console.log('[MockData] Seeded:');
    console.log(`  - ${mockAlerts.length} alerts`);
    console.log(`  - ${mockDevices.length} devices`);
    console.log(`  - ${mockKnownDevices.length} known devices`);
    console.log(`  - Analytics data`);
    console.log(`  - Heatmap data (${mockHeatmapPoints.length} points)`);
    console.log(`  - ${mockDeviceFingerprints.length} device fingerprints`);
    console.log(`  - User: ${mockAdminUser.email} (${mockAdminUser.role})`);
  } catch (error) {
    console.error('[MockData] Error seeding mock data:', error);
    throw error;
  }
};

/**
 * Clears all mock data from the application
 * @param options - Clearing configuration
 */
export const clearMockData = ({
  queryClient,
  store,
}: Omit<SeedOptions, 'user'>): void => {
  console.log('[MockData] Clearing mock data...');

  // Clear React Query cache
  queryClient.clear();

  // Reset Redux store (logout)
  store.dispatch({ type: 'auth/logout' });

  console.log('[MockData] ✓ Mock data cleared');
};

/**
 * Refreshes mock data (useful for testing)
 * @param options - Refresh configuration
 */
export const refreshMockData = async (options: SeedOptions): Promise<void> => {
  clearMockData(options);
  await seedMockData(options);
};
