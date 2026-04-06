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
  mockKnownDevices,
  mockAppSettings,
} from '@/mocks/data';
import { getMockAlerts, PERSONA_FINGERPRINTS } from '@/mocks/data/mockAlerts';
import { getMockDevices } from '@/mocks/data/mockDevices';
import {
  getAnalyticsData,
  getDeviceFingerprints,
  getHeatmapPoints,
} from '@/mocks/data/mockAnalytics';
import { TriangulatedPosition } from '@/types/triangulation';
import { randomFingerprint } from '@/mocks/helpers/fingerprints';

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
  const signalTypes = ['wifi', 'bluetooth', 'cellular'] as const;

  for (let i = 0; i < 8; i++) {
    const persona = PERSONA_FINGERPRINTS[i];
    const signalType = persona
      ? persona.signalType
      : signalTypes[i % signalTypes.length];
    const fingerprintHash = persona
      ? persona.fingerprintHash
      : randomFingerprint(signalTypes[i % signalTypes.length]);

    positions.push({
      id: `pos-${deviceId}-${i}`,
      deviceId,
      fingerprintHash,
      signalType,
      latitude: centerLat + (Math.random() - 0.5) * 0.002,
      longitude: centerLng + (Math.random() - 0.5) * 0.002,
      accuracyMeters: 5 + Math.random() * 20,
      confidence: Math.round(70 + Math.random() * 30),
      measurementCount: 3 + Math.floor(Math.random() * 5),
      presenceCertainty: Math.floor(Math.random() * 100),
      proximity: Math.floor(Math.random() * 100),
      threatLevel: (['low', 'medium', 'high', 'critical'] as const)[
        Math.floor(Math.random() * 4)
      ],
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
    const freshDevices = getMockDevices();
    const freshAlerts = getMockAlerts();
    const freshAnalytics = getAnalyticsData(freshAlerts);
    const freshHeatmap = getHeatmapPoints(freshAlerts);
    const freshFingerprints = getDeviceFingerprints(freshAlerts);

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
    queryClient.setQueryData([ALERTS_QUERY_KEY, undefined], freshAlerts);
    queryClient.setQueryData([ALERTS_QUERY_KEY], freshAlerts);

    // Individual alerts
    freshAlerts.forEach(alert => {
      queryClient.setQueryData([ALERTS_QUERY_KEY, alert.id], alert);
    });

    // Devices
    queryClient.setQueryData([DEVICES_QUERY_KEY], freshDevices);

    // Individual devices
    freshDevices.forEach(device => {
      queryClient.setQueryData([DEVICES_QUERY_KEY, device.id], device);
    });

    // Positions for each device with coordinates
    freshDevices.forEach(device => {
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
        freshAnalytics
      );
    });

    // Heatmap data
    queryClient.setQueryData(
      [HEATMAP_QUERY_KEY, undefined, undefined],
      freshHeatmap
    );

    // Device history/fingerprints
    freshFingerprints.forEach(fingerprint => {
      queryClient.setQueryData(
        [DEVICE_HISTORY_QUERY_KEY, fingerprint.fingerprintHash],
        fingerprint
      );
    });

    // User profile
    queryClient.setQueryData(['user', 'profile'], mockAdminUser);

    console.log('[MockData] ✓ Mock data seeding complete!');
    console.log('[MockData] Seeded:');
    console.log(`  - ${freshAlerts.length} alerts`);
    console.log(`  - ${freshDevices.length} devices`);
    console.log(`  - ${mockKnownDevices.length} known devices`);
    console.log(`  - Analytics data`);
    console.log(`  - Heatmap data (${freshHeatmap.length} points)`);
    console.log(`  - ${freshFingerprints.length} device fingerprints`);
    console.log(`  - User: ${mockAdminUser.email}`);
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
