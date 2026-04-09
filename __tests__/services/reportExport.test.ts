import {
  buildBriefCsv,
  buildBriefHtml,
  buildReportCsv,
  buildReportHtml,
} from '@services/reportExport';
import { mockAnalyticsData } from '@/mocks/data';
import type { IntelligenceBrief, ReportConfig } from '@/types/report';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///tmp/',
  documentDirectory: 'file:///tmp/',
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

const config: ReportConfig = {
  template: 'security-summary',
  period: 'week',
  threatLevels: ['critical', 'high', 'medium', 'low'],
  detectionTypes: ['wifi', 'bluetooth', 'cellular'],
  deviceIds: ['dev-1'],
};

describe('reportExport', () => {
  it('builds report html with summary content', () => {
    const html = buildReportHtml({
      config,
      analytics: mockAnalyticsData,
      comparison: {
        current: mockAnalyticsData,
        comparison: mockAnalyticsData,
        percentageChange: {
          totalDetections: 12,
          unknownDevices: 8,
          avgResponseTime: -4,
        },
      },
    });

    expect(html).toContain('Security Summary');
    expect(html).toContain('Threat Distribution');
    expect(html).toContain('Detection Types');
    expect(html).toContain('Top Detected Devices');
    expect(html).toContain('Period Comparison');
    expect(html).toContain(String(mockAnalyticsData.totalAlerts));
  });

  it('builds activity report html with all sections', () => {
    const html = buildReportHtml({
      config: { ...config, template: 'activity-report' },
      analytics: mockAnalyticsData,
    });

    expect(html).toContain('Activity Report');
    expect(html).toContain('Daily Trend');
    expect(html).toContain('Hourly Distribution');
    expect(html).toContain('Day of Week');
    expect(html).toContain('Nighttime');
  });

  it('builds signal analysis html with all sections', () => {
    const html = buildReportHtml({
      config: { ...config, template: 'signal-analysis' },
      analytics: mockAnalyticsData,
    });

    expect(html).toContain('Signal Analysis');
    expect(html).toContain('RSSI Distribution');
    expect(html).toContain('Proximity Zones');
    expect(html).toContain('Modality Breakdown');
    expect(html).toContain('Phantom Merges');
  });

  it('filters signal modalities in html by detectionTypes', () => {
    const html = buildReportHtml({
      config: {
        ...config,
        template: 'signal-analysis',
        detectionTypes: ['wifi'],
      },
      analytics: mockAnalyticsData,
    });

    expect(html).toContain('WiFi');
    expect(html).not.toContain('<h3>Bluetooth</h3>');
    expect(html).not.toContain('<h3>Cellular</h3>');
  });

  it('builds security summary csv with all sections', () => {
    const csv = buildReportCsv({
      config,
      analytics: mockAnalyticsData,
      comparison: {
        current: mockAnalyticsData,
        comparison: mockAnalyticsData,
        percentageChange: {
          totalDetections: 12,
          unknownDevices: 8,
          avgResponseTime: -4,
        },
      },
    });

    expect(csv).toContain('summary');
    expect(csv).toContain('threat_distribution');
    expect(csv).toContain('detection_types');
    expect(csv).toContain('top_devices');
    expect(csv).toContain('comparison');
  });

  it('builds activity report csv with all sections', () => {
    const csv = buildReportCsv({
      config: { ...config, template: 'activity-report' },
      analytics: mockAnalyticsData,
    });

    expect(csv).toContain('daily_trend');
    expect(csv).toContain('hourly_distribution');
    expect(csv).toContain('day_of_week');
    expect(csv).toContain('nighttime_activity');
  });

  it('builds signal analysis csv with all sections', () => {
    const csv = buildReportCsv({
      config: { ...config, template: 'signal-analysis' },
      analytics: mockAnalyticsData,
    });

    expect(csv).toContain('rssi_summary');
    expect(csv).toContain('rssi_distribution');
    expect(csv).toContain('proximity_zones');
    expect(csv).toContain('confidence_distribution');
    expect(csv).toContain('modality_breakdown');
    expect(csv).toContain('cross_modal');
  });

  it('builds brief html and csv', () => {
    const brief: IntelligenceBrief = {
      summary: 'The property remained stable.',
      findings: [
        {
          title: 'Nighttime activity elevated',
          description: 'More detections occurred after dark.',
          severity: 'warning',
          metric: '32%',
        },
      ],
      generatedAt: '2026-04-08T12:00:00.000Z',
      period: 'week',
    };

    expect(buildBriefHtml(brief)).toContain('Intelligence Brief');
    expect(buildBriefCsv(brief)).toContain('Nighttime activity elevated');
  });
});
