/**
 * Mock WebSocket Service
 *
 * Simulates real-time WebSocket events for development and testing.
 * Generates realistic alert, device status, and positions events.
 */

import { Alert, ThreatLevel, DetectionType } from '@/types/alert';
import { Device } from '@/types/device';
import { getMockDevices } from './data/mockDevices';
import { randomFingerprint } from './helpers/fingerprints';

type EventCallback = (data: any) => void;

class MockWebSocketService {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private alertIntervalId: NodeJS.Timeout | null = null;
  private deviceStatusIntervalId: NodeJS.Timeout | null = null;
  private positionsIntervalId: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private eventCounter: number = 0;
  private devices: Device[] = [];
  private uptimeState = new Map<string, number>();
  private alertCountState = new Map<string, number>();
  private signalStrengthState = new Map<string, string>();

  // Configuration
  private readonly EVENT_INTERVAL = 5000;
  private readonly DEVICE_STATUS_INTERVAL = 15000;
  private readonly POSITIONS_INTERVAL = 10000;

  /**
   * Simulates WebSocket connection
   */
  connect(_token: string) {
    if (this.isConnected) {
      console.warn('[MockWebSocket] Already connected');
      return;
    }

    this.devices = getMockDevices();
    this.uptimeState = new Map(
      this.devices
        .filter(device => device.uptimeSeconds != null)
        .map(device => [device.id, device.uptimeSeconds!] as const)
    );
    this.alertCountState = new Map(
      this.devices
        .filter(device => device.alertCount != null)
        .map(device => [device.id, device.alertCount!] as const)
    );
    this.signalStrengthState = new Map(
      this.devices
        .filter(device => device.signalStrength != null)
        .map(device => [device.id, device.signalStrength!] as const)
    );

    console.log('[MockWebSocket] Connecting to mock WebSocket...');
    this.isConnected = true;

    setTimeout(() => {
      console.log('[MockWebSocket] Connected');
      this.emit('connect', {});
    }, 500);

    this.startEventGeneration();
  }

  /**
   * Simulates WebSocket disconnection
   */
  disconnect() {
    if (!this.isConnected) return;

    console.log('[MockWebSocket] Disconnecting...');
    this.isConnected = false;

    this.stopEventGeneration();
    this.emit('disconnect', {});
    console.log('[MockWebSocket] Disconnected');
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to all subscribers
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Start generating mock events
   */
  private startEventGeneration() {
    this.alertIntervalId = setInterval(() => {
      this.generateMockAlert();
    }, this.EVENT_INTERVAL);

    this.deviceStatusIntervalId = setInterval(() => {
      this.generateMockDeviceStatus();
    }, this.DEVICE_STATUS_INTERVAL);

    this.positionsIntervalId = setInterval(() => {
      this.generateMockPositionsUpdate();
    }, this.POSITIONS_INTERVAL);
  }

  /**
   * Stop generating mock events
   */
  private stopEventGeneration() {
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
    }

    if (this.deviceStatusIntervalId) {
      clearInterval(this.deviceStatusIntervalId);
      this.deviceStatusIntervalId = null;
    }

    if (this.positionsIntervalId) {
      clearInterval(this.positionsIntervalId);
      this.positionsIntervalId = null;
    }
  }

  /**
   * Generate a realistic mock alert event
   */
  private generateMockAlert() {
    this.eventCounter++;

    const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
    const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];

    const threatWeights = [40, 35, 20, 5];
    const threatLevel = this.weightedRandom(threatLevels, threatWeights);

    const typeWeights = [20, 50, 30];
    const detectionType = this.weightedRandom(detectionTypes, typeWeights);

    const onlineDevices = this.devices.filter(d => d.online);
    if (onlineDevices.length === 0) return;
    const device =
      onlineDevices[Math.floor(Math.random() * onlineDevices.length)];

    const confidenceRanges = {
      cellular: [70, 92],
      wifi: [60, 88],
      bluetooth: [55, 82],
    };

    const [minConfidence, maxConfidence] = confidenceRanges[detectionType];
    const confidence =
      Math.floor(Math.random() * (maxConfidence - minConfidence + 1)) +
      minConfidence;
    const accuracyMeters = Number((4 + Math.random() * 45).toFixed(1));
    const timestamp = new Date().toISOString();
    const uniqueId = `live-alert-${Date.now()}-${this.eventCounter}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: uniqueId,
      deviceId: device.id,
      timestamp,
      threatLevel,
      detectionType,
      fingerprintHash: randomFingerprint(detectionType),
      confidence,
      accuracyMeters,
      isReviewed: false,
      isFalsePositive: false,
      location:
        device.latitude !== undefined && device.longitude !== undefined
          ? {
              latitude: device.latitude + (Math.random() - 0.5) * 0.001,
              longitude: device.longitude + (Math.random() - 0.5) * 0.001,
            }
          : undefined,
      metadata: {
        source: 'positions',
        signalCount: 1 + Math.floor(Math.random() * 4),
        measurementCount: 3 + Math.floor(Math.random() * 4),
      },
      createdAt: timestamp,
    };

    console.log(
      `[MockWebSocket] Alert: ${threatLevel.toUpperCase()} ${detectionType} ${confidence}% @ ~${accuracyMeters}m from ${device.name}`
    );
    this.emit('alert', alert);

    const currentCount = this.alertCountState.get(device.id) ?? 0;
    this.alertCountState.set(device.id, currentCount + 1);
  }

  /**
   * Generate mock device status update
   */
  private generateMockDeviceStatus() {
    const device =
      this.devices[Math.floor(Math.random() * this.devices.length)];

    const batteryChange = Math.floor(Math.random() * 5) - 2;
    const newBattery = Math.max(
      0,
      Math.min(
        100,
        (device.batteryPercent ?? device.battery ?? 50) + batteryChange
      )
    );

    const priorUptime =
      this.uptimeState.get(device.id) ?? device.uptimeSeconds ?? undefined;
    const uptimeSeconds =
      priorUptime != null
        ? priorUptime + Math.floor(Math.random() * 300) + 60
        : undefined;

    if (uptimeSeconds != null) {
      this.uptimeState.set(device.id, uptimeSeconds);
    }

    const currentSignal =
      this.signalStrengthState.get(device.id) ?? device.signalStrength;
    const signalLevels = ['poor', 'fair', 'good', 'excellent'];
    let signalStrength = currentSignal;
    if (signalStrength && Math.random() < 0.1) {
      const idx = signalLevels.indexOf(signalStrength);
      if (idx >= 0) {
        const drift = Math.random() < 0.5 ? -1 : 1;
        const nextIdx = Math.max(
          0,
          Math.min(signalLevels.length - 1, idx + drift)
        );
        signalStrength = signalLevels[nextIdx];
        this.signalStrengthState.set(device.id, signalStrength);
      }
    }

    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      name: device.name,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5,
      alertCount: this.alertCountState.get(device.id) ?? device.alertCount,
      signalStrength,
      lastBootAt: device.lastBootAt,
      latitude: device.latitude,
      longitude: device.longitude,
      ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
    };

    console.log(
      `[MockWebSocket] Device Status: ${device.name} battery: ${newBattery}%`
    );
    this.emit('device-status', statusUpdate);
  }

  private generateMockPositionsUpdate() {
    const onlineDevices = this.devices.filter(d => d.online);
    if (onlineDevices.length === 0) return;

    const device =
      onlineDevices[Math.floor(Math.random() * onlineDevices.length)];

    if (device.latitude === undefined || device.longitude === undefined) {
      return;
    }

    const detectionTypes: DetectionType[] = ['wifi', 'bluetooth', 'cellular'];
    const positionCount = 2 + Math.floor(Math.random() * 3);

    const positions = Array.from({ length: positionCount }, (_, index) => {
      const type = detectionTypes[index % detectionTypes.length];
      const presenceCertainty = 20 + Math.floor(Math.random() * 70);
      const proximity = 20 + Math.floor(Math.random() * 70);

      return {
        id: `pos-live-${Date.now()}-${index}`,
        fingerprintHash: randomFingerprint(type),
        signalType: type,
        latitude: device.latitude! + (Math.random() - 0.5) * 0.002,
        longitude: device.longitude! + (Math.random() - 0.5) * 0.002,
        accuracyMeters: 5 + Math.random() * 20,
        confidence: Math.round(60 + Math.random() * 35),
        measurementCount: 3 + Math.floor(Math.random() * 5),
        updatedAt: new Date().toISOString(),
        presenceCertainty,
        proximity,
        threatLevel: this.deriveThreatLevel(presenceCertainty, proximity),
      };
    });

    this.emit('positions-updated', {
      deviceId: device.id,
      positions,
    });
  }

  /**
   * Weighted random selection
   */
  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  private deriveThreatLevel(presence: number, proximity: number): ThreatLevel {
    const presenceRow =
      presence <= 25 ? 0 : presence <= 50 ? 1 : presence <= 75 ? 2 : 3;
    const proximityColumn =
      proximity <= 30 ? 0 : proximity <= 55 ? 1 : proximity <= 75 ? 2 : 3;

    const matrix: ThreatLevel[][] = [
      ['low', 'low', 'low', 'medium'],
      ['low', 'low', 'medium', 'high'],
      ['low', 'medium', 'high', 'critical'],
      ['medium', 'high', 'critical', 'critical'],
    ];

    return matrix[presenceRow][proximityColumn];
  }
}

export const mockWebSocketService = new MockWebSocketService();
