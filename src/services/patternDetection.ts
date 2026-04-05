import { Alert } from '@types';

export interface VisitPattern {
  totalVisits: number;
  visitsThisWeek: number;
  averageArrivalHour: number | null;
  dayOfWeekFrequency: Record<string, number>;
  timeOfDayClusters: Array<{ start: number; end: number; count: number }>;
  firstSeen: string;
  lastSeen: string;
  isNew: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function computeVisitPattern(
  allAlerts: Alert[],
  fingerprintHash: string
): VisitPattern {
  const deviceAlerts = allAlerts
    .filter(alert => alert.fingerprintHash === fingerprintHash)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  if (deviceAlerts.length === 0) {
    return {
      totalVisits: 0,
      visitsThisWeek: 0,
      averageArrivalHour: null,
      dayOfWeekFrequency: {},
      timeOfDayClusters: [],
      firstSeen: '',
      lastSeen: '',
      isNew: true,
    };
  }

  const dayOfWeekFrequency: Record<string, number> = {};
  DAY_NAMES.forEach(day => {
    dayOfWeekFrequency[day] = 0;
  });

  const hours = deviceAlerts.map(alert => {
    const date = new Date(alert.timestamp);
    dayOfWeekFrequency[DAY_NAMES[date.getDay()]] += 1;
    return date.getHours();
  });

  const averageArrivalHour = Math.round(
    hours.reduce((sum, hour) => sum + hour, 0) / hours.length
  );

  const sortedHours = [...hours].sort((a, b) => a - b);
  const timeOfDayClusters: Array<{
    start: number;
    end: number;
    count: number;
  }> = [];
  let clusterStart = sortedHours[0];
  let clusterEnd = sortedHours[0];
  let clusterCount = 1;

  for (let i = 1; i < sortedHours.length; i += 1) {
    if (sortedHours[i] - clusterEnd <= 2) {
      clusterEnd = sortedHours[i];
      clusterCount += 1;
    } else {
      timeOfDayClusters.push({
        start: clusterStart,
        end: clusterEnd,
        count: clusterCount,
      });
      clusterStart = sortedHours[i];
      clusterEnd = sortedHours[i];
      clusterCount = 1;
    }
  }

  timeOfDayClusters.push({
    start: clusterStart,
    end: clusterEnd,
    count: clusterCount,
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const visitsThisWeek = deviceAlerts.filter(
    alert => new Date(alert.timestamp) >= weekAgo
  ).length;

  return {
    totalVisits: deviceAlerts.length,
    visitsThisWeek,
    averageArrivalHour,
    dayOfWeekFrequency,
    timeOfDayClusters: timeOfDayClusters.sort((a, b) => b.count - a.count),
    firstSeen: deviceAlerts[0].timestamp,
    lastSeen: deviceAlerts[deviceAlerts.length - 1].timestamp,
    isNew: deviceAlerts.length < 3,
  };
}

export function generateInsightText(pattern: VisitPattern): string {
  if (pattern.totalVisits === 0) {
    return 'No detections recorded for this device yet.';
  }

  if (pattern.isNew) {
    return `First detected ${formatDate(pattern.firstSeen)}. No established pattern yet.`;
  }

  const activeDays = Object.entries(pattern.dayOfWeekFrequency)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const lines: string[] = [];
  const topCluster = pattern.timeOfDayClusters[0];

  if (activeDays.length > 0 && topCluster) {
    lines.push(
      `Most visits happen on ${activeDays
        .slice(0, 3)
        .map(([day]) => day)
        .join(', ')} between ${formatHour(topCluster.start)} and ${formatHour(
        topCluster.end
      )}.`
    );
  }

  if (pattern.visitsThisWeek > pattern.totalVisits / 4) {
    lines.push(
      `${pattern.visitsThisWeek} visits occurred in the last week out of ${pattern.totalVisits} total detections.`
    );
  }

  return (
    lines.join(' ') ||
    `Detected ${pattern.totalVisits} times since ${formatDate(pattern.firstSeen)}.`
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return timestamp;
  }
}
