import React from 'react';
import { PropsWithChildren } from 'react';
import { render } from '@testing-library/react-native';
import { ReplayRadarDisplay } from '@components/organisms/ReplayRadarDisplay';
import { BucketEntry } from '@/types/replay';

jest.mock('@theme/provider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        label: '#fff',
        secondaryLabel: '#aaa',
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

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: PropsWithChildren) => children,
  Circle: () => null,
  Line: () => null,
  Group: ({ children }: PropsWithChildren) => children,
  vec: (x: number, y: number) => ({ x, y }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: PropsWithChildren) => children,
  Gesture: {
    Tap: () => ({ onEnd: () => ({}) }),
  },
}));

function makeBuckets() {
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test',
    macAddress: 'AA:BB:CC:DD:EE:01',
    x: 175,
    y: 100,
    threatLevel: 'high',
    confidence: 0.8,
    signalType: 'cellular',
  };

  return new Map<number, BucketEntry[]>([[600, [entry]]]);
}

describe('ReplayRadarDisplay', () => {
  it('renders without crashing', () => {
    const tree = render(
      <ReplayRadarDisplay
        currentMinute={600}
        positions={{ startTime: Date.now(), buckets: makeBuckets() }}
      />
    );

    expect(tree).toBeTruthy();
  });
});
