import { Platform } from 'react-native';
import { llmLogger } from '@/utils/llmLogger';
import { LLMError, LLMErrorCode, ModelInfo, ModelDownloadProgress } from '@/types/llm';
import { LLM_CONFIG } from '@/config/llmConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import RNFS to avoid crashes in Expo managed workflow
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch (error) {
  console.warn('[ModelDownloader] react-native-fs not available. LLM features disabled.');
}

/**
 * Model Downloader Service
 * Handles model file access - either bundled with app or downloaded on-demand
 */
export class ModelDownloader {
  private modelPath: string;
  private tokenizerPath: string;
  private downloadInProgress: boolean = false;
  private currentDownloadJobId: number | null = null;

  constructor() {
    // Check if RNFS is available
    if (!RNFS) {
      this.modelPath = '';
      this.tokenizerPath = '';
      llmLogger.warn('ModelDownloader initialized without react-native-fs. LLM features unavailable.');
      return;
    }

    if (LLM_CONFIG.MODEL_STRATEGY === 'bundled') {
      // Model bundled with app - use MainBundlePath (read-only)
      const bundlePath = Platform.OS === 'android'
        ? RNFS.MainBundlePath + '/assets'
        : RNFS.MainBundlePath;

      this.modelPath = `${bundlePath}/${LLM_CONFIG.MODEL_FILE_NAME}`;
      this.tokenizerPath = `${bundlePath}/${LLM_CONFIG.TOKENIZER_FILE_NAME}`;
    } else {
      // Model downloaded on-demand - use DocumentDirectory (writable)
      const baseDir = Platform.OS === 'android'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DocumentDirectoryPath;

      this.modelPath = `${baseDir}/${LLM_CONFIG.MODEL_FILE_NAME}`;
      this.tokenizerPath = `${baseDir}/${LLM_CONFIG.TOKENIZER_FILE_NAME}`;
    }

    llmLogger.info('ModelDownloader initialized', {
      strategy: LLM_CONFIG.MODEL_STRATEGY,
      modelPath: this.modelPath,
      tokenizerPath: this.tokenizerPath,
    });
  }

  /**
   * Check if RNFS module is available
   */
  private checkRNFSAvailable(): void {
    if (!RNFS) {
      throw new LLMError(
        LLMErrorCode.MODULE_NOT_AVAILABLE,
        'react-native-fs module not available. LLM features require expo prebuild.'
      );
    }
  }

  /**
   * Check if model is already downloaded
   */
  async isModelDownloaded(): Promise<boolean> {
    if (!RNFS) return false;

    try {
      const modelExists = await RNFS.exists(this.modelPath);
      const tokenizerExists = await RNFS.exists(this.tokenizerPath);

      const isDownloaded = modelExists && tokenizerExists;

      if (isDownloaded) {
        // Verify file sizes are reasonable
        const modelStat = await RNFS.stat(this.modelPath);
        const tokenizerStat = await RNFS.stat(this.tokenizerPath);

        // Model should be at least 1GB (allow some variance)
        const modelSizeOk = parseInt(modelStat.size) > (1024 * 1024 * 1024);
        const tokenizerSizeOk = parseInt(tokenizerStat.size) > 1000;

        if (!modelSizeOk || !tokenizerSizeOk) {
          llmLogger.warn('Model files exist but sizes are suspicious', {
            modelSize: modelStat.size,
            tokenizerSize: tokenizerStat.size,
          });
          return false;
        }
      }

      return isDownloaded;
    } catch (error) {
      llmLogger.error('Error checking if model downloaded', error);
      return false;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    const isDownloaded = await this.isModelDownloaded();

    let modelSize = 0;
    let downloadedAt: string | undefined;

    if (isDownloaded) {
      try {
        const modelStat = await RNFS.stat(this.modelPath);
        modelSize = parseInt(modelStat.size);

        // Try to get download timestamp from storage
        const timestamp = await AsyncStorage.getItem('@llm_model_downloaded_at');
        if (timestamp) {
          downloadedAt = timestamp;
        }
      } catch (error) {
        llmLogger.error('Error getting model info', error);
      }
    }

    return {
      modelName: LLM_CONFIG.MODEL_NAME,
      modelVersion: LLM_CONFIG.MODEL_VERSION,
      modelSize,
      isDownloaded,
      downloadedAt,
      modelPath: isDownloaded ? this.modelPath : undefined,
      tokenizerPath: isDownloaded ? this.tokenizerPath : undefined,
    };
  }

  /**
   * Download model and tokenizer files
   * Only applicable when MODEL_STRATEGY is 'download'
   */
  async downloadModel(
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    // If model is bundled, no download needed
    if (LLM_CONFIG.MODEL_STRATEGY === 'bundled') {
      llmLogger.info('Model is bundled with app, no download needed');
      return;
    }

    if (this.downloadInProgress) {
      throw new LLMError(
        LLMErrorCode.MODEL_DOWNLOAD_FAILED,
        'Download already in progress'
      );
    }

    // Check if already downloaded
    if (await this.isModelDownloaded()) {
      llmLogger.info('Model already downloaded');
      return;
    }

    this.downloadInProgress = true;

    try {
      llmLogger.info('Starting model download...');

      // Check storage space
      const freeSpace = await RNFS.getFSInfo();
      const requiredSpace = LLM_CONFIG.MODEL_SIZE_BYTES + LLM_CONFIG.TOKENIZER_SIZE_BYTES;

      if (freeSpace.freeSpace < requiredSpace * 1.5) {
        throw new LLMError(
          LLMErrorCode.MODEL_DOWNLOAD_FAILED,
          `Insufficient storage. Need ${(requiredSpace / (1024 ** 3)).toFixed(2)}GB free.`
        );
      }

      // Download model file (the large one)
      llmLogger.info('Downloading model file...');
      await this.downloadFile(
        LLM_CONFIG.MODEL_DOWNLOAD_URL,
        this.modelPath,
        LLM_CONFIG.MODEL_SIZE_BYTES,
        (progress) => {
          // Model is ~95% of total download
          const adjustedProgress = {
            ...progress,
            percentage: progress.percentage * 0.95,
          };
          onProgress?.(adjustedProgress);
        }
      );

      llmLogger.info('Model file downloaded successfully');

      // Download tokenizer file (small)
      llmLogger.info('Downloading tokenizer file...');
      await this.downloadFile(
        LLM_CONFIG.TOKENIZER_DOWNLOAD_URL,
        this.tokenizerPath,
        LLM_CONFIG.TOKENIZER_SIZE_BYTES,
        (progress) => {
          // Tokenizer is last 5%
          const adjustedProgress = {
            ...progress,
            percentage: 95 + (progress.percentage * 0.05),
          };
          onProgress?.(adjustedProgress);
        }
      );

      llmLogger.info('Tokenizer file downloaded successfully');

      // Verify downloads
      await this.verifyDownloads();

      // Save download timestamp
      await AsyncStorage.setItem(
        '@llm_model_downloaded_at',
        new Date().toISOString()
      );

      // Report 100% completion
      onProgress?.({
        bytesDownloaded: LLM_CONFIG.MODEL_SIZE_BYTES + LLM_CONFIG.TOKENIZER_SIZE_BYTES,
        totalBytes: LLM_CONFIG.MODEL_SIZE_BYTES + LLM_CONFIG.TOKENIZER_SIZE_BYTES,
        percentage: 100,
      });

      llmLogger.info('Model download complete');
    } catch (error) {
      llmLogger.error('Model download failed', error);

      // Clean up partial downloads
      await this.deleteModel();

      throw new LLMError(
        LLMErrorCode.MODEL_DOWNLOAD_FAILED,
        'Failed to download model files',
        error
      );
    } finally {
      this.downloadInProgress = false;
      this.currentDownloadJobId = null;
    }
  }

  /**
   * Cancel ongoing download
   */
  async cancelDownload(): Promise<void> {
    if (!this.downloadInProgress || this.currentDownloadJobId === null) {
      return;
    }

    try {
      await RNFS.stopDownload(this.currentDownloadJobId);
      llmLogger.info('Download cancelled');

      // Clean up partial downloads
      await this.deleteModel();
    } catch (error) {
      llmLogger.error('Error cancelling download', error);
    } finally {
      this.downloadInProgress = false;
      this.currentDownloadJobId = null;
    }
  }

  /**
   * Delete downloaded model files
   */
  async deleteModel(): Promise<void> {
    try {
      llmLogger.info('Deleting model files...');

      if (await RNFS.exists(this.modelPath)) {
        await RNFS.unlink(this.modelPath);
        llmLogger.info('Model file deleted');
      }

      if (await RNFS.exists(this.tokenizerPath)) {
        await RNFS.unlink(this.tokenizerPath);
        llmLogger.info('Tokenizer file deleted');
      }

      // Remove download timestamp
      await AsyncStorage.removeItem('@llm_model_downloaded_at');

      llmLogger.info('Model deletion complete');
    } catch (error) {
      llmLogger.error('Error deleting model files', error);
      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Failed to delete model files',
        error
      );
    }
  }

  /**
   * Get paths to model files
   */
  getModelPath(): string {
    return this.modelPath;
  }

  getTokenizerPath(): string {
    return this.tokenizerPath;
  }

  /**
   * Private: Download a single file with progress tracking
   */
  private async downloadFile(
    url: string,
    destination: string,
    expectedSize: number,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const download = RNFS.downloadFile({
        fromUrl: url,
        toFile: destination,
        progressInterval: 1000, // Update every second
        progressDivider: 1,
        begin: (res) => {
          llmLogger.debug('Download started', {
            statusCode: res.statusCode,
            contentLength: res.contentLength,
          });

          // Verify content length matches expected
          if (res.contentLength && Math.abs(res.contentLength - expectedSize) > expectedSize * 0.1) {
            llmLogger.warn('Downloaded file size differs from expected', {
              expected: expectedSize,
              actual: res.contentLength,
            });
          }
        },
        progress: (res) => {
          const progress: ModelDownloadProgress = {
            bytesDownloaded: res.bytesWritten,
            totalBytes: res.contentLength,
            percentage: (res.bytesWritten / res.contentLength) * 100,
          };

          llmLogger.debug(`Download progress: ${progress.percentage.toFixed(1)}%`);
          onProgress?.(progress);
        },
      });

      // Store job ID for cancellation
      this.currentDownloadJobId = download.jobId;

      download.promise
        .then((result) => {
          if (result.statusCode === 200) {
            llmLogger.info('Download completed', {
              statusCode: result.statusCode,
              bytesWritten: result.bytesWritten,
            });
            resolve();
          } else {
            reject(new Error(`Download failed with status ${result.statusCode}`));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Private: Verify downloaded files are valid
   */
  private async verifyDownloads(): Promise<void> {
    llmLogger.info('Verifying downloads...');

    try {
      // Check model file exists and has reasonable size
      const modelStat = await RNFS.stat(this.modelPath);
      const modelSize = parseInt(modelStat.size);

      if (modelSize < LLM_CONFIG.MODEL_SIZE_BYTES * 0.9) {
        throw new Error('Model file size is too small');
      }

      // Check tokenizer file exists
      const tokenizerStat = await RNFS.stat(this.tokenizerPath);
      const tokenizerSize = parseInt(tokenizerStat.size);

      if (tokenizerSize < 1000) {
        throw new Error('Tokenizer file size is too small');
      }

      llmLogger.info('Download verification passed', {
        modelSize,
        tokenizerSize,
      });
    } catch (error) {
      llmLogger.error('Download verification failed', error);
      throw new LLMError(
        LLMErrorCode.MODEL_DOWNLOAD_FAILED,
        'Downloaded files failed verification',
        error
      );
    }
  }

  /**
   * Calculate checksum of a file (for integrity verification)
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      // Note: Full file checksum is expensive for 2GB files
      // In production, consider checking only a sample or using a CDN-provided checksum
      const hash = await RNFS.hash(filePath, 'sha256');
      return hash;
    } catch (error) {
      llmLogger.warn('Could not calculate checksum', error);
      return '';
    }
  }
}

// Export singleton instance
export const modelDownloader = new ModelDownloader();
