import React from 'react';
import { PropsWithChildren } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TimelineScrubber } from '@components/organisms/TimelineScrubber';
import { BucketEntry } from '@/types/replay';

jest.mock('@theme/provider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
        tertiaryLabel: '#777',
        systemBlue: '#3478F6',
        systemBackground: '#000',
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
        systemBlue: '#3478F6',
        systemBackground: '#000',
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

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: PropsWithChildren) => children,
  Gesture: {
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

function makeBuckets() {
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test',
    x: 100,
    y: 100,
    threatLevel: 'medium',
    confidence: 70,
    signalType: 'cellular',
  };

  return new Map<number, BucketEntry[]>([
    [120, [entry]],
    [600, [entry]],
  ]);
}

describe('TimelineScrubber', () => {
  const baseProps = {
    minuteIndex: 120,
    buckets: makeBuckets(),
    isPlaying: false,
    speed: 10 as const,
    onPlayPause: jest.fn(),
    onSpeedChange: jest.fn(),
    onSkipForward: jest.fn(),
    onSkipBack: jest.fn(),
    onScrub: jest.fn(),
  };

  it('renders labels and current time', () => {
    const { getByText } = render(<TimelineScrubber {...baseProps} />);
    expect(getByText('12am')).toBeTruthy();
    expect(getByText('6am')).toBeTruthy();
    expect(getByText('2:00 AM')).toBeTruthy();
    expect(getByText('10x')).toBeTruthy();
  });

  it('calls transport callbacks', () => {
    const onPlayPause = jest.fn();
    const onSpeedChange = jest.fn();
    const onSkipForward = jest.fn();
    const onSkipBack = jest.fn();
    const { getByTestId } = render(
      <TimelineScrubber
        {...baseProps}
        onPlayPause={onPlayPause}
        onSpeedChange={onSpeedChange}
        onSkipForward={onSkipForward}
        onSkipBack={onSkipBack}
      />
    );

    fireEvent.press(getByTestId('play-pause-button'));
    fireEvent.press(getByTestId('speed-button'));
    fireEvent.press(getByTestId('skip-forward-button'));
    fireEvent.press(getByTestId('skip-back-button'));

    expect(onPlayPause).toHaveBeenCalled();
    expect(onSpeedChange).toHaveBeenCalled();
    expect(onSkipForward).toHaveBeenCalled();
    expect(onSkipBack).toHaveBeenCalled();
  });
});
