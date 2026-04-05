import React from 'react';
import { PropsWithChildren } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyCommandCenter } from '@screens/home/PropertyCommandCenter';

jest.mock('@theme/provider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
        tertiaryLabel: '#777',
        secondarySystemBackground: '#111',
        systemBlue: '#3478F6',
        systemRed: '#f00',
        brandAccentBorder: '#999',
      },
    },
  }),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
        tertiaryLabel: '#777',
        secondarySystemBackground: '#111',
        systemBlue: '#3478F6',
        systemRed: '#f00',
        brandAccentBorder: '#999',
      },
    },
    colorScheme: 'dark',
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: { setAccessToken: jest.fn(), StyleURL: {} },
  PointAnnotation: () => null,
}));

jest.mock('@hooks/usePropertyStatus', () => ({
  usePropertyStatus: () => ({
    level: 'clear',
    title: 'All Clear',
    subtitle: 'No active alerts',
    isLoading: false,
    activeAlertCount: 0,
    visitorsToday: 1,
    devicesOnline: 1,
    devicesOffline: 0,
    devicesTotal: 1,
    allAlerts: [
      {
        id: 'alert-1',
        deviceId: 'device-001',
        timestamp: new Date().toISOString(),
        threatLevel: 'low',
        detectionType: 'wifi',
        fingerprintHash: 'c_aabbccddeeff',
        confidence: 75,
        accuracyMeters: 10.0,
        isReviewed: false,
        isFalsePositive: false,
      },
    ],
    recentAlerts: [],
    allDevices: [],
    recentVisitorFingerprints: [],
    onlineDeviceNames: ['North Gate'],
    offlineDeviceNames: [],
    alertsError: null,
    devicesError: null,
    refetchAlerts: jest.fn(),
    refetchDevices: jest.fn(),
  }),
}));

jest.mock('@hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('@components/organisms', () => ({
  AlertCard: () => null,
  MiniPropertyMap: () => null,
}));

jest.mock('@components/templates', () => ({
  ScreenLayout: ({ children }: PropsWithChildren) => children,
}));

describe('PropertyCommandCenter sparkline deep link', () => {
  it('navigates to RadarTab with startHour when sparkline bar is pressed', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const navigate = jest.fn();

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <PropertyCommandCenter navigation={{ navigate }} />
        </NavigationContainer>
      </QueryClientProvider>
    );

    // Press the sparkline bar for hour 14 (2pm)
    fireEvent.press(getByTestId('sparkline-bar-14'));

    expect(navigate).toHaveBeenCalledWith('RadarTab', {
      screen: 'LiveRadar',
      params: { startHour: 14 },
    });
  });
});
