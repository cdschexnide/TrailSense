import { getMockAlerts, PERSONA_FINGERPRINTS } from '@/mocks/data/mockAlerts';

const FINGERPRINT_REGEX = /^[wcb]_[a-f0-9]+$/;
const PREFIX_MAP = {
  wifi: 'w_',
  bluetooth: 'b_',
  cellular: 'c_',
} as const;

describe('getMockAlerts', () => {
  const alerts = getMockAlerts();

  it('returns 55 alerts', () => {
    expect(alerts).toHaveLength(55);
  });

  it('all fingerprints use backend w_/b_/c_ format', () => {
    alerts.forEach(alert => {
      expect(alert.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });

  it('fingerprint prefix matches detectionType', () => {
    alerts.forEach(alert => {
      expect(
        alert.fingerprintHash.startsWith(PREFIX_MAP[alert.detectionType])
      ).toBe(true);
    });
  });

  it('all alerts have createdAt field', () => {
    alerts.forEach(alert => {
      expect(alert).toHaveProperty('createdAt');
      expect(alert.createdAt).toBe(alert.timestamp);
    });
  });

  it('all alerts are within the last 7 days', () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000 + 60 * 1000;

    alerts.forEach(alert => {
      const diff = Date.now() - new Date(alert.timestamp).getTime();
      expect(diff).toBeLessThan(sevenDays);
      expect(diff).toBeGreaterThanOrEqual(0);
    });
  });

  it('metadata includes presenceCertainty and proximity', () => {
    alerts.forEach(alert => {
      expect(alert.metadata).toHaveProperty('presenceCertainty');
      expect(alert.metadata).toHaveProperty('proximity');
      expect(typeof alert.metadata?.presenceCertainty).toBe('number');
      expect(typeof alert.metadata?.proximity).toBe('number');
    });
  });

  it('metadata includes triangulatedPosition', () => {
    alerts.forEach(alert => {
      expect(alert.metadata?.triangulatedPosition).toMatchObject({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        accuracyMeters: expect.any(Number),
        confidence: expect.any(Number),
      });
    });
  });

  it('PERSONA_FINGERPRINTS use backend format', () => {
    PERSONA_FINGERPRINTS.forEach(persona => {
      expect(persona.fingerprintHash).toMatch(FINGERPRINT_REGEX);
    });
  });
});
