import { Alert, DetectionType, ThreatLevel } from '@/types/alert';
import { ReplayPosition, TriangulationSignalType } from '@/types/triangulation';
import { PERSONA_FINGERPRINTS as PERSONAS } from '../helpers/fingerprints';
import { todayAt } from '../helpers/timestamps';

const DEVICE_CENTERS: Record<string, { latitude: number; longitude: number }> =
  {
    'device-001': { latitude: 30.396526, longitude: -94.317806 },
    'device-002': { latitude: 30.394982, longitude: -94.319441 },
    'device-003': { latitude: 30.398774, longitude: -94.315984 },
    'device-004': { latitude: 30.395214, longitude: -94.321118 },
    'device-005': { latitude: 30.397901, longitude: -94.313562 },
  };
const METERS_PER_DEG_LAT = 111_320;

type ReplayOptions = {
  date?: Date;
  deviceId?: string;
};

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
  positions: ReplayPosition[];
  alerts: Alert[];
}

function getDeviceCenter(deviceId?: string) {
  if (deviceId && DEVICE_CENTERS[deviceId]) {
    return DEVICE_CENTERS[deviceId];
  }

  return DEVICE_CENTERS['device-001'];
}

function toLatLng(
  northMeters: number,
  eastMeters: number,
  center: { latitude: number; longitude: number }
) {
  const metersPerDegLng = 111_320 * Math.cos((center.latitude * Math.PI) / 180);

  return {
    latitude: center.latitude + northMeters / METERS_PER_DEG_LAT,
    longitude: center.longitude + eastMeters / metersPerDegLng,
  };
}

function createBaseDate(date?: Date) {
  if (date) {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    return base;
  }
  // Use shared timestamp helper for today at midnight
  return new Date(todayAt(0, 0));
}

function createScenarioAlert(
  scenario: ScenarioDefinition,
  center: { latitude: number; longitude: number },
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
    location: { ...center },
    metadata: {
      source: 'positions',
      measurementCount: 4,
      signalCount: 2,
      triangulatedPosition: {
        ...center,
        accuracyMeters,
        confidence,
      },
    },
    createdAt: timestamp,
  };
}

const SCENARIOS: ScenarioDefinition[] = [
  {
    deviceId: 'device-001',
    fingerprintHash: PERSONAS.delivery,
    signalType: 'cellular',
    threatLevel: 'low',
    visits: [
      {
        startHour: 10,
        startMinute: 15,
        durationMinutes: 5,
        positionsPerMinute: 2,
      },
      {
        startHour: 15,
        startMinute: 30,
        durationMinutes: 5,
        positionsPerMinute: 2,
      },
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
    fingerprintHash: PERSONAS.visitor,
    signalType: 'wifi',
    threatLevel: 'medium',
    visits: [
      {
        startHour: 8,
        startMinute: 0,
        durationMinutes: 3,
        positionsPerMinute: 2,
      },
      {
        startHour: 12,
        startMinute: 0,
        durationMinutes: 3,
        positionsPerMinute: 2,
      },
      {
        startHour: 18,
        startMinute: 0,
        durationMinutes: 3,
        positionsPerMinute: 2,
      },
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
    fingerprintHash: PERSONAS.loiterer,
    signalType: 'bluetooth',
    threatLevel: 'critical',
    visits: [
      {
        startHour: 1,
        startMinute: 30,
        durationMinutes: 45,
        positionsPerMinute: 2,
      },
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
    fingerprintHash: PERSONAS.vehicle,
    signalType: 'cellular',
    threatLevel: 'high',
    visits: [
      {
        startHour: 7,
        startMinute: 45,
        durationMinutes: 2,
        positionsPerMinute: 4,
      },
    ],
    pointForProgress: progress => ({
      northMeters: -20 + progress * 6,
      eastMeters: -210 + progress * 420,
      confidence: 64,
      detectionType: 'cellular',
    }),
  },
  {
    deviceId: 'device-002',
    fingerprintHash: PERSONAS.delivery,
    signalType: 'wifi',
    threatLevel: 'low',
    visits: [
      {
        startHour: 8,
        startMinute: 0,
        durationMinutes: 10,
        positionsPerMinute: 2,
      },
    ],
    pointForProgress: progress => ({
      northMeters: -50 + progress * 40,
      eastMeters: 12 * Math.sin(progress * Math.PI),
      confidence: 65 + progress * 25,
      detectionType: 'wifi',
    }),
  },
  {
    deviceId: 'device-002',
    fingerprintHash: PERSONAS.loiterer,
    signalType: 'bluetooth',
    threatLevel: 'high',
    visits: [
      {
        startHour: 22,
        startMinute: 15,
        durationMinutes: 20,
        positionsPerMinute: 2,
      },
    ],
    pointForProgress: (progress, minuteProgress) => ({
      northMeters: 30 + Math.sin(progress * Math.PI * 2) * 15,
      eastMeters: -40 + progress * 60,
      confidence: 80 - Math.abs(minuteProgress - 0.5) * 10,
      detectionType: 'bluetooth',
    }),
  },
];

export function generateReplayData(options: ReplayOptions = {}): ReplayData {
  const positions: ReplayPosition[] = [];
  const alerts: Alert[] = [];
  const baseDate = createBaseDate(options.date);
  const scenarios = options.deviceId
    ? SCENARIOS.filter(scenario => scenario.deviceId === options.deviceId)
    : SCENARIOS;
  let alertIndex = 0;

  for (const scenario of scenarios) {
    const center = getDeviceCenter(scenario.deviceId);

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
        const coords = toLatLng(point.northMeters, point.eastMeters, center);
        const accuracyMeters = 10 + (step % 5) * 2;
        const confidence = Math.round(
          Math.min(99, Math.max(55, point.confidence))
        );
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
          presenceCertainty: confidence,
          proximity: Math.max(0, Math.min(100, 100 - accuracyMeters * 2)),
          threatLevel: scenario.threatLevel,
          observedAt: timestamp,
        });

        alerts.push(
          createScenarioAlert(
            scenario,
            center,
            timestamp,
            alertIndex++,
            accuracyMeters,
            confidence
          )
        );
      }
    }
  }

  positions.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  alerts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return { positions, alerts };
}

export function generateReplayPositions(
  options: ReplayOptions = {}
): ReplayPosition[] {
  return generateReplayData(options).positions;
}

export const mockReplayData = generateReplayData();
export const mockReplayPositions = mockReplayData.positions;
