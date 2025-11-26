# Claude Code Handoff - TrailSense Real Model Implementation

Copy and paste this prompt to a new Claude Code instance to continue with real model implementation:

---

## Prompt:

I'm working on the TrailSense mobile app and need to implement the real on-device LLM model. The code integration is 100% complete - all services, UI components, and hooks are implemented and tested with mock mode. Now I need to convert and bundle the actual Gemma 3n E2B model.

### Context
- **Project:** TrailSense - Home security/intrusion detection app
- **Location:** `/Users/home/Documents/Project/TrailSense`
- **Branch:** `feature/on-device-llm`
- **Status:** Code integration 100% complete, tested with mock mode
- **Platform:** Android (iOS deferred)
- **Model Strategy:** Bundled (local on device, no CDN)

### What's Already Done
- ✅ All LLM services and infrastructure (85%)
- ✅ UI components (AlertSummaryCard)
- ✅ React hooks (useAlertSummary)
- ✅ AlertDetailScreen integration (100%)
- ✅ Feature flags configured
- ✅ Mock mode working perfectly
- ✅ All documentation complete

### What I Need You to Do

I need you to help me with **Option 2: Use Real Model** from `NEXT_STEPS.md`. Specifically:

#### Step 1: Convert Model to ExecuTorch Format

Help me set up and run the Python conversion script:

1. **Create Python environment:**
   ```bash
   python3 -m venv ~/llm-env
   source ~/llm-env/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install torch transformers executorch sentencepiece accelerate huggingface_hub
   ```

3. **Create conversion script:**
   - Create `convert_gemma3n.py` based on the template in `LLM_BUNDLED_MODEL_GUIDE.md`
   - The script should:
     - Download Gemma 3n E2B from Hugging Face
     - Convert to ExecuTorch .pte format
     - Apply INT4 quantization
     - Export tokenizer
     - Save to `~/llm-models/gemma-3n-e2b-executorch/`

4. **Run the conversion:**
   - Guide me through any Hugging Face authentication needed
   - Execute the conversion script
   - Verify output files are correct size (~2GB model, ~512KB tokenizer)

#### Step 2: Copy Model Files to Android Assets

1. **Create assets directory:**
   ```bash
   mkdir -p /Users/home/Documents/Project/TrailSense/android/app/src/main/assets
   ```

2. **Copy model files:**
   - Copy `gemma-3n-e2b-int4.pte` to assets
   - Copy `tokenizer.bin` to assets
   - Verify files are in the correct location
   - Check file sizes

3. **Update Gradle configuration (if needed):**
   - Check `android/app/build.gradle` for large file handling
   - Add `noCompress 'pte', 'bin'` if not present
   - Ensure packagingOptions are correct

#### Step 3: Build and Test

1. **Disable mock mode:**
   - Comment out `featureFlagsManager.enableMockMode()` in `src/App.tsx`
   - Or set `LLM_MOCK_MODE: false` in feature flags

2. **Clean build:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **Build and run:**
   ```bash
   npm run android
   ```

4. **Test on physical Android device:**
   - Deploy to device
   - Navigate to Alert Detail screen
   - Click "Explain with AI"
   - Monitor logs: `adb logcat | grep LLM`
   - Verify model loads (first time: 5-15 seconds)
   - Verify inference works (1-3 seconds per summary)
   - Test with different threat levels

5. **Validation checklist:**
   - [ ] Model files accessible in app
   - [ ] Model loads without errors
   - [ ] Inference generates real summaries
   - [ ] Performance is acceptable
   - [ ] Error handling works
   - [ ] Caching works (second load faster)

### Important Notes

**Model Details:**
- Model: `google/gemma-3n-e2b` from Hugging Face
- Target format: ExecuTorch .pte with INT4 quantization
- Expected size: ~2GB (model) + ~512KB (tokenizer)
- Configuration: Already set in `src/config/llmConfig.ts`

**Gradle Configuration:**
- Already configured for ARM64-only (`arm64-v8a`)
- Heap size already increased to 4GB
- May need to add `aaptOptions` for large assets

**Testing Requirements:**
- Must test on **physical Android device** (not emulator)
- Recommended: Android 10+, 6GB+ RAM, ARM64 processor
- First model load takes 5-15 seconds (normal)

**Troubleshooting:**
- If model won't load: Check file paths and sizes
- If inference fails: Check device has enough RAM
- If build fails: May need to increase Gradle heap size
- Reference `LLM_BUNDLED_MODEL_GUIDE.md` for detailed troubleshooting

### Key Files to Reference

Start with these (in order):
1. `NEXT_STEPS.md` - Overview of what needs to be done
2. `LLM_BUNDLED_MODEL_GUIDE.md` - Detailed model bundling instructions (has full conversion script)
3. `IMPLEMENTATION_COMPLETE.md` - Summary of completed work
4. `LLM_QUICK_START.md` - Quick reference

### Expected Outcomes

After you complete this:
- ✅ Model converted to ExecuTorch format
- ✅ Model files in Android assets folder
- ✅ App builds successfully (larger APK size expected)
- ✅ Real AI summaries working on device
- ✅ Performance metrics validated
- ✅ All features tested end-to-end

### My Specific Needs

**Please help me:**
1. Create the Python conversion script (adapt from `LLM_BUNDLED_MODEL_GUIDE.md`)
2. Guide me through running the conversion
3. Handle any errors during conversion
4. Copy files to correct Android assets location
5. Update Gradle config if needed for large files
6. Build the app and help troubleshoot any issues
7. Validate that everything works on device

**I have:**
- Python 3 installed
- Android Studio setup
- Physical Android device for testing
- Hugging Face account (or can create one)

**I need help with:**
- Creating the correct conversion script
- Ensuring the conversion produces correct output
- Copying files to the right place
- Building with the large model file
- Testing and validation

---

## Additional Context

The app is fully functional with mock mode. Mock mode testing shows:
- ✅ UI works perfectly
- ✅ Hook integration correct
- ✅ Feature flags working
- ✅ Error handling functional
- ✅ Feedback buttons operational

Now I just need the real model to replace the mock responses!

---

**Important:** Be methodical and check each step. The model conversion can take 30-60 minutes depending on hardware. If the conversion script needs to be adapted for the specific ExecuTorch version available, please help me troubleshoot.

**Note to Claude:** All the code infrastructure is complete. This is purely about:
1. Running a Python script to convert a model
2. Copying files to the right folder
3. Building the app with the larger asset
4. Testing on a real device

The user may need help with Python environment setup, Hugging Face authentication, ExecuTorch installation issues, or Gradle configuration for large assets.
