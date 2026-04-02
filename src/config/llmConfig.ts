import { Platform } from 'react-native';

/**
 * LLM Configuration
 * Centralized configuration for on-device LLM features
 */

export const LLM_CONFIG = {
  // Model Configuration
  MODEL_NAME: 'llama-3.2-1b-spinquant',
  MODEL_VERSION: '3.2',
  MODEL_FILE_NAME: 'llama-3.2-1b.pte',
  TOKENIZER_FILE_NAME: 'llama-3.2-1b-tokenizer.json',

  // Using built-in models from react-native-executorch
  // These will be downloaded on-demand, not bundled in the app
  USE_BUILTIN_MODELS: true,

  // Model Storage Strategy
  // Set to 'bundled' to include model in app bundle
  // Set to 'download' to download on first use
  MODEL_STRATEGY: 'download' as 'bundled' | 'download',

  // Model Size (in bytes) - Llama 3.2 1B SpinQuant
  MODEL_SIZE_BYTES: 1224065679, // ~1.14GB based on official ExecuTorch benchmarks
  TOKENIZER_SIZE_BYTES: 524288, // ~512KB

  // Model Parameters
  CONTEXT_LENGTH: 2048,
  VOCAB_SIZE: 256000,
  MAX_TOKENS_DEFAULT: 150,
  TEMPERATURE_DEFAULT: 0.7,
  TOP_P_DEFAULT: 0.9,

  // Performance Settings
  INFERENCE_TIMEOUT_MS: 10000, // 10 seconds
  MODEL_LOAD_TIMEOUT_MS: 30000, // 30 seconds
  UNLOAD_MODEL_AFTER_IDLE_MS: 5 * 60 * 1000, // 5 minutes

  // Cache Settings
  ENABLE_CACHING: true,
  MAX_CACHE_SIZE: 100, // Number of cached responses
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Feature-Specific Settings
  ALERT_SUMMARIES: {
    AUTO_GENERATE_FOR_THREATS: ['high', 'critical'],
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7,
    ENABLE_PRELOADING: true,
    PRELOAD_LIMIT: 5, // Preload summaries for 5 most recent critical alerts
  },

  PATTERN_ANALYSIS: {
    MAX_TOKENS: 200,
    TEMPERATURE: 0.6,
    MIN_DETECTIONS_REQUIRED: 3, // Require at least 3 detections before analysis
  },

  CONVERSATIONAL: {
    MAX_TOKENS: 150,
    TEMPERATURE: 0.8,
    MAX_CONTEXT_MESSAGES: 5, // Keep last 5 messages in conversation context
  },

  // Platform Support - Now supporting both Android and iOS
  SUPPORTED_PLATFORMS: ['android', 'ios'] as const,
  IS_PLATFORM_SUPPORTED: Platform.OS === 'android' || Platform.OS === 'ios',

  // Battery Optimization
  LOW_BATTERY_THRESHOLD: 20, // Disable AI when battery < 20%
  WARN_ON_LOW_BATTERY: true,

  // Storage Paths
  get MODEL_STORAGE_PATH(): string {
    // Model storage is managed by react-native-executorch internally
    return '';
  },

  // Analytics
  TRACK_PERFORMANCE: true,
  TRACK_USAGE: true,
  TRACK_ERRORS: true,

  // Development/Debug
  ENABLE_DEBUG_LOGS: __DEV__,
  MOCK_RESPONSES_IN_DEV: false, // Set to true to use mock responses instead of real inference

  // Error Handling
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,

  // Feature Flags (references to main feature flag system)
  get FEATURE_FLAGS() {
    // These will be imported from featureFlags.ts
    // This is a placeholder to document what flags are expected
    return {
      LLM_ENABLED: false,
      LLM_ALERT_SUMMARIES: false,
      LLM_PATTERN_ANALYSIS: false,
      LLM_CONVERSATIONAL_ASSISTANT: false,
    };
  },
} as const;

/**
 * Helper function to check if LLM features are available on current platform
 */
export function isLLMAvailable(): boolean {
  if (!LLM_CONFIG.IS_PLATFORM_SUPPORTED) {
    return false;
  }

  if (Platform.OS === 'ios') {
    const iosMajorVersion = parseInt(String(Platform.Version).split('.')[0], 10);
    return iosMajorVersion >= 17;
  }

  if (Platform.OS === 'android') {
    const androidApiLevel =
      typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version;
    return androidApiLevel >= 33;
  }

  return false;
}

/**
 * Helper function to get user-friendly error messages
 */
export function getLLMErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    MODULE_NOT_AVAILABLE:
      'AI features are not available in this build. Use a custom dev build with ExecuTorch enabled.',
    MODEL_NOT_LOADED: 'AI model is not loaded. Please try again.',
    MODEL_NOT_DOWNLOADED:
      'AI model needs to be downloaded. Go to Settings > AI Features to download.',
    MODEL_LOAD_FAILED:
      'Failed to load AI model. Please try restarting the app.',
    MODEL_DOWNLOAD_FAILED:
      'Failed to download AI model. Please check your internet connection.',
    INFERENCE_FAILED: 'Failed to generate AI response. Please try again.',
    INFERENCE_TIMEOUT: 'AI is taking too long to respond. Please try again.',
    OUT_OF_MEMORY:
      'Not enough memory available for AI features. Try closing other apps.',
    INVALID_INPUT: 'Invalid input provided to AI.',
    PLATFORM_NOT_SUPPORTED:
      'TrailSense AI requires iOS 17+ or Android 13+.',
  };

  return errorMessages[code] || 'An unknown error occurred with AI features.';
}

/**
 * Helper function to estimate storage requirements
 */
export function getStorageRequirements(): {
  modelSize: number;
  tokenizerSize: number;
  totalSize: number;
  formattedTotal: string;
} {
  const totalSize =
    LLM_CONFIG.MODEL_SIZE_BYTES + LLM_CONFIG.TOKENIZER_SIZE_BYTES;
  const formattedTotal = `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;

  return {
    modelSize: LLM_CONFIG.MODEL_SIZE_BYTES,
    tokenizerSize: LLM_CONFIG.TOKENIZER_SIZE_BYTES,
    totalSize,
    formattedTotal,
  };
}

/**
 * Helper function to check if device has enough storage
 */
export async function hasEnoughStorage(): Promise<boolean> {
  try {
    const RNFS = require('react-native-fs');
    if (!RNFS || !RNFS.getFSInfo) {
      // Module not available (Expo managed workflow)
      console.warn(
        '[LLMConfig] react-native-fs not available, skipping storage check'
      );
      return true;
    }

    const freeSpace = await RNFS.getFSInfo();
    const requiredSpace = getStorageRequirements().totalSize;

    // Require 2x the model size to be safe
    return freeSpace.freeSpace > requiredSpace * 2;
  } catch (error) {
    // If we can't check, assume there's enough space
    return true;
  }
}
