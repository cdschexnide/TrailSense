import type { DetectionType, ThreatLevel } from './alert';

export type ReportTemplate =
  | 'security-summary'
  | 'activity-report'
  | 'signal-analysis';

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface ReportConfig {
  template: ReportTemplate;
  period: ReportPeriod;
  threatLevels: ThreatLevel[];
  detectionTypes: DetectionType[];
  deviceIds: string[];
}

export interface SavedReport {
  id: string;
  name: string;
  config: ReportConfig;
  createdAt: string;
  lastGeneratedAt?: string;
}

export interface Finding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
}

export interface IntelligenceBrief {
  summary: string;
  findings: Finding[];
  generatedAt: string;
  period: string;
}

export const REPORT_TEMPLATES: Record<
  ReportTemplate,
  { name: string; description: string; icon: string }
> = {
  'security-summary': {
    name: 'Security Summary',
    description:
      'Threat overview, detection counts, top devices, period comparison',
    icon: 'shield-checkmark-outline',
  },
  'activity-report': {
    name: 'Activity Report',
    description:
      'Temporal patterns, hourly/daily breakdowns, nighttime activity',
    icon: 'bar-chart-outline',
  },
  'signal-analysis': {
    name: 'Signal Analysis',
    description: 'RSSI distributions, proximity zones, modality breakdown',
    icon: 'radio-outline',
  },
};
