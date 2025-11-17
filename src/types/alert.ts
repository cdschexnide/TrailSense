export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type DetectionType = 'cellular' | 'wifi' | 'bluetooth';

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
  metadata?: Record<string, any>;
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
  totalDetections: number;
  unknownDevices: number;
  dailyDetections: Array<{ date: string; count: number }>;
  cellularCount: number;
  wifiCount: number;
  bluetoothCount: number;
  hourlyDistribution: Array<{ hour: number; count: number }>;
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
