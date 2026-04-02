import { catmullRomPoint, generateSplinePoints } from '@/utils/catmullRom';

describe('catmullRomPoint', () => {
  const p0 = { lat: 30.0, lng: -94.0 };
  const p1 = { lat: 30.1, lng: -94.1 };
  const p2 = { lat: 30.2, lng: -94.2 };
  const p3 = { lat: 30.3, lng: -94.3 };

  it('returns p1 at t=0', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 0);
    expect(result.lat).toBeCloseTo(p1.lat, 6);
    expect(result.lng).toBeCloseTo(p1.lng, 6);
  });

  it('returns p2 at t=1', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 1);
    expect(result.lat).toBeCloseTo(p2.lat, 6);
    expect(result.lng).toBeCloseTo(p2.lng, 6);
  });

  it('returns a point between p1 and p2 at t=0.5', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 0.5);
    expect(result.lat).toBeGreaterThan(p1.lat);
    expect(result.lat).toBeLessThan(p2.lat);
    expect(result.lng).toBeLessThan(p1.lng);
    expect(result.lng).toBeGreaterThan(p2.lng);
  });

  it('clamps t to the supported range', () => {
    const atZero = catmullRomPoint(p0, p1, p2, p3, 0);
    const belowZero = catmullRomPoint(p0, p1, p2, p3, -0.5);
    expect(belowZero.lat).toBeCloseTo(atZero.lat, 6);
    expect(belowZero.lng).toBeCloseTo(atZero.lng, 6);

    const atOne = catmullRomPoint(p0, p1, p2, p3, 1);
    const aboveOne = catmullRomPoint(p0, p1, p2, p3, 1.5);
    expect(aboveOne.lat).toBeCloseTo(atOne.lat, 6);
    expect(aboveOne.lng).toBeCloseTo(atOne.lng, 6);
  });
});

describe('generateSplinePoints', () => {
  it('returns an empty array for fewer than two waypoints', () => {
    expect(generateSplinePoints([{ lat: 30.0, lng: -94.0 }], 10)).toEqual([]);
    expect(generateSplinePoints([], 10)).toEqual([]);
  });

  it('generates the expected number of samples for two waypoints', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
    ];

    const points = generateSplinePoints(waypoints, 10);
    expect(points.length).toBe(11);
  });

  it('generates the expected number of samples for three waypoints', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
      { lat: 30.2, lng: -94.2 },
    ];

    const points = generateSplinePoints(waypoints, 5);
    expect(points.length).toBe(11);
  });

  it('starts at the first waypoint and ends at the last waypoint', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
      { lat: 30.2, lng: -94.2 },
    ];

    const points = generateSplinePoints(waypoints, 10);
    expect(points[0].lat).toBeCloseTo(30.0, 5);
    expect(points[0].lng).toBeCloseTo(-94.0, 5);
    expect(points[points.length - 1].lat).toBeCloseTo(30.2, 5);
    expect(points[points.length - 1].lng).toBeCloseTo(-94.2, 5);
  });
});
