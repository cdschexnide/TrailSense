# TrailSense LLM - Testing and Deployment Guide

## Quick Navigation

- [Current Status](#current-status)
- [Option 1: Test with Mock Mode (5 minutes)](#option-1-test-with-mock-mode)
- [Option 2: Test with Real Model (2-4 hours)](#option-2-test-with-real-model)
- [Troubleshooting](#troubleshooting)
- [Performance Metrics](#performance-metrics)

---

## Current Status

### ✅ What's Complete

**Code Integration (100%):**
- ✅ AlertDetailScreen integrated with LLM features
- ✅ AlertSummaryCard UI component
- ✅ useAlertSummary React hook
- ✅ All LLM services and infrastructure
- ✅ Feature flags configured
- ✅ Mock mode enabled in development

**Environment Setup:**
- ✅ Android Gradle configured for large files
- ✅ ARM64-only build configuration
- ✅ 4GB heap size for Gradle builds
- ✅ Python environment ready (~/llm-env)
- ✅ Conversion script created
- ✅ Android assets directory created

### 📋 What You Need to Do

Choose one of two paths:

**Path A: Mock Mode (Fastest - Recommended First)**
- Test UI/UX immediately
- No model conversion needed
- Perfect for development and demos

**Path B: Real Model (Production Ready)**
- Convert or download model files
- Copy to Android assets
- Build and test on device

---

## Option 1: Test with Mock Mode

**Time Required:** 5 minutes
**Purpose:** Validate UI/UX without needing the real model

### Step 1: Verify Mock Mode is Enabled

Mock mode is **already enabled** in development. You can verify by checking:

```typescript
// src/App.tsx (lines 26-29)
if (__DEV__) {
  console.log('[App] Enabling LLM mock mode for development');
  featureFlagsManager.enableMockMode();
}
```

### Step 2: Build and Run

```bash
cd /Users/home/Documents/Project/TrailSense

# Build and run on Android device/emulator
npm run android
```

### Step 3: Test the Features

1. **Navigate to Alert Detail Screen:**
   - Open the app
   - Go to Alerts tab
   - Tap on any alert

2. **Test AI Summary:**
   - For HIGH/CRITICAL alerts: Summary auto-generates
   - For LOW/MEDIUM alerts: Tap "Explain with AI ✨" button

3. **Verify Mock Response:**
   - Summary appears within 1-2 seconds
   - Should show realistic mock explanations
   - Confidence indicator shows percentage

4. **Test Interactions:**
   - ✅ Tap thumbs up/down for feedback
   - ✅ Tap "Regenerate" to get new summary
   - ✅ Verify loading states work

### Expected Console Output

```
[App] Enabling LLM mock mode for development
[LLM] Mock mode enabled
[LLM] Feature flags: LLM_ENABLED=true, MOCK_MODE=true
[LLM] Generating alert summary (MOCK MODE)
[LLM] Mock summary generated in 1.2s
```

### Mock Mode Behavior

- **Response Time:** 500-1500ms (instant)
- **Summary Quality:** Generic but realistic
- **Auto-generation:** Works for HIGH/CRITICAL alerts
- **Caching:** Fully functional
- **Error handling:** Simulated

### Validation Checklist

- [ ] App builds successfully
- [ ] Alert Detail screen displays correctly
- [ ] "Explain with AI" button appears (for LOW/MEDIUM)
- [ ] Summary auto-generates (for HIGH/CRITICAL)
- [ ] Summary card displays with content
- [ ] Thumbs up/down buttons work
- [ ] Regenerate button works
- [ ] Loading states display correctly
- [ ] No errors in console

---

## Option 2: Test with Real Model

**Time Required:** 2-4 hours (including model conversion)
**Purpose:** Production deployment with real AI

### Prerequisites

- ✅ Physical Android device (Android 10+, 6GB+ RAM, ARM64)
- ✅ USB cable and ADB working
- ⚠️  Converted model files OR pre-converted model

### Step 1: Get the Model Files

You have 3 options (see `MODEL_CONVERSION_GUIDE.md` for details):

**Option A: Pre-Converted Model (Fastest)**
- Search Hugging Face for pre-converted Gemma 3n E2B
- Download .pte and tokenizer.bin files directly

**Option B: Convert Yourself**
- Follow ExecuTorch installation guide
- Run: `python convert_gemma3n.py`
- Wait 30-60 minutes for conversion

**Option C: Use Fallback Method**
- Run conversion script without ExecuTorch
- Uses TorchScript as fallback
- Less optimal but works

### Step 2: Copy Model Files to Android Assets

Use the provided script:

```bash
cd /Users/home/Documents/Project/TrailSense

# Make sure model files exist in ~/llm-models/gemma-3n-e2b-executorch/
ls -lh ~/llm-models/gemma-3n-e2b-executorch/

# Run copy script
./copy-model-files.sh
```

Or manually:

```bash
# Copy model file
cp ~/llm-models/gemma-3n-e2b-executorch/gemma-3n-e2b-int4.pte \
   /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/

# Copy tokenizer
cp ~/llm-models/gemma-3n-e2b-executorch/tokenizer.bin \
   /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/

# Verify
ls -lh /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/
```

Expected output:
```
gemma-3n-e2b-int4.pte  (~2.0GB)
tokenizer.bin          (~512KB)
```

### Step 3: Disable Mock Mode

You have two options:

**Option A: Disable for Release Builds Only**

Mock mode is only enabled in `__DEV__` mode, so release builds automatically use the real model.

```bash
# Build release APK (mock mode automatically disabled)
cd android && ./gradlew assembleRelease && cd ..
```

**Option B: Disable for All Builds**

Edit `src/App.tsx`:

```typescript
// src/App.tsx
useEffect(() => {
  // Comment out these lines to disable mock mode:
  // if (__DEV__) {
  //   console.log('[App] Enabling LLM mock mode for development');
  //   featureFlagsManager.enableMockMode();
  // }

  // ... rest of the code
}, []);
```

Or use feature flags:

```typescript
// src/config/featureFlags.ts
// Set this to false to disable mock mode
LLM_MOCK_MODE: false,
```

### Step 4: Clean Build

```bash
cd /Users/home/Documents/Project/TrailSense

# Clean previous builds
cd android && ./gradlew clean && cd ..

# Clear caches (optional but recommended)
npm run android -- --reset-cache
```

### Step 5: Build with Model

```bash
cd /Users/home/Documents/Project/TrailSense

# Build and deploy (this will take longer due to large asset)
npm run android
```

**Expected build time:** 5-15 minutes (first time)
**APK size:** ~2.1GB (due to bundled model)

### Step 6: Deploy to Physical Device

```bash
# Connect your Android device via USB
# Enable USB debugging on device

# Verify device is connected
adb devices

# Deploy app (if not already done)
npm run android
```

### Step 7: Test on Device

1. **First Launch:**
   - Open the app
   - Navigate to Alert Detail screen
   - Click "Explain with AI"
   - **Wait 5-15 seconds** for first model load
   - Watch console: `adb logcat | grep LLM`

2. **Expected First Load:**
   ```
   [LLM] Loading model from assets...
   [LLM] Model file: gemma-3n-e2b-int4.pte
   [LLM] Model loaded successfully (12.3s)
   [LLM] Running inference...
   [LLM] Inference complete (2.1s)
   ```

3. **Subsequent Loads:**
   - Should be much faster (2-5 seconds)
   - Model stays in memory for 5 minutes

4. **Test Different Scenarios:**
   - [ ] HIGH threat alert (auto-generates)
   - [ ] CRITICAL threat alert (auto-generates)
   - [ ] LOW threat alert (manual button)
   - [ ] MEDIUM threat alert (manual button)
   - [ ] Multiple summaries (test caching)
   - [ ] Regenerate summary
   - [ ] Feedback buttons

### Monitoring Logs

```bash
# Watch LLM logs
adb logcat | grep LLM

# Watch all logs (verbose)
adb logcat

# Clear logs and watch
adb logcat -c && adb logcat | grep -E 'LLM|TrailSense'
```

### Validation Checklist

- [ ] Model files copied to assets (verify size ~2GB)
- [ ] Mock mode disabled
- [ ] App builds successfully (larger APK)
- [ ] App installs on device
- [ ] Model loads without errors (first load: 5-15s)
- [ ] Inference generates real summaries (1-3s)
- [ ] Summaries are contextually relevant (not generic)
- [ ] Performance is acceptable
- [ ] Second load faster (caching works)
- [ ] Auto-generation works for HIGH/CRITICAL
- [ ] Manual generation works for LOW/MEDIUM
- [ ] Error handling works (disconnect, etc.)
- [ ] Feedback buttons work
- [ ] Regenerate produces different summaries

---

## Performance Metrics

### Expected Performance (Real Model)

| Metric | First Time | Cached | Target |
|--------|-----------|--------|--------|
| Model Load | 5-15s | 2-5s | <20s |
| Inference | 1-3s | 1-3s | <5s |
| Total (First) | 6-18s | - | <25s |
| Total (Cached) | - | 3-8s | <10s |

### Expected Performance (Mock Mode)

| Metric | Value |
|--------|-------|
| Model Load | Instant |
| Inference | 0.5-1.5s |
| Total | <2s |

### Memory Usage

- **Model in Memory:** ~2-3GB
- **Inference:** +500MB-1GB
- **Total:** ~3-4GB RAM required
- **Minimum Device:** 6GB RAM recommended

---

## Troubleshooting

### Build Issues

#### "APK too large" or "Out of memory during build"

Already handled! Gradle is configured with 4GB heap:

```gradle
// android/gradle.properties (line 13)
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

If still having issues:

```bash
# Increase Gradle heap further
echo "org.gradle.jvmargs=-Xmx6144m -XX:MaxMetaspaceSize=1024m" >> android/gradle.properties

# Clean and rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

#### "Asset not found" during build

```bash
# Verify files exist
ls -lh android/app/src/main/assets/

# Should show:
# gemma-3n-e2b-int4.pte
# tokenizer.bin
```

### Runtime Issues

#### Model won't load

```bash
# Check logs
adb logcat | grep LLM

# Look for:
# - File path errors
# - Permission errors
# - OOM errors
```

**Solutions:**
1. Verify files are in assets folder
2. Check file permissions
3. Ensure device has enough RAM
4. Try on device with more RAM

#### "Module not found" or "ExecuTorch not available"

```bash
# Check if react-native-executorch linked properly
cd android && ./gradlew :app:dependencies | grep executorch

# If not found, try:
cd .. && npx expo prebuild --clean && npm run android
```

#### Inference fails or times out

**Possible causes:**
1. Device too slow (try on better device)
2. Not enough RAM (close other apps)
3. Model file corrupt (re-copy from source)

**Solutions:**
```typescript
// Increase timeout in src/config/llmConfig.ts
INFERENCE_TIMEOUT_MS: 30000, // Increase to 30s
```

#### UI doesn't show AI features

**Check:**
1. Feature flags enabled
2. Platform is Android
3. LLM_ENABLED feature flag is true
4. Not in mock mode (if testing real model)

```bash
# Check feature flags in code
grep -r "LLM_ENABLED" src/

# Check Platform OS
grep -r "Platform.OS === 'android'" src/screens/alerts/
```

### Performance Issues

#### Model load too slow (>30s)

**Solutions:**
1. Use device with better CPU
2. Ensure model is quantized (INT4)
3. Check if model file is correct size
4. Try different model export settings

#### Inference too slow (>10s)

**Solutions:**
1. Reduce MAX_TOKENS in llmConfig.ts
2. Use faster device
3. Optimize prompt templates
4. Consider smaller model

#### App crashes on model load

**Likely cause:** Out of memory

**Solutions:**
1. Test on device with more RAM (8GB+)
2. Close all other apps
3. Restart device before testing
4. Use smaller quantization (INT8 instead of INT4)

---

## Testing Scenarios

### Scenario 1: Basic Functionality

```
1. Open app
2. Navigate to Alert Detail
3. Click "Explain with AI"
4. Wait for summary
5. Verify summary is relevant
6. Click thumbs up
7. Click regenerate
8. Verify new summary appears
```

### Scenario 2: Auto-Generation

```
1. Create HIGH threat alert (or use existing)
2. Open Alert Detail
3. Verify summary auto-generates
4. No button should appear
5. Summary should appear automatically
```

### Scenario 3: Caching

```
1. Generate summary for alert A
2. Go back
3. Open alert A again
4. Summary should load instantly (from cache)
5. Check logs for cache hit
```

### Scenario 4: Error Handling

```
1. Enable airplane mode
2. Try to generate summary
3. Should show appropriate error
4. Disable airplane mode
5. Retry - should work
```

### Scenario 5: Multiple Alerts

```
1. Generate summaries for 5 different alerts
2. Verify each summary is unique
3. Verify caching works for all
4. Check memory usage doesn't grow infinitely
```

---

## Next Steps After Testing

### If Mock Mode Works Well

1. Great! UI/UX is validated
2. Proceed with real model conversion
3. Follow Option 2 steps above

### If Real Model Works Well

1. ✅ Disable mock mode permanently
2. Build release APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
3. Test release build on multiple devices
4. Prepare for deployment

### If You Encounter Issues

1. Check troubleshooting section above
2. Review logs carefully
3. Consult documentation:
   - `NEXT_STEPS.md`
   - `LLM_BUNDLED_MODEL_GUIDE.md`
   - `MODEL_CONVERSION_GUIDE.md`
4. Try with mock mode first to isolate issues

---

## Deployment Checklist

Before deploying to production:

- [ ] Real model tested on multiple devices
- [ ] Performance metrics meet targets
- [ ] Error handling validated
- [ ] Mock mode disabled in production
- [ ] Feature flags configured for gradual rollout
- [ ] Analytics tracking implemented
- [ ] Emergency kill switch tested
- [ ] User feedback system working
- [ ] Documentation updated
- [ ] APK size acceptable for target users

---

## Quick Reference Commands

```bash
# Build and run (development)
npm run android

# Build release APK
cd android && ./gradlew assembleRelease

# View logs
adb logcat | grep LLM

# Clear logs
adb logcat -c

# Check device
adb devices

# Copy model files
./copy-model-files.sh

# Clean build
cd android && ./gradlew clean && cd ..

# Reset cache and rebuild
npm run android -- --reset-cache
```

---

## Support and Documentation

- **Quick Start:** `LLM_QUICK_START.md`
- **Integration Guide:** `LLM_INTEGRATION_GUIDE.md`
- **Model Bundling:** `LLM_BUNDLED_MODEL_GUIDE.md`
- **Next Steps:** `NEXT_STEPS.md`
- **Conversion Guide:** `MODEL_CONVERSION_GUIDE.md`
- **Implementation Status:** `IMPLEMENTATION_COMPLETE.md`

---

**Ready to test! Start with Mock Mode (Option 1) first, then proceed to Real Model (Option 2) when ready.**
