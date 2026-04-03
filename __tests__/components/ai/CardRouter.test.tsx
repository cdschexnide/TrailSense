import React from 'react';
import { render } from '@testing-library/react-native';
import { CardRouter } from '@/components/ai/cards/CardRouter';
import type {
  AlertBriefingData,
  DeviceStatusData,
  TimelineData,
  SitrepData,
  PatternData,
  TextData,
} from '@/types/cardData';

// Mock all card components to verify routing
jest.mock('@/components/ai/cards/AlertBriefingCard', () => ({
  AlertBriefingCard: () => <mock-alert-card testID="alert-card" />,
}));
jest.mock('@/components/ai/cards/DeviceStatusCard', () => ({
  DeviceStatusCard: () => <mock-device-card testID="device-card" />,
}));
jest.mock('@/components/ai/cards/TimelineCard', () => ({
  TimelineCard: () => <mock-timeline-card testID="timeline-card" />,
}));
jest.mock('@/components/ai/cards/SitrepCard', () => ({
  SitrepCard: () => <mock-sitrep-card testID="sitrep-card" />,
}));
jest.mock('@/components/ai/cards/PatternCard', () => ({
  PatternCard: () => <mock-pattern-card testID="pattern-card" />,
}));
jest.mock('@/components/ai/cards/TextCard', () => ({
  TextCard: () => <mock-text-card testID="text-card" />,
}));

describe('CardRouter', () => {
  const baseProps = {
    assessment: 'Test assessment',
    onCopy: jest.fn(),
    onFeedback: jest.fn(),
  };

  it('routes alert_query to AlertBriefingCard', () => {
    const data: AlertBriefingData = {
      type: 'alert_query',
      alerts: [],
      filters: {},
      devices: [],
    };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('alert-card')).toBeTruthy();
  });

  it('routes device_query to DeviceStatusCard', () => {
    const data: DeviceStatusData = {
      type: 'device_query',
      devices: [],
      alertCounts: {},
    };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('device-card')).toBeTruthy();
  });

  it('routes time_query to TimelineCard', () => {
    const data: TimelineData = {
      type: 'time_query',
      hourlyBuckets: [],
      busiestHour: '',
      quietestHour: '',
    };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('timeline-card')).toBeTruthy();
  });

  it('routes status_overview to SitrepCard', () => {
    const data: SitrepData = {
      type: 'status_overview',
      alerts: [],
      devices: [],
      threatCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      onlineCount: 0,
      offlineCount: 0,
      unreviewedCount: 0,
    };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('sitrep-card')).toBeTruthy();
  });

  it('routes pattern_query to PatternCard', () => {
    const data: PatternData = {
      type: 'pattern_query',
      visitors: [],
    };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('pattern-card')).toBeTruthy();
  });

  it('routes help to TextCard', () => {
    const data: TextData = { type: 'help' };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('text-card')).toBeTruthy();
  });

  it('routes unknown to TextCard (fallback)', () => {
    const data: TextData = { type: 'unknown' };
    const { getByTestId } = render(
      <CardRouter structuredData={data} {...baseProps} />
    );
    expect(getByTestId('text-card')).toBeTruthy();
  });
});
