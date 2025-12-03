import { modelManager } from './modelManager';
import { llmLogger } from '@/utils/llmLogger';
import { performanceTracker } from '@/utils/llmPerformance';
import {
  LLMError,
  LLMErrorCode,
  GenerationOptions,
  Message,
} from '@/types/llm';
import { LLM_CONFIG } from '@/config/llmConfig';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Inference Engine
 * Handles text generation using the loaded LLM model with chat message format
 *
 * Updated to use the new ModelManager API that properly wraps LLMModule
 */
export class InferenceEngine {
  private inferenceInProgress: boolean = false;

  /**
   * Generate text from chat messages
   * @param messages - Array of chat messages with role and content
   * @param options - Generation options (temperature, maxTokens, etc.)
   */
  async generate(
    messages: Message[],
    options: GenerationOptions = {}
  ): Promise<string> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new LLMError(
        LLMErrorCode.INVALID_INPUT,
        'Messages array cannot be empty'
      );
    }

    // Check if mock mode is enabled
    if (FEATURE_FLAGS.LLM_MOCK_MODE) {
      return this.generateMockResponse(messages, options);
    }

    // Ensure model is loaded
    if (!modelManager.isModelLoaded()) {
      llmLogger.info('Model not loaded, loading now...');
      await modelManager.loadModel();
    }

    // Set defaults
    const { timeout = LLM_CONFIG.INFERENCE_TIMEOUT_MS } = options;

    this.inferenceInProgress = true;
    const endTimer = performanceTracker.startTimer('Inference');

    try {
      const messagePreview = messages
        .map(m => `${m.role}: ${m.content.substring(0, 50)}...`)
        .join('; ');
      llmLogger.debug('Starting inference...', {
        messageCount: messages.length,
        messagePreview,
      });

      // Use modelManager.generate() which properly uses LLMModule.generate()
      // The response is built through streaming token callbacks
      const response = await modelManager.generate(messages);

      const inferenceTime = endTimer();
      const tokenCount = this.estimateTokenCount(response);

      performanceTracker.recordInference(inferenceTime, tokenCount);

      llmLogger.info(`Inference complete in ${inferenceTime}ms`, {
        tokenCount,
        tokensPerSecond: ((tokenCount / inferenceTime) * 1000).toFixed(1),
      });

      llmLogger.debug('Response preview', {
        preview: response.substring(0, 100) + '...',
      });

      return this.postProcessResponse(response);
    } catch (error) {
      const inferenceTime = endTimer();
      llmLogger.error(`Inference failed after ${inferenceTime}ms`, error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new LLMError(
            LLMErrorCode.INFERENCE_TIMEOUT,
            'Inference took too long to complete',
            error
          );
        }

        if (error.message.includes('memory') || error.message.includes('OOM')) {
          throw new LLMError(
            LLMErrorCode.OUT_OF_MEMORY,
            'Not enough memory for inference',
            error
          );
        }
      }

      throw new LLMError(
        LLMErrorCode.INFERENCE_FAILED,
        'Failed to generate response',
        error
      );
    } finally {
      this.inferenceInProgress = false;
    }
  }

  /**
   * Check if inference is currently in progress
   */
  isInferring(): boolean {
    return this.inferenceInProgress;
  }

  /**
   * Private: Post-process response (cleanup, formatting)
   */
  private postProcessResponse(response: string): string {
    let processed = response;

    // Trim whitespace
    processed = processed.trim();

    // Remove any trailing incomplete sentences (optional)
    // This is commented out as it might cut off valid responses
    // processed = processed.replace(/[^.!?]*$/, '').trim();

    // Remove duplicate newlines
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed;
  }

  /**
   * Private: Estimate token count from text
   */
  private estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token
    // This is approximate and should be replaced with actual tokenizer
    return Math.ceil(text.length / 4);
  }

  /**
   * Private: Generate mock response for development/testing
   */
  private async generateMockResponse(
    messages: Message[],
    options: GenerationOptions
  ): Promise<string> {
    llmLogger.info('Generating mock response (LLM_MOCK_MODE enabled)');

    // Simulate inference delay
    await new Promise(resolve =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    // Extract the user message content
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const combinedContent = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Generate mock responses based on message content
    if (
      combinedContent.includes('alert') ||
      combinedContent.includes('detection')
    ) {
      return 'This is a mock alert summary. A WiFi device was detected at -55 dBm, which indicates close proximity (within 10-20 feet). This signal strength suggests the device is in your immediate vicinity, possibly in your driveway or yard. Recommended action: Check your security cameras to see if anyone is nearby.';
    }

    if (
      combinedContent.includes('pattern') ||
      combinedContent.includes('device')
    ) {
      return 'This is a mock pattern analysis. Based on the detection history, this appears to be a routine visitor, likely a delivery driver. The device is detected on weekdays during typical delivery hours (10am-4pm) and stays in the FAR zone (street level). Confidence: High. Recommendation: Consider whitelisting this device as "Delivery Driver" to reduce false alerts.';
    }

    if (
      combinedContent.includes('conversation') ||
      combinedContent.includes('question')
    ) {
      return "This is a mock conversational response. I can help you understand your security data. Based on your recent alerts, everything looks normal with routine detections only. Is there something specific you'd like to know more about?";
    }

    // Default mock response
    return 'This is a mock AI response for development and testing purposes. The actual LLM inference is disabled (LLM_MOCK_MODE = true). To use real inference, set FEATURE_FLAGS.LLM_MOCK_MODE = false and ensure the model is downloaded and loaded.';
  }

  /**
   * Estimate tokens in messages before generation
   */
  estimatePromptTokens(textOrMessages: string | Message[]): number {
    if (typeof textOrMessages === 'string') {
      return this.estimateTokenCount(textOrMessages);
    }

    // For messages, combine all content and estimate
    const combined = textOrMessages.map(m => m.content).join('\n');
    return this.estimateTokenCount(combined);
  }

  /**
   * Check if messages are within context length limits
   */
  isPromptValid(messages: Message[]): boolean {
    const estimatedTokens = this.estimatePromptTokens(messages);
    return estimatedTokens <= LLM_CONFIG.CONTEXT_LENGTH;
  }
}

// Export singleton instance
export const inferenceEngine = new InferenceEngine();
