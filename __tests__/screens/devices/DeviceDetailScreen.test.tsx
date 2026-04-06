import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import type { Device } from '@/types/device';

const mockUseRoute = jest.fn();
const mockUseDevice = jest.fn();
const mockReact = React;
const mockText = Text;
const mockView = View;
const mockRenderView = (children?: React.ReactNode) =>
  mockReact.createElement(mockView, null, children);
const mockRenderText = (content: string) =>
  mockReact.createElement(mockText, null, content);

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
}));

jest.mock('@hooks/api/useDevices', () => ({
  useDevice: (...args: unknown[]) => mockUseDevice(...args),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        systemBlue: '#3478F6',
        systemOrange: '#FF9500',
        systemPurple: '#AF52DE',
        systemIndigo: '#5856D6',
        systemGreen: '#34C759',
        systemRed: '#FF3B30',
        systemTeal: '#5AC8FA',
      },
    },
  }),
}));

jest.mock('@utils/dateUtils', () => ({
  isDeviceOnline: jest.fn(() => true),
}));

jest.mock('@components/templates', () => {
  return {
    ScreenLayout: ({ children }: { children: React.ReactNode }) =>
      mockRenderView(children),
    LoadingState: () => mockRenderText('Loading'),
    ErrorState: ({ message }: { message: string }) => mockRenderText(message),
  };
});

jest.mock('@components/molecules/DetailHero', () => {
  return {
    DetailHero: ({ children }: { children?: React.ReactNode }) =>
      mockRenderView(children),
  };
});

jest.mock('@components/molecules/TabSegment', () => {
  return {
    TabSegment: ({
      tabs,
      onSelect,
    }: {
      tabs: Array<{ key: string; label: string }>;
      onSelect: (key: string) => void;
    }) =>
      mockReact.createElement(
        mockView,
        null,
        tabs.map(tab =>
          mockReact.createElement(
            mockText,
            { key: tab.key, onPress: () => onSelect(tab.key) },
            tab.label
          )
        )
      ),
  };
});

jest.mock('@components/molecules/FloatingActionBar', () => ({
  FloatingActionBar: () => null,
}));

jest.mock('@components/molecules/GroupedListSection', () => {
  return {
    GroupedListSection: ({
      children,
      title,
    }: {
      children: React.ReactNode;
      title?: string;
    }) =>
      mockReact.createElement(
        mockView,
        null,
        title ? mockReact.createElement(mockText, null, title) : null,
        children
      ),
  };
});

jest.mock('@components/molecules/GroupedListRow', () => {
  return {
    GroupedListRow: ({
      subtitle,
      title,
      value,
    }: {
      subtitle?: string;
      title: string;
      value?: string;
    }) =>
      mockReact.createElement(
        mockView,
        null,
        mockReact.createElement(mockText, null, title),
        value != null ? mockReact.createElement(mockText, null, value) : null,
        subtitle != null
          ? mockReact.createElement(mockText, null, subtitle)
          : null
      ),
  };
});

jest.mock('react-native-maps', () => {
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) =>
      mockRenderView(children),
    Marker: ({ children }: { children?: React.ReactNode }) =>
      mockRenderView(children),
    Circle: ({ children }: { children?: React.ReactNode }) =>
      mockRenderView(children),
  };
});

import {
  DeviceDetailScreen,
  formatUptime,
  getSignalLabel,
} from '@screens/devices/DeviceDetailScreen';

describe('formatUptime', () => {
  it('returns "< 1m" for seconds under 60', () => {
    expect(formatUptime(0)).toBe('< 1m');
    expect(formatUptime(59)).toBe('< 1m');
  });

  it('returns "Xm Ys" for seconds between 60 and 3599', () => {
    expect(formatUptime(60)).toBe('1m 0s');
    expect(formatUptime(754)).toBe('12m 34s');
    expect(formatUptime(3599)).toBe('59m 59s');
  });

  it('returns "Xh Ym" for seconds between 3600 and 86399', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
    expect(formatUptime(9240)).toBe('2h 34m');
    expect(formatUptime(86399)).toBe('23h 59m');
  });

  it('returns "Xd Yh" for seconds >= 86400', () => {
    expect(formatUptime(86400)).toBe('1d 0h');
    expect(formatUptime(131400)).toBe('1d 12h');
    expect(formatUptime(604800)).toBe('7d 0h');
  });
});

describe('getSignalLabel', () => {
  it('returns "--" when signal strength is undefined', () => {
    expect(getSignalLabel(undefined)).toBe('--');
  });

  it('returns "--" when signal strength is null', () => {
    expect(getSignalLabel(null as unknown as undefined)).toBe('--');
  });

  it('returns "--" when signal strength is empty string', () => {
    expect(getSignalLabel('')).toBe('--');
  });

  it('returns "Excellent" for "excellent"', () => {
    expect(getSignalLabel('excellent')).toBe('Excellent');
  });

  it('returns "Good" for "good"', () => {
    expect(getSignalLabel('good')).toBe('Good');
  });

  it('returns "Fair" for "fair"', () => {
    expect(getSignalLabel('fair')).toBe('Fair');
  });

  it('returns "Weak" for "poor"', () => {
    expect(getSignalLabel('poor')).toBe('Weak');
  });
});

describe('DeviceDetailScreen uptime surfacing', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const baseDevice: Device = {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    signalStrength: 'excellent',
    alertCount: 142,
    latitude: 30.396526,
    longitude: -94.317806,
    lastSeen: '2026-04-05T11:55:00Z',
    firmwareVersion: 'v2.1.3',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-04-05T11:55:00Z',
  };

  const renderScreen = (deviceOverrides?: Partial<Device>) => {
    mockUseRoute.mockReturnValue({
      params: { deviceId: baseDevice.id },
    });
    mockUseDevice.mockReturnValue({
      data: { ...baseDevice, ...deviceOverrides },
      isLoading: false,
      error: null,
    });

    return render(<DeviceDetailScreen navigation={navigation} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-05T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders formatted uptime on the Status tab when uptimeSeconds is present', () => {
    const { getByText } = renderScreen({
      uptimeSeconds: 88200,
    });

    expect(getByText('Uptime')).toBeTruthy();
    expect(getByText('1d 0h')).toBeTruthy();
  });

  it('renders last reboot relative time on the History tab when lastBootAt is present', () => {
    const { getByText } = renderScreen({
      lastBootAt: '2026-04-05T10:00:00Z',
    });

    fireEvent.press(getByText('History'));

    expect(getByText('Last Reboot')).toBeTruthy();
    expect(getByText('2h ago')).toBeTruthy();
  });

  it('renders placeholders when uptime data is unavailable', () => {
    const { getByText, queryAllByText } = renderScreen({
      uptimeSeconds: undefined,
      lastBootAt: undefined,
    });

    expect(getByText('Uptime')).toBeTruthy();
    expect(queryAllByText('--')).toHaveLength(1);

    fireEvent.press(getByText('History'));

    expect(getByText('Last Reboot')).toBeTruthy();
    expect(queryAllByText('--')).toHaveLength(1);
  });
});
