import React from 'react';
import { render } from '@testing-library/react-native';
import { ProximityZoneVisual } from '@components/molecules/ProximityZoneVisual';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        secondarySystemGroupedBackground: '#1a1a14',
      },
    },
  }),
}));

describe('ProximityZoneVisual', () => {
  it('renders all proximity zones', () => {
    const { getByTestId, getByText } = render(
      <ProximityZoneVisual
        zones={[
          { zone: 'immediate', count: 4 },
          { zone: 'near', count: 12 },
          { zone: 'far', count: 20 },
          { zone: 'extreme', count: 7 },
        ]}
      />
    );

    expect(getByTestId('proximity-zone-visual')).toBeTruthy();
    expect(getByTestId('zone-immediate')).toBeTruthy();
    expect(getByTestId('zone-near')).toBeTruthy();
    expect(getByText('Immediate')).toBeTruthy();
    expect(getByText('Extreme')).toBeTruthy();
  });
});
