// LLM Error Types
export enum LLMErrorCode {
  MODULE_NOT_AVAILABLE = 'MODULE_NOT_AVAILABLE',
  MODEL_NOT_LOADED = 'MODEL_NOT_LOADED',
  MODEL_NOT_DOWNLOADED = 'MODEL_NOT_DOWNLOADED',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  MODEL_DOWNLOAD_FAILED = 'MODEL_DOWNLOAD_FAILED',
  INFERENCE_FAILED = 'INFERENCE_FAILED',
  INFERENCE_TIMEOUT = 'INFERENCE_TIMEOUT',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  INVALID_INPUT = 'INVALID_INPUT',
  PLATFORM_NOT_SUPPORTED = 'PLATFORM_NOT_SUPPORTED',
}

export class LLMError extends Error {
  code: LLMErrorCode;
  originalError?: any;

  constructor(code: LLMErrorCode, message: string, originalError?: any) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.originalError = originalError;
  }
}

// Generation Options
export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  timeout?: number;
}

// Message type for chat format
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// LLM Request/Response Types
export interface LLMRequest {
  messages: Message[];
  context?: any;
  options?: GenerationOptions;
  cacheKey?: string;
}

export interface LLMResponse {
  text: string;
  tokensGenerated: number;
  inferenceTimeMs: number;
  cached: boolean;
  confidence?: number;
}

// Alert Summary Types
export interface AlertSummary {
  summary: string;
  threatExplanation: string;
  recommendedActions: string[];
  confidence: number;
}

export interface AlertContext {
  alert: any; // Will be the Alert type from @/types/alert
  relatedAlerts?: any[];
  deviceHistory?: any;
}

// Model Download Types
export interface ModelDownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

export interface ModelInfo {
  modelName: string;
  modelVersion: string;
  modelSize: number;
  isDownloaded: boolean;
  downloadedAt?: string;
  modelPath?: string;
  tokenizerPath?: string;
}

// Pattern Analysis Types
export interface PatternAnalysis {
  patternType: 'delivery' | 'neighbor' | 'routine' | 'suspicious' | 'unknown';
  description: string;
  confidence: number;
  whitelistSuggestion?: {
    name: string;
    category: string;
    reason: string;
  };
}

export interface DeviceContext {
  device: any;
  detectionHistory: any[];
  similarDevices?: any[];
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: string[];
}

export interface ConversationContext {
  messages: ChatMessage[];
  securityContext?: {
    recentAlerts: any[];
    deviceStatus: any[];
  };
}
