import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityHeatmap } from '@components/organisms/charts/ActivityHeatmap';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        separator: '#333',
        secondarySystemGroupedBackground: '#1a1a14',
        label: '#fff',
        secondaryLabel: '#aaa',
      },
      shadows: {
        sm: {},
      },
    },
  }),
}));

describe('ActivityHeatmap', () => {
  it('renders the heatmap shell', () => {
    const { getByTestId, getByText } = render(
      <ActivityHeatmap
        data={[
          { dayOfWeek: 0, hour: 8, count: 3, date: '2026-04-01' },
          { dayOfWeek: 0, hour: 9, count: 2, date: '2026-04-01' },
          { dayOfWeek: 1, hour: 10, count: 4, date: '2026-04-02' },
        ]}
      />
    );

    expect(getByTestId('activity-heatmap')).toBeTruthy();
    expect(getByText('Activity Heatmap')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });
});
