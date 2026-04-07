import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DevicePicker } from '@components/molecules/DevicePicker';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        systemGreen: '#4ade80',
        systemRed: '#ef4444',
        systemBlue: '#007AFF',
        label: '#e8e8e0',
        secondaryLabel: '#a8a898',
        tertiaryLabel: '#5a5a50',
        separator: '#333333',
      },
    },
  }),
}));

jest.mock('@utils/dateUtils', () => ({
  isDeviceOnline: jest.fn((lastSeen: string | undefined) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
  }),
}));

const onlineDevice = {
  id: 'device-001',
  name: 'North Gate Sensor',
  online: true,
  lastSeen: new Date().toISOString(),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const offlineDevice = {
  id: 'device-004',
  name: 'West Perimeter',
  online: false,
  lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
};

describe('DevicePicker', () => {
  const devices = [onlineDevice, offlineDevice];

  it('renders nothing when isOpen is false', () => {
    const { queryByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(queryByText('North Gate Sensor')).toBeNull();
  });

  it('renders all devices when isOpen is true', () => {
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(getByText('North Gate Sensor')).toBeTruthy();
    expect(getByText('West Perimeter')).toBeTruthy();
  });

  it('shows OFFLINE label for offline devices', () => {
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(getByText('OFFLINE')).toBeTruthy();
  });

  it('calls onSelectDevice and onClose when a device is tapped', () => {
    const onSelectDevice = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={onSelectDevice}
        isOpen={true}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText('West Perimeter'));

    expect(onSelectDevice).toHaveBeenCalledWith('device-004');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is tapped', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId('picker-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('renders with topOffset prop', () => {
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={jest.fn()}
        topOffset={140}
      />
    );

    expect(getByText('North Gate Sensor')).toBeTruthy();
  });

  it('works with a single device', () => {
    const onSelectDevice = jest.fn();
    const { getByText, queryByText } = render(
      <DevicePicker
        devices={[onlineDevice]}
        selectedDeviceId="device-001"
        onSelectDevice={onSelectDevice}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(getByText('North Gate Sensor')).toBeTruthy();
    expect(queryByText('West Perimeter')).toBeNull();

    fireEvent.press(getByText('North Gate Sensor'));
    expect(onSelectDevice).toHaveBeenCalledWith('device-001');
  });
});
