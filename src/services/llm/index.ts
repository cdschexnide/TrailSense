// Main LLM Service
export { llmService } from './LLMService';

// AI Provider and Hook (primary API for components)
export { AIProvider, useAI } from './AIProvider';
export type { AIContextType } from './AIProvider';

// Core Services
export { modelManager } from './modelManager';
export { inferenceEngine } from './inferenceEngine';

// Cache
export { responseCache } from './cache/ResponseCache';
export { IntentClassifier } from './IntentClassifier';
export { FocusedContextBuilder } from './FocusedContextBuilder';
export { ResponseProcessor } from './ResponseProcessor';

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
  ChatContext,
  IntentType,
  IntentFilters,
  ClassifiedIntent,
  ModelInfo,
  ModelDownloadProgress,
  Message,
} from '@/types/llm';
