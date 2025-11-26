# TrailSense LLM - Quick Start Guide

This is the **fastest path** to get your on-device LLM working.

---

## ✅ What's Already Done (85%)

All code is implemented:
- ✅ Full service layer with model loading, inference, and caching
- ✅ React components and hooks ready to use
- ✅ Feature flags and configuration
- ✅ **Configured for bundled model** (local on device, no CDN needed)

---

## 🚀 What You Need to Do (15%)

### Step 1: Get the Model (2-4 hours)

1. **Install Python dependencies:**
```bash
python3 -m venv ~/llm-env
source ~/llm-env/bin/activate
pip install torch transformers executorch sentencepiece accelerate huggingface_hub
```

2. **Download & Convert Model:**
```bash
# Login to Hugging Face
huggingface-cli login

# Download Gemma 3n E2B
huggingface-cli download google/gemma-3n-e2b \
  --local-dir ~/llm-models/gemma-3n-e2b \
  --local-dir-use-symlinks False

# Convert to ExecuTorch (see LLM_BUNDLED_MODEL_GUIDE.md for conversion script)
python3 convert_gemma3n.py
```

3. **Copy to Android assets:**
```bash
mkdir -p android/app/src/main/assets

cp ~/llm-models/gemma-3n-e2b-executorch/gemma-3n-e2b-int4.pte \
   android/app/src/main/assets/

cp ~/llm-models/gemma-3n-e2b-executorch/tokenizer.bin \
   android/app/src/main/assets/
```

**That's it for the model!** No server, no CDN, no download UI needed.

---

### Step 2: Enable Features (5 minutes)

In your app initialization or dev menu:

```typescript
import { featureFlagsManager } from '@/config/featureFlags';

// For development - enable mock mode (no model needed for testing)
featureFlagsManager.enableMockMode();

// OR for real model - enable dev mode
featureFlagsManager.enableLLMForDev();
```

---

### Step 3: Add to AlertDetailScreen (30 minutes)

Add these 3 sections to `src/screens/alerts/AlertDetailScreen.tsx`:

**1. Imports:**
```typescript
import { useAlertSummary } from '@hooks/useAlertSummary';
import { AlertSummaryCard } from '@components/organisms/AlertSummaryCard';
import { FEATURE_FLAGS } from '@/config/featureFlags';
```

**2. Use the hook:**
```typescript
const {
  summary,
  isLoading: isGeneratingSummary,
  error: summaryError,
  generate: generateSummary,
  regenerate: regenerateSummary,
} = useAlertSummary(alert);
```

**3. Add to render (after AlertCard):**
```typescript
{FEATURE_FLAGS.LLM_ALERT_SUMMARIES && (
  <>
    {!summary && !isGeneratingSummary && (
      <TouchableOpacity onPress={generateSummary} style={styles.explainButton}>
        <Icon name="sparkles" size={18} />
        <Text>Explain with AI</Text>
      </TouchableOpacity>
    )}

    <AlertSummaryCard
      summary={summary}
      isLoading={isGeneratingSummary}
      error={summaryError}
      onRegenerate={regenerateSummary}
      onFeedback={(positive) => {
        analytics.track('llm_feedback', { positive });
      }}
    />
  </>
)}
```

See `LLM_INTEGRATION_GUIDE.md` for complete code examples.

---

### Step 4: Test (1 hour)

1. **Build app:**
```bash
npm run android
```

2. **Test mock mode first:**
   - Enable mock mode in feature flags
   - Open any alert detail screen
   - Click "Explain with AI"
   - Should see a mock summary appear

3. **Test with real model:**
   - Disable mock mode
   - Ensure model files are in assets
   - Click "Explain with AI"
   - Model loads (~5-15 seconds first time)
   - Real AI summary appears!

---

## 🎯 Expected Results

**Mock Mode:**
- Instant response (500-1500ms)
- Generic but realistic summaries
- Perfect for UI/UX testing

**Real Model:**
- First load: 5-15 seconds
- Subsequent loads: 2-5 seconds (cached)
- Inference: 1-3 seconds per summary
- Real, context-aware explanations

---

## 🐛 Troubleshooting

### Model won't load
- Check files are in `android/app/src/main/assets/`
- Check file sizes: model ~2GB, tokenizer ~512KB
- Check Android logs: `adb logcat | grep LLM`

### "Model not found" error
- Verify `MODEL_STRATEGY: 'bundled'` in `llmConfig.ts`
- Check paths in `modelDownloader.ts` logs
- Ensure `RNFS.MainBundlePath` is accessible

### Inference timeout
- Model may be too large for device
- Try on device with 6GB+ RAM
- Check logs for OOM errors

### App crashes
- Model file may be corrupted
- Re-download and re-convert
- Test on physical device (not emulator)

---

## 📚 Full Documentation

- `LLM_BUNDLED_MODEL_GUIDE.md` - Complete bundling instructions
- `LLM_INTEGRATION_GUIDE.md` - Full integration guide
- `LLM_IMPLEMENTATION_STATUS.md` - Project status

---

## ⚡ Ultra-Quick Test (5 minutes)

Want to test the UI immediately without the model?

```typescript
// In your app somewhere
import { featureFlagsManager } from '@/config/featureFlags';

// Enable mock mode
featureFlagsManager.enableMockMode();
```

Then follow Step 3 above. You'll see the full UI flow with mock AI responses!

---

## 🎉 Summary

**Total Time to Full Implementation:**
- Model conversion: 2-4 hours (one-time)
- Code integration: 30 minutes (already 85% done)
- Testing: 1 hour
- **Total: 3.5-5.5 hours**

**No servers, no CDN, no downloads needed.** Just bundle and go! 🚀
