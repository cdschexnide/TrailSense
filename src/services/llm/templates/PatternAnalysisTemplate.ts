import { PromptTemplate } from './PromptTemplate';

/**
 * Device Context for pattern analysis
 */
export interface DeviceContext {
  device: any;
  detectionHistory: any[];
  similarDevices?: any[];
}

/**
 * Pattern Analysis Template
 * Generates prompts for analyzing device detection patterns
 */
export class PatternAnalysisTemplate extends PromptTemplate {
  constructor() {
    const systemPrompt = `You are a pattern recognition expert for a security system. Analyze device detection patterns to identify routine visitors, suspicious behavior, and suggest appropriate actions.

Common patterns:
- Delivery driver: Weekdays, same time, stays in FAR zone (street)
- Mail carrier: Weekdays, morning, brief visits
- Neighbor: Regular times, EXTREME zone (property boundary)
- Routine visitor: Same days/times, approaches property
- Suspicious: Irregular times, especially nighttime, stationary

Your analysis should:
- Identify the most likely pattern type
- Explain the reasoning clearly
- Suggest if device should be whitelisted
- Recommend a friendly name if whitelisting`;

    super(systemPrompt);
  }

  /**
   * Build chat messages for pattern analysis
   */
  buildPrompt(context: DeviceContext): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
    const { device, detectionHistory, similarDevices } = context;

    // Extract device details
    const macAddress = device.mac_address || 'Unknown';
    const deviceName = this.getDeviceName(device);
    const firstSeen = device.first_seen;
    const totalDetections = detectionHistory.length;

    // Analyze detection times
    const detections = this.formatDetections(detectionHistory);
    const timeAnalysis = this.analyzeDetectionTimes(detectionHistory);
    const zoneAnalysis = this.analyzeDetectionZones(detectionHistory);

    // Build the user prompt
    const userPrompt = `Analyze this device's detection pattern:

Device ID: ${macAddress}
Device Name: ${deviceName}
First Seen: ${this.formatDate(firstSeen)}
Total Detections: ${totalDetections}

Detection Schedule:
${detections}

Time Pattern: ${timeAnalysis}
Location Pattern: ${zoneAnalysis}

${similarDevices && similarDevices.length > 0 ? this.formatSimilarDevices(similarDevices) : ''}

Based on this pattern:
1. What type of visitor is this likely to be? (delivery, neighbor, routine, suspicious, or unknown)
2. Why do you think this?
3. Should this device be whitelisted? If yes, suggest a name and category.
4. Provide confidence level (low/medium/high)`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Get device name from metadata
   */
  private getDeviceName(device: any): string {
    const metadata = device.metadata || {};
    return metadata.ssid || metadata.device_name || metadata.manufacturer || 'Unknown';
  }

  /**
   * Format detection history
   */
  private formatDetections(detectionHistory: any[]): string {
    // Show last 10 detections
    const recent = detectionHistory.slice(0, 10);

    return recent
      .map((alert) => {
        const day = this.formatDayOfWeek(alert.timestamp);
        const time = this.formatTime(alert.timestamp);
        const zone = alert.zone || 'unknown';
        const duration = alert.metadata?.duration || 'unknown';

        return `- ${day} at ${time}, ${zone} zone, duration: ${duration}`;
      })
      .join('\n');
  }

  /**
   * Analyze detection times
   */
  private analyzeDetectionTimes(detectionHistory: any[]): string {
    if (detectionHistory.length === 0) return 'No detections to analyze';

    // Group by time of day
    const morningCount = detectionHistory.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 6 && hour < 12;
    }).length;

    const afternoonCount = detectionHistory.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 12 && hour < 18;
    }).length;

    const eveningCount = detectionHistory.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 18 && hour < 22;
    }).length;

    const nightCount = detectionHistory.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 22 || hour < 6;
    }).length;

    // Group by day of week
    const weekdayCount = detectionHistory.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day >= 1 && day <= 5;
    }).length;

    const weekendCount = detectionHistory.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day === 0 || day === 6;
    }).length;

    return `Morning: ${morningCount}, Afternoon: ${afternoonCount}, Evening: ${eveningCount}, Night: ${nightCount}; Weekdays: ${weekdayCount}, Weekends: ${weekendCount}`;
  }

  /**
   * Analyze detection zones
   */
  private analyzeDetectionZones(detectionHistory: any[]): string {
    if (detectionHistory.length === 0) return 'No detections to analyze';

    const zoneCounts: Record<string, number> = {};

    detectionHistory.forEach(alert => {
      const zone = alert.zone || 'unknown';
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });

    const zoneStrings = Object.entries(zoneCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([zone, count]) => `${zone}: ${count}`)
      .join(', ');

    return zoneStrings;
  }

  /**
   * Format similar devices
   */
  private formatSimilarDevices(similarDevices: any[]): string {
    if (similarDevices.length === 0) return '';

    const deviceList = similarDevices
      .slice(0, 3) // Show top 3 similar devices
      .map(d => {
        const name = d.friendly_name || d.metadata?.device_name || 'Unknown';
        const similarity = d.similarity_score ? `${(d.similarity_score * 100).toFixed(0)}%` : 'N/A';
        return `- ${name} (${similarity} similar)`;
      })
      .join('\n');

    return `Similar devices in system:\n${deviceList}`;
  }
}
