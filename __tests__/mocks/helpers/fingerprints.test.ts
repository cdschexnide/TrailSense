import {
  FINGERPRINT_PREFIX,
  PERSONA_FINGERPRINTS,
  bleFingerprint,
  cellularFingerprint,
  fingerprintForType,
  randomFingerprint,
  wifiFingerprint,
} from '@/mocks/helpers/fingerprints';

describe('fingerprint helpers', () => {
  it('wifiFingerprint prepends w_ prefix', () => {
    expect(wifiFingerprint('3a7fb2e1')).toBe('w_3a7fb2e1');
  });

  it('bleFingerprint prepends b_ prefix', () => {
    expect(bleFingerprint('e50201aa')).toBe('b_e50201aa');
  });

  it('cellularFingerprint prepends c_ prefix', () => {
    expect(cellularFingerprint('0003abcd')).toBe('c_0003abcd');
  });

  it('fingerprintForType applies the correct prefix', () => {
    expect(fingerprintForType('wifi', 'abc12345')).toBe('w_abc12345');
    expect(fingerprintForType('bluetooth', 'abc12345')).toBe('b_abc12345');
    expect(fingerprintForType('cellular', 'abc12345')).toBe('c_abc12345');
  });

  it('randomFingerprint generates the correct prefix and hex payload', () => {
    expect(randomFingerprint('wifi')).toMatch(/^w_[a-f0-9]{8}$/);
    expect(randomFingerprint('bluetooth')).toMatch(/^b_[a-f0-9]{8}$/);
    expect(randomFingerprint('cellular')).toMatch(/^c_[a-f0-9]{8}$/);
  });

  it('randomFingerprint generates unique values', () => {
    expect(randomFingerprint('wifi')).not.toBe(randomFingerprint('wifi'));
  });

  it('PERSONA_FINGERPRINTS use the correct backend format', () => {
    expect(PERSONA_FINGERPRINTS.delivery).toBe('c_a1b2c3');
    expect(PERSONA_FINGERPRINTS.visitor).toBe('w_d4e5f6');
    expect(PERSONA_FINGERPRINTS.loiterer).toBe('b_a7b8c9');
    expect(PERSONA_FINGERPRINTS.vehicle).toBe('c_d0e1f2');
  });

  it('FINGERPRINT_PREFIX maps detection types to prefixes', () => {
    expect(FINGERPRINT_PREFIX.wifi).toBe('w_');
    expect(FINGERPRINT_PREFIX.bluetooth).toBe('b_');
    expect(FINGERPRINT_PREFIX.cellular).toBe('c_');
  });
});
