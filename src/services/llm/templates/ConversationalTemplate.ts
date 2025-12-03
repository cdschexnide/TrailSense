import { PromptTemplate } from './PromptTemplate';

/**
 * Chat Message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Conversation Context for chat
 */
export interface ConversationContext {
  messages: ChatMessage[];
  securityContext?: {
    recentAlerts: any[];
    deviceStatus: any[];
  };
}

/**
 * Conversational Template
 * Generates prompts for conversational security assistant
 */
export class ConversationalTemplate extends PromptTemplate {
  constructor() {
    const systemPrompt = `You are a helpful security assistant for TrailSense, a passive RF detection system designed for rural and off-grid properties. TrailSense detects nearby wireless devices (WiFi, Bluetooth, cellular) to provide early warning of approaching people or vehicles. There are NO cameras - this is a detection-only system.

Context: TrailSense is used on rural properties, ranches, farms, cabins, and remote locations where:
- Properties are large with long driveways
- Visitors are less frequent than urban areas
- Early warning of approaching vehicles/people is valuable
- There are no security cameras to check

You help property owners understand their detection data through natural conversation.

You have access to:
- Recent detection alerts (WiFi, Bluetooth, cellular signals detected)
- Detection device status (ESP32 sensors) and battery levels
- Whitelist of known/trusted devices
- Detection history and patterns

Guidelines:
- Be conversational and friendly (but professional)
- Answer questions based ONLY on provided data (never speculate)
- If you don't know something, say so
- Offer to help with follow-up questions
- Suggest actionable next steps when relevant (but never mention cameras)
- Keep responses concise (3-4 sentences max)
- Remember this is for RURAL properties - context matters`;

    super(systemPrompt);
  }

  /**
   * Build chat messages for conversational interaction
   */
  buildPrompt(
    context: ConversationContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const { messages, securityContext } = context;

    // Build conversation history (keep last 5 messages for context)
    const conversationHistory = this.formatConversationHistory(messages);

    // Add security context if available
    const contextInfo = this.formatSecurityContext(securityContext);

    // Build the user prompt
    const userPrompt = `${conversationHistory}${contextInfo}

Respond to the user's latest message helpfully and concisely.`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Format conversation history
   */
  private formatConversationHistory(messages: ChatMessage[]): string {
    // Keep last 5 messages for context
    const recentMessages = messages.slice(-5);

    if (recentMessages.length === 0) {
      return 'No conversation history.';
    }

    const formattedMessages = recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    });

    return formattedMessages.join('\n');
  }

  /**
   * Format security context
   */
  private formatSecurityContext(securityContext?: {
    recentAlerts: any[];
    deviceStatus: any[];
  }): string {
    if (!securityContext) {
      return '';
    }

    const { recentAlerts, deviceStatus } = securityContext;

    const recentAlertsCount = recentAlerts ? recentAlerts.length : 0;
    const activeDevicesCount = deviceStatus
      ? deviceStatus.filter(d => d.online).length
      : 0;
    const criticalAlertsCount = recentAlerts
      ? recentAlerts.filter(a => ['high', 'critical'].includes(a.threat_level))
          .length
      : 0;

    return `

Current Security Status:
- Recent Alerts (last 24h): ${recentAlertsCount}
- Active Devices: ${activeDevicesCount}
- High/Critical Alerts: ${criticalAlertsCount}`;
  }

  /**
   * Format alert summary for context
   */
  private formatAlertSummary(alert: any): string {
    const timestamp = this.formatDate(alert.timestamp);
    const type = alert.detection_type || 'unknown';
    const level = alert.threat_level || 'low';

    return `${timestamp}: ${type} detection, ${level} threat`;
  }

  /**
   * Build prompt for specific question types
   */
  buildQuestionPrompt(question: string, context: any): string {
    // Detect question type and customize prompt
    const questionLower = question.toLowerCase();

    if (
      questionLower.includes('alert') ||
      questionLower.includes('detection')
    ) {
      return this.buildAlertQuestionPrompt(question, context);
    }

    if (
      questionLower.includes('device') ||
      questionLower.includes('whitelist')
    ) {
      return this.buildDeviceQuestionPrompt(question, context);
    }

    if (questionLower.includes('status') || questionLower.includes('summary')) {
      return this.buildStatusQuestionPrompt(question, context);
    }

    // Default conversational prompt
    return this.buildPrompt(context);
  }

  /**
   * Build prompt for alert-related questions
   */
  private buildAlertQuestionPrompt(question: string, context: any): string {
    const alertInfo = context.recentAlerts
      ? this.formatAlertsList(context.recentAlerts)
      : 'No recent alerts';

    const userPrompt = `User Question: ${question}

Recent Alerts:
${alertInfo}

Answer the user's question based on the alert data provided.`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Build prompt for device-related questions
   */
  private buildDeviceQuestionPrompt(question: string, context: any): string {
    const deviceInfo = context.deviceStatus
      ? this.formatDeviceList(context.deviceStatus)
      : 'No device information available';

    const userPrompt = `User Question: ${question}

Known Devices:
${deviceInfo}

Answer the user's question based on the device data provided.`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Build prompt for status-related questions
   */
  private buildStatusQuestionPrompt(question: string, context: any): string {
    const statusSummary = this.formatSystemStatus(context);

    const userPrompt = `User Question: ${question}

System Status:
${statusSummary}

Provide a clear summary addressing the user's question.`;

    return this.buildFullPrompt(userPrompt);
  }

  /**
   * Format alerts list
   */
  private formatAlertsList(alerts: any[]): string {
    if (!alerts || alerts.length === 0) {
      return 'No alerts';
    }

    return alerts
      .slice(0, 5) // Show last 5 alerts
      .map(alert => this.formatAlertSummary(alert))
      .join('\n');
  }

  /**
   * Format device list
   */
  private formatDeviceList(devices: any[]): string {
    if (!devices || devices.length === 0) {
      return 'No devices';
    }

    return devices
      .slice(0, 10) // Show up to 10 devices
      .map(device => {
        const name =
          device.friendly_name || device.metadata?.device_name || 'Unknown';
        const status = device.online ? 'Active' : 'Inactive';
        const whitelisted = device.whitelisted ? '(Whitelisted)' : '';
        return `- ${name}: ${status} ${whitelisted}`;
      })
      .join('\n');
  }

  /**
   * Format system status
   */
  private formatSystemStatus(context: any): string {
    const parts: string[] = [];

    if (context.recentAlerts) {
      parts.push(`Recent alerts: ${context.recentAlerts.length}`);
    }

    if (context.deviceStatus) {
      const active = context.deviceStatus.filter((d: any) => d.online).length;
      parts.push(`Active devices: ${active}/${context.deviceStatus.length}`);
    }

    if (context.systemHealth) {
      parts.push(`System health: ${context.systemHealth}`);
    }

    return parts.join('\n') || 'Status information not available';
  }
}
