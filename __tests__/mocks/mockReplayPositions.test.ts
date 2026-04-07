import {
  generateReplayData,
  generateReplayPositions,
} from '@/mocks/data/mockReplayPositions';
import { ReplayPosition } from '@/types/triangulation';

describe('generateReplayPositions', () => {
  let positions: ReplayPosition[];

  beforeAll(() => {
    positions = generateReplayPositions();
  });

  it('generates positions for all 4 scenarios', () => {
    expect(
      new Set(positions.map(position => position.fingerprintHash)).size
    ).toBe(4);
  });

  it('distributes positions across 24h', () => {
    const hours = new Set(
      positions.map(position => new Date(position.observedAt).getHours())
    );
    expect(hours.size).toBeGreaterThanOrEqual(6);
  });

  it('all positions have valid lat/lng within deployed device bounds', () => {
    for (const position of positions) {
      expect(position.latitude).toBeGreaterThan(30.392);
      expect(position.latitude).toBeLessThan(30.399);
      expect(position.longitude).toBeGreaterThan(-94.323);
      expect(position.longitude).toBeLessThan(-94.312);
    }
  });

  it('only seeded devices expose replay history', () => {
    const deviceIds = new Set(positions.map(position => position.deviceId));
    expect(Array.from(deviceIds).sort()).toEqual(['device-001', 'device-002']);
  });

  it('all positions have required fields', () => {
    for (const position of positions) {
      expect(position.id).toBeDefined();
      expect(position.fingerprintHash).toBeDefined();
      expect(position.signalType).toMatch(/wifi|bluetooth|cellular/);
      expect(position.confidence).toBeGreaterThan(0);
      expect(position.confidence).toBeLessThanOrEqual(100);
      expect(position.observedAt).toBeDefined();
    }
  });

  it('loiterer scenario has ~90 positions for device-001 (45 min) plus ~40 for device-002 (20 min)', () => {
    const loiterer = positions.filter(
      position => position.fingerprintHash === 'b_a7b8c9'
    );
    // device-001: 45 min * 2/min = 90, device-002: 20 min * 2/min = 40
    expect(loiterer.length).toBeGreaterThanOrEqual(110);
    expect(loiterer.length).toBeLessThanOrEqual(150);
  });
});

describe('replay fingerprint format', () => {
  const data = generateReplayData();

  it('all positions use backend fingerprint format', () => {
    data.positions.forEach(position => {
      expect(position.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]+$/);
    });
  });

  it('all alerts use backend fingerprint format', () => {
    data.alerts.forEach(alert => {
      expect(alert.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]+$/);
    });
  });
});
