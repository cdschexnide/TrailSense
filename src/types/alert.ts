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

  // WiFi-specific
  channel?: number;

  // BLE-specific
  deviceName?: string;

  // Cellular-specific
  cellularPeak?: number;
  cellularAvg?: number;
  cellularDelta?: number;
  burstCount?: number;
  clusterIndex?: number;

  // Summary-specific fields
  source?: 'legacy' | 'summary';
  signalCount?: number;
  windowDuration?: number;

  // Triangulation-specific fields
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
  rssi: number;
  macAddress: string;
  cellularStrength?: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: AlertMetadata;
  // Additional properties for threat classification
  wifiDetected?: boolean;
  bluetoothDetected?: boolean;
  multiband?: boolean;
  isStationary?: boolean;
  seenCount?: number;
  duration?: number; // Duration in seconds
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
  topDetectedDevices: Array<{ macAddress: string; count: number }>;
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
  macAddress: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  detections: Array<{
    timestamp: string;
    rssi: number;
    location?: any;
    type: string;
  }>;
  averageDuration: number;
  commonHours: number[];
  category: string;
}
