// Main LLM Service
export { llmService } from './LLMService';

// Core Services
export { modelManager } from './modelManager';
export { modelDownloader } from './modelDownloader';
export { inferenceEngine } from './inferenceEngine';

// Cache
export { responseCache } from './cache/ResponseCache';

// Templates
export {
  PromptTemplate,
  AlertSummaryTemplate,
  PatternAnalysisTemplate,
  ConversationalTemplate,
} from './templates';

// Types (re-export from @/types/llm for convenience)
export type {
  LLMError,
  LLMErrorCode,
  GenerationOptions,
  LLMRequest,
  LLMResponse,
  AlertSummary,
  AlertContext,
  PatternAnalysis,
  DeviceContext,
  ChatMessage,
  ChatResponse,
  ConversationContext,
  ModelInfo,
  ModelDownloadProgress,
} from '@/types/llm';
