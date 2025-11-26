# TrailSense On-Device LLM Use Cases

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Model:** Llama 3.2 1B (via react-native-executorch)

---

## Table of Contents

1. [Overview](#overview)
2. [Use Case 1: Alert Summaries](#use-case-1-alert-summaries)
3. [Use Case 2: Device Pattern Analysis](#use-case-2-device-pattern-analysis)
4. [Use Case 3: Conversational Security Assistant](#use-case-3-conversational-security-assistant)
5. [Architecture Overview](#architecture-overview)
6. [File Reference Guide](#file-reference-guide)
7. [Integration Points](#integration-points)
8. [Performance Characteristics](#performance-characteristics)

---

## Overview

TrailSense uses on-device AI (Llama 3.2 1B) to enhance home security monitoring through three primary use cases:

- **Alert Summaries**: Natural language explanations of security detections
- **Device Pattern Analysis**: Intelligent identification of routine visitors
- **Conversational Assistant**: Interactive Q&A about security data

All inference runs **100% on-device** with no cloud dependency, ensuring privacy and offline functionality.

**Key Metrics:**
- Model Size: ~1.5GB (downloads on first use)
- Inference Time: 2-5 seconds per request
- Platform: Android 10+ only (iOS deferred)
- Memory Required: 4GB+ RAM (6GB+ recommended)

---

## Use Case 1: Alert Summaries

### Purpose

Transforms raw security detection data into clear, actionable explanations that non-technical homeowners can understand.

### User Experience

**Trigger:** User clicks "Explain with AI" button on an alert detail screen.

**Input Data:**
- Detection type (WiFi, Bluetooth, Cellular)
- Signal strength (RSSI in dBm)
- Proximity zone (IMMEDIATE, NEAR, FAR, EXTREME)
- Threat level (LOW, MEDIUM, HIGH, CRITICAL)
- Movement trend (approaching, receding, stationary)
- Device metadata (MAC address, manufacturer, SSID)
- Historical context (previous detections, first seen date)

**Output:**
- **Summary**: 2-3 sentence explanation of what happened
- **Threat Explanation**: Why this threat level was assigned
- **Recommended Actions**: Specific steps the homeowner should take
- **Confidence Score**: AI's confidence in the analysis (0.0-1.0)

### Example

**Input Alert:**
```json
{
  "detection_type": "wifi",
  "rssi": -55,
  "zone": "NEAR",
  "threat_level": "MEDIUM",
  "trend": "approaching",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

**Output Summary:**
```
A WiFi device was detected at -55 dBm, indicating close proximity
(within 10-20 feet). The signal is getting stronger, suggesting the
device is approaching your property. This warrants attention.

Recommended Action: Check your security cameras to see if anyone is nearby.
```

### Implementation Files

#### Service Layer
**File:** `src/services/llm/LLMService.ts:76-109`

```typescript
async generateAlertSummary(context: AlertContext): Promise<AlertSummary> {
  // Build chat messages from alert context
  const messages = this.alertSummaryTemplate.buildPrompt(context);

  // Generate response using Llama 3.2 1B
  const response = await this.generate({
    messages,
    context,
    options: {
      maxTokens: LLM_CONFIG.ALERT_SUMMARIES.MAX_TOKENS, // 150
      temperature: LLM_CONFIG.ALERT_SUMMARIES.TEMPERATURE, // 0.7
    },
    cacheKey: LLM_CONFIG.ENABLE_CACHING ? cacheKey : undefined,
  });

  // Parse structured response
  return this.parseAlertSummary(response.text);
}
```

#### Prompt Template
**File:** `src/services/llm/templates/AlertSummaryTemplate.ts:32-69`

This template builds the chat messages sent to the AI:

```typescript
buildPrompt(context: AlertContext): Message[] {
  const systemPrompt = `You are a security assistant for a home intrusion
  detection system. Your job is to explain security alerts in clear,
  actionable language for non-technical homeowners.

  Guidelines:
  - Be clear and concise (2-3 sentences max)
  - Explain WHY this detection matters
  - Provide specific, actionable recommendations
  - Use appropriate urgency (but don't be alarmist)
  - Never speculate beyond the data provided
  - Use simple language (avoid jargon)`;

  const userPrompt = `Summarize this security detection for a homeowner:

  Detection Type: ${formatDetectionType(detectionType)}
  Signal Strength: ${rssi} dBm
  Proximity Zone: ${zone}
  Threat Level: ${threatLevel.toUpperCase()}
  Movement: ${trendDescription}
  Device: ${deviceInfo}
  Time: ${formatDate(timestamp)}

  Provide:
  1. A clear summary (2-3 sentences) explaining what happened
  2. Why this threat level was assigned
  3. One specific action the homeowner should take`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}
```

#### UI Component
**File:** `src/components/alerts/AlertSummaryCard.tsx`

Displays the AI-generated summary with:
- Summary text
- Threat explanation
- Recommended actions (bulleted list)
- Regenerate button
- Feedback buttons (helpful/not helpful)

#### React Hook
**File:** `src/hooks/useAlertSummary.ts`

Manages the UI state for alert summaries:

```typescript
export function useAlertSummary(alertId: string) {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = async () => {
    setIsLoading(true);
    try {
      const result = await llmService.generateAlertSummary({
        alert: alertData,
        relatedAlerts,
        deviceHistory,
      });
      setSummary(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate, regenerate };
}
```

#### Screen Integration
**File:** `src/screens/AlertDetailScreen.tsx`

Shows the "Explain with AI" button and AlertSummaryCard component.

### Configuration

**File:** `src/config/llmConfig.ts:46-52`

```typescript
ALERT_SUMMARIES: {
  AUTO_GENERATE_FOR_THREATS: ['high', 'critical'], // Auto-generate for these levels
  MAX_TOKENS: 150,                                  // Limit response length
  TEMPERATURE: 0.7,                                 // Balance creativity vs consistency
  ENABLE_PRELOADING: true,                          // Preload summaries in background
  PRELOAD_LIMIT: 5,                                 // Preload top 5 critical alerts
}
```

### Caching Strategy

**File:** `src/services/llm/cache/ResponseCache.ts`

Summaries are cached by:
- Alert ID
- Threat level
- Prompt content hash

Cache TTL: 24 hours

This prevents re-generating the same summary multiple times, improving performance.

---

## Use Case 2: Device Pattern Analysis

### Purpose

Analyzes detection patterns over time to identify routine visitors (delivery drivers, neighbors, mail carriers) and suggests whitelisting to reduce false alerts.

### User Experience

**Trigger:**
- User views device detail screen
- System auto-analyzes after 3+ detections

**Input Data:**
- Device MAC address and metadata
- Detection history (timestamps, zones, signal strengths)
- Time of day patterns
- Day of week patterns
- Similar devices in the system

**Output:**
- **Pattern Type**: delivery, neighbor, routine, suspicious, or unknown
- **Description**: Detailed analysis of the pattern
- **Confidence Score**: How certain the AI is (0.0-1.0)
- **Whitelist Suggestion**: Optional recommendation with friendly name

### Example

**Input History:**
```json
{
  "device": {
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "first_seen": "2025-11-01T09:00:00Z"
  },
  "detectionHistory": [
    { "timestamp": "2025-11-18T14:30:00Z", "zone": "FAR" },
    { "timestamp": "2025-11-19T14:15:00Z", "zone": "FAR" },
    { "timestamp": "2025-11-20T14:45:00Z", "zone": "FAR" },
    { "timestamp": "2025-11-21T14:20:00Z", "zone": "FAR" },
    { "timestamp": "2025-11-22T14:35:00Z", "zone": "FAR" }
  ]
}
```

**Output Analysis:**
```json
{
  "patternType": "delivery",
  "description": "This device appears to be a delivery driver. Detected on
  weekdays during typical delivery hours (2-3pm) and stays in the FAR zone
  (street level). The pattern is highly consistent over the past 5 days.",
  "confidence": 0.9,
  "whitelistSuggestion": {
    "name": "Delivery Driver",
    "category": "delivery",
    "reason": "Regular weekday afternoon detections in street zone"
  }
}
```

### Implementation Files

#### Service Layer
**File:** `src/services/llm/LLMService.ts:114-148`

```typescript
async analyzeDevicePattern(context: DeviceContext): Promise<PatternAnalysis> {
  // Requires minimum 3 detections
  if (context.detectionHistory.length < LLM_CONFIG.PATTERN_ANALYSIS.MIN_DETECTIONS_REQUIRED) {
    throw new Error('Insufficient detection history for pattern analysis');
  }

  // Build chat messages from device context
  const messages = this.patternAnalysisTemplate.buildPrompt(context);

  // Generate analysis
  const response = await this.generate({
    messages,
    context,
    options: {
      maxTokens: LLM_CONFIG.PATTERN_ANALYSIS.MAX_TOKENS, // 200
      temperature: LLM_CONFIG.PATTERN_ANALYSIS.TEMPERATURE, // 0.6 (more deterministic)
    },
    cacheKey: LLM_CONFIG.ENABLE_CACHING ? cacheKey : undefined,
  });

  // Parse pattern type, confidence, whitelist suggestion
  return this.parsePatternAnalysis(response.text);
}
```

#### Prompt Template
**File:** `src/services/llm/templates/PatternAnalysisTemplate.ts:39-80`

```typescript
buildPrompt(context: DeviceContext): Message[] {
  const systemPrompt = `You are a pattern recognition expert for a security
  system. Analyze device detection patterns to identify routine visitors,
  suspicious behavior, and suggest appropriate actions.

  Common patterns:
  - Delivery driver: Weekdays, same time, stays in FAR zone (street)
  - Mail carrier: Weekdays, morning, brief visits
  - Neighbor: Regular times, EXTREME zone (property boundary)
  - Routine visitor: Same days/times, approaches property
  - Suspicious: Irregular times, especially nighttime, stationary

  Your analysis should:
  - Identify the most likely pattern type
  - Explain the reasoning clearly
  - Suggest if device should be whitelisted
  - Recommend a friendly name if whitelisting`;

  const userPrompt = `Analyze this device detection pattern:

  Device: ${macAddress}
  First Seen: ${formatDate(firstSeen)}
  Total Detections: ${totalDetections}

  Recent Detections:
  ${formatDetections(detectionHistory)}

  Time Analysis:
  ${timeAnalysis}

  Provide:
  1. Pattern type (delivery, neighbor, routine, suspicious, unknown)
  2. Confidence level (high, medium, low)
  3. Should this device be whitelisted?
  4. Suggested friendly name if whitelisting`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}
```

#### Configuration

**File:** `src/config/llmConfig.ts:54-58`

```typescript
PATTERN_ANALYSIS: {
  MAX_TOKENS: 200,              // Longer responses for detailed analysis
  TEMPERATURE: 0.6,             // More deterministic than summaries
  MIN_DETECTIONS_REQUIRED: 3,  // Require at least 3 detections
}
```

### Use Cases for Pattern Analysis

1. **Reduce False Alerts**: Automatically identify routine visitors
2. **Smart Whitelisting**: Suggest devices to whitelist with context
3. **Anomaly Detection**: Flag suspicious patterns (nighttime, irregular)
4. **User Education**: Explain patterns so users understand their environment

---

## Use Case 3: Conversational Security Assistant

### Purpose

Provides interactive, conversational access to security data. Users can ask questions about their alerts, devices, and system status in natural language.

### User Experience

**Trigger:** User types a question in the chat interface.

**Input Data:**
- User's message
- Conversation history (last 5 messages)
- Recent alerts (contextual information)
- Device status data
- System configuration

**Output:**
- Natural language response
- Relevant follow-up suggestions
- Actionable recommendations

### Example Conversations

**Example 1: Alert Inquiry**
```
User: "What happened at 2pm today?"

AI: "At 2:15pm, a WiFi device was detected in your driveway (NEAR zone).
The device approached your property but then left after 3 minutes. This
was flagged as MEDIUM threat. Would you like to see the device details?"
```

**Example 2: Status Check**
```
User: "Is everything normal?"

AI: "Yes, everything looks normal. You've had 3 detections in the last
24 hours - all from whitelisted devices (your delivery driver and neighbor).
No alerts required attention."
```

**Example 3: Device Question**
```
User: "Who's been detected most this week?"

AI: "Your neighbor's device (AA:BB:CC:DD:EE:FF) has been detected 12 times
this week, mostly in the afternoon. This is consistent with their usual
pattern. The device is whitelisted as 'Neighbor - John'."
```

### Implementation Files

#### Service Layer
**File:** `src/services/llm/LLMService.ts:153-180`

```typescript
async chat(context: ConversationContext): Promise<ChatResponse> {
  // Build chat messages (includes conversation history)
  const messages = this.conversationalTemplate.buildPrompt(context);

  // Generate response (don't cache conversational responses)
  const response = await this.generate({
    messages,
    context,
    options: {
      maxTokens: LLM_CONFIG.CONVERSATIONAL.MAX_TOKENS, // 150
      temperature: LLM_CONFIG.CONVERSATIONAL.TEMPERATURE, // 0.8 (more creative)
    },
    // Note: No caching for conversations
  });

  return {
    message: response.text,
    confidence: 0.8,
  };
}
```

#### Prompt Template
**File:** `src/services/llm/templates/ConversationalTemplate.ts:51-90`

```typescript
buildPrompt(context: ConversationContext): Message[] {
  const systemPrompt = `You are a helpful security assistant for the
  TrailSense home security system. You help homeowners understand their
  security data through natural conversation.

  You have access to:
  - Recent security alerts and detections
  - Device status and history
  - Whitelist configuration
  - System settings

  Guidelines:
  - Be conversational and friendly (but professional)
  - Answer questions based ONLY on provided data (never speculate)
  - If you don't know something, say so
  - Offer to help with follow-up questions
  - Suggest actionable next steps when relevant
  - Keep responses concise (3-4 sentences max)`;

  // Include conversation history
  const conversationMessages = messages.slice(-5).map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add security context
  const contextMessage = securityContext ?
    `Current Security Status:\n${formatSecurityContext(securityContext)}` : '';

  return [
    { role: 'system', content: systemPrompt },
    ...conversationMessages,
    { role: 'user', content: contextMessage }
  ];
}
```

#### Configuration

**File:** `src/config/llmConfig.ts:60-64`

```typescript
CONVERSATIONAL: {
  MAX_TOKENS: 150,           // Concise responses
  TEMPERATURE: 0.8,          // More conversational/creative
  MAX_CONTEXT_MESSAGES: 5,  // Keep last 5 messages for context
}
```

### Notes

- **No Caching**: Conversational responses are not cached (each conversation is unique)
- **Context Window**: Only last 5 messages included to save tokens
- **Security Context**: Recent alerts and device status included automatically
- **Stateless**: Each request is independent (no persistent conversation memory)

---

## Architecture Overview

### High-Level Flow

```
User Action (UI)
    ↓
React Hook (useAlertSummary, etc.)
    ↓
LLM Service (LLMService.ts)
    ↓
Template (AlertSummaryTemplate, etc.)
    ↓
Inference Engine (inferenceEngine.ts)
    ↓
Model Manager (modelManager.ts)
    ↓
LLM Controller (react-native-executorch)
    ↓
Llama 3.2 1B Model (on-device)
    ↓
Response flows back up the stack
```

### Component Responsibilities

#### 1. **LLM Service** (`LLMService.ts`)
- **Role**: Main entry point for all LLM features
- **Responsibilities**:
  - Route requests to appropriate templates
  - Manage caching
  - Parse structured responses
  - Handle errors and retries
  - Track performance metrics

#### 2. **Templates** (`templates/*.ts`)
- **Role**: Build prompts for different use cases
- **Responsibilities**:
  - Format input data for the AI
  - Create chat message arrays (system + user prompts)
  - Include relevant context
  - Follow best practices for prompt engineering

#### 3. **Inference Engine** (`inferenceEngine.ts`)
- **Role**: Execute model inference
- **Responsibilities**:
  - Validate input messages
  - Call LLM Controller
  - Handle timeouts
  - Post-process responses
  - Estimate token counts
  - Provide mock mode for testing

#### 4. **Model Manager** (`modelManager.ts`)
- **Role**: Manage model lifecycle
- **Responsibilities**:
  - Load Llama 3.2 1B model
  - Track download progress
  - Handle model unloading
  - Manage memory
  - Retry failed loads

#### 5. **LLM Controller** (from `react-native-executorch`)
- **Role**: Native bridge to ExecuTorch
- **Responsibilities**:
  - Download model files
  - Load model into memory
  - Run inference on device
  - Stream tokens
  - Apply chat templates

---

## File Reference Guide

### Core Services

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/services/llm/LLMService.ts` | Main LLM service | `generateAlertSummary()`, `analyzeDevicePattern()`, `chat()` |
| `src/services/llm/inferenceEngine.ts` | Run inference | `generate(messages, options)` |
| `src/services/llm/modelManager.ts` | Manage model lifecycle | `loadModel()`, `unloadModel()`, `getModel()` |
| `src/services/llm/cache/ResponseCache.ts` | Cache responses | `get()`, `set()`, `clear()` |

### Templates

| File | Purpose | Use Case |
|------|---------|----------|
| `src/services/llm/templates/PromptTemplate.ts` | Base template class | N/A (abstract) |
| `src/services/llm/templates/AlertSummaryTemplate.ts` | Alert summaries | Use Case 1 |
| `src/services/llm/templates/PatternAnalysisTemplate.ts` | Pattern analysis | Use Case 2 |
| `src/services/llm/templates/ConversationalTemplate.ts` | Chat assistant | Use Case 3 |

### UI Components

| File | Purpose | Use Case |
|------|---------|----------|
| `src/components/alerts/AlertSummaryCard.tsx` | Display alert summary | Use Case 1 |
| `src/hooks/useAlertSummary.ts` | Alert summary hook | Use Case 1 |
| `src/screens/AlertDetailScreen.tsx` | Alert detail screen | Use Case 1 |

### Configuration

| File | Purpose | Contains |
|------|---------|----------|
| `src/config/llmConfig.ts` | LLM configuration | Model settings, timeouts, token limits |
| `src/config/featureFlags.ts` | Feature flags | Enable/disable LLM features, mock mode |
| `src/types/llm.ts` | Type definitions | Interfaces for requests, responses, contexts |

### Utilities

| File | Purpose | Functions |
|------|---------|-----------|
| `src/utils/llmLogger.ts` | Logging | `info()`, `error()`, `debug()` |
| `src/utils/llmPerformance.ts` | Performance tracking | `startTimer()`, `recordInference()` |

---

## Integration Points

### How to Use Alert Summaries

```typescript
import { llmService } from '@/services/llm';

// In a component or hook
const generateSummary = async (alert) => {
  try {
    const summary = await llmService.generateAlertSummary({
      alert: alert,
      relatedAlerts: [], // Optional
      deviceHistory: null, // Optional
    });

    console.log(summary.summary);
    console.log(summary.recommendedActions);
  } catch (error) {
    console.error('Failed to generate summary:', error);
  }
};
```

### How to Use Pattern Analysis

```typescript
import { llmService } from '@/services/llm';

// Analyze a device's detection pattern
const analyzeDevice = async (device, detections) => {
  try {
    const analysis = await llmService.analyzeDevicePattern({
      device: device,
      detectionHistory: detections,
      similarDevices: [], // Optional
    });

    console.log(`Pattern: ${analysis.patternType}`);
    console.log(`Confidence: ${analysis.confidence}`);

    if (analysis.whitelistSuggestion) {
      console.log(`Suggest whitelisting as: ${analysis.whitelistSuggestion.name}`);
    }
  } catch (error) {
    console.error('Failed to analyze pattern:', error);
  }
};
```

### How to Use Conversational Assistant

```typescript
import { llmService } from '@/services/llm';

// Send a chat message
const sendMessage = async (userMessage, conversationHistory) => {
  try {
    const response = await llmService.chat({
      messages: [
        ...conversationHistory,
        { role: 'user', content: userMessage, timestamp: Date.now() }
      ],
      securityContext: {
        recentAlerts: [], // Include recent alerts
        deviceStatus: [], // Include device statuses
      }
    });

    console.log(`AI: ${response.message}`);
  } catch (error) {
    console.error('Failed to get response:', error);
  }
};
```

---

## Performance Characteristics

### Initialization (First Time)

| Phase | Duration | Notes |
|-------|----------|-------|
| Model Download | 2-5 minutes | ~1.5GB download (one-time) |
| Model Load | 10-30 seconds | First load after download |
| First Inference | 5-10 seconds | Includes warm-up |

### Subsequent Usage

| Operation | Duration | Notes |
|-----------|----------|-------|
| Model Load | 5-10 seconds | From cache |
| Alert Summary | 2-5 seconds | Typical inference time |
| Pattern Analysis | 3-6 seconds | Slightly longer prompts |
| Chat Response | 2-4 seconds | Depends on context |

### Memory Usage

| State | RAM Usage | Notes |
|-------|-----------|-------|
| Model Unloaded | ~100MB | Base app |
| Model Loaded | ~2-3GB | Model in memory |
| During Inference | ~3-4GB | Peak usage |

### Optimization Strategies

1. **Caching**:
   - Alert summaries cached for 24 hours
   - Pattern analyses cached by device
   - Reduces redundant inference

2. **Lazy Loading**:
   - Model loads on first use
   - Auto-unloads after 5 minutes idle

3. **Token Limiting**:
   - Alert summaries: 150 tokens max
   - Pattern analysis: 200 tokens max
   - Conversations: 150 tokens max

4. **Preloading**:
   - Critical alerts auto-generate summaries
   - Preload top 5 alerts in background

---

## Error Handling

### Common Errors

| Error Code | Meaning | User Action |
|------------|---------|-------------|
| `MODEL_NOT_DOWNLOADED` | Model needs download | Initiate download from Settings |
| `MODEL_LOAD_FAILED` | Failed to load model | Restart app, check storage |
| `INFERENCE_TIMEOUT` | Inference took too long | Try again, simplify prompt |
| `OUT_OF_MEMORY` | Insufficient RAM | Close other apps |
| `PLATFORM_NOT_SUPPORTED` | iOS not supported | Use Android device |

### Retry Logic

**File:** `src/services/llm/modelManager.ts:145-152`

```typescript
// Retry up to 3 times with exponential backoff
if (this.loadAttempts < this.MAX_LOAD_ATTEMPTS) {
  await this.sleep(LLM_CONFIG.RETRY_DELAY_MS);
  return this.loadModel(); // Recursive retry
}
```

---

## Future Enhancements

### Planned Features

1. **Multi-Alert Analysis**: Analyze patterns across multiple alerts
2. **Predictive Alerts**: Predict likely future detections
3. **Smart Scheduling**: Learn optimal monitoring times
4. **Voice Integration**: Voice-based Q&A
5. **Summary Personalization**: Learn user preferences

### Model Upgrades

- **Llama 3.2 3B**: Larger model for better accuracy (requires more RAM)
- **Fine-tuned Model**: Domain-specific training on security data
- **Quantized Models**: Smaller, faster variants

---

## Testing

### Mock Mode

**File:** `src/config/featureFlags.ts:51`

Set `LLM_MOCK_MODE: true` to test UI without real model:

```typescript
FEATURE_FLAGS.LLM_MOCK_MODE = true;  // Use mock responses
FEATURE_FLAGS.LLM_MOCK_MODE = false; // Use real Llama 3.2 1B
```

Mock responses are defined in:
**File:** `src/services/llm/inferenceEngine.ts:161-189`

### Testing Checklist

- [ ] Alert summary generates correctly
- [ ] Pattern analysis identifies delivery drivers
- [ ] Conversational assistant responds accurately
- [ ] Caching works (second request is instant)
- [ ] Model downloads successfully
- [ ] Performance is acceptable (<10s inference)
- [ ] Error handling works (airplane mode test)
- [ ] Memory usage is acceptable
- [ ] UI shows loading states
- [ ] Feedback buttons work

---

## Conclusion

The TrailSense LLM integration provides three powerful AI-driven features that enhance the security monitoring experience:

1. **Alert Summaries** help users quickly understand security events
2. **Pattern Analysis** reduces false alerts through intelligent device recognition
3. **Conversational Assistant** makes security data accessible through natural language

All features run **100% on-device** using Llama 3.2 1B, ensuring privacy, offline functionality, and low latency.

---

**For Questions or Issues:**
- Check logs: `adb logcat | grep -E 'LLM|executorch'`
- Review error codes in `src/types/llm.ts`
- Test with mock mode first
- Ensure physical device meets requirements (Android 10+, 6GB+ RAM)

**Document Maintained By:** Claude Code
**Last Review Date:** November 24, 2025
