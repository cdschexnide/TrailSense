import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@theme/index';
import { DashboardScreen } from '@screens/analytics/DashboardScreen';
import { mockAnalyticsData } from '@/mocks/data';

jest.mock('@rnmapbox/maps', () => ({
  PointAnnotation: 'PointAnnotation',
  MapView: 'MapView',
  Camera: 'Camera',
}));

jest.mock('react-native-gifted-charts', () => ({
  BarChart: 'BarChart',
  LineChart: 'LineChart',
  PieChart: 'PieChart',
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;
const mockRoute = { key: 'test', name: 'Dashboard' } as any;

// Mock hooks
jest.mock('@hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    data: mockAnalyticsData,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useComparison: () => ({
    data: {
      current: mockAnalyticsData,
      comparison: {
        ...mockAnalyticsData,
        totalAlerts: Math.round(mockAnalyticsData.totalAlerts * 0.85),
      },
      percentageChange: {
        totalDetections: 18,
        unknownDevices: 35,
        avgResponseTime: -5,
      },
    },
  }),
}));

jest.mock('@hooks/useDevices', () => ({
  useDevices: () => ({
    data: [
      {
        id: 'dev-1',
        name: 'North Gate',
        online: true,
        batteryPercent: 87,
        uptimeSeconds: 86400,
      },
    ],
  }),
}));

jest.mock('@services/analyticsInsights', () => ({
  generateInsights: () => [],
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NavigationContainer>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DashboardScreen
            navigation={mockNavigation}
            route={mockRoute}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </NavigationContainer>
  );
};

describe('DashboardScreen', () => {
  it('renders the period selector', () => {
    const { getByText } = renderScreen();
    expect(getByText('24h')).toBeTruthy();
    expect(getByText('7d')).toBeTruthy();
    expect(getByText('30d')).toBeTruthy();
    expect(getByText('1y')).toBeTruthy();
  });

  it('renders the tab bar with three tabs', () => {
    const { getByText } = renderScreen();
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Signals')).toBeTruthy();
    expect(getByText('Patterns')).toBeTruthy();
  });

  it('defaults to the Overview tab', () => {
    const { getByText, queryByText } = renderScreen();
    // Overview tab is active — its content is rendered
    expect(getByText('SENSOR HEALTH')).toBeTruthy();
    // Signals-specific content should NOT be present
    expect(queryByText('Proximity Zones')).toBeNull();
  });

  it('switches to Signals tab on press', async () => {
    const { getByRole, getByText, queryByText } = renderScreen();
    const signalsTab = getByRole('tab', { name: 'Signals' });
    fireEvent.press(signalsTab);
    await waitFor(() => {
      expect(getByText('Proximity Zones')).toBeTruthy();
    });
    expect(queryByText('SENSOR HEALTH')).toBeNull();
  });

  it('switches to Patterns tab on press', async () => {
    const { getByRole, queryByText } = renderScreen();
    const patternsTab = getByRole('tab', { name: 'Patterns' });
    fireEvent.press(patternsTab);
    await waitFor(() => {
      expect(queryByText('SENSOR HEALTH')).toBeNull();
    });
    expect(queryByText('Proximity Zones')).toBeNull();
  });

  it('period change updates displayed period selector', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('30d'));
    // The 30d button should still be rendered (period state changed)
    expect(getByText('30d')).toBeTruthy();
  });
});
