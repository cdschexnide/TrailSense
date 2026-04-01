import { database } from '@database';
import { Alert, DeviceFingerprint } from '@types';
import {
  computeVisitPattern,
  generateInsightText,
  VisitPattern,
} from './patternDetection';

export class DeviceFingerprintingService {
  static async trackDevice(macAddress: string, alert: Alert): Promise<void> {
    const fingerprint = await this.getOrCreateFingerprint(macAddress);

    fingerprint.detections.push({
      timestamp: alert.timestamp,
      rssi: alert.rssi,
      location: alert.location,
      type: alert.detectionType,
    });

    fingerprint.lastSeen = alert.timestamp;
    fingerprint.totalVisits++;

    // Calculate patterns
    fingerprint.averageDuration = this.calculateAverageDuration(
      fingerprint.detections
    );
    fingerprint.commonHours = this.findCommonHours(fingerprint.detections);

    await this.saveFingerprint(fingerprint);
  }

  static async getDeviceHistory(
    macAddress: string
  ): Promise<DeviceFingerprint> {
    return await database.fingerprints.findOne({ macAddress });
  }

  private static async getOrCreateFingerprint(
    macAddress: string
  ): Promise<DeviceFingerprint> {
    let fingerprint = await database.fingerprints.findOne({ macAddress });

    if (!fingerprint) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      fingerprint = {
        id: `fp-${timestamp}-${randomId}`,
        macAddress,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        totalVisits: 0,
        detections: [],
        averageDuration: 0,
        commonHours: [],
        category: 'Unknown',
      };
    }

    return fingerprint;
  }

  private static async saveFingerprint(
    fingerprint: DeviceFingerprint
  ): Promise<void> {
    await database.fingerprints.upsert(fingerprint);
  }

  private static calculateAverageDuration(
    detections: Array<{
      timestamp: string;
      rssi: number;
      location?: any;
      type: string;
    }>
  ): number {
    if (detections.length === 0) return 0;

    // Group detections by visit (consecutive detections within 5 minutes)
    const visits: Array<{ start: Date; end: Date }> = [];
    let currentVisit: { start: Date; end: Date } | null = null;

    detections.forEach((detection, index) => {
      const detectionTime = new Date(detection.timestamp);

      if (
        !currentVisit ||
        detectionTime.getTime() -
          new Date(detections[index - 1].timestamp).getTime() >
          5 * 60 * 1000
      ) {
        // New visit
        if (currentVisit) visits.push(currentVisit);
        currentVisit = { start: detectionTime, end: detectionTime };
      } else {
        // Continue current visit
        currentVisit.end = detectionTime;
      }
    });

    if (currentVisit) visits.push(currentVisit);

    // Calculate average duration
    const totalDuration = visits.reduce(
      (sum, visit) => sum + (visit.end.getTime() - visit.start.getTime()),
      0
    );

    return totalDuration / visits.length / 1000; // Return in seconds
  }

  private static findCommonHours(
    detections: Array<{ timestamp: string }>
  ): number[] {
    const hourCounts: Record<number, number> = {};

    detections.forEach(detection => {
      const hour = new Date(detection.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find hours that appear more than once
    return Object.entries(hourCounts)
      .filter(([_, count]) => count > 1)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => hourCounts[b] - hourCounts[a])
      .slice(0, 5); // Top 5 common hours
  }

  /**
   * Analyze all fingerprints to identify patterns
   */
  static async analyzeAllFingerprints(): Promise<{
    frequentVisitors: DeviceFingerprint[];
    newDevices: DeviceFingerprint[];
    suspiciousDevices: DeviceFingerprint[];
  }> {
    const allFingerprints: DeviceFingerprint[] = await database.fingerprints.find();

    const frequentVisitors = allFingerprints.filter(
      (fp: DeviceFingerprint) => fp.totalVisits >= 5
    );

    const newDevices = allFingerprints.filter(
      (fp: DeviceFingerprint) =>
        new Date().getTime() - new Date(fp.firstSeen).getTime() <
        7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    const suspiciousDevices = allFingerprints.filter(
      (fp: DeviceFingerprint) =>
        fp.commonHours.some((hour: number) => hour >= 22 || hour <= 6) && // Night activity
        fp.averageDuration < 300 // Short visits
    );

    return {
      frequentVisitors,
      newDevices,
      suspiciousDevices,
    };
  }

  static computeVisitPattern(alerts: Alert[], macAddress: string): VisitPattern {
    return computeVisitPattern(alerts, macAddress);
  }

  static generateInsightText(pattern: VisitPattern): string {
    return generateInsightText(pattern);
  }
}
