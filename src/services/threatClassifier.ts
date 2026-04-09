import { Alert, ThreatLevel } from '@types';

export class ThreatClassifier {
  static classifyAlert(alert: Alert): ThreatLevel {
    let score = 0;
    if (alert.detectionType === 'cellular') {
      score += 15;
    }
    score += Math.round(alert.confidence / 4);
    if (alert.accuracyMeters < 5) {
      score += 30;
    } else if (alert.accuracyMeters < 10) {
      score += 20;
    } else if (alert.accuracyMeters < 25) {
      score += 10;
    }

    // Time of day (nighttime is higher threat)
    const hour = new Date(alert.timestamp).getHours();
    if (hour >= 22 || hour <= 6) {
      score += 20; // Night time
    }

    // Movement pattern
    // Classify based on score
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  static categorizeDevice(alert: Alert): string {
    // Pattern recognition
    if (this.isDeliveryDriver(alert)) return 'Delivery Driver';
    if (this.isMailCarrier(alert)) return 'Mail Carrier';
    if (this.isNeighbor(alert)) return 'Neighbor';
    return 'Unknown';
  }

  private static isDeliveryDriver(alert: Alert): boolean {
    return alert.accuracyMeters >= 10 && this.detectedBetween(alert, 9, 20);
  }

  private static isMailCarrier(alert: Alert): boolean {
    const hour = new Date(alert.timestamp).getHours();
    return hour >= 10 && hour <= 14 && alert.confidence >= 70;
  }

  private static isNeighbor(alert: Alert): boolean {
    return alert.confidence >= 85 && alert.accuracyMeters >= 25;
  }

  private static detectedBetween(
    alert: Alert,
    startHour: number,
    endHour: number
  ): boolean {
    const hour = new Date(alert.timestamp).getHours();
    return hour >= startHour && hour <= endHour;
  }

  /**
   * Analyze detection patterns over time
   */
  static analyzePattern(alerts: Alert[]): {
    isRecurring: boolean;
    commonTimes: number[];
    averageDuration: number;
  } {
    if (alerts.length === 0) {
      return {
        isRecurring: false,
        commonTimes: [],
        averageDuration: 0,
      };
    }

    const sortedAlerts = [...alerts].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let totalDuration = 0;
    for (let index = 1; index < sortedAlerts.length; index += 1) {
      const previous = new Date(sortedAlerts[index - 1].timestamp).getTime();
      const current = new Date(sortedAlerts[index].timestamp).getTime();
      const deltaSeconds = Math.max(0, (current - previous) / 1000);
      totalDuration += Math.min(deltaSeconds, 15 * 60);
    }
    const averageDuration =
      sortedAlerts.length > 1 ? totalDuration / (sortedAlerts.length - 1) : 0;

    // Find common hours
    const hourCounts: Record<number, number> = {};
    alerts.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const commonTimes = Object.entries(hourCounts)
      .filter(([, count]) => count >= 2)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => hourCounts[b] - hourCounts[a]);

    // Determine if recurring (seen on multiple days)
    const dates = new Set(
      alerts.map(alert => new Date(alert.timestamp).toDateString())
    );
    const isRecurring = dates.size >= 3;

    return {
      isRecurring,
      commonTimes,
      averageDuration,
    };
  }
}
