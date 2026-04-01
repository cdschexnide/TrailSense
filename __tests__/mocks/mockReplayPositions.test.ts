import { generateReplayPositions } from '@/mocks/data/mockReplayPositions';
import { TriangulatedPosition } from '@/types/triangulation';

describe('generateReplayPositions', () => {
  let positions: TriangulatedPosition[];

  beforeAll(() => {
    positions = generateReplayPositions();
  });

  it('generates positions for all 4 scenarios', () => {
    expect(new Set(positions.map(position => position.fingerprintHash)).size).toBe(4);
  });

  it('distributes positions across 24h', () => {
    const hours = new Set(positions.map(position => new Date(position.updatedAt).getHours()));
    expect(hours.size).toBeGreaterThanOrEqual(6);
  });

  it('all positions have valid lat/lng near property center', () => {
    for (const position of positions) {
      expect(position.latitude).toBeGreaterThan(31.52);
      expect(position.latitude).toBeLessThan(31.54);
      expect(position.longitude).toBeGreaterThan(-110.30);
      expect(position.longitude).toBeLessThan(-110.28);
    }
  });

  it('all positions have required fields', () => {
    for (const position of positions) {
      expect(position.id).toBeDefined();
      expect(position.fingerprintHash).toBeDefined();
      expect(position.signalType).toMatch(/wifi|bluetooth|cellular/);
      expect(position.confidence).toBeGreaterThan(0);
      expect(position.confidence).toBeLessThanOrEqual(1);
      expect(position.updatedAt).toBeDefined();
      expect(position.macAddress).toBeDefined();
    }
  });

  it('loiterer scenario has ~90 positions over 45 min', () => {
    const loiterer = positions.filter(position => position.fingerprintHash === 'fp-loiterer-g7h8i9');
    expect(loiterer.length).toBeGreaterThanOrEqual(70);
    expect(loiterer.length).toBeLessThanOrEqual(110);
  });
});
