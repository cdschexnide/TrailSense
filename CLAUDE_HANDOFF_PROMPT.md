# Claude Code Handoff Prompt - TrailSense LLM Integration

Copy and paste this prompt to a new Claude Code instance to continue where we left off:

---

## Prompt:

I'm working on the TrailSense mobile app (React Native/Expo) and need to continue implementing on-device LLM features. A previous Claude Code instance has completed 85% of the implementation. Here's where we are:

### Context
- **Project:** TrailSense - Home security/intrusion detection app
- **Branch:** `feature/on-device-llm`
- **Goal:** Add on-device LLM using ExecuTorch for natural language alert summaries
- **Platform:** Android-first (iOS deferred), model bundled with app (no CDN)
- **Location:** `/Users/home/Documents/Project/TrailSense`

### What's Already Implemented (85% complete)

All core infrastructure is done:

**Configuration & Services:**
- ✅ `src/config/llmConfig.ts` - Full configuration (MODEL_STRATEGY: 'bundled')
- ✅ `src/config/featureFlags.ts` - Feature flags with A/B testing
- ✅ `src/services/llm/modelDownloader.ts` - Supports bundled models
- ✅ `src/services/llm/modelManager.ts` - Model loading/unloading
- ✅ `src/services/llm/inferenceEngine.ts` - Text generation with mock mode
- ✅ `src/services/llm/LLMService.ts` - Unified API
- ✅ `src/services/llm/cache/ResponseCache.ts` - Response caching
- ✅ `src/services/llm/templates/` - 3 prompt templates (Alert, Pattern, Conversational)

**UI & Hooks:**
- ✅ `src/components/organisms/AlertSummaryCard/` - UI component for summaries
- ✅ `src/hooks/useAlertSummary.ts` - React hook for alert summaries

**Types & Utils:**
- ✅ `src/types/llm.ts` - All TypeScript types
- ✅ `src/utils/llmLogger.ts` - Logging
- ✅ `src/utils/llmPerformance.ts` - Performance tracking

**Documentation:**
- ✅ `LLM_QUICK_START.md` - Quick start guide
- ✅ `LLM_BUNDLED_MODEL_GUIDE.md` - Model bundling guide
- ✅ `LLM_INTEGRATION_GUIDE.md` - Full integration guide
- ✅ `LLM_IMPLEMENTATION_STATUS.md` - Project status

### What Needs to Be Done (15% remaining)

**Priority 1: Model Preparation (External task)**
1. Convert Gemma 3n E2B model to ExecuTorch .pte format
2. Copy model files to `android/app/src/main/assets/`
   - Files: `gemma-3n-e2b-int4.pte` (~2GB) and `tokenizer.bin` (~512KB)
   - Full instructions in `LLM_BUNDLED_MODEL_GUIDE.md`

**Priority 2: Integration (Code task)**
3. Update `src/screens/alerts/AlertDetailScreen.tsx` with LLM integration
   - Add imports and hook usage
   - Add AlertSummaryCard to render
   - Example code in `LLM_INTEGRATION_GUIDE.md` section "Step 1.4"

**Priority 3: Testing**
4. Test with mock mode first (no model needed)
5. Test with real model on physical Android device
6. Validate all error scenarios

### Important Implementation Details

- **Model Strategy:** Using 'bundled' approach - model lives in Android assets, no CDN/download needed
- **Mock Mode:** Available for testing without model - set `LLM_MOCK_MODE: true` in feature flags
- **Platform:** Android-only initially (Platform.OS === 'android' checks throughout)
- **ExecuTorch:** Using `react-native-executorch@0.4.10` (already installed)
- **Auto-generation:** Summaries auto-generate for HIGH and CRITICAL threat alerts

### Key Configuration

Current settings in `src/config/llmConfig.ts`:
```typescript
MODEL_STRATEGY: 'bundled'  // Model bundled with app, not downloaded
MODEL_FILE_NAME: 'gemma-3n-e2b-int4.pte'
TOKENIZER_FILE_NAME: 'tokenizer.bin'
```

### Files to Reference

Start with these (in order):
1. `LLM_QUICK_START.md` - Overview of remaining work
2. `LLM_IMPLEMENTATION_STATUS.md` - Detailed status
3. `LLM_INTEGRATION_GUIDE.md` - Integration code examples
4. `LLM_BUNDLED_MODEL_GUIDE.md` - Model preparation steps

### My Immediate Question/Task

[INSERT YOUR SPECIFIC QUESTION OR TASK HERE]

For example:
- "Help me integrate the AlertSummaryCard into AlertDetailScreen"
- "I have the model files ready, where exactly do I copy them?"
- "Help me test the LLM features with mock mode"
- "I'm getting an error when loading the model: [error message]"
- "Continue with the next integration step from where the previous Claude left off"

---

## Additional Context (Optional)

[Add any specific issues, errors, or additional context here]

---

**Note to Claude:** All the heavy lifting (services, components, hooks) is done. The main remaining work is:
1. Model file preparation (external Python task)
2. Simple integration into AlertDetailScreen (mostly copy-paste from guide)
3. Testing and validation

The code is designed to work with bundled models (local-only, no CDN) and includes mock mode for testing without the actual model.
