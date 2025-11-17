import { Alert, ThreatLevel } from '@types';

export class ThreatClassifier {
  static classifyAlert(alert: Alert): ThreatLevel {
    let score = 0;

    // Cellular-only detection (WiFi/BT disabled)
    if (
      alert.detectionType === 'cellular' &&
      !alert.wifiDetected &&
      !alert.bluetoothDetected
    ) {
      score += 40; // Suspicious - stealth mode
    }

    // Multi-band detection
    if (alert.multiband) {
      score += 20; // High confidence
    }

    // Signal strength (closer = higher threat)
    if (alert.rssi > -50) {
      score += 30; // Very close
    } else if (alert.rssi > -70) {
      score += 15; // Moderately close
    }

    // Time of day (nighttime is higher threat)
    const hour = new Date(alert.timestamp).getHours();
    if (hour >= 22 || hour <= 6) {
      score += 20; // Night time
    }

    // Movement pattern
    if (alert.isStationary) {
      score += 15; // Lurking
    }

    // Repeat visitor
    if (alert.seenCount > 3) {
      score -= 30; // Likely familiar
    }

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
    // Check for quick visit pattern
    return (
      alert.duration < 300 && // Less than 5 minutes
      this.detectedBetween(alert, 9, 20)
    ); // Business hours
  }

  private static isMailCarrier(alert: Alert): boolean {
    // Check for regular daily pattern around mail delivery time
    const hour = new Date(alert.timestamp).getHours();
    return hour >= 10 && hour <= 14 && alert.seenCount > 5;
  }

  private static isNeighbor(alert: Alert): boolean {
    // Frequent visitor with longer duration
    return alert.seenCount > 10 && alert.duration > 600;
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

    // Calculate average duration
    const totalDuration = alerts.reduce((sum, alert) => sum + alert.duration, 0);
    const averageDuration = totalDuration / alerts.length;

    // Find common hours
    const hourCounts: Record<number, number> = {};
    alerts.forEach((alert) => {
      const hour = new Date(alert.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const commonTimes = Object.entries(hourCounts)
      .filter(([_, count]) => count >= 2)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => hourCounts[b] - hourCounts[a]);

    // Determine if recurring (seen on multiple days)
    const dates = new Set(
      alerts.map((alert) => new Date(alert.timestamp).toDateString())
    );
    const isRecurring = dates.size >= 3;

    return {
      isRecurring,
      commonTimes,
      averageDuration,
    };
  }
}
