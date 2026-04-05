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
    fingerprintHash: 'fp-test',
    onViewProfile: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('renders the unknown device label and fingerprint hash', () => {
    const { getByText } = render(<FingerprintPeek {...props} />);
    expect(getByText('Unknown Device')).toBeTruthy();
    expect(getByText('fp-test')).toBeTruthy();
  });

  it('calls onViewProfile with the fingerprint hash', () => {
    const onViewProfile = jest.fn();
    const { getByText } = render(
      <FingerprintPeek {...props} onViewProfile={onViewProfile} />
    );

    fireEvent.press(getByText('View Full Profile'));
    expect(onViewProfile).toHaveBeenCalledWith('fp-test');
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
