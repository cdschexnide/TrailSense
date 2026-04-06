import {
  mockAnalyticsData,
  mockDeviceFingerprints,
  mockTopDevices,
} from '@/mocks/data/mockAnalytics';

const FINGERPRINT_REGEX = /^[wcb]_[a-f0-9]+$/;

describe('mockAnalyticsData', () => {
  it('topDetectedDevices uses { fingerprintHash, count } shape', () => {
    mockAnalyticsData.topDetectedDevices.forEach(entry => {
      expect(entry).toHaveProperty('fingerprintHash');
      expect(entry).toHaveProperty('count');
      expect(typeof entry.fingerprintHash).toBe('string');
      expect(typeof entry.count).toBe('number');
    });
  });

  it('topDetectedDevices use backend-format fingerprints', () => {
    mockAnalyticsData.topDetectedDevices.forEach(entry => {
      expect(entry.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});

describe('mockTopDevices', () => {
  it('matches the getTopDevices API shape', () => {
    mockTopDevices.forEach(entry => {
      expect(entry).toHaveProperty('fingerprintHash');
      expect(entry).toHaveProperty('visits');
      expect(entry).toHaveProperty('lastSeen');
      expect(entry).toHaveProperty('threatLevel');
      expect(entry).toHaveProperty('category');
    });
  });
});

describe('mockDeviceFingerprints', () => {
  it('uses backend shape with totalSamples and totalAlerts', () => {
    mockDeviceFingerprints.forEach(fp => {
      expect(fp).toHaveProperty('totalSamples');
      expect(fp).toHaveProperty('totalAlerts');
      expect(fp).not.toHaveProperty('detections');
      expect(fp).not.toHaveProperty('averageDuration');
    });
  });

  it('category is a signal type', () => {
    mockDeviceFingerprints.forEach(fp => {
      expect(['wifi', 'bluetooth', 'cellular']).toContain(fp.category);
    });
  });

  it('fingerprints use backend format', () => {
    mockDeviceFingerprints.forEach(fp => {
      expect(fp.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});
