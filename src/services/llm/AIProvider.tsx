import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { modelManager } from './modelManager';
import { llmService } from './LLMService';
import { inferenceEngine } from './inferenceEngine';
import { llmLogger } from '@/utils/llmLogger';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import {
  Message,
  AlertSummary,
  PatternAnalysis,
  ChatResponse,
  AlertContext,
  DeviceContext,
  ChatContext,
} from '@/types/llm';

/**
 * AI Context Type
 * Defines all state and methods available through the useAI hook
 */
export interface AIContextType {
  // State
  isAvailable: boolean;
  isReady: boolean;
  isEnabling: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  response: string;
  token: string;
  messageHistory: Message[];
  error: Error | null;

  // Model Management
  enableAI: () => Promise<void>;
  disableAI: () => Promise<void>;

  // Generation Methods
  generate: (messages: Message[]) => Promise<string>;
  sendMessage: (message: string) => Promise<string>;
  interrupt: () => void;

  // High-Level Features
  generateAlertSummary: (context: AlertContext) => Promise<AlertSummary>;
  analyzeDevicePattern: (context: DeviceContext) => Promise<PatternAnalysis>;
  chat: (context: ChatContext) => Promise<ChatResponse>;

  // Status
  getStatus: () => {
    isAvailable: boolean;
    isReady: boolean;
    isEnabling: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    platformSupported: boolean;
  };
}

// Create the context with undefined default
const AIContext = createContext<AIContextType | undefined>(undefined);

/**
 * AI Provider Props
 */
interface AIProviderProps {
  children: ReactNode;
  showDownloadModal?: boolean;
}

/**
 * AI Provider Component
 * Wraps the app to provide LLM functionality through React Context
 *
 * Based on the working mobile-llm implementation pattern
 */
export const AIProvider: React.FC<AIProviderProps> = ({
  children,
  showDownloadModal = true,
}) => {
  const getAvailability = useCallback(
    () => FEATURE_FLAGS.LLM_MOCK_MODE || modelManager.isRuntimeSupported(),
    []
  );

  // State
  const [isAvailable, setIsAvailable] = useState(getAvailability());
  const [isReady, setIsReady] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [response, setResponse] = useState('');
  const [token, setToken] = useState('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Setup callbacks when component mounts
   */
  useEffect(() => {
    setIsAvailable(getAvailability());

    // Setup model manager callbacks for real-time updates
    modelManager.onTokenReceived = (newToken: string) => {
      setToken(newToken);
    };

    modelManager.onResponseUpdated = (newResponse: string) => {
      setResponse(newResponse);
    };

    modelManager.onGeneratingChanged = (generating: boolean) => {
      setIsGenerating(generating);
    };

    // Auto-initialize if runtime is available. If the model is already
    // downloaded this completes instantly; otherwise it starts the download
    // in the background so the user doesn't have to tap "Enable" every
    // cold start.
    if (
      FEATURE_FLAGS.LLM_ENABLED &&
      !FEATURE_FLAGS.LLM_MOCK_MODE &&
      getAvailability()
    ) {
      llmLogger.info('Auto-initializing LLM on mount');
      llmService
        .initialize()
        .then(() => {
          setIsReady(true);
          llmLogger.info('LLM auto-initialized successfully');
        })
        .catch(err => {
          llmLogger.warn('LLM auto-init failed (user can retry manually)', err);
        });
    }

    // Cleanup on unmount
    return () => {
      modelManager.onTokenReceived = undefined;
      modelManager.onResponseUpdated = undefined;
      modelManager.onGeneratingChanged = undefined;
    };
  }, [getAvailability]);

  /**
   * Enable AI - loads the model
   */
  const enableAI = useCallback(async () => {
    if (isReady || isEnabling) {
      llmLogger.info('AI already enabled or enabling');
      return;
    }

    // Check feature flags
    if (!FEATURE_FLAGS.LLM_ENABLED) {
      llmLogger.warn('LLM features are disabled via feature flags');
      return;
    }

    if (!getAvailability()) {
      const availabilityError = new Error(
        'TrailSense AI requires a custom dev build with ExecuTorch and iOS 17+ or Android 13+.'
      );
      setError(availabilityError);
      throw availabilityError;
    }

    setIsEnabling(true);
    setDownloadProgress(0);
    setError(null);
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      llmLogger.info('Enabling AI...');

      // The model manager will handle download progress internally
      // We monitor it via polling during load
      if (!FEATURE_FLAGS.LLM_MOCK_MODE) {
        progressInterval = setInterval(() => {
          const progress = modelManager.getDownloadProgress();
          setDownloadProgress(progress);
          setIsDownloading(progress > 0 && progress < 1);
        }, 100);
      }

      await llmService.initialize();

      if (!FEATURE_FLAGS.LLM_MOCK_MODE) {
        setIsDownloading(false);
        setDownloadProgress(1);
      }

      setIsReady(true);
      llmLogger.info('AI enabled successfully');
    } catch (err) {
      const error = err as Error;
      llmLogger.error('Failed to enable AI', error);
      setError(error);
      setIsReady(false);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsEnabling(false);
      setIsDownloading(false);
    }
  }, [getAvailability, isReady, isEnabling]);

  /**
   * Disable AI - unloads the model
   */
  const disableAI = useCallback(async () => {
    if (!isReady) {
      return;
    }

    try {
      llmLogger.info('Disabling AI...');
      await llmService.shutdown();
      setIsReady(false);
      setResponse('');
      setToken('');
      setMessageHistory([]);
      llmLogger.info('AI disabled successfully');
    } catch (err) {
      llmLogger.error('Failed to disable AI', err);
    }
  }, [isReady]);

  /**
   * Generate response from messages
   */
  const generate = useCallback(
    async (messages: Message[]): Promise<string> => {
      if (!isReady) {
        await enableAI();
      }

      setResponse('');
      setIsGenerating(true);

      try {
        const result = FEATURE_FLAGS.LLM_MOCK_MODE
          ? await inferenceEngine.generate(messages)
          : await modelManager.generate(messages);
        setResponse(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [isReady, enableAI]
  );

  /**
   * Send a single message
   */
  const sendMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!isReady) {
        await enableAI();
      }

      setResponse('');
      setIsGenerating(true);

      try {
        const result = FEATURE_FLAGS.LLM_MOCK_MODE
          ? await inferenceEngine.generate([{ role: 'user', content: message }])
          : await modelManager.sendMessage(message);
        setResponse(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [isReady, enableAI]
  );

  /**
   * Interrupt current generation
   */
  const interrupt = useCallback(() => {
    modelManager.interrupt();
    setIsGenerating(false);
  }, []);

  /**
   * Generate alert summary (high-level API)
   */
  const generateAlertSummary = useCallback(
    async (context: AlertContext): Promise<AlertSummary> => {
      if (!isReady) {
        await enableAI();
      }
      return llmService.generateAlertSummary(context);
    },
    [isReady, enableAI]
  );

  /**
   * Analyze device pattern (high-level API)
   */
  const analyzeDevicePattern = useCallback(
    async (context: DeviceContext): Promise<PatternAnalysis> => {
      if (!isReady) {
        await enableAI();
      }
      return llmService.analyzeDevicePattern(context);
    },
    [isReady, enableAI]
  );

  /**
   * Chat with assistant (high-level API)
   */
  const chat = useCallback(
    async (context: ChatContext): Promise<ChatResponse> => {
      if (!isReady) {
        await enableAI();
      }
      return llmService.chat(context);
    },
    [isReady, enableAI]
  );

  /**
   * Get current status
   */
  const getStatus = useCallback(
    () => ({
      isAvailable,
      isReady,
      isEnabling,
      isGenerating,
      downloadProgress,
      platformSupported:
        FEATURE_FLAGS.LLM_MOCK_MODE ||
        modelManager.isPlatformVersionSupported(),
    }),
    [isAvailable, isReady, isEnabling, isGenerating, downloadProgress]
  );

  // Context value
  const contextValue: AIContextType = {
    // State
    isAvailable,
    isReady,
    isEnabling,
    isGenerating,
    isDownloading,
    downloadProgress,
    response,
    token,
    messageHistory,
    error,

    // Model Management
    enableAI,
    disableAI,

    // Generation Methods
    generate,
    sendMessage,
    interrupt,

    // High-Level Features
    generateAlertSummary,
    analyzeDevicePattern,
    chat,

    // Status
    getStatus,
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}

      {/* Download Progress Modal */}
      {showDownloadModal && isDownloading && (
        <Modal visible={isDownloading} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.aiIcon}>
                  <View style={styles.aiIconInner} />
                </View>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${downloadProgress * 100}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressText}>
                    <View style={styles.downloadingText} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AIContext.Provider>
  );
};

/**
 * useAI Hook
 * Access AI functionality from any component
 *
 * @example
 * ```tsx
 * const { isReady, enableAI, generateAlertSummary } = useAI();
 *
 * const handleAnalyze = async () => {
 *   if (!isReady) await enableAI();
 *   const summary = await generateAlertSummary({ alert });
 * };
 * ```
 */
export const useAI = (): AIContextType => {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }

  return context;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  modalBody: {
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 12,
    alignItems: 'center',
  },
  downloadingText: {
    height: 16,
    width: 120,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
});

export default AIProvider;
