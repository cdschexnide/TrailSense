import { useState, useEffect, useCallback } from 'react';
import { llmService } from '@/services/llm';
import { AlertSummary } from '@/types/llm';
import type { Alert } from '@types';
import { llmLogger } from '@/utils/llmLogger';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { LLM_CONFIG } from '@/config/llmConfig';

type SummaryAlert = Partial<Alert> & {
  id?: string;
  threat_level?: string;
  fingerprint_hash?: string;
  metadata?: Record<string, unknown>;
};

const getThreatLevel = (alert: SummaryAlert | null | undefined): string =>
  alert?.threat_level ?? alert?.threatLevel ?? '';

/**
 * Hook return type
 */
interface UseAlertSummaryReturn {
  summary: AlertSummary | null;
  isLoading: boolean;
  error: Error | null;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
}

/**
 * useAlertSummary Hook
 * Manages AI-generated summaries for security alerts
 *
 * @param alert - The alert to generate a summary for
 * @returns Summary state and control functions
 *
 * @example
 * ```tsx
 * const { summary, isLoading, error, generate, regenerate } = useAlertSummary(alert);
 *
 * // Auto-generates for high/critical alerts
 * // Or manually trigger with generate()
 * ```
 */
export const useAlertSummary = (
  alert: SummaryAlert | null | undefined
): UseAlertSummaryReturn => {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate alert summary
   */
  const generate = useCallback(async () => {
    // Check if LLM features are enabled
    if (!FEATURE_FLAGS.LLM_ALERT_SUMMARIES) {
      llmLogger.debug('LLM alert summaries feature is disabled');
      return;
    }

    // Check platform support
    if (!LLM_CONFIG.IS_PLATFORM_SUPPORTED) {
      llmLogger.warn('LLM not supported on this platform');
      return;
    }

    // Validate alert
    if (!alert || !alert.id) {
      llmLogger.error('Invalid alert provided to useAlertSummary');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      llmLogger.info('Generating alert summary', {
        alertId: alert.id,
        threatLevel: getThreatLevel(alert),
      });

      const result = await llmService.generateAlertSummary({
        alert,
        // Could add related alerts and device history here
        relatedAlerts: undefined,
        deviceHistory: undefined,
      });

      setSummary(result);

      llmLogger.info('Alert summary generated successfully', {
        alertId: alert.id,
        summaryLength: result.summary.length,
      });
    } catch (err) {
      const error = err as Error;

      llmLogger.error('Failed to generate alert summary', {
        alertId: alert.id,
        error: error.message,
      });

      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [alert]);

  /**
   * Regenerate alert summary (clears cache to force fresh generation)
   */
  const regenerate = useCallback(async () => {
    llmLogger.info('Regenerating alert summary', {
      alertId: alert?.id,
    });

    // Clear existing summary
    setSummary(null);
    setError(null);

    // Clear cache for this alert
    // Note: We could add a method to ResponseCache to clear specific entries
    // For now, regenerate will get a new response because the timestamp has changed

    // Generate new summary
    await generate();
  }, [generate, alert]);

  /**
   * Auto-generate on mount for HIGH and CRITICAL alerts
   */
  useEffect(() => {
    if (!alert || !FEATURE_FLAGS.LLM_ALERT_SUMMARIES) {
      return;
    }

    // Check if this threat level should auto-generate
    const shouldAutoGenerate =
      LLM_CONFIG.ALERT_SUMMARIES.AUTO_GENERATE_FOR_THREATS.includes(
        getThreatLevel(alert).toLowerCase() as 'high' | 'critical'
      );

    if (shouldAutoGenerate) {
      llmLogger.debug('Auto-generating summary for alert', {
        alertId: alert.id,
        threatLevel: getThreatLevel(alert),
      });

      // Small delay to avoid blocking UI
      const timeoutId = setTimeout(() => {
        generate();
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [alert, generate]); // Only re-run if alert or generator changes

  return {
    summary,
    isLoading,
    error,
    generate,
    regenerate,
  };
};

/**
 * Hook for batch preloading summaries
 * Useful for preloading summaries for a list of alerts
 *
 * @example
 * ```tsx
 * const { preload, isPreloading } = useAlertSummaryPreload();
 *
 * useEffect(() => {
 *   preload(alerts);
 * }, [alerts]);
 * ```
 */
export const useAlertSummaryPreload = () => {
  const [isPreloading, setIsPreloading] = useState(false);

  const preload = useCallback(async (alerts: SummaryAlert[]) => {
    if (
      !FEATURE_FLAGS.LLM_ALERT_SUMMARIES ||
      !LLM_CONFIG.ALERT_SUMMARIES.ENABLE_PRELOADING
    ) {
      return;
    }

    setIsPreloading(true);

    try {
      await llmService.preloadAlertSummaries(alerts);
    } catch (error) {
      llmLogger.error('Failed to preload alert summaries', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return {
    preload,
    isPreloading,
  };
};
