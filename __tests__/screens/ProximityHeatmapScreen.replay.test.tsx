import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProximityHeatmapScreen } from '@screens/radar/ProximityHeatmapScreen';

jest.mock('@theme/provider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
        tertiaryLabel: '#777',
        separator: '#333',
        systemGreen: '#0f0',
        systemRed: '#f00',
        systemBlue: '#3478F6',
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
        separator: '#333',
        systemGreen: '#0f0',
        systemRed: '#f00',
        systemBlue: '#3478F6',
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

jest.mock('@components/templates', () => ({
  ScreenLayout: ({ children }: any) => children,
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const actual = jest.requireActual('__mocks__/react-native-reanimated.js');
  return {
    __esModule: true,
    ...actual,
    default: {
      View: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    },
    useSharedValue: jest.fn(initial => ({ value: initial })),
    useAnimatedStyle: jest.fn(callback => callback()),
    withTiming: jest.fn(value => value),
  };
});

jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: {
    setAccessToken: jest.fn(),
    StyleURL: { SatelliteStreet: 'sat', Dark: 'dark' },
  },
  Camera: () => null,
  MapView: ({ children }: any) => children ?? null,
}));

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children,
  Circle: () => null,
  Line: () => null,
  Group: ({ children }: any) => children,
  vec: (x: number, y: number) => ({ x, y }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Tap: () => ({ onEnd: () => ({}) }),
    Pan: () => ({
      onStart() {
        return this;
      },
      onUpdate() {
        return this;
      },
    }),
  },
}));

jest.mock('@hooks/api/useAlerts', () => ({
  useAlerts: () => ({ data: [], isLoading: false }),
}));

jest.mock('@hooks/api/useDevices', () => ({
  useDevices: () => ({
    data: [
      {
        id: 'device-001',
        name: 'North Gate',
        online: true,
        latitude: 31.530757,
        longitude: -110.287842,
      },
    ],
    isLoading: false,
  }),
}));

jest.mock('@hooks/api/usePositions', () => ({
  usePositions: () => ({ data: { positions: [] } }),
  POSITIONS_QUERY_KEY: 'positions',
}));

jest.mock('@hooks/api/useReplayPositions', () => ({
  useReplayData: () => ({
    data: { positions: [], alerts: [] },
    isSuccess: true,
    isLoading: false,
  }),
}));

jest.mock('@api/websocket', () => ({
  websocketService: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock('@components/molecules/DetectedDeviceMarker', () => ({
  DetectedDeviceMarker: () => null,
}));

jest.mock('@components/molecules/TrailSenseDeviceMarker', () => ({
  TrailSenseDeviceMarker: () => null,
}));

jest.mock('@components/molecules/PositionInfoPopup', () => ({
  PositionInfoPopup: () => null,
}));

jest.mock('@components/molecules/PositionListItem', () => ({
  PositionListItem: () => null,
}));

describe('ProximityHeatmapScreen replay mode', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderScreen = (params?: { startHour?: number }) => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };

    const route = { params };

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <ProximityHeatmapScreen navigation={navigation} route={route} />
        </NavigationContainer>
      </QueryClientProvider>
    );

    return { ...screen, navigation };
  };

  it('shows the segmented control and mounts both views', () => {
    const { getByText, getByTestId } = renderScreen();
    expect(getByText('Live Map')).toBeTruthy();
    expect(getByText('Replay')).toBeTruthy();
    expect(getByTestId('live-map-content')).toBeTruthy();
    expect(getByTestId('replay-content')).toBeTruthy();
  });

  it('allows switching to replay mode', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Replay'));
    expect(getByText('Replay')).toBeTruthy();
  });

  it('activates replay mode immediately when startHour is passed', () => {
    const { getByText } = renderScreen({ startHour: 14 });
    expect(getByText('Replay')).toBeTruthy();
  });

  it('clears startHour param after consuming it (consume-and-clear)', () => {
    const { navigation } = renderScreen({ startHour: 14 });
    expect(navigation.setParams).toHaveBeenCalledWith({
      startHour: undefined,
    });
  });
});
