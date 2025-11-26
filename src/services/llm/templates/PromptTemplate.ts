// Message type for chat format
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * Base Prompt Template Class
 * Abstract class for building structured prompts for LLM inference in chat format
 */
export abstract class PromptTemplate {
  protected systemPrompt: string;

  constructor(systemPrompt: string) {
    this.systemPrompt = systemPrompt;
  }

  /**
   * Build a complete set of chat messages from context
   * Must be implemented by subclasses
   */
  abstract buildPrompt(context: any): Message[];

  /**
   * Format context as JSON string
   */
  protected formatContext(context: any): string {
    try {
      return JSON.stringify(context, null, 2);
    } catch (error) {
      return String(context);
    }
  }

  /**
   * Build full chat messages with system prompt and user prompt
   */
  protected buildFullPrompt(userPrompt: string): Message[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Estimate token count for a prompt
   * This is a rough estimate (~4 characters per token)
   */
  getTokenEstimate(prompt: string): number {
    return Math.ceil(prompt.length / 4);
  }

  /**
   * Validate that prompt is not too long
   */
  validatePromptLength(prompt: string, maxTokens: number = 2048): boolean {
    const estimatedTokens = this.getTokenEstimate(prompt);
    return estimatedTokens <= maxTokens;
  }

  /**
   * Truncate text to fit within token limit
   */
  protected truncateText(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4; // Rough estimate

    if (text.length <= maxChars) {
      return text;
    }

    return text.substring(0, maxChars) + '...';
  }

  /**
   * Format a list of items as numbered or bulleted list
   */
  protected formatList(items: string[], numbered: boolean = false): string {
    return items
      .map((item, index) => {
        const prefix = numbered ? `${index + 1}.` : '-';
        return `${prefix} ${item}`;
      })
      .join('\n');
  }

  /**
   * Format a date/timestamp in human-readable format
   */
  protected formatDate(dateOrTimestamp: Date | string | number): string {
    try {
      const date = typeof dateOrTimestamp === 'string' || typeof dateOrTimestamp === 'number'
        ? new Date(dateOrTimestamp)
        : dateOrTimestamp;

      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return String(dateOrTimestamp);
    }
  }

  /**
   * Format time only (no date)
   */
  protected formatTime(dateOrTimestamp: Date | string | number): string {
    try {
      const date = typeof dateOrTimestamp === 'string' || typeof dateOrTimestamp === 'number'
        ? new Date(dateOrTimestamp)
        : dateOrTimestamp;

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return String(dateOrTimestamp);
    }
  }

  /**
   * Format day of week
   */
  protected formatDayOfWeek(dateOrTimestamp: Date | string | number): string {
    try {
      const date = typeof dateOrTimestamp === 'string' || typeof dateOrTimestamp === 'number'
        ? new Date(dateOrTimestamp)
        : dateOrTimestamp;

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
      });
    } catch (error) {
      return String(dateOrTimestamp);
    }
  }

  /**
   * Clean and sanitize user input
   */
  protected sanitizeInput(input: string): string {
    // Remove potentially problematic characters
    let sanitized = input.trim();

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Get system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }
}
