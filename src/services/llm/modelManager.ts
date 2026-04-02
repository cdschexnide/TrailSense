import { Platform } from 'react-native';
import { llmLogger } from '@/utils/llmLogger';
import { performanceTracker } from '@/utils/llmPerformance';
import { LLMError, LLMErrorCode, Message } from '@/types/llm';
import { LLM_CONFIG } from '@/config/llmConfig';

// Conditionally import react-native-executorch to avoid crashes in Expo managed workflow
let LLMModule: any = null;
let LLAMA3_2_1B: any = null;
let LLAMA3_2_1B_SPINQUANT: any = null;
let HAMMER2_1_1_5B_QUANTIZED: any = null;

try {
  const executorch = require('react-native-executorch');

  // Import LLMModule class and model constants directly
  LLMModule = executorch.LLMModule;
  LLAMA3_2_1B = executorch.LLAMA3_2_1B;
  LLAMA3_2_1B_SPINQUANT = executorch.LLAMA3_2_1B_SPINQUANT;
  HAMMER2_1_1_5B_QUANTIZED = executorch.HAMMER2_1_1_5B_QUANTIZED;

  console.log('[ModelManager] react-native-executorch loaded successfully');
  console.log('[ModelManager] LLMModule:', typeof LLMModule);
  console.log('[ModelManager] Available models:', {
    LLAMA3_2_1B: !!LLAMA3_2_1B,
    LLAMA3_2_1B_SPINQUANT: !!LLAMA3_2_1B_SPINQUANT,
    HAMMER2_1_1_5B_QUANTIZED: !!HAMMER2_1_1_5B_QUANTIZED,
  });
} catch (error) {
  console.warn(
    '[ModelManager] react-native-executorch not available. LLM features disabled.'
  );
  console.warn('[ModelManager] Error details:', error);
}

/**
 * Model Manager Service
 * Handles loading, unloading, and managing the LLM model using react-native-executorch
 *
 * Based on working implementation from mobile-llm using LLMModule API
 */
export class ModelManager {
  private llmModule: any = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadAttempts: number = 0;
  private readonly MAX_LOAD_ATTEMPTS = 3;
  private downloadProgress: number = 0;

  // Response state (updated via callbacks)
  private _response: string = '';
  private _token: string = '';
  private _messageHistory: Message[] = [];
  private _isGenerating: boolean = false;

  // Callbacks for external listeners
  public onTokenReceived?: (token: string) => void;
  public onResponseUpdated?: (response: string) => void;
  public onGeneratingChanged?: (isGenerating: boolean) => void;

  /**
   * Check if ExecuTorch module is available
   */
  async isModuleAvailable(): Promise<boolean> {
    // Check if module was loaded
    if (!LLMModule) {
      llmLogger.warn(
        'react-native-executorch LLMModule not available (not installed or Expo managed workflow)'
      );
      return false;
    }

    // Check platform - now supporting both Android and iOS
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      llmLogger.warn('ExecuTorch only supported on Android and iOS');
      return false;
    }

    try {
      llmLogger.info('ExecuTorch LLMModule is available');
      return true;
    } catch (error) {
      llmLogger.error('Error checking ExecuTorch availability', error);
      return false;
    }
  }

  /**
   * Load the LLM model into memory
   * Uses the correct LLMModule API from react-native-executorch
   */
  async loadModel(): Promise<void> {
    // Check if already loaded
    if (this.isLoaded && this.llmModule) {
      llmLogger.info('Model already loaded');
      return;
    }

    // Check if already loading
    if (this.isLoading) {
      llmLogger.warn('Model load already in progress');
      // Wait for current load to complete
      return this.waitForLoad();
    }

    // Check if module is available
    const moduleAvailable = await this.isModuleAvailable();
    if (!moduleAvailable) {
      throw new LLMError(
        LLMErrorCode.MODULE_NOT_AVAILABLE,
        'ExecuTorch LLMModule not available'
      );
    }

    this.isLoading = true;
    this.loadAttempts++;
    const endTimer = performanceTracker.startTimer('Model Load');

    try {
      llmLogger.info('Loading LLM model...', {
        attempt: this.loadAttempts,
        platform: Platform.OS,
      });

      // Create LLMModule instance with callback handlers (mobile-llm pattern)
      this.llmModule = new LLMModule({
        tokenCallback: (newToken: string) => {
          this._token = newToken;
          this._response += newToken;

          // Notify external listeners
          if (this.onTokenReceived) {
            this.onTokenReceived(newToken);
          }
          if (this.onResponseUpdated) {
            this.onResponseUpdated(this._response);
          }

          llmLogger.debug('Token received:', newToken.substring(0, 20) + '...');
        },
        messageHistoryCallback: (messageHistory: Message[]) => {
          this._messageHistory = messageHistory;
          llmLogger.debug(
            `Message history updated: ${messageHistory.length} messages`
          );
        },
        responseCallback: (response: string) => {
          this._response = response;
          if (this.onResponseUpdated) {
            this.onResponseUpdated(response);
          }
        },
      });

      // Select the best model based on availability
      // LLAMA3_2_1B_SPINQUANT is smaller/faster, LLAMA3_2_1B is standard
      const modelToUse = LLAMA3_2_1B_SPINQUANT || LLAMA3_2_1B;

      if (!modelToUse) {
        throw new Error('No LLM model configuration available');
      }

      llmLogger.info(
        'Using model:',
        modelToUse ? 'LLAMA3_2_1B variant' : 'Unknown'
      );

      // Load model using the correct API: load(MODEL_CONSTANT, progressCallback)
      await this.llmModule.load(modelToUse, (progress: number) => {
        this.downloadProgress = progress;
        const percentage = (progress * 100).toFixed(1);
        llmLogger.info(`Model download/load progress: ${percentage}%`);
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
        llmLogger.info(
          `Retrying model load (attempt ${this.loadAttempts + 1}/${this.MAX_LOAD_ATTEMPTS})`
        );

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

      // Release model resources using LLMModule.delete()
      if (this.llmModule) {
        this.llmModule.delete();
      }

      // Clear references and state
      this.llmModule = null;
      this.isLoaded = false;
      this._response = '';
      this._token = '';
      this._messageHistory = [];
      this._isGenerating = false;

      llmLogger.info('Model unloaded successfully');
    } catch (error) {
      llmLogger.error('Error unloading model', error);

      // Force clear even if release failed
      this.llmModule = null;
      this.isLoaded = false;

      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Error unloading model',
        error
      );
    }
  }

  /**
   * Generate response from messages
   * Uses LLMModule.generate() API
   */
  async generate(messages: Message[]): Promise<string> {
    if (!this.isLoaded || !this.llmModule) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_LOADED,
        'Model not loaded. Call loadModel() first.'
      );
    }

    this._response = '';
    this._isGenerating = true;

    if (this.onGeneratingChanged) {
      this.onGeneratingChanged(true);
    }

    try {
      llmLogger.info('Starting generation...', {
        messageCount: messages.length,
      });

      // Use LLMModule.generate() which streams tokens via tokenCallback
      const result = await this.llmModule.generate(messages);

      // Result is the final complete response
      this._response = result;

      llmLogger.info('Generation complete', {
        responseLength: this._response.length,
      });

      return this._response;
    } catch (error) {
      llmLogger.error('Generation failed', error);
      throw new LLMError(
        LLMErrorCode.INFERENCE_FAILED,
        'Failed to generate response',
        error
      );
    } finally {
      this._isGenerating = false;
      if (this.onGeneratingChanged) {
        this.onGeneratingChanged(false);
      }
    }
  }

  /**
   * Send a single message (simplified API)
   * Uses LLMModule.sendMessage() API
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.isLoaded || !this.llmModule) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_LOADED,
        'Model not loaded. Call loadModel() first.'
      );
    }

    this._response = '';
    this._isGenerating = true;

    if (this.onGeneratingChanged) {
      this.onGeneratingChanged(true);
    }

    try {
      llmLogger.info('Sending message...');

      // Use LLMModule.sendMessage() for single message conversation
      await this.llmModule.sendMessage(message);

      llmLogger.info('Message sent, response received', {
        responseLength: this._response.length,
      });

      return this._response;
    } catch (error) {
      llmLogger.error('sendMessage failed', error);
      throw new LLMError(
        LLMErrorCode.INFERENCE_FAILED,
        'Failed to send message',
        error
      );
    } finally {
      this._isGenerating = false;
      if (this.onGeneratingChanged) {
        this.onGeneratingChanged(false);
      }
    }
  }

  /**
   * Interrupt current generation
   */
  interrupt(): void {
    if (this.llmModule && this._isGenerating) {
      try {
        this.llmModule.interrupt();
        llmLogger.info('Generation interrupted');
      } catch (error) {
        llmLogger.error('Failed to interrupt generation', error);
      }
    }
  }

  /**
   * Delete a message from history
   */
  deleteMessage(index: number): void {
    if (this.llmModule) {
      try {
        this.llmModule.deleteMessage(index);
        llmLogger.debug('Message deleted at index', index);
      } catch (error) {
        llmLogger.error('Failed to delete message', error);
      }
    }
  }

  /**
   * Check if model is currently loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded && this.llmModule !== null;
  }

  /**
   * Check if model is currently loading
   */
  isModelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Check if currently generating
   */
  isGenerating(): boolean {
    return this._isGenerating;
  }

  /**
   * Get the loaded LLM module instance
   */
  getModel(): any {
    if (!this.isLoaded || !this.llmModule) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_LOADED,
        'Model not loaded. Call loadModel() first.'
      );
    }

    return this.llmModule;
  }

  /**
   * Get current response (built from streaming tokens)
   */
  get response(): string {
    return this._response;
  }

  /**
   * Get last received token
   */
  get token(): string {
    return this._token;
  }

  /**
   * Get message history
   */
  get messageHistory(): Message[] {
    return this._messageHistory;
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
    isGenerating: boolean;
    loadAttempts: number;
    responseLength: number;
  } {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      isGenerating: this._isGenerating,
      loadAttempts: this.loadAttempts,
      responseLength: this._response.length,
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
    if (this.llmModule) {
      try {
        this.llmModule.delete();
      } catch (error) {
        llmLogger.error('Error deleting LLM module during reset', error);
      }
    }
    this.llmModule = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadAttempts = 0;
    this.downloadProgress = 0;
    this._response = '';
    this._token = '';
    this._messageHistory = [];
    this._isGenerating = false;
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
