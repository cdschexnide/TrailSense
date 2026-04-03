import type { Alert, ThreatLevel } from '@/types/alert';
import type { Device } from '@/types/device';
import type { IntentFilters } from '@/types/llm';

// ── Alert Briefing Card ────────────────────────────────
export interface AlertBriefingData {
  type: 'alert_query';
  alerts: Alert[];
  filters: IntentFilters;
  devices: Device[];
}

// ── Device Status Card ─────────────────────────────────
export interface DeviceStatusData {
  type: 'device_query';
  devices: Device[];
  alertCounts: Record<string, number>;
}

// ── Activity Timeline Card ─────────────────────────────
export interface TimelineData {
  type: 'time_query';
  hourlyBuckets: { hour: number; label: string; count: number }[];
  busiestHour: string;
  quietestHour: string;
}

// ── Situation Report Card ──────────────────────────────
export interface SitrepData {
  type: 'status_overview';
  alerts: Alert[];
  devices: Device[];
  threatCounts: Record<ThreatLevel, number>;
  onlineCount: number;
  offlineCount: number;
  unreviewedCount: number;
}

// ── Pattern Analysis Card ──────────────────────────────
export interface PatternData {
  type: 'pattern_query';
  visitors: {
    mac: string;
    count: number;
    classification: 'ROUTINE' | 'SUSPICIOUS' | 'UNKNOWN';
    detectionType: string;
    lastDevice: string;
  }[];
  busiestHour?: string;
}

// ── Text Response Card ─────────────────────────────────
export interface TextData {
  type: 'help' | 'unknown';
}

// ── Discriminated Union ────────────────────────────────
export type StructuredCardData =
  | AlertBriefingData
  | DeviceStatusData
  | TimelineData
  | SitrepData
  | PatternData
  | TextData;
