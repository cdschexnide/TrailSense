import { IntentClassifier } from '@/services/llm/IntentClassifier';
import type { Device } from '@/types/device';

const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-12-16T09:45:00Z',
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: false,
    batteryPercent: 12,
    signalStrength: 'fair',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-12-16T09:47:00Z',
  },
];

describe('IntentClassifier', () => {
  describe('intent detection', () => {
    it('classifies alert queries', () => {
      const result = IntentClassifier.classify(
        'Tell me about the critical alerts',
        mockDevices
      );
      expect(result.intent).toBe('alert_query');
      expect(result.filters.threatLevel).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('classifies device queries', () => {
      const result = IntentClassifier.classify(
        'Are any sensors offline?',
        mockDevices
      );
      expect(result.intent).toBe('device_query');
      expect(result.filters.online).toBe(false);
    });

    it('classifies status overview', () => {
      const result = IntentClassifier.classify("What's going on?", mockDevices);
      expect(result.intent).toBe('status_overview');
    });

    it('classifies pattern queries', () => {
      const result = IntentClassifier.classify(
        'Any suspicious activity this week?',
        mockDevices
      );
      expect(result.intent).toBe('pattern_query');
      expect(result.filters.timeRange).toBe('7d');
    });

    it('classifies time queries', () => {
      const result = IntentClassifier.classify(
        'When is it usually quietest?',
        mockDevices
      );
      expect(result.intent).toBe('time_query');
    });

    it('classifies help queries', () => {
      const result = IntentClassifier.classify('What can you do?', mockDevices);
      expect(result.intent).toBe('help');
    });

    it('falls back to status_overview for ambiguous messages', () => {
      const result = IntentClassifier.classify('hello', mockDevices);
      expect(result.intent).toBe('status_overview');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('filter extraction', () => {
    it('extracts threat level from message', () => {
      const result = IntentClassifier.classify(
        'Show me high threat detections',
        mockDevices
      );
      expect(result.filters.threatLevel).toBe('high');
    });

    it('extracts detection type', () => {
      const result = IntentClassifier.classify(
        'How many WiFi detections today?',
        mockDevices
      );
      expect(result.filters.detectionType).toBe('wifi');
      expect(result.filters.timeRange).toBe('24h');
    });

    it('extracts device name - full match', () => {
      const result = IntentClassifier.classify(
        'How is the North Gate Sensor doing?',
        mockDevices
      );
      expect(result.intent).toBe('device_query');
      expect(result.filters.deviceName).toBe('North Gate Sensor');
    });

    it('extracts device name - partial match', () => {
      const result = IntentClassifier.classify(
        'What about north gate?',
        mockDevices
      );
      expect(result.filters.deviceName).toBe('North Gate Sensor');
    });

    it('extracts unreviewed filter', () => {
      const result = IntentClassifier.classify(
        'Show me unreviewed alerts',
        mockDevices
      );
      expect(result.filters.isReviewed).toBe(false);
    });

    it('extracts time range - today', () => {
      const result = IntentClassifier.classify('What happened today?', mockDevices);
      expect(result.filters.timeRange).toBe('24h');
    });

    it('extracts time range - this week', () => {
      const result = IntentClassifier.classify('Activity this week', mockDevices);
      expect(result.filters.timeRange).toBe('7d');
    });

    it('extracts bluetooth detection type', () => {
      const result = IntentClassifier.classify(
        'Any bluetooth detections?',
        mockDevices
      );
      expect(result.filters.detectionType).toBe('bluetooth');
    });

    it('extracts cellular detection type', () => {
      const result = IntentClassifier.classify('Show cellular alerts', mockDevices);
      expect(result.filters.detectionType).toBe('cellular');
    });
  });
});
