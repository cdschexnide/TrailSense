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
  private intervalId: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private eventCounter: number = 0;

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
    this.intervalId = setInterval(() => {
      this.generateMockAlert();
    }, this.EVENT_INTERVAL);

    // Generate device status updates
    setInterval(() => {
      this.generateMockDeviceStatus();
    }, this.DEVICE_STATUS_INTERVAL);
  }

  /**
   * Stop generating mock events
   */
  private stopEventGeneration() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
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

    // Generate realistic RSSI based on detection type
    const rssiRanges = {
      cellular: [-70, -50],
      wifi: [-85, -60],
      bluetooth: [-90, -70],
    };

    const [minRssi, maxRssi] = rssiRanges[detectionType];
    const rssi = Math.floor(Math.random() * (maxRssi - minRssi + 1)) + minRssi;

    // Determine if multiband detection
    const isMultiband = Math.random() < 0.3; // 30% chance

    // Generate unique ID using timestamp + counter + random component
    const uniqueId = `live-alert-${Date.now()}-${this.eventCounter}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate mock alert
    const alert: Alert = {
      id: uniqueId,
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      threatLevel,
      detectionType,
      rssi,
      macAddress: this.generateRandomMAC(),
      cellularStrength: detectionType === 'cellular' ? rssi : undefined,
      isReviewed: false,
      isFalsePositive: false,
      location: device.latitude !== undefined && device.longitude !== undefined
        ? {
            latitude: device.latitude + (Math.random() - 0.5) * 0.001,
            longitude: device.longitude + (Math.random() - 0.5) * 0.001,
          }
        : undefined,
      wifiDetected: isMultiband || detectionType === 'wifi',
      bluetoothDetected: isMultiband || detectionType === 'bluetooth',
      multiband: isMultiband,
      isStationary: Math.random() < 0.3,
      seenCount: 1,
      duration: Math.floor(Math.random() * 300) + 30,
      metadata:
        detectionType === 'wifi'
          ? {
              ssid: this.generateRandomSSID(),
              vendor: this.getRandomVendor(),
            }
          : detectionType === 'bluetooth'
            ? {
                deviceName: this.generateRandomDeviceName(),
              }
            : {
                band: '850MHz',
                provider: this.getRandomProvider(),
              },
    };

    // Emit the alert event
    console.log(
      `[MockWebSocket] 📡 Alert: ${threatLevel.toUpperCase()} ${detectionType} @ ${rssi}dBm from ${device.name}`
    );
    this.emit('alert', alert);
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

    const statusUpdate: Partial<Device> & { id: string } = {
      id: device.id,
      battery: newBattery,
      lastSeen: new Date().toISOString(),
      online: newBattery > 5, // Go offline if battery too low
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

  /**
   * Generate random MAC address
   */
  private generateRandomMAC(): string {
    const hexChars = '0123456789ABCDEF';
    const segments = [];

    for (let i = 0; i < 6; i++) {
      const segment =
        hexChars[Math.floor(Math.random() * 16)] +
        hexChars[Math.floor(Math.random() * 16)];
      segments.push(segment);
    }

    return segments.join(':');
  }

  /**
   * Generate random WiFi SSID
   */
  private generateRandomSSID(): string {
    const ssids = [
      'iPhone',
      'Samsung-Galaxy',
      'AndroidAP',
      'Pixel',
      'OnePlus',
      'DIRECT-',
      'MyPhone',
    ];
    return ssids[Math.floor(Math.random() * ssids.length)];
  }

  /**
   * Generate random device name (for Bluetooth)
   */
  private generateRandomDeviceName(): string {
    const names = [
      'AirPods Pro',
      'Galaxy Buds',
      'Fitbit',
      'Apple Watch',
      'Smartwatch',
      'Headphones',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Get random device vendor
   */
  private getRandomVendor(): string {
    const vendors = ['Apple Inc.', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'];
    return vendors[Math.floor(Math.random() * vendors.length)];
  }

  /**
   * Get random cellular provider
   */
  private getRandomProvider(): string {
    const providers = ['Verizon', 'AT&T', 'T-Mobile', 'Sprint'];
    return providers[Math.floor(Math.random() * providers.length)];
  }
}

export const mockWebSocketService = new MockWebSocketService();
