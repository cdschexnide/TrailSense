# Claude Code Handoff - Real LLM Implementation with Built-in Models

Copy and paste this prompt to a new Claude Code instance to implement the real on-device LLM:

---

## Prompt:

I'm working on the TrailSense mobile app (React Native/Expo) and need to implement **real on-device LLM** using the built-in models from `react-native-executorch`. The code integration is 100% complete and working with mock mode. Now I need to switch to the actual Llama 3.2 1B model.

### Context
- **Project:** TrailSense - Home security/intrusion detection app
- **Location:** `/Users/home/Documents/Project/TrailSense`
- **Branch:** `feature/on-device-llm`
- **Status:** Code 100% complete, mock mode tested and working
- **Package:** `react-native-executorch@0.4.10` (already installed)
- **Platform:** Android-first (iOS deferred)

### What's Already Done
- ✅ All LLM services and infrastructure (100%)
- ✅ UI components (AlertSummaryCard)
- ✅ React hooks (useAlertSummary)
- ✅ AlertDetailScreen integration (100%)
- ✅ Feature flags configured
- ✅ Mock mode working perfectly
- ✅ Android Gradle configured
- ✅ All documentation complete

### Key Discovery
The `react-native-executorch` package provides **built-in models** that don't require manual conversion!

From their README:
```typescript
import {
  useLLM,
  LLAMA3_2_1B,
  LLAMA3_2_TOKENIZER_CONFIG,
} from 'react-native-executorch';

const llm = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
});
```

### What I Need You to Do

**Primary Goal:** Update the codebase to use the built-in Llama 3.2 1B model from `react-native-executorch` instead of mock mode.

**DO NOT:**
- ❌ Test with mock mode
- ❌ Convert models manually
- ❌ Use custom model files
- ❌ Bundle model in assets

**DO:**
- ✅ Use built-in LLAMA3_2_1B from the package
- ✅ Update code to use the `useLLM` hook
- ✅ Disable mock mode
- ✅ Test with real model on device
- ✅ Ensure model downloads on-demand

---

## Step-by-Step Implementation

### Step 1: Study the Package API

1. **Read the package documentation:**
   ```bash
   cat /Users/home/Documents/Project/TrailSense/node_modules/react-native-executorch/README.md
   ```

2. **Check available models:**
   - Review what's exported from the package
   - Understand the `useLLM` hook API
   - Check tokenizer configuration requirements

3. **Review examples:**
   - Look at their example apps if available
   - Visit: https://docs.swmansion.com/react-native-executorch
   - Check: https://github.com/software-mansion/react-native-executorch/tree/main/examples

### Step 2: Update the Inference Engine

**File to modify:** `src/services/llm/inferenceEngine.ts`

**Current approach:**
```typescript
// Currently uses custom ExecuTorch module loading
// Works in mock mode only
```

**Update to:**
```typescript
import { useLLM, LLAMA3_2_1B, LLAMA3_2_TOKENIZER_CONFIG } from 'react-native-executorch';

// Initialize the model
const llm = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
});

// Generate responses
await llm.generate([
  { role: 'system', content: 'You are a security assistant that explains security alerts.' },
  { role: 'user', content: promptForAlert }
]);

return llm.response;
```

**Key changes needed:**
1. Replace custom model loading with `useLLM` hook
2. Update the inference function to use the hook's API
3. Handle the model's response format
4. Keep error handling and timeout logic
5. Ensure compatibility with existing service architecture

### Step 3: Update the LLM Service

**File to modify:** `src/services/llm/LLMService.ts`

**Changes needed:**
1. Initialize the `useLLM` hook at the service level
2. Update `generateAlertSummary` to use the new API
3. Ensure prompt templates work with the new format
4. Keep caching and performance tracking
5. Maintain the existing service interface (don't break consumers)

**Important:** The service should still expose the same API to the rest of the app, just use the built-in model internally.

### Step 4: Update Model Manager (If Needed)

**File to review:** `src/services/llm/modelManager.ts`

**Possible changes:**
- May not need manual model loading anymore
- The `useLLM` hook handles model lifecycle
- Keep status tracking if useful
- Simplify or refactor as needed

### Step 5: Disable Mock Mode

**File to modify:** `src/App.tsx`

**Current code (lines 26-29):**
```typescript
if (__DEV__) {
  console.log('[App] Enabling LLM mock mode for development');
  featureFlagsManager.enableMockMode();
}
```

**Update to:**
```typescript
// Disable mock mode - using real model
// if (__DEV__) {
//   console.log('[App] Enabling LLM mock mode for development');
//   featureFlagsManager.enableMockMode();
// }
```

Or update feature flags directly:

**File:** `src/config/featureFlags.ts`
```typescript
LLM_MOCK_MODE: false, // Use real model
```

### Step 6: Update Configuration

**File to review:** `src/config/llmConfig.ts`

**Possible updates:**
```typescript
// May need to update model configuration
MODEL_NAME: 'llama-3.2-1b',  // Update if needed
MODEL_STRATEGY: 'download',   // Change from 'bundled' to 'download'

// Remove these if not needed:
// MODEL_FILE_NAME: 'gemma-3n-e2b-int4.pte',  // Not needed for built-in models
// TOKENIZER_FILE_NAME: 'tokenizer.bin',      // Not needed for built-in models
```

### Step 7: Update Hook Integration (If Needed)

**File to review:** `src/hooks/useAlertSummary.ts`

**Check if changes needed:**
- The hook should still work with updated service
- May need to handle new loading states
- Ensure error handling compatible

### Step 8: Build and Test

1. **Clean build:**
   ```bash
   cd /Users/home/Documents/Project/TrailSense
   cd android && ./gradlew clean && cd ..
   ```

2. **Build and deploy:**
   ```bash
   npm run android
   ```

3. **Test on physical Android device:**
   - Deploy to device (Android 10+, 4GB+ RAM recommended)
   - Navigate to Alert Detail screen
   - Click "Explain with AI"
   - **First time:** Model downloads (may take 2-5 minutes)
   - Monitor logs: `adb logcat | grep -E 'LLM|executorch'`
   - Verify model loads successfully
   - Verify inference generates real summaries
   - Test with different alert types

### Step 9: Validation

**Check these things:**
- [ ] Model downloads successfully on first launch
- [ ] Subsequent loads are faster (model cached)
- [ ] Inference generates real, contextual summaries
- [ ] Summaries are NOT generic mock responses
- [ ] Performance is acceptable (inference <10s)
- [ ] Error handling works (airplane mode, etc.)
- [ ] UI shows loading states correctly
- [ ] Feedback buttons still work
- [ ] Regenerate produces different summaries
- [ ] Auto-generation works for HIGH/CRITICAL alerts

---

## Important Notes

### Model Details
- **Model:** Llama 3.2 1B (provided by react-native-executorch)
- **Download:** Happens automatically on first use
- **Size:** ~1-2GB (downloads to device cache)
- **Format:** .pte (ExecuTorch format, pre-converted by package)
- **Performance:** Should be 2-5s per inference on modern devices

### Architecture Considerations

**The package uses React hooks** (`useLLM`), but your service architecture is class-based. You'll need to:

**Option A: Use the hook at component level**
- Import `useLLM` in your components/hooks
- Pass the llm instance to services
- Simpler, more "React-y"

**Option B: Wrap the hook in your service**
- Create a React component that uses `useLLM`
- Expose service methods that delegate to it
- More complex but keeps architecture

**Option C: Use the low-level API (if available)**
- Check if package exports non-hook API
- Use directly in services
- Best for your architecture

**Recommended:** Check the package documentation to see what's available. If they only provide hooks, go with Option A.

### Testing Requirements
- **Physical device required** - model inference won't work on emulator
- **Minimum:** Android 10+, 4GB RAM (6GB+ recommended)
- **First run:** Model download takes 2-5 minutes (one-time)
- **Subsequent runs:** Model loads from cache in seconds

### Prompt Engineering

The built-in model expects chat format:
```typescript
[
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Your question here' }
]
```

**Update your prompt templates:**
- `src/services/llm/templates/AlertSummaryTemplate.ts`
- Make sure prompts work with chat format
- Test different system prompts for best results

### Performance Expectations

**First load:**
- Download: 2-5 minutes (one-time)
- Load into memory: 10-30 seconds
- First inference: 5-10 seconds

**Subsequent loads:**
- Load from cache: 5-10 seconds
- Inference: 2-5 seconds

**Optimization tips:**
- Keep model loaded in memory (don't unload too quickly)
- Use shorter prompts when possible
- Limit max_tokens to 150-200 for summaries

---

## Key Files to Modify

**Priority 1 (Required):**
1. `src/services/llm/inferenceEngine.ts` - Update to use `useLLM` hook
2. `src/services/llm/LLMService.ts` - Adapt to new API
3. `src/App.tsx` - Disable mock mode
4. `src/config/llmConfig.ts` - Update configuration

**Priority 2 (Review/Update if needed):**
5. `src/services/llm/modelManager.ts` - May need simplification
6. `src/hooks/useAlertSummary.ts` - Ensure compatibility
7. `src/services/llm/templates/AlertSummaryTemplate.ts` - Update prompts

**Priority 3 (Reference):**
8. Review package README and docs
9. Check examples from react-native-executorch

---

## Reference Documentation

**Read these files first:**
1. `START_HERE.md` - Overview
2. `FINAL_RECOMMENDATION.md` - Why built-in models
3. `TESTING_AND_DEPLOYMENT_GUIDE.md` - Testing workflows
4. Package README: `node_modules/react-native-executorch/README.md`

**Official docs:**
- https://docs.swmansion.com/react-native-executorch
- https://github.com/software-mansion/react-native-executorch

**Existing implementation:**
- `IMPLEMENTATION_COMPLETE.md` - What was built
- `LLM_QUICK_START.md` - Quick reference
- `LLM_INTEGRATION_GUIDE.md` - Integration patterns

---

## Expected Outcomes

After you complete this:
- ✅ Mock mode disabled
- ✅ Real Llama 3.2 1B model in use
- ✅ Model downloads automatically on first launch
- ✅ Real AI summaries generating
- ✅ Performance validated on device
- ✅ All features working end-to-end

---

## Troubleshooting

### If model won't download:
- Check internet connection
- Check device storage (needs ~2GB free)
- Check logs: `adb logcat | grep executorch`
- Verify package version: `npm list react-native-executorch`

### If inference fails:
- Check device has enough RAM (6GB+ recommended)
- Try shorter prompts
- Check model loaded successfully
- Review error messages

### If build fails:
- Clean build: `cd android && ./gradlew clean && cd ..`
- Clear metro cache: `npm run android -- --reset-cache`
- Verify react-native-executorch linked: `cd android && ./gradlew :app:dependencies | grep executorch`

### If app crashes:
- Check device RAM
- Close other apps
- Monitor logs during crash
- Try on device with more RAM

---

## Success Criteria

You'll know it's working when:

**First launch:**
- Logs show "Downloading model..."
- Progress visible (if UI shows it)
- Model loads after download completes

**Summary generation:**
- Real, contextual summaries appear
- NOT generic mock responses
- Summaries vary by alert type
- Different from mock mode responses

**Performance:**
- Inference completes in <10s
- No crashes
- Acceptable user experience

---

## My Specific Question/Task

**Please help me:**
1. Study the `react-native-executorch` package API and docs
2. Update the codebase to use built-in LLAMA3_2_1B model
3. Disable mock mode completely
4. Ensure proper integration with existing architecture
5. Build and test on physical Android device
6. Validate that real AI summaries work
7. Document any issues or changes made

**I have:**
- Physical Android device for testing (Android 10+, 6GB+ RAM)
- USB debugging enabled
- ADB working
- All code infrastructure complete

**I need help with:**
- Understanding the `useLLM` hook API
- Integrating it with existing service architecture
- Updating prompts for chat format
- Testing and validating real model
- Ensuring performance is good

---

## Important Implementation Details

**Model Strategy Changed:**
- **Before:** Bundled model in assets (2GB in APK)
- **After:** On-demand download (~1-2GB downloads to cache)
- **Benefit:** Smaller APK, maintained by package

**Architecture Adaptation:**
- Your services are class-based
- Package provides React hooks
- Need to bridge the two approaches
- Keep existing API surface for consumers

**Prompt Format:**
- Old format: Single string prompts
- New format: Chat messages array
- Update templates accordingly

---

## Additional Context

**Why this approach:**
- ✅ No manual model conversion needed
- ✅ Package maintains and updates models
- ✅ Smaller APK size (downloads on demand)
- ✅ Battle-tested implementation
- ✅ Active maintenance and support

**Why not mock mode:**
- User wants real model working
- Mock mode already validated UI
- Ready for production implementation

**Why not custom Gemma conversion:**
- Built-in Llama 3.2 1B is sufficient
- Saves 2-4 days of conversion work
- Can switch to custom model later if needed

---

**Note to Claude:**

The code infrastructure is 100% complete. This task is about:
1. Swapping out the mock implementation for real model
2. Using the package's built-in models (not custom)
3. Adapting the existing architecture to use `useLLM` hook
4. Testing on physical device
5. Validating real AI summaries work

The user is ready to see real AI working, not mock responses. Focus on getting the built-in Llama 3.2 1B model running successfully.

---

**Current environment:**
- Location: `/Users/home/Documents/Project/TrailSense`
- Branch: `feature/on-device-llm`
- Platform: macOS (building for Android)
- React Native version: Latest (Expo)
- Package installed: `react-native-executorch@0.4.10`

**Start by reading:**
1. Package README: `node_modules/react-native-executorch/README.md`
2. `FINAL_RECOMMENDATION.md` in project root
3. Existing implementation: `src/services/llm/`

**Then implement the changes to use the real built-in model.**

Good luck! 🚀
