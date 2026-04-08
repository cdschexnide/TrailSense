import { generateInsights } from '@services/analyticsInsights';
import type { AnalyticsData } from '@/types/alert';
import { mockAnalyticsData } from '@/mocks/data';

describe('generateInsights', () => {
  it('returns empty array when no data', () => {
    expect(generateInsights(null, null, [])).toEqual([]);
  });

  it('detects new devices when current period has more unique devices', () => {
    const currentData: AnalyticsData = {
      ...mockAnalyticsData,
      uniqueDevices: 15,
    };
    const previousData: AnalyticsData = {
      ...mockAnalyticsData,
      uniqueDevices: 10,
    };
    const comparisonData = {
      current: currentData,
      comparison: previousData,
      percentageChange: {
        totalDetections: 10,
        unknownDevices: 5,
        avgResponseTime: 0,
      },
    };

    const result = generateInsights(currentData, comparisonData, []);
    const newDevices = result.find(i => i.type === 'new-devices');
    expect(newDevices).toBeDefined();
    expect(newDevices?.title).toContain('5 new device');
  });

  it('detects activity spike when a day exceeds 2x average', () => {
    const analytics: AnalyticsData = {
      ...mockAnalyticsData,
      dailyTrend: [
        { date: '2026-04-01', count: 5 },
        { date: '2026-04-02', count: 5 },
        { date: '2026-04-03', count: 5 },
        { date: '2026-04-04', count: 5 },
        { date: '2026-04-05', count: 5 },
        { date: '2026-04-06', count: 25 },
        { date: '2026-04-07', count: 5 },
      ],
    };

    const result = generateInsights(analytics, null, []);
    expect(result.find(i => i.type === 'activity-spike')).toBeDefined();
  });

  it('detects nighttime activity above 20%', () => {
    const analytics: AnalyticsData = {
      ...mockAnalyticsData,
      nighttimeActivity: { count: 30, percentOfTotal: 35, trend: [] },
    };

    const result = generateInsights(analytics, null, []);
    expect(result.find(i => i.type === 'nighttime')).toBeDefined();
  });

  it('detects sensor offline', () => {
    const result = generateInsights(mockAnalyticsData, null, [
      { id: '1', name: 'Test', online: false } as any,
    ]);

    expect(result.find(i => i.type === 'sensor-offline')).toBeDefined();
  });

  it('detects confidence drop when previous period had higher avgConfidence', () => {
    const currentData: AnalyticsData = {
      ...mockAnalyticsData,
      avgConfidence: 55,
    };
    const previousData: AnalyticsData = {
      ...mockAnalyticsData,
      avgConfidence: 78,
    };
    const comparisonData = {
      current: currentData,
      comparison: previousData,
      percentageChange: {
        totalDetections: 10,
        unknownDevices: 5,
        avgResponseTime: 0,
      },
    };

    const result = generateInsights(currentData, comparisonData, []);
    const confDrop = result.find(i => i.type === 'confidence-drop');
    expect(confDrop).toBeDefined();
    expect(confDrop?.severity).toBe('warning');
    expect(confDrop?.subtitle).toContain('23%');
    expect(confDrop?.targetTab).toBe('signals');
  });
});
