import { PromptTemplate } from './PromptTemplate';
import { AlertContext } from '@/types/llm';

/**
 * Alert Summary Template
 * Generates prompts for creating natural language explanations of security alerts
 */
export class AlertSummaryTemplate extends PromptTemplate {
  constructor() {
    const systemPrompt = `You are a security assistant for TrailSense, a passive RF detection system for rural and off-grid properties. TrailSense detects nearby wireless devices (WiFi, Bluetooth, cellular) to alert property owners of approaching people or vehicles. There are NO cameras - this is a detection-only system.

Guidelines:
- Be clear and concise (2-3 sentences max for summary)
- Explain WHY this detection matters for rural property security
- Provide specific, actionable recommendations appropriate for rural/remote properties
- Use appropriate urgency (but don't be alarmist)
- Never speculate beyond the data provided
- Use simple language (avoid jargon)

Context: TrailSense is used on rural properties, ranches, farms, cabins, and remote locations where:
- There are NO security cameras
- Properties may be large with long driveways
- Neighbors may be far away
- Cell service may be limited
- The goal is early warning of approaching visitors or intruders

Appropriate actions for different threat levels:
- CRITICAL: Secure the property, consider contacting authorities, have a safety plan ready
- HIGH: Investigate the area if safe, check if expecting visitors, monitor for movement patterns
- MEDIUM: Note the detection, check if it matches known patterns (delivery, neighbor), review later
- LOW: Routine detection, likely a passing vehicle or known device, no immediate action needed

DO NOT recommend:
- Checking security cameras (there are none)
- Reviewing video footage
- Any camera-related actions

DO recommend:
- Checking the detection area if safe to do so
- Reviewing the device's detection history for patterns
- Adding recognized devices to Known Devices
- Monitoring for recurring detections
- Contacting expected visitors to confirm arrival
- Being aware of the detection zone (immediate, near, far, extreme)`;

    super(systemPrompt);
  }

  /**
   * Build chat messages for alert summary generation
   */
  buildPrompt(
    context: AlertContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const { alert, relatedAlerts, deviceHistory } = context;

    // Extract alert details
    const detectionType = alert.detection_type || 'unknown';
    const rssi = alert.rssi || 0;
    const zone = alert.zone || this.getZoneFromRSSI(rssi);
    const threatLevel = alert.threat_level || 'low';
    const trend = alert.trend || 'unknown';
    const timestamp = alert.timestamp;

    // Get device info
    const deviceInfo = this.getDeviceInfo(alert);

    // Get movement trend description
    const trendDescription = this.getTrendDescription(trend);

    // Build the user prompt
    const userPrompt = `Summarize this security detection for a homeowner:

Detection Type: ${this.formatDetectionType(detectionType)}
Signal Strength: ${rssi} dBm
Proximity Zone: ${zone}
Threat Level: ${threatLevel.toUpperCase()}
Movement: ${trendDescription}
Device: ${deviceInfo}
Time: ${this.formatDate(timestamp)}

${relatedAlerts && relatedAlerts.length > 0 ? this.formatRelatedAlerts(relatedAlerts) : ''}

${deviceHistory ? this.formatDeviceHistory(deviceHistory) : ''}

Provide:
1. A clear summary (2-3 sentences) explaining what happened
2. Why this threat level was assigned
3. One specific action the homeowner should take`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Get proximity zone from RSSI value
   */
  private getZoneFromRSSI(rssi: number): string {
    if (rssi > -50) return 'IMMEDIATE (0-10 feet)';
    if (rssi > -70) return 'NEAR (10-50 feet)';
    if (rssi > -85) return 'FAR (50-200 feet)';
    return 'EXTREME (200+ feet)';
  }

  /**
   * Format detection type in human-readable form
   */
  private formatDetectionType(type: string): string {
    const typeMap: Record<string, string> = {
      wifi: 'WiFi Device',
      bluetooth: 'Bluetooth Device',
      ble: 'Bluetooth Low Energy Device',
      cellular: 'Cellular Device',
      multiband: 'Multi-Band Device (WiFi + Cellular)',
      unknown: 'Unknown Device Type',
    };

    return typeMap[type.toLowerCase()] || type;
  }

  /**
   * Get device information from alert metadata
   */
  private getDeviceInfo(alert: any): string {
    const metadata = alert.metadata || {};

    // Try to get meaningful device identifier
    const ssid = metadata.ssid;
    const deviceName = metadata.device_name;
    const manufacturer = metadata.manufacturer;
    const macAddress = alert.mac_address;

    if (ssid) return `"${ssid}" (WiFi network)`;
    if (deviceName) return `"${deviceName}"`;
    if (manufacturer) return `${manufacturer} device`;
    if (macAddress) return `Device ${macAddress.substring(0, 8)}...`;

    return 'Unknown device';
  }

  /**
   * Get trend description
   */
  private getTrendDescription(trend: string): string {
    const trendMap: Record<string, string> = {
      approaching: 'Approaching (signal getting stronger)',
      receding: 'Moving away (signal getting weaker)',
      stationary: 'Stationary (not moving)',
      intermittent: 'Intermittent (appearing and disappearing)',
      unknown: 'Unknown movement pattern',
    };

    return trendMap[trend.toLowerCase()] || trend;
  }

  /**
   * Format related alerts context
   */
  private formatRelatedAlerts(relatedAlerts: any[]): string {
    if (relatedAlerts.length === 0) return '';

    const recentCount = relatedAlerts.length;
    const timeWindow = this.getTimeWindow(relatedAlerts);

    return `Context: This device has been detected ${recentCount} time(s) in the last ${timeWindow}.`;
  }

  /**
   * Format device history context
   */
  private formatDeviceHistory(deviceHistory: any): string {
    if (!deviceHistory) return '';

    const firstSeen = deviceHistory.first_seen;
    const totalDetections = deviceHistory.detection_count || 0;
    const isWhitelisted = deviceHistory.whitelisted || false;

    if (isWhitelisted) {
      return `Note: This device is in Known Devices as "${deviceHistory.friendly_name || 'trusted device'}".`;
    }

    if (firstSeen && totalDetections > 1) {
      const daysSinceFirstSeen = Math.floor(
        (Date.now() - new Date(firstSeen).getTime()) / (1000 * 60 * 60 * 24)
      );

      return `Context: This device was first seen ${daysSinceFirstSeen} day(s) ago and has been detected ${totalDetections} times total.`;
    }

    return '';
  }

  /**
   * Get time window for related alerts
   */
  private getTimeWindow(alerts: any[]): string {
    if (alerts.length === 0) return 'unknown time';

    const timestamps = alerts.map(a => new Date(a.timestamp).getTime());
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);

    const diffMs = newest - oldest;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.round(diffHours * 60)} minutes`;
    if (diffHours < 24) return `${Math.round(diffHours)} hours`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} day(s)`;
  }
}
