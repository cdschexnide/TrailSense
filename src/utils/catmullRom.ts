export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Interpolate a point on the spline segment between p1 and p2.
 */
export function catmullRomPoint(
  p0: LatLng,
  p1: LatLng,
  p2: LatLng,
  p3: LatLng,
  t: number
): LatLng {
  const clampedT = Math.max(0, Math.min(1, t));
  const t2 = clampedT * clampedT;
  const t3 = t2 * clampedT;

  const lat =
    0.5 *
    (2 * p1.lat +
      (-p0.lat + p2.lat) * clampedT +
      (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
      (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);

  const lng =
    0.5 *
    (2 * p1.lng +
      (-p0.lng + p2.lng) * clampedT +
      (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
      (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3);

  return { lat, lng };
}

/**
 * Sample a spline that passes through all waypoints.
 */
export function generateSplinePoints(
  waypoints: LatLng[],
  samplesPerSegment: number
): LatLng[] {
  if (waypoints.length < 2) {
    return [];
  }

  const safeSamplesPerSegment = Math.max(1, Math.floor(samplesPerSegment));
  const points: LatLng[] = [];

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

    for (let s = 0; s < safeSamplesPerSegment; s += 1) {
      points.push(catmullRomPoint(p0, p1, p2, p3, s / safeSamplesPerSegment));
    }
  }

  points.push(waypoints[waypoints.length - 1]);

  return points;
}
