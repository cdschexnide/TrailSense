# LLM Intent-Aware Context Pipeline

**Date:** 2026-04-02
**Status:** Approved
**Scope:** Redesign the on-device LLM conversational pipeline to produce accurate, specific, and useful responses by classifying user intent, building focused context, and post-processing output.

## Problem

The current conversational LLM (Llama 3.2 1B via ExecuTorch) produces poor responses:

1. **Generic/vague** — "I recommend taking necessary precautions" instead of listing actual alert data
2. **Hallucinations** — "device list appears to be empty" when 5 devices exist
3. **Verbose filler** — "Based on the provided information, I've analyzed..." preamble on every response
4. **Doesn't answer the question** — "Tell me about critical alerts" gets a summary of everything instead of critical alerts

**Root cause:** Every question receives the same ~800-token data dump containing alert counts, device statuses, time patterns, and the last 10 alerts regardless of type. The 1B model can't extract what's relevant from a wall of mixed data, so it summarizes the top of the blob and fills the rest with generic advice.

## Solution: Intent-Aware Context Pipeline

```
User message
      ↓
IntentClassifier.classify(message)
      ↓
{ intent, filters }
      ↓
FocusedContextBuilder.build(intent, filters, alerts, devices)
      ↓
focused contextString (~800 tokens, all relevant)
      ↓
ConversationalTemplate.buildPrompt(messages, intent, focusedContext)
      ↓
inferenceEngine.generate(messages)
      ↓
ResponseProcessor.process(response, intent, filters, alerts, devices)
      ↓
Clean, accurate response → UI
```

## 1. Intent Classifier

Pure regex/keyword matching. No inference cost. Returns `{ intent, filters, confidence }`.

### Intent Categories

| Intent            | Trigger Keywords                                              | Context Included                          |
| ----------------- | ------------------------------------------------------------- | ----------------------------------------- |
| `alert_query`     | "alerts", "detections", "critical", "high threat", "warnings" | Filtered alerts with full detail          |
| `device_query`    | "sensors", "offline", "battery", "devices"                    | Full device table                         |
| `status_overview` | "status", "summary", "how's everything", "what's going on"    | Compact summary with top concerns         |
| `pattern_query`   | "pattern", "suspicious", "unusual", "activity this week"      | Repeat visitors, time analysis, anomalies |
| `time_query`      | "quietest", "busiest", "when", "what time"                    | Hour-by-hour breakdown                    |
| `help`            | "what can you do", "help", "how do I"                         | No data context, capability description   |

### Filter Extraction

Extracted from the user message via regex:

- **Threat level:** "critical alerts" → `{ threatLevel: 'critical' }`
- **Time range:** All time filters use rolling windows: "today" / "last 24 hours" → rolling 24h, "this week" / "last 7 days" → rolling 7d. No "since midnight" semantics — rolling is simpler and avoids timezone edge cases.
- **Device name:** matches against device names from the `rawDevices` array passed to `chat()` → `{ deviceName: 'North Gate Sensor' }`. The classifier receives the device list as a parameter so it can match user references like "north gate" to actual device names.
- **Detection type:** "WiFi detections", "bluetooth" → `{ detectionType: 'wifi' }`
- **Status filters:** "unreviewed" → `{ isReviewed: false }`, "offline" → `{ online: false }`

Falls back to `status_overview` if no intent matches with sufficient confidence.

### Interface

```typescript
interface ClassifiedIntent {
  intent:
    | 'alert_query'
    | 'device_query'
    | 'status_overview'
    | 'pattern_query'
    | 'time_query'
    | 'help';
  filters: IntentFilters;
  confidence: number;
}

interface IntentFilters {
  threatLevel?: 'critical' | 'high' | 'medium' | 'low';
  detectionType?: 'wifi' | 'bluetooth' | 'cellular';
  timeRange?: '24h' | '7d';
  deviceName?: string;
  isReviewed?: boolean;
  online?: boolean;
}
```

## 2. Focused Context Builders

Each intent gets a dedicated context builder that maximizes relevant data within the ~800-token budget.

### `buildAlertContext(alerts, filters)`

Filters alerts by threat level/type/time from `IntentFilters`, then formats:

```
You have 16 critical alerts. Here are the most recent:

1. Cellular detection at South Boundary sensor
   Time: Dec 15, 2:30 AM
   Signal: -58 dBm (NEAR zone, ~20-50 ft)
   MAC: A4:CF:12:XX:XX:XX
   Status: UNREVIEWED
   Notes: 850MHz band, stationary for 12 min, nighttime

2. Cellular detection at North Gate Sensor
   Time: Dec 14, 3:15 AM
   Signal: -52 dBm (IMMEDIATE zone, ~10-20 ft)
   MAC: A4:CF:12:XX:XX:XX (SAME device as #1)
   Status: UNREVIEWED
   Notes: 700MHz band, approaching pattern
```

Key behaviors:

- Pre-filtered by intent filters — only relevant alerts
- Cross-references MAC addresses across alerts to flag repeat visitors
- Includes proximity zone labels derived from RSSI
- Sorted by recency
- Fits more alerts than current approach since budget isn't shared with device/time data

### `buildDeviceContext(devices, alerts)`

Lists offline devices first (the likely reason someone asks about devices):

```
You have 5 TrailSense sensors. 3 online, 2 offline.

OFFLINE (needs attention):
1. Cabin Approach - OFFLINE since Dec 12
   Battery: 5% (CRITICAL)
   Last signal: weak
   Total detections: 156

2. East Trail Monitor - OFFLINE since Dec 16
   Battery: 12% (LOW)
   Last signal: fair
   Total detections: 213

ONLINE:
3. North Gate Sensor - ONLINE
   Battery: 87%, Signal: excellent, Detections: 142

4. South Boundary - ONLINE
   Battery: 65%, Signal: good, Detections: 98

5. West Fence Line - ONLINE
   Battery: 91%, Signal: excellent, Detections: 74
```

Key behaviors:

- Offline devices listed first with duration and reason
- Battery labeled as CRITICAL (<20%) / LOW (<40%) / OK
- No alert data cluttering the context

### `buildStatusContext(alerts, devices)`

Leads with actionable concerns:

```
SECURITY STATUS as of Dec 16, 8:05 PM:

TOP CONCERNS:
- 2 sensors offline (Cabin Approach, East Trail Monitor) — both low battery
- 16 critical alerts, 19 unreviewed total
- Most recent critical: cellular detection at South Boundary, Dec 15 2:30 AM

ALERT BREAKDOWN: 16 critical, 12 high, 28 medium, 30 low (86 total)
DETECTION TYPES: 34 WiFi, 28 Bluetooth, 24 Cellular
SENSORS: 3/5 online

LAST 24 HOURS: 5 new alerts (1 critical, 2 high, 2 medium)
```

### `buildPatternContext(alerts, devices)`

Groups by repeat visitors and flags anomalies:

```
DETECTION PATTERNS (last 7 days):

REPEAT VISITORS:
- MAC A4:CF:12:XX:XX:XX: 8 detections, all nighttime (1-4 AM), cellular only
  → SUSPICIOUS: irregular schedule, nighttime, cellular-only
- MAC B2:7F:34:XX:XX:XX: 12 detections, weekdays 10-11 AM, WiFi
  → ROUTINE: consistent schedule, likely delivery

HOURLY DISTRIBUTION:
  12AM-6AM: 14 alerts (16%) ← above average for nighttime
  6AM-12PM: 22 alerts (26%)
  12PM-6PM: 31 alerts (36%)
  6PM-12AM: 19 alerts (22%)

ANOMALIES:
- Nighttime activity (12AM-6AM) accounts for 16% of alerts but includes highest-threat detections
- New device (MAC C8:...) seen 3 times in 48 hours
```

### `buildTimeContext(alerts)`

Full hourly breakdown:

```
DETECTION TIME PATTERNS:

HOURLY BREAKDOWN:
  12 AM: 4    6 AM: 2    12 PM: 8    6 PM: 5
   1 AM: 3    7 AM: 5     1 PM: 6    7 PM: 4
   2 AM: 7←   8 AM: 3     2 PM: 4    8 PM: 3
   3 AM: 2    9 AM: 4     3 PM: 3    9 PM: 2
   4 AM: 1   10 AM: 6     4 PM: 5   10 PM: 3
   5 AM: 0   11 AM: 3     5 PM: 4   11 PM: 2

BUSIEST: 2 AM (7 alerts) — unusual, warrants investigation
QUIETEST: 5 AM (0 alerts)

WEEKDAY vs WEEKEND:
  Weekdays: avg 14 alerts/day
  Weekends: avg 8 alerts/day
```

### RSSI to Zone Mapping

Used by alert context builder:

| RSSI Range     | Zone      | Distance Estimate |
| -------------- | --------- | ----------------- |
| > -50 dBm      | IMMEDIATE | ~0-20 ft          |
| -50 to -70 dBm | NEAR      | ~20-50 ft         |
| -70 to -85 dBm | FAR       | ~50-200 ft        |
| < -85 dBm      | EXTREME   | ~200+ ft          |

## 3. System Prompt Redesign

### New System Prompt (~70 tokens)

```
You are TrailSense AI. You answer questions about property security sensor data.

RULES:
1. ONLY state facts from the DATA section below. Never guess or add information.
2. If data is missing, say "I don't have that data" — do not fill in gaps.
3. Start with the direct answer. No preamble like "Based on the provided information".
4. Reference specific names, numbers, and times from the data.
5. Keep your answer under 100 words.
```

### Intent-Specific User Prompt Templates

#### Alert Query

```
DATA:
{focusedAlertContext}

QUESTION: {user's message}

List each relevant alert with its threat level, detection type, sensor name, and time. Then give one sentence of analysis.
```

#### Device Query

```
DATA:
{focusedDeviceContext}

QUESTION: {user's message}

List each device with its status. Mention offline devices first. State battery levels and last seen times.
```

#### Status Overview

```
DATA:
{focusedStatusContext}

QUESTION: {user's message}

Start with the most urgent issue. Then summarize alert counts and device health. Keep it brief.
```

#### Pattern Query

```
DATA:
{focusedPatternContext}

QUESTION: {user's message}

Describe the pattern you see in the data. Mention specific MAC addresses, times, and frequencies. Flag anything unusual.
```

#### Time Query

```
DATA:
{focusedTimeContext}

QUESTION: {user's message}

Answer using specific hours and counts from the data.
```

#### Help

```
You are TrailSense AI, an on-device security assistant. You can answer questions about:
- Detection alerts (by threat level, type, or time)
- Sensor status (online/offline, battery)
- Activity patterns and suspicious behavior
- Time-based detection trends

QUESTION: {user's message}

Answer briefly. If the question is about security data, say what specific question to ask.
```

## 4. Response Post-Processing

Three stages applied to every response, all pure string manipulation (~1ms total).

### Stage 1: Clean Formatting

Strip preamble phrases:

- "Based on the provided information, "
- "Based on the data, "
- "According to the system's current data, "
- "I've analyzed "
- "Let me analyze "
- "Looking at the data, "

Strip filler closings:

- "Is there anything else you'd like to know?"
- "Feel free to ask if you have more questions."
- Any sentence containing "taking necessary precautions"
- Any sentence starting with "Considering the context of rural"

Trim to last complete sentence to avoid mid-word cutoffs.

### Stage 2: Hallucination Detection

Cross-reference response against the data provided in the prompt.

**Checks by intent:**

| Intent            | Hallucination Pattern                                     | Detection                                                                                                                       |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `device_query`    | "empty", "no devices", "none" when matching devices exist | Response contains negation + filter-matched devices non-empty (respects `online`, `deviceName` filters)                         |
| `alert_query`     | "no alerts" when matching alerts exist                    | Response negates + filter-matched alerts non-empty (respects `threatLevel`, `detectionType`, `timeRange`, `isReviewed` filters) |
| `status_overview` | "everything looks normal" with critical/high alerts       | Response claims normal + critical count > 0                                                                                     |

Note: Numeric contradiction detection (e.g., "3 critical alerts" when there are 16) is deferred to a future iteration. The 1B model often phrases counts imprecisely ("several", "a few"), making regex-based count extraction unreliable.

**On contradiction:** Replace the full response with a **deterministic fallback** built directly from the structured data — no model involved. Both the hallucination detection and the fallback builders apply the same `IntentFilters` (threatLevel, detectionType, timeRange, isReviewed, online, deviceName) to ensure the fallback is accurate for the specific query, not just the broad intent. Example for `alert_query` with `{ threatLevel: 'critical' }`:

```
16 critical alerts. Most recent:
1. Cellular detection at South Boundary, Dec 15 2:30 AM — signal -58 dBm
2. Cellular detection at North Gate Sensor, Dec 14 3:15 AM — signal -52 dBm
3. Bluetooth detection at Cabin Approach, Dec 13 11:45 PM — signal -61 dBm
```

The fallback is always accurate because it's generated from the actual data, not the model.

### Stage 3: Length Enforcement

Hard cap at 150 words. Truncate to last complete sentence within the limit.

## 5. Conversation Flow Changes

### AIAssistantScreen Changes

Pass raw data arrays instead of pre-built context:

```typescript
// Before
const chatResponse = await llmService.chat({
  messages: [...messages.filter(m => m.role !== 'system'), userMessage],
  securityContext: {
    recentAlerts: securityContext.recentAlerts,
    deviceStatus: securityContext.deviceList,
    contextString: securityContext.contextString,
  },
});

// After
const chatResponse = await llmService.chat({
  messages: [...messages.filter(m => m.role !== 'system'), userMessage],
  rawAlerts: alerts,
  rawDevices: devices,
});
```

`useSecurityContext` remains for the `SecurityStatusCard` header component. The chat pipeline bypasses it.

### LLMService.chat() Changes

Becomes the orchestrator:

```typescript
async chat(context: ChatContext): Promise<ChatResponse> {
  const { messages, rawAlerts, rawDevices } = context;
  const userMessage = messages[messages.length - 1].content;

  const { intent, filters } = IntentClassifier.classify(userMessage, rawDevices);

  const focusedContext = FocusedContextBuilder.build(
    intent, filters, rawAlerts, rawDevices
  );

  const promptMessages = this.conversationalTemplate.buildPrompt(
    messages, intent, focusedContext
  );

  const response = await this.generate({
    messages: promptMessages,
    options: {
      maxTokens: LLM_CONFIG.CONVERSATIONAL.MAX_TOKENS,
      temperature: LLM_CONFIG.CONVERSATIONAL.TEMPERATURE,
    },
  });

  const processed = ResponseProcessor.process(
    response.text, intent, filters, rawAlerts, rawDevices
  );

  return { message: processed, confidence: 0.8, intent };
}
```

### ConversationalTemplate Changes

- `buildPrompt()` gains `intent` and `focusedContext` parameters
- Routes to intent-specific user prompt templates
- System prompt shortened to ~70 tokens
- `focusedContext` is truncated to ~800 tokens via `truncateText()` before injection, enforcing the token budget regardless of how many alerts/devices match the filters
- Remove unused `buildQuestionPrompt`, `buildAlertQuestionPrompt`, `buildDeviceQuestionPrompt`, `buildStatusQuestionPrompt` methods

### Type Changes

```typescript
// New type replacing ConversationContext for chat
interface ChatContext {
  messages: ChatMessage[];
  rawAlerts: Alert[];
  rawDevices: Device[];
}

// ChatResponse gains intent field
interface ChatResponse {
  message: string;
  confidence: number;
  intent?: string;
}
```

## 6. New Files

| File                                        | Purpose                                                      | Approximate Size |
| ------------------------------------------- | ------------------------------------------------------------ | ---------------- |
| `src/services/llm/IntentClassifier.ts`      | Regex/keyword intent classification + filter extraction      | ~150 lines       |
| `src/services/llm/FocusedContextBuilder.ts` | Intent-specific context formatters (5 builders + helpers)    | ~300 lines       |
| `src/services/llm/ResponseProcessor.ts`     | 3-stage post-processing (clean, hallucination check, length) | ~200 lines       |

## 7. Modified Files

| File                                                   | Changes                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `src/services/llm/templates/ConversationalTemplate.ts` | New system prompt, intent-aware buildPrompt, remove unused question methods                     |
| `src/services/llm/LLMService.ts`                       | `chat()` orchestrates intent → context → prompt → generate → process                            |
| `src/services/llm/AIProvider.tsx`                      | Update `chat` wrapper and `AIContextType` to use `ChatContext` instead of `ConversationContext` |
| `src/screens/ai/AIAssistantScreen.tsx`                 | Pass raw alerts/devices instead of pre-built securityContext                                    |
| `src/types/llm.ts`                                     | Add `ChatContext`, `ClassifiedIntent`, `IntentFilters`; update `ChatResponse`                   |

## 8. Token Budget Comparison

For "Tell me about the critical alerts" with 2048 token context window:

| Component                     | Before                                   | After                                        |
| ----------------------------- | ---------------------------------------- | -------------------------------------------- |
| System prompt                 | ~160 tokens                              | ~70 tokens                                   |
| Conversation history (5 msgs) | ~200 tokens                              | ~200 tokens                                  |
| Context data                  | ~800 tokens (everything)                 | ~800 tokens (only critical alerts)           |
| User prompt template          | ~20 tokens                               | ~40 tokens                                   |
| **Available for generation**  | **~868 tokens**                          | **~938 tokens**                              |
| **Relevant data in context**  | ~15% (~120 tokens about critical alerts) | ~95% (~760 tokens of critical alert details) |

## 9. What Stays the Same

- `useSecurityContext` hook — still used by `SecurityStatusCard` for dashboard display
- `inferenceEngine.ts` — unchanged, still handles model interaction
- `modelManager.ts` — unchanged, still handles ExecuTorch lifecycle
- `ResponseCache` — unchanged, still available for alert summaries and pattern analysis
- `AlertSummaryTemplate` and `PatternAnalysisTemplate` — unchanged, used by their respective features
- Mock mode — `inferenceEngine` mock responses still work; `ResponseProcessor` also runs in mock mode for consistency
- Feature flags — no new flags needed
