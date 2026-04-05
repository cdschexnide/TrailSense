import { Alert, DetectionType, ThreatLevel } from '@/types/alert';
import {
  TriangulatedPosition,
  TriangulationSignalType,
} from '@/types/triangulation';

const PROPERTY_CENTER = { latitude: 30.396526, longitude: -94.317806 };
const METERS_PER_DEG_LAT = 111_320;
const METERS_PER_DEG_LNG =
  111_320 * Math.cos((PROPERTY_CENTER.latitude * Math.PI) / 180);

type VisitDefinition = {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  positionsPerMinute: number;
};

type ScenarioDefinition = {
  deviceId: string;
  fingerprintHash: string;
  signalType: TriangulationSignalType;
  threatLevel: ThreatLevel;
  visits: VisitDefinition[];
  pointForProgress: (
    progress: number,
    minuteProgress: number
  ) => {
    northMeters: number;
    eastMeters: number;
    confidence: number;
    detectionType: DetectionType;
  };
};

export interface ReplayData {
  positions: TriangulatedPosition[];
  alerts: Alert[];
}

function toLatLng(northMeters: number, eastMeters: number) {
  return {
    latitude: PROPERTY_CENTER.latitude + northMeters / METERS_PER_DEG_LAT,
    longitude: PROPERTY_CENTER.longitude + eastMeters / METERS_PER_DEG_LNG,
  };
}

function createBaseDate(date?: Date) {
  const base = date ? new Date(date) : new Date();
  base.setHours(0, 0, 0, 0);
  return base;
}

function createScenarioAlert(
  scenario: ScenarioDefinition,
  timestamp: string,
  index: number,
  accuracyMeters: number,
  confidence: number
): Alert {
  return {
    id: `replay-alert-${scenario.fingerprintHash}-${index}`,
    deviceId: scenario.deviceId,
    timestamp,
    threatLevel: scenario.threatLevel,
    detectionType:
      scenario.signalType === 'bluetooth' ? 'bluetooth' : scenario.signalType,
    fingerprintHash: scenario.fingerprintHash,
    confidence,
    accuracyMeters,
    isReviewed: false,
    isFalsePositive: false,
    location: { ...PROPERTY_CENTER },
    metadata: {
      source: 'positions',
      measurementCount: 4,
      signalCount: 2,
      triangulatedPosition: {
        ...PROPERTY_CENTER,
        accuracyMeters,
        confidence,
      },
    },
  };
}

const SCENARIOS: ScenarioDefinition[] = [
  {
    deviceId: 'device-001',
    fingerprintHash: 'fp-delivery-a1b2c3',
    signalType: 'cellular',
    threatLevel: 'low',
    visits: [
      { startHour: 10, startMinute: 15, durationMinutes: 5, positionsPerMinute: 2 },
      { startHour: 15, startMinute: 30, durationMinutes: 5, positionsPerMinute: 2 },
    ],
    pointForProgress: progress => ({
      northMeters: -70 + progress * 55,
      eastMeters: 8 * Math.sin(progress * Math.PI),
      confidence: 72 + progress * 18,
      detectionType: 'cellular',
    }),
  },
  {
    deviceId: 'device-001',
    fingerprintHash: 'fp-visitor-d4e5f6',
    signalType: 'wifi',
    threatLevel: 'medium',
    visits: [
      { startHour: 8, startMinute: 0, durationMinutes: 3, positionsPerMinute: 2 },
      { startHour: 12, startMinute: 0, durationMinutes: 3, positionsPerMinute: 2 },
      { startHour: 18, startMinute: 0, durationMinutes: 3, positionsPerMinute: 2 },
    ],
    pointForProgress: progress => ({
      northMeters: 12 - progress * 6,
      eastMeters: 85 - progress * 45,
      confidence: 78,
      detectionType: 'wifi',
    }),
  },
  {
    deviceId: 'device-001',
    fingerprintHash: 'fp-loiterer-g7h8i9',
    signalType: 'bluetooth',
    threatLevel: 'critical',
    visits: [
      { startHour: 1, startMinute: 30, durationMinutes: 45, positionsPerMinute: 2 },
    ],
    pointForProgress: (progress, minuteProgress) => ({
      northMeters: 98 + Math.sin(progress * Math.PI * 3) * 8,
      eastMeters:
        Math.sin(progress * Math.PI * 6) * 70 + (minuteProgress - 0.5) * 6,
      confidence: 90 - Math.abs(minuteProgress - 0.5) * 8,
      detectionType: 'bluetooth',
    }),
  },
  {
    deviceId: 'device-001',
    fingerprintHash: 'fp-vehicle-j0k1l2',
    signalType: 'cellular',
    threatLevel: 'high',
    visits: [
      { startHour: 7, startMinute: 45, durationMinutes: 2, positionsPerMinute: 4 },
    ],
    pointForProgress: progress => ({
      northMeters: -20 + progress * 6,
      eastMeters: -210 + progress * 420,
      confidence: 64,
      detectionType: 'cellular',
    }),
  },
];

export function generateReplayData(date?: Date): ReplayData {
  const positions: TriangulatedPosition[] = [];
  const alerts: Alert[] = [];
  const baseDate = createBaseDate(date);
  let alertIndex = 0;

  for (const scenario of SCENARIOS) {
    for (const visit of scenario.visits) {
      const visitStart = new Date(baseDate);
      visitStart.setHours(visit.startHour, visit.startMinute, 0, 0);

      const totalPositions = visit.durationMinutes * visit.positionsPerMinute;

      for (let step = 0; step < totalPositions; step++) {
        const positionTime = new Date(visitStart);
        positionTime.setSeconds(
          Math.floor((step * 60) / visit.positionsPerMinute),
          (step % visit.positionsPerMinute) *
            Math.floor(60 / visit.positionsPerMinute)
        );

        const visitProgress =
          totalPositions <= 1 ? 0 : step / (totalPositions - 1);
        const minuteProgress =
          (step % visit.positionsPerMinute) / visit.positionsPerMinute;
        const point = scenario.pointForProgress(visitProgress, minuteProgress);
        const coords = toLatLng(point.northMeters, point.eastMeters);
        const accuracyMeters = 10 + (step % 5) * 2;
        const confidence = Math.round(Math.min(99, Math.max(55, point.confidence)));
        const timestamp = positionTime.toISOString();

        positions.push({
          id: `replay-${scenario.fingerprintHash}-${visit.startHour}-${visit.startMinute}-${step}`,
          deviceId: scenario.deviceId,
          fingerprintHash: scenario.fingerprintHash,
          signalType: scenario.signalType,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters,
          confidence,
          measurementCount: 4 + (step % 3),
          updatedAt: timestamp,
        });

        alerts.push(
          createScenarioAlert(
            scenario,
            timestamp,
            alertIndex++,
            accuracyMeters,
            confidence
          )
        );
      }
    }
  }

  positions.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  alerts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return { positions, alerts };
}

export function generateReplayPositions(date?: Date): TriangulatedPosition[] {
  return generateReplayData(date).positions;
}

export const mockReplayData = generateReplayData();
export const mockReplayPositions = mockReplayData.positions;
