import { PromptTemplate } from './PromptTemplate';
import type {
  ChatMessage,
  IntentType,
  Message as PromptMessage,
} from '@/types/llm';

interface ConversationalPromptContext {
  messages: ChatMessage[];
  intent: IntentType;
  focusedContext: string;
}

const HELP_CONTEXT = `You are TrailSense AI, an on-device security assistant. You can answer questions about:
- Detection alerts (by threat level, type, or time)
- Sensor status (online/offline, battery)
- Activity patterns and suspicious behavior
- Time-based detection trends`;

export class ConversationalTemplate extends PromptTemplate {
  constructor() {
    super(`You are TrailSense AI. You answer questions about property security sensor data.

RULES:
1. ONLY state facts from the DATA section below. Never guess or add information.
2. If data is missing, say "I don't have that data" and stop.
3. Start with the direct answer. No preamble.
4. Reference specific names, numbers, and times from the data.
5. Keep your answer under 100 words.`);
  }

  buildPrompt(context: ConversationalPromptContext): PromptMessage[] {
    const { messages, intent, focusedContext } = context;
    const latestUserMessage = [...messages]
      .reverse()
      .find(message => message.role === 'user')?.content;

    const question = latestUserMessage || 'Summarize the current security data.';
    const trimmedContext =
      intent === 'help' ? HELP_CONTEXT : this.truncateText(focusedContext, 800);
    const userPrompt = this.buildIntentPrompt(intent, question, trimmedContext);

    return this.buildFullPrompt(userPrompt);
  }

  private buildIntentPrompt(
    intent: IntentType,
    question: string,
    focusedContext: string
  ): string {
    const sanitizedQuestion = this.sanitizeInput(question);

    switch (intent) {
      case 'alert_query':
        return `DATA:
${focusedContext}

QUESTION: ${sanitizedQuestion}

List each relevant alert with its threat level, detection type, sensor name, and time. Then give one sentence of analysis.`;
      case 'device_query':
        return `DATA:
${focusedContext}

QUESTION: ${sanitizedQuestion}

List each device with its status. Mention offline devices first. State battery levels and last seen times.`;
      case 'pattern_query':
        return `DATA:
${focusedContext}

QUESTION: ${sanitizedQuestion}

Describe the pattern you see in the data. Mention specific MAC addresses, times, and frequencies. Flag anything unusual.`;
      case 'time_query':
        return `DATA:
${focusedContext}

QUESTION: ${sanitizedQuestion}

Answer using specific hours and counts from the data.`;
      case 'help':
        return `${focusedContext}

QUESTION: ${sanitizedQuestion}

Answer briefly. If the question is about security data, say what specific question to ask.`;
      case 'status_overview':
      default:
        return `DATA:
${focusedContext}

QUESTION: ${sanitizedQuestion}

Start with the most urgent issue. Then summarize alert counts and device health. Keep it brief.`;
    }
  }
}
