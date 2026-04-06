/**
 * Mock WebSocket Service
 *
 * Simulates real-time WebSocket events for development and testing.
 * Generates realistic alert and device status events at configurable intervals.
 */

import { Alert, ThreatLevel, DetectionType } from '@/types/alert';
import { Device } from '@/types/device';
import { mockDevices } from './data/mockDevices';

type EventCallback = (data: any) => void;

class MockWebSocketService {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private alertIntervalId: NodeJS.Timeout | null = null;
  private deviceStatusIntervalId: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private eventCounter: number = 0;
  private uptimeState = new Map(
    mockDevices
      .filter(device => device.uptimeSeconds != null)
      .map(device => [device.id, device.uptimeSeconds!] as const)
  );
  private alertCountState = new Map(
    mockDevices
      .filter(device => device.alertCount != null)
      .map(device => [device.id, device.alertCount!] as const)
  );

  // Configuration
  private readonly EVENT_INTERVAL = 5000; // 5 seconds between events
  private readonly DEVICE_STATUS_INTERVAL = 15000; // 15 seconds between device updates

  /**
   * Simulates WebSocket connection
   */
  connect(_token: string) {
    if (this.isConnected) {
      console.warn('[MockWebSocket] Already connected');
      return;
    }

    console.log('[MockWebSocket] 🎭 Connecting to mock WebSocket...');
    this.isConnected = true;

    // Simulate connection event
    setTimeout(() => {
      console.log('[MockWebSocket] ✓ Connected');
      this.emit('connect', {});
    }, 500);

    // Start generating events
    this.startEventGeneration();
  }

  /**
   * Simulates WebSocket disconnection
   */
  disconnect() {
    if (!this.isConnected) return;

    console.log('[MockWebSocket] Disconnecting...');
    this.isConnected = false;

    // Stop event generation
    this.stopEventGeneration();

    // Simulate disconnect event
    this.emit('disconnect', {});

    console.log('[MockWebSocket] ✓ Disconnected');
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
    // Generate alert events
    this.alertIntervalId = setInterval(() => {
      this.generateMockAlert();
    }, this.EVENT_INTERVAL);

    // Generate device status updates
    this.deviceStatusIntervalId = setInterval(() => {
      this.generateMockDeviceStatus();
    }, this.DEVICE_STATUS_INTERVAL);
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
  }

  /**
   * Generate a realistic mock alert event
   */
  private generateMockAlert() {
    this.eventCounter++;

    const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
    const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];

    // Weight threat levels to make critical/high more rare
    const threatWeights = [40, 35, 20, 5]; // low, medium, high, critical
    const threatLevel = this.weightedRandom(threatLevels, threatWeights);

    // Weight detection types
    const typeWeights = [20, 50, 30]; // cellular, wifi, bluetooth
    const detectionType = this.weightedRandom(detectionTypes, typeWeights);

    // Pick a random online device
    const onlineDevices = mockDevices.filter(d => d.online);
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

    // Generate unique ID using timestamp + counter + random component
    const uniqueId = `live-alert-${Date.now()}-${this.eventCounter}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate mock alert
    const alert: Alert = {
      id: uniqueId,
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      threatLevel,
      detectionType,
      fingerprintHash: this.generateRandomFingerprint(),
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
    };

    // Emit the alert event
    console.log(
      `[MockWebSocket] Alert: ${threatLevel.toUpperCase()} ${detectionType} ${confidence}% @ ~${accuracyMeters}m from ${device.name}`
    );
    this.emit('alert', alert);

    // Keep status pushes aligned with alert traffic over time.
    const currentCount = this.alertCountState.get(device.id) ?? 0;
    this.alertCountState.set(device.id, currentCount + 1);
  }

  /**
   * Generate mock device status update
   */
  private generateMockDeviceStatus() {
    // Pick a random device
    const device = mockDevices[Math.floor(Math.random() * mockDevices.length)];

    // Generate realistic status update
    const batteryChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const newBattery = Math.max(
      0,
      Math.min(100, (device.battery || 50) + batteryChange)
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

    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      name: device.name,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5, // Go offline if battery too low
      alertCount: this.alertCountState.get(device.id) ?? device.alertCount,
      ...(uptimeSeconds != null ? { uptimeSeconds } : {}),
    };

    console.log(
      `[MockWebSocket] 🔋 Device Status: ${device.name} battery: ${newBattery}%`
    );
    this.emit('device-status', statusUpdate);
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

  private generateRandomFingerprint(): string {
    return `fp-live-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const mockWebSocketService = new MockWebSocketService();
