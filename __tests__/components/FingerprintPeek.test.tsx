import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FingerprintPeek } from '@components/molecules/FingerprintPeek';

jest.mock('@theme/provider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
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

describe('FingerprintPeek', () => {
  const props = {
    macAddress: 'AA:BB:CC:DD:EE:FF',
    fingerprintHash: 'fp-test',
    scrubTimestamp: Date.now(),
    onViewProfile: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('renders the unknown device label and truncated mac', () => {
    const { getByText } = render(<FingerprintPeek {...props} />);
    expect(getByText('Unknown Device')).toBeTruthy();
    expect(getByText('AA:BB:CC')).toBeTruthy();
  });

  it('calls onViewProfile with the mac address', () => {
    const onViewProfile = jest.fn();
    const { getByText } = render(
      <FingerprintPeek {...props} onViewProfile={onViewProfile} />
    );

    fireEvent.press(getByText('View Full Profile'));
    expect(onViewProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
  });

  it('dismisses through the backdrop', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <FingerprintPeek {...props} onDismiss={onDismiss} />
    );

    fireEvent.press(getByTestId('peek-backdrop'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
