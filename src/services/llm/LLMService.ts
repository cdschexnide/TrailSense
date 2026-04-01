import { modelManager } from './modelManager';
import { inferenceEngine } from './inferenceEngine';
import { responseCache } from './cache/ResponseCache';
import { llmLogger } from '@/utils/llmLogger';
import { LLM_CONFIG } from '@/config/llmConfig';
import {
  LLMRequest,
  LLMResponse,
  AlertSummary,
  PatternAnalysis,
  ChatResponse,
  AlertContext,
  DeviceContext,
  ConversationContext,
} from '@/types/llm';
import {
  AlertSummaryTemplate,
  PatternAnalysisTemplate,
  ConversationalTemplate,
} from './templates';

/**
 * Unified LLM Service
 * Main entry point for all LLM features in TrailSense
 */
class LLMService {
  // Template instances
  private alertSummaryTemplate = new AlertSummaryTemplate();
  private patternAnalysisTemplate = new PatternAnalysisTemplate();
  private conversationalTemplate = new ConversationalTemplate();

  // Idle timeout management
  private idleTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Initialize LLM service (load model)
   */
  async initialize(): Promise<void> {
    llmLogger.info('Initializing LLM service...');

    try {
      await modelManager.loadModel();
      this.resetIdleTimer();
      llmLogger.info('LLM service initialized successfully');
    } catch (error) {
      llmLogger.error('Failed to initialize LLM service', error);
      throw error;
    }
  }

  /**
   * Shutdown LLM service (unload model)
   */
  async shutdown(): Promise<void> {
    llmLogger.info('Shutting down LLM service...');

    try {
      // Clear idle timer
      if (this.idleTimeoutId) {
        clearTimeout(this.idleTimeoutId);
        this.idleTimeoutId = null;
      }

      // Unload model
      await modelManager.unloadModel();

      llmLogger.info('LLM service shutdown complete');
    } catch (error) {
      llmLogger.error('Error during LLM service shutdown', error);
    }
  }

  /**
   * Generate alert summary with natural language
   */
  async generateAlertSummary(context: AlertContext): Promise<AlertSummary> {
    try {
      llmLogger.info('Generating alert summary', {
        alertId: context.alert.id,
      });

      // Build chat messages
      const messages = this.alertSummaryTemplate.buildPrompt(context);

      // Generate cache key from message content
      const messageContent = messages.map(m => m.content).join('\n');
      const cacheKey = responseCache.generateCacheKey(messageContent, {
        alertId: context.alert.id,
        threatLevel: context.alert.threat_level,
      });

      // Generate response
      const response = await this.generate({
        messages,
        context,
        options: {
          maxTokens: LLM_CONFIG.ALERT_SUMMARIES.MAX_TOKENS,
          temperature: LLM_CONFIG.ALERT_SUMMARIES.TEMPERATURE,
        },
        cacheKey: LLM_CONFIG.ENABLE_CACHING ? cacheKey : undefined,
      });

      // Parse and return structured response
      return this.parseAlertSummary(response.text);
    } catch (error) {
      llmLogger.error('Failed to generate alert summary', error);
      throw error;
    }
  }

  /**
   * Analyze device pattern and suggest Known Devices action
   */
  async analyzeDevicePattern(context: DeviceContext): Promise<PatternAnalysis> {
    try {
      llmLogger.info('Analyzing device pattern', {
        deviceId: context.device.mac_address,
        detectionCount: context.detectionHistory.length,
      });

      // Build chat messages
      const messages = this.patternAnalysisTemplate.buildPrompt(context);

      // Generate cache key from message content
      const messageContent = messages.map(m => m.content).join('\n');
      const cacheKey = responseCache.generateCacheKey(messageContent, {
        deviceId: context.device.mac_address,
        detectionCount: context.detectionHistory.length,
      });

      // Generate response
      const response = await this.generate({
        messages,
        context,
        options: {
          maxTokens: LLM_CONFIG.PATTERN_ANALYSIS.MAX_TOKENS,
          temperature: LLM_CONFIG.PATTERN_ANALYSIS.TEMPERATURE,
        },
        cacheKey: LLM_CONFIG.ENABLE_CACHING ? cacheKey : undefined,
      });

      // Parse and return structured response
      return this.parsePatternAnalysis(response.text);
    } catch (error) {
      llmLogger.error('Failed to analyze device pattern', error);
      throw error;
    }
  }

  /**
   * Handle conversational query
   */
  async chat(context: ConversationContext): Promise<ChatResponse> {
    try {
      llmLogger.info('Processing chat message', {
        messageCount: context.messages.length,
      });

      // Build chat messages
      const messages = this.conversationalTemplate.buildPrompt(context);

      // Generate response (don't cache conversational responses)
      const response = await this.generate({
        messages,
        context,
        options: {
          maxTokens: LLM_CONFIG.CONVERSATIONAL.MAX_TOKENS,
          temperature: LLM_CONFIG.CONVERSATIONAL.TEMPERATURE,
        },
      });

      return {
        message: response.text,
        confidence: 0.8, // TODO: Calculate actual confidence from response
      };
    } catch (error) {
      llmLogger.error('Failed to process chat message', error);
      throw error;
    }
  }

  /**
   * Low-level generate method
   * This is the core method that all feature-specific methods use
   */
  private async generate(request: LLMRequest): Promise<LLMResponse> {
    const { messages, context, options, cacheKey } = request;

    // Check cache if key provided
    if (cacheKey && LLM_CONFIG.ENABLE_CACHING) {
      const cached = await responseCache.get(cacheKey);
      if (cached) {
        llmLogger.info('Using cached response', { cacheKey });

        return {
          text: cached,
          tokensGenerated: inferenceEngine.estimatePromptTokens(cached),
          inferenceTimeMs: 0,
          cached: true,
        };
      }
    }

    // Ensure model is loaded
    if (!modelManager.isModelLoaded()) {
      llmLogger.info('Model not loaded, loading now...');
      await modelManager.loadModel();
    }

    // Generate response using chat messages
    const startTime = Date.now();
    const text = await inferenceEngine.generate(messages, options);
    const inferenceTimeMs = Date.now() - startTime;

    const tokensGenerated = inferenceEngine.estimatePromptTokens(text);

    // Cache if key provided
    if (cacheKey && LLM_CONFIG.ENABLE_CACHING) {
      const messageContent = messages.map(m => m.content).join('\n');
      await responseCache.set(cacheKey, messageContent, text, tokensGenerated);
    }

    // Reset idle timer after successful generation
    this.resetIdleTimer();

    return {
      text,
      tokensGenerated,
      inferenceTimeMs,
      cached: false,
    };
  }

  /**
   * Parse alert summary from LLM response
   */
  private parseAlertSummary(text: string): AlertSummary {
    // Simple parsing - in production, use more robust parsing or structured output
    // For now, treat the entire response as the summary

    // Try to extract sections if they exist
    const lines = text
      .trim()
      .split('\n')
      .filter(line => line.trim());

    let summary = text;
    let threatExplanation =
      'Threat level determined by proximity and behavior patterns';
    let recommendedActions: string[] = [];

    // Try to extract numbered or bulleted actions
    const actionLines = lines.filter(
      line =>
        line.match(/^[\d\-\•]\s*/) ||
        line.toLowerCase().includes('action') ||
        line.toLowerCase().includes('recommend')
    );

    if (actionLines.length > 0) {
      recommendedActions = actionLines
        .map(line => line.replace(/^[\d\-\•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // If no specific actions found, provide default
    if (recommendedActions.length === 0) {
      recommendedActions = ['Review alert details', 'Check security cameras'];
    }

    return {
      summary: summary.trim(),
      threatExplanation,
      recommendedActions,
      confidence: 0.8, // TODO: Calculate actual confidence
    };
  }

  /**
   * Parse pattern analysis from LLM response
   */
  private parsePatternAnalysis(text: string): PatternAnalysis {
    // Simple parsing - in production, use more robust parsing or structured output
    const textLower = text.toLowerCase();

    // Detect pattern type
    let patternType: PatternAnalysis['patternType'] = 'unknown';

    if (textLower.includes('delivery')) {
      patternType = 'delivery';
    } else if (textLower.includes('neighbor')) {
      patternType = 'neighbor';
    } else if (textLower.includes('routine') || textLower.includes('regular')) {
      patternType = 'routine';
    } else if (
      textLower.includes('suspicious') ||
      textLower.includes('concern')
    ) {
      patternType = 'suspicious';
    }

    // Detect confidence
    let confidence = 0.7;

    if (
      textLower.includes('high confidence') ||
      textLower.includes('very confident')
    ) {
      confidence = 0.9;
    } else if (
      textLower.includes('medium confidence') ||
      textLower.includes('moderate')
    ) {
      confidence = 0.7;
    } else if (
      textLower.includes('low confidence') ||
      textLower.includes('uncertain')
    ) {
      confidence = 0.5;
    }

    // Try to extract Known Devices suggestion
    let whitelistSuggestion: PatternAnalysis['whitelistSuggestion'];

    if (
      (textLower.includes('whitelist') ||
        textLower.includes('known device')) &&
      textLower.includes('suggest')
    ) {
      whitelistSuggestion = {
        name:
          patternType === 'delivery'
            ? 'Delivery Driver'
            : patternType === 'neighbor'
              ? 'Neighbor Device'
              : 'Routine Visitor',
        category: patternType,
        reason: 'Regular detection pattern identified',
      };
    }

    return {
      patternType,
      description: text.trim(),
      confidence,
      whitelistSuggestion,
    };
  }

  /**
   * Reset idle timer (unload model after inactivity)
   */
  private resetIdleTimer(): void {
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
    }

    if (LLM_CONFIG.UNLOAD_MODEL_AFTER_IDLE_MS > 0) {
      this.idleTimeoutId = setTimeout(async () => {
        llmLogger.info('Model idle timeout reached, unloading...');

        try {
          await modelManager.unloadModel();
        } catch (error) {
          llmLogger.error('Error unloading model during idle timeout', error);
        }
      }, LLM_CONFIG.UNLOAD_MODEL_AFTER_IDLE_MS);
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return modelManager.isModelLoaded();
  }

  /**
   * Get service status
   */
  getStatus(): {
    isReady: boolean;
    modelLoaded: boolean;
    modelLoading: boolean;
  } {
    return {
      isReady: this.isReady(),
      modelLoaded: modelManager.isModelLoaded(),
      modelLoading: modelManager.isModelLoading(),
    };
  }

  /**
   * Preload responses for common queries (optimization)
   */
  async preloadAlertSummaries(alerts: any[]): Promise<void> {
    if (!LLM_CONFIG.ALERT_SUMMARIES.ENABLE_PRELOADING) {
      return;
    }

    try {
      llmLogger.info('Preloading alert summaries', {
        count: alerts.length,
      });

      // Filter to high/critical alerts only
      const criticalAlerts = alerts
        .filter(a =>
          LLM_CONFIG.ALERT_SUMMARIES.AUTO_GENERATE_FOR_THREATS.includes(
            a.threat_level
          )
        )
        .slice(0, LLM_CONFIG.ALERT_SUMMARIES.PRELOAD_LIMIT);

      // Generate summaries in background (don't await)
      const promises = criticalAlerts.map(alert =>
        this.generateAlertSummary({ alert }).catch(error => {
          llmLogger.debug('Preload failed for alert', {
            alertId: alert.id,
            error,
          });
        })
      );

      // Don't wait for all to complete
      Promise.all(promises).catch(() => {
        // Silently fail - preloading is optional
      });
    } catch (error) {
      llmLogger.error('Error during preload', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    await responseCache.clear();
    llmLogger.info('All caches cleared');
  }
}

// Export singleton instance
export const llmService = new LLMService();
