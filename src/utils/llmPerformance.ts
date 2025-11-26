import { llmLogger } from './llmLogger';

interface PerformanceMetrics {
  modelLoadTime?: number;
  inferenceTime?: number;
  tokenCount?: number;
  tokensPerSecond?: number;
  memoryUsed?: number;
  timestamp: number;
}

class LLMPerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100;

  startTimer(operation: string): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      llmLogger.debug(`${operation} took ${duration}ms`);
      return duration;
    };
  }

  recordInference(durationMs: number, tokenCount: number) {
    const metric: PerformanceMetrics = {
      inferenceTime: durationMs,
      tokenCount,
      tokensPerSecond: (tokenCount / durationMs) * 1000,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    llmLogger.info(`Inference: ${durationMs}ms, ${metric.tokensPerSecond.toFixed(1)} tokens/sec`);
  }

  recordModelLoad(durationMs: number) {
    const metric: PerformanceMetrics = {
      modelLoadTime: durationMs,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    llmLogger.info(`Model loaded in ${durationMs}ms`);
  }

  getAverageInferenceTime(): number {
    const inferenceMetrics = this.metrics.filter(m => m.inferenceTime !== undefined);
    if (inferenceMetrics.length === 0) return 0;

    const sum = inferenceMetrics.reduce((acc, m) => acc + (m.inferenceTime || 0), 0);
    return sum / inferenceMetrics.length;
  }

  getAverageTokensPerSecond(): number {
    const inferenceMetrics = this.metrics.filter(m => m.tokensPerSecond !== undefined);
    if (inferenceMetrics.length === 0) return 0;

    const sum = inferenceMetrics.reduce((acc, m) => acc + (m.tokensPerSecond || 0), 0);
    return sum / inferenceMetrics.length;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
    llmLogger.info('Performance metrics cleared');
  }
}

export const performanceTracker = new LLMPerformanceTracker();
