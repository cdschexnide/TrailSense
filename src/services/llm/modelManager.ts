import { Platform } from 'react-native';
import { llmLogger } from '@/utils/llmLogger';
import { performanceTracker } from '@/utils/llmPerformance';
import { LLMError, LLMErrorCode } from '@/types/llm';
import { LLM_CONFIG } from '@/config/llmConfig';

// Conditionally import react-native-executorch to avoid crashes in Expo managed workflow
let LLMController: any = null;
let LLAMA3_2_1B: any = null;
let LLAMA3_2_TOKENIZER: any = null;
let LLAMA3_2_TOKENIZER_CONFIG: any = null;

try {
  const executorch = require('react-native-executorch');
  const controllers = require('react-native-executorch/src/controllers/LLMController');

  LLMController = controllers.LLMController;
  LLAMA3_2_1B = executorch.LLAMA3_2_1B;
  LLAMA3_2_TOKENIZER = executorch.LLAMA3_2_TOKENIZER;
  LLAMA3_2_TOKENIZER_CONFIG = executorch.LLAMA3_2_TOKENIZER_CONFIG;
} catch (error) {
  console.warn('[ModelManager] react-native-executorch not available. LLM features disabled.');
}

/**
 * Model Manager Service
 * Handles loading, unloading, and managing the LLM model using react-native-executorch
 */
export class ModelManager {
  private llmController: LLMController | null = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadAttempts: number = 0;
  private readonly MAX_LOAD_ATTEMPTS = 3;
  private downloadProgress: number = 0;

  /**
   * Check if ExecuTorch module is available
   */
  async isModuleAvailable(): Promise<boolean> {
    // Check if module was loaded
    if (!LLMController) {
      llmLogger.warn('react-native-executorch module not available (not installed or Expo managed workflow)');
      return false;
    }

    if (Platform.OS !== 'android') {
      llmLogger.warn('ExecuTorch only supported on Android');
      return false;
    }

    try {
      // The react-native-executorch package handles availability checks internally
      llmLogger.info('ExecuTorch module is available (using react-native-executorch package)');
      return true;
    } catch (error) {
      llmLogger.error('Error checking ExecuTorch availability', error);
      return false;
    }
  }

  /**
   * Load the LLM model into memory
   */
  async loadModel(): Promise<void> {
    // Check if already loaded
    if (this.isLoaded && this.llmController) {
      llmLogger.info('Model already loaded');
      return;
    }

    // Check if already loading
    if (this.isLoading) {
      llmLogger.warn('Model load already in progress');
      // Wait for current load to complete
      return this.waitForLoad();
    }

    // Check platform support
    if (!LLM_CONFIG.IS_PLATFORM_SUPPORTED) {
      throw new LLMError(
        LLMErrorCode.PLATFORM_NOT_SUPPORTED,
        'LLM features not supported on this platform'
      );
    }

    // Check if module is available
    const moduleAvailable = await this.isModuleAvailable();
    if (!moduleAvailable) {
      throw new LLMError(
        LLMErrorCode.MODULE_NOT_AVAILABLE,
        'ExecuTorch module not available'
      );
    }

    this.isLoading = true;
    this.loadAttempts++;
    const endTimer = performanceTracker.startTimer('Model Load');

    try {
      llmLogger.info('Loading Llama 3.2 1B model (built-in)...', {
        attempt: this.loadAttempts,
      });

      // Create LLMController instance
      this.llmController = new LLMController({
        tokenCallback: (token: string) => {
          // Handle streaming tokens if needed
          llmLogger.debug('Token received:', token.substring(0, 10) + '...');
        },
        isReadyCallback: (ready: boolean) => {
          llmLogger.info(`Model ready state: ${ready}`);
          this.isLoaded = ready;
        },
        isGeneratingCallback: (generating: boolean) => {
          llmLogger.debug(`Model generating: ${generating}`);
        },
        onDownloadProgressCallback: (progress: number) => {
          this.downloadProgress = progress;
          llmLogger.info(`Model download progress: ${(progress * 100).toFixed(1)}%`);
        },
      });

      // Load the built-in Llama 3.2 1B model
      await this.llmController.load({
        modelSource: LLAMA3_2_1B,
        tokenizerSource: LLAMA3_2_TOKENIZER,
        tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
      });

      const loadTime = endTimer();
      performanceTracker.recordModelLoad(loadTime);

      llmLogger.info(`Model loaded successfully in ${loadTime}ms`);

      this.isLoaded = true;
      this.loadAttempts = 0;
    } catch (error) {
      const loadTime = endTimer();
      llmLogger.error(`Failed to load model after ${loadTime}ms`, error);

      // Retry logic
      if (this.loadAttempts < this.MAX_LOAD_ATTEMPTS) {
        llmLogger.info(`Retrying model load (attempt ${this.loadAttempts + 1}/${this.MAX_LOAD_ATTEMPTS})`);

        // Wait before retry
        await this.sleep(LLM_CONFIG.RETRY_DELAY_MS);

        this.isLoading = false;
        return this.loadModel(); // Recursive retry
      }

      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Failed to load LLM model after multiple attempts',
        error
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Unload the model from memory
   */
  async unloadModel(): Promise<void> {
    if (!this.isLoaded) {
      llmLogger.info('Model not loaded, nothing to unload');
      return;
    }

    try {
      llmLogger.info('Unloading model...');

      // Release model resources using LLMController
      if (this.llmController) {
        this.llmController.delete();
      }

      // Clear references
      this.llmController = null;
      this.isLoaded = false;

      llmLogger.info('Model unloaded successfully');
    } catch (error) {
      llmLogger.error('Error unloading model', error);

      // Force clear even if release failed
      this.llmController = null;
      this.isLoaded = false;

      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Error unloading model',
        error
      );
    }
  }

  /**
   * Check if model is currently loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded && this.llmController !== null;
  }

  /**
   * Check if model is currently loading
   */
  isModelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get the loaded LLM controller instance
   */
  getModel(): LLMController {
    if (!this.isLoaded || !this.llmController) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_LOADED,
        'Model not loaded. Call loadModel() first.'
      );
    }

    return this.llmController;
  }

  /**
   * Get download progress (0-1)
   */
  getDownloadProgress(): number {
    return this.downloadProgress;
  }

  /**
   * Get model status information
   */
  getStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    loadAttempts: number;
  } {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      loadAttempts: this.loadAttempts,
    };
  }

  /**
   * Private: Wait for current load operation to complete
   */
  private async waitForLoad(maxWaitMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (this.isLoading) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new LLMError(
          LLMErrorCode.MODEL_LOAD_FAILED,
          'Timeout waiting for model to load'
        );
      }

      await this.sleep(100);
    }

    if (!this.isLoaded) {
      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Model load failed while waiting'
      );
    }
  }

  /**
   * Private: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset the manager state (for testing)
   */
  reset(): void {
    if (this.llmController) {
      try {
        this.llmController.delete();
      } catch (error) {
        llmLogger.error('Error deleting LLM controller during reset', error);
      }
    }
    this.llmController = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadAttempts = 0;
    this.downloadProgress = 0;
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
