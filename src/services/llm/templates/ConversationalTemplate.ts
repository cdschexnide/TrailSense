import { PromptTemplate } from './PromptTemplate';
import type {
  AlertContext,
  ChatMessage,
  ConversationContext,
  Message as PromptMessage,
} from '@/types/llm';

type SecurityContext = NonNullable<ConversationContext['securityContext']>;

type SecurityDevice = SecurityContext['deviceStatus'][number] & {
  friendly_name?: string;
  metadata?: {
    device_name?: string;
  };
  whitelisted?: boolean;
};

type SecurityContextWithHealth = SecurityContext & {
  systemHealth?: string;
};

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
- Known Devices list of trusted devices
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

  buildPrompt(context: ConversationContext): PromptMessage[] {
    const { messages, securityContext } = context;
    const conversationHistory = this.formatConversationHistory(messages);
    const contextInfo = this.formatSecurityContext(securityContext);

    const userPrompt = `${conversationHistory}${contextInfo}

Respond to the user's latest message helpfully and concisely.`;

    return this.buildFullPrompt(userPrompt);
  }

  private formatConversationHistory(messages: ChatMessage[]): string {
    const recentMessages = messages.slice(-5);

    if (recentMessages.length === 0) {
      return 'No conversation history.';
    }

    return recentMessages
      .map(message => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${message.content}`;
      })
      .join('\n');
  }

  private formatSecurityContext(
    securityContext?: ConversationContext['securityContext']
  ): string {
    if (!securityContext) {
      return '';
    }

    // Use the pre-formatted contextString from useSecurityContext when available.
    // It includes alert details, device statuses, threat breakdown, and time
    // patterns — everything the model needs to answer data-specific questions.
    if (securityContext.contextString) {
      // Budget: ~800 tokens for context (~3200 chars) to leave room for
      // system prompt (~400 tokens), conversation history, and generation.
      return '\n\n' + this.truncateText(securityContext.contextString, 800);
    }

    // Fallback: basic counts when full context string isn't provided
    const { recentAlerts, deviceStatus } = securityContext;
    const recentAlertsCount = recentAlerts?.length ?? 0;
    const activeDevicesCount =
      deviceStatus?.filter(device => device.online).length ?? 0;
    const criticalAlertsCount =
      recentAlerts?.filter(alert =>
        ['high', 'critical'].includes(alert.threat_level ?? '')
      ).length ?? 0;

    return `

Current Security Status:
- Recent Alerts (last 24h): ${recentAlertsCount}
- Active Devices: ${activeDevicesCount}
- High/Critical Alerts: ${criticalAlertsCount}`;
  }

  private formatAlertSummary(alert: AlertContext['alert']): string {
    const timestamp = this.formatDate(alert.timestamp ?? Date.now());
    const type = alert.detection_type || 'unknown';
    const level = alert.threat_level || 'low';

    return `${timestamp}: ${type} detection, ${level} threat`;
  }

  buildQuestionPrompt(
    question: string,
    context: ConversationContext['securityContext'] = {
      recentAlerts: [],
      deviceStatus: [],
    }
  ): PromptMessage[] {
    const questionLower = question.toLowerCase();

    if (
      questionLower.includes('alert') ||
      questionLower.includes('detection')
    ) {
      return this.buildAlertQuestionPrompt(question, context);
    }

    if (
      questionLower.includes('device') ||
      questionLower.includes('whitelist') ||
      questionLower.includes('known device')
    ) {
      return this.buildDeviceQuestionPrompt(question, context);
    }

    if (questionLower.includes('status') || questionLower.includes('summary')) {
      return this.buildStatusQuestionPrompt(question, context);
    }

    return this.buildPrompt({
      messages: [{ role: 'user', content: question, timestamp: Date.now() }],
      securityContext: context,
    });
  }

  private buildAlertQuestionPrompt(
    question: string,
    context: ConversationContext['securityContext']
  ): PromptMessage[] {
    // Prefer the full contextString which has detailed alert info with
    // device names, signal strength, MAC addresses, and review status.
    const alertInfo = context?.contextString
      ? this.truncateText(context.contextString, 800)
      : context?.recentAlerts?.length
        ? this.formatAlertsList(context.recentAlerts)
        : 'No recent alerts';

    const userPrompt = `User Question: ${question}

${alertInfo}

Answer the user's question based on the alert data provided.`;

    return this.buildFullPrompt(userPrompt);
  }

  private buildDeviceQuestionPrompt(
    question: string,
    context: ConversationContext['securityContext']
  ): PromptMessage[] {
    const deviceInfo = context?.contextString
      ? this.truncateText(context.contextString, 800)
      : context?.deviceStatus?.length
        ? this.formatDeviceList(context.deviceStatus)
        : 'No device information available';

    const userPrompt = `User Question: ${question}

${deviceInfo}

Answer the user's question based on the device data provided.`;

    return this.buildFullPrompt(userPrompt);
  }

  private buildStatusQuestionPrompt(
    question: string,
    context: SecurityContextWithHealth
  ): PromptMessage[] {
    const statusSummary = context.contextString
      ? this.truncateText(context.contextString, 800)
      : this.formatSystemStatus(context);

    const userPrompt = `User Question: ${question}

${statusSummary}

Provide a clear summary addressing the user's question.`;

    return this.buildFullPrompt(userPrompt);
  }

  private formatAlertsList(alerts: SecurityContext['recentAlerts']): string {
    if (alerts.length === 0) {
      return 'No alerts';
    }

    return alerts
      .slice(0, 5)
      .map(alert => this.formatAlertSummary(alert))
      .join('\n');
  }

  private formatDeviceList(devices: SecurityContext['deviceStatus']): string {
    if (devices.length === 0) {
      return 'No devices';
    }

    return devices
      .slice(0, 10)
      .map(device => {
        const typedDevice = device as SecurityDevice;
        const name =
          typedDevice.friendly_name ||
          typedDevice.metadata?.device_name ||
          typedDevice.name ||
          'Unknown';
        const status = device.online ? 'Active' : 'Inactive';
        const whitelisted = typedDevice.whitelisted ? '(Known Device)' : '';
        return `- ${name}: ${status} ${whitelisted}`.trim();
      })
      .join('\n');
  }

  private formatSystemStatus(context: SecurityContextWithHealth): string {
    const parts: string[] = [];

    if (context.recentAlerts) {
      parts.push(`Recent alerts: ${context.recentAlerts.length}`);
    }

    if (context.deviceStatus) {
      const active = context.deviceStatus.filter(
        device => device.online
      ).length;
      parts.push(`Active devices: ${active}/${context.deviceStatus.length}`);
    }

    if (context.systemHealth) {
      parts.push(`System health: ${context.systemHealth}`);
    }

    return parts.join('\n') || 'Status information not available';
  }
}
