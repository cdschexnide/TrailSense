export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type DetectionType = 'cellular' | 'wifi' | 'bluetooth';

/**
 * Typed metadata for alerts
 * Provides IDE autocomplete and type safety
 */
export interface AlertMetadata {
  // Location/distance info
  zone?: number;
  distance?: number;

  // Summary-specific fields
  source?: 'legacy' | 'summary' | 'positions';
  signalCount?: number;
  windowDuration?: number;
  measurementCount?: number;

  // Triangulation-specific fields
  presenceCertainty?: number;
  proximity?: number;
  triangulatedPosition?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    confidence: number;
  };
}

export interface Alert {
  id: string;
  deviceId: string;
  timestamp: string;
  threatLevel: ThreatLevel;
  detectionType: DetectionType;
  fingerprintHash: string;
  confidence: number;
  accuracyMeters: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: AlertMetadata;
  createdAt?: string;
}

export interface AlertFilters {
  deviceId?: string;
  threatLevel?: ThreatLevel[];
  detectionType?: DetectionType[];
  startDate?: string;
  endDate?: string;
  isReviewed?: boolean;
  limit?: number;
  offset?: number;
}

export interface Detection {
  id: string;
  distance: number;
  angle: number;
  threatLevel: ThreatLevel;
  type: DetectionType;
  timestamp: string;
}

export interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  totalAlerts: number;
  threatLevelDistribution: Array<{ level: string; count: number }>;
  detectionTypeDistribution: Array<{ type: string; count: number }>;
  deviceDistribution: Array<{ deviceId: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
  topDetectedDevices: Array<{ fingerprintHash: string; count: number }>;
  rssiDistribution: Array<{
    bucketMin: number;
    bucketMax: number;
    count: number;
  }>;
  medianRssi: number;
  peakRssi: number;
  proximityZoneDistribution: Array<{
    zone: 'immediate' | 'near' | 'far' | 'extreme';
    count: number;
  }>;
  confidenceDistribution: Array<{
    tier: 'high' | 'medium' | 'low';
    count: number;
  }>;
  modalityBreakdown: {
    wifi: {
      count: number;
      channelsActive: number;
      probeRequestPercent: number;
    };
    ble: {
      count: number;
      phonePercent: number;
      applePercent: number;
      beaconPercent: number;
    };
    cellular: {
      count: number;
      avgPeakDbm: number;
      avgBurstDurationMs: number;
      avgNoiseFloorDbm: number;
    };
  };
  crossModalStats: {
    wifiBleLinks: number;
    avgLinkConfidence: number;
    phantomMerges: number;
  };
  rssiTrend: Array<{
    date: string;
    wifiAvgRssi: number | null;
    bleAvgRssi: number | null;
    cellularAvgRssi: number | null;
  }>;
  hourlyDayOfWeekDistribution: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
    date: string;
  }>;
  dayOfWeekDistribution: Array<{
    day: number;
    count: number;
  }>;
  nighttimeActivity: {
    count: number;
    percentOfTotal: number;
    trend: Array<{ date: string; count: number }>;
  };
  perSensorTrend: Array<{
    date: string;
    sensors: Array<{
      deviceId: string;
      deviceName: string;
      count: number;
    }>;
  }>;
  threatTimeline: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  uniqueDevices: number;
  avgConfidence: number;
  closestApproachMeters: number;
  // Legacy fields for backward compatibility
  totalDetections?: number;
  unknownDevices?: number;
  dailyDetections?: Array<{ date: string; count: number }>;
  cellularCount?: number;
  wifiCount?: number;
  bluetoothCount?: number;
  hourlyDistribution?: Array<{ hour: number; count: number }>;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight?: number;
  type?: DetectionType;
}

export interface DeviceFingerprint {
  id: string;
  fingerprintHash: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  detections: Array<{
    timestamp: string;
    confidence: number;
    location?: {
      latitude: number;
      longitude: number;
    };
    type: string;
  }>;
  averageDuration: number;
  commonHours: number[];
  category: string;
}

/**
 * Backend API response shape from GET /analytics/devices/:fingerprintHash.
 * Separate from DeviceFingerprint, which is the app-internal domain model.
 */
export interface BackendDeviceFingerprint {
  id: string;
  fingerprintHash: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalSamples: number;
  totalAlerts: number;
  commonHours: number[];
  category: string;
}
