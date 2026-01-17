/**
 * Triangulation Types
 *
 * Types for triangulated device positions from ESP32 multilateration
 */

export type TriangulationSignalType = 'wifi' | 'bluetooth' | 'cellular';

export interface TriangulatedPosition {
  id: string;
  deviceId: string;
  fingerprintHash: string;
  signalType: TriangulationSignalType;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  confidence: number;
  measurementCount: number;
  updatedAt: string;
}

export interface TriangulatedMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  signalType: TriangulationSignalType;
  fingerprintHash: string;
  confidence: number;
  accuracyMeters: number;
}

export interface DetectionWindow {
  id: string;
  deviceId: string;
  timestamp: string;
  windowDuration: number;
  estimatedDevices: number;
  closestDistance: number;
  wifiDeviceCount: number;
  bleDeviceCount: number;
  cellularClusters: number;
  totalSignals: number;
  triangulatedPositionCount: number;
}

export interface EfficiencyAnalytics {
  period: string;
  totalWindows: number;
  totalRawSignals: number;
  totalEstimatedDevices: number;
  deduplicationRatio: number;
  avgDevicesPerWindow: number;
  avgClosestDistance: number;
}
