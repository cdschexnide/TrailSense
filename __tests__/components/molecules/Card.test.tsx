import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@components/molecules/Card/Card';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        surface: '#1a1a14',
        secondarySystemGroupedBackground: '#1a1a14',
        systemBackground: '#111210',
        systemBlue: '#fbbf24',
        separator: '#2a2a1a',
        primary: '#fbbf24',
        label: '#e8e8e0',
        systemGray6: '#141410',
      },
      shadows: { sm: {} },
    },
    colorScheme: 'dark',
  }),
}));

describe('Card tiers', () => {
  it('renders briefing tier with accent bar', () => {
    const { getByTestId } = render(
      <Card tier="briefing" headerLabel="SITUATION REPORT" testID="card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByTestId('card')).toBeTruthy();
    expect(getByTestId('card-accent-bar')).toBeTruthy();
    expect(getByTestId('card-header-label')).toBeTruthy();
  });

  it('renders data tier without accent bar', () => {
    const { getByTestId, queryByTestId } = render(
      <Card tier="data" testID="card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByTestId('card')).toBeTruthy();
    expect(queryByTestId('card-accent-bar')).toBeNull();
  });

  it('renders surface tier with subtle background', () => {
    const { getByTestId } = render(
      <Card tier="surface" testID="card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByTestId('card')).toBeTruthy();
  });

  it('supports severity border on data tier', () => {
    const { getByTestId } = render(
      <Card tier="data" severity="critical" testID="card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByTestId('card-severity-border')).toBeTruthy();
  });
});
