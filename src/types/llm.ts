import type { Alert, ThreatLevel, DetectionType } from '@/types/alert';
import type { Device } from '@/types/device';
import type { StructuredCardData } from '@/types/cardData';

export interface LLMStructuredValue {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | LLMStructuredValue
    | LLMStructuredValue[];
}

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
  originalError?: unknown;

  constructor(code: LLMErrorCode, message: string, originalError?: unknown) {
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
  context?: unknown;
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
  alert: Partial<Alert> & {
    detection_type?: string;
    threat_level?: string;
    mac_address?: string;
    metadata?: Record<string, unknown>;
    trend?: string;
    zone?: string;
  };
  relatedAlerts?: Array<
    Partial<Alert> & {
      timestamp?: string | number | Date;
    }
  >;
  deviceHistory?: {
    first_seen?: string;
    detection_count?: number;
    whitelisted?: boolean;
    friendly_name?: string;
  };
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
  device: Partial<Device> & {
    mac_address?: string;
    first_seen?: string;
    metadata?: {
      ssid?: string;
      device_name?: string;
      manufacturer?: string;
    };
  };
  detectionHistory: Array<{
    timestamp: string | number | Date;
    zone?: string;
    metadata?: {
      duration?: string | number;
      device_name?: string;
    };
  }>;
  similarDevices?: Array<{
    friendly_name?: string;
    similarity_score?: number;
    metadata?: {
      device_name?: string;
    };
  }>;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: IntentType;
  structuredData?: StructuredCardData;
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: string[];
  intent: IntentType;
  structuredData: StructuredCardData;
}

export interface ConversationContext {
  messages: ChatMessage[];
  securityContext?: {
    recentAlerts: Array<
      Partial<Alert> & {
        threat_level?: string;
      }
    >;
    deviceStatus: Array<
      Partial<Device> & {
        online?: boolean;
      }
    >;
    contextString?: string;
  };
}

// Intent Classification Types
export type IntentType =
  | 'alert_query'
  | 'device_query'
  | 'status_overview'
  | 'pattern_query'
  | 'time_query'
  | 'help';

export interface IntentFilters {
  threatLevel?: ThreatLevel;
  detectionType?: DetectionType;
  timeRange?: '24h' | '7d';
  deviceName?: string;
  isReviewed?: boolean;
  online?: boolean;
}

export interface ClassifiedIntent {
  intent: IntentType;
  filters: IntentFilters;
  confidence: number;
}

// New chat context — replaces ConversationContext for chat()
export interface ChatContext {
  messages: ChatMessage[];
  rawAlerts: Alert[];
  rawDevices: Device[];
}
