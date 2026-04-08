import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar/InlineFilterBar';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        brandAccentBackground: 'rgba(251, 191, 36, 0.12)',
        brandAccent: '#fbbf24',
        separator: '#2a2a1a',
        primary: '#fbbf24',
        tertiaryLabel: '#8a887a',
      },
    },
    colorScheme: 'dark',
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockOptions = [
  { key: 'critical', label: 'CRITICAL', count: 16, color: '#ef4444' },
  { key: 'high', label: 'HIGH', count: 16, color: '#f59e0b' },
  { key: 'medium', label: 'MEDIUM', count: 22, color: '#fbbf24' },
  { key: 'low', label: 'LOW', count: 22, color: '#4ade80' },
];

const flattenResolvedStyle = (style: unknown): Record<string, unknown> => {
  if (typeof style === 'function') {
    return flattenResolvedStyle(style({ pressed: false }));
  }

  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, item) => {
      if (!item) {
        return acc;
      }

      return { ...acc, ...flattenResolvedStyle(item) };
    }, {});
  }

  return style && typeof style === 'object'
    ? (style as Record<string, unknown>)
    : {};
};

describe('InlineFilterBar', () => {
  it('renders all 4 filter chips', () => {
    const { getByText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={jest.fn()}
      />
    );

    expect(getByText('CRITICAL')).toBeTruthy();
    expect(getByText('HIGH')).toBeTruthy();
    expect(getByText('MEDIUM')).toBeTruthy();
    expect(getByText('LOW')).toBeTruthy();
  });

  it('renders chips with width styling for 2-column grid', () => {
    const { getAllByRole } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={jest.fn()}
      />
    );

    const chips = getAllByRole('button');
    expect(chips).toHaveLength(4);

    chips.forEach(chip => {
      const flatStyle = flattenResolvedStyle(chip.props.style);
      expect(flatStyle).toHaveProperty('width', '47%');
    });
  });

  it('calls onSelect with key when chip is pressed', async () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByLabelText('CRITICAL filter, 16 items'));
    // onPress fires after async Haptics.impactAsync in FilterChip
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('critical');
    });
  });

  it('calls onSelect with null when selected chip is pressed again', async () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey="critical"
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByLabelText('CRITICAL filter, 16 items'));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(null);
    });
  });
});
