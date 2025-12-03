# Task: Fix react-native-executorch Integration via Expo Development Build

## Project Context

**TrailSense** is a React Native mobile app (Expo SDK 54) for perimeter intrusion detection. The app has an AI feature that uses **react-native-executorch** (v0.5.15) to run Llama 3.2 1B model on-device for generating natural language explanations of security alerts.

**Location**: `/Users/home/Documents/Project/TrailSense/`

## Current Problem

The `react-native-executorch` package is **not working** in the current Expo managed workflow. The module fails to register at runtime with this error:

```
[LLM WARN] react-native-executorch module not available (not installed or Expo managed workflow)
[ModelManager] Error details: [Error: The package 'react-native-executorch' doesn't seem to be linked. Make sure...
```

### What's Been Verified

✅ **Package installed**: `npm list react-native-executorch` shows v0.5.15
✅ **Native libraries built**: `.so` files exist in APK (`libreact-native-executorch.so`, `libexecutorch.so`)
✅ **Autolinking working**: Package appears in `PackageList.java` with `RnExecutorchPackage`
✅ **Code is correct**: Import/usage fixed (see commit history in `src/services/llm/modelManager.ts`)

❌ **TurboModule registration failing**: `TurboModuleRegistry.get('ETInstaller')` returns `null`

### Root Cause

`react-native-executorch` is a **TurboModule** that requires React Native's **New Architecture**. Expo managed workflow (using `expo run:android`) doesn't properly initialize TurboModules without creating a **Development Build**.

### What's Been Tried (and Failed)

1. ❌ **Disabling New Architecture** (`newArchEnabled=false`) - Causes duplicate `.so` file conflicts
2. ❌ **Early initialization in App.tsx** - Module still not registered
3. ❌ **Various packaging options** - Native library conflicts persist

## Your Task

**Create an Expo Development Build** to properly support `react-native-executorch` with TurboModules.

### Required Steps

#### 1. Install Development Build Tools

```bash
npm install -g eas-cli
eas login  # Use Expo account or create one
```

#### 2. Configure Development Build

```bash
cd /Users/home/Documents/Project/TrailSense

# Generate native Android project
npx expo prebuild --platform android --clean

# This creates android/ directory with:
# - Native code
# - Proper TurboModule registration
# - Custom build configuration
```

**Expected output**: `android/` directory with generated native code

#### 3. Verify Prebuild Configuration

After prebuild, check these files were generated correctly:

**File**: `android/app/src/main/java/com/trailsense/app/MainApplication.kt`
- Should have TurboModule initialization
- Should include `ReactNativeHostWrapper`
- Should call autolinking

**File**: `android/settings.gradle`
- Should include all native modules
- Check `react-native-executorch` is included

**File**: `android/gradle.properties`
- Verify `newArchEnabled=true` (keep it enabled)
- Check Hermes is enabled: `hermesEnabled=true`

#### 4. Fix Any Prebuild Issues

Common issues after prebuild:

**Issue A: Duplicate libraries (likely)**
If you get duplicate `.so` errors during build, add to `android/app/build.gradle`:

```gradle
android {
    packagingOptions {
        jniLibs {
            pickFirsts += ['**/libjsi.so', '**/libfbjni.so', '**/libc++_shared.so']
        }
    }
}
```

**Issue B: react-native-executorch native build**
The module needs CMake. Verify in `android/app/build.gradle`:

```gradle
android {
    externalNativeBuild {
        cmake {
            path "../../node_modules/react-native-executorch/android/CMakeLists.txt"
        }
    }
}
```

If missing, add it.

**Issue C: Firebase configuration**
Ensure `google-services.json` exists:
```bash
# Check if file exists
ls -la android/app/google-services.json
```

If missing, copy from root or create a placeholder.

#### 5. Build Development APK

```bash
cd /Users/home/Documents/Project/TrailSense

# Clean previous build
cd android && ./gradlew clean && cd ..

# Build with expo (now uses custom native code)
npm run android
```

**Important**: This will take **longer** than before (10-15 minutes first build) because it's compiling native C++ code for react-native-executorch.

#### 6. Test LLM Feature

Once installed on device:

1. Open TrailSense app
2. Navigate to **Alerts tab**
3. Tap any alert to open Alert Detail screen
4. Tap **"Explain with AI"** button
5. Check logs for success:

```bash
adb logcat | grep -E "ModelManager|executorch|ETInstaller"
```

**Success indicators**:
```
[App] react-native-executorch initialized
[ModelManager] react-native-executorch loaded successfully
[ModelManager] LLMController: function
[ModelManager] LLAMA3_2_1B_CONFIG: object
[LLM INFO] Loading Llama 3.2 1B model...
[LLM INFO] Model download progress: 15%...
```

**First-time download**: Model files (~1.5GB) will download from HuggingFace. This takes 5-15 minutes on WiFi.

#### 7. Document Changes

After successful build, create a file documenting the setup:

**File**: `DEVELOPMENT-BUILD-SETUP.md`

Include:
- Steps to rebuild after code changes
- How to generate new development build
- EAS Build configuration (if used)
- Known issues and workarounds

## Important Files to Review

### Current LLM Implementation

**Service**: `src/services/llm/modelManager.ts`
- Lines 7-25: Module import and configuration
- Lines 117-135: Model loading logic

**Service**: `src/services/llm/LLMService.ts`
- Main LLM service interface
- Alert summary generation

**Config**: `src/config/llmConfig.ts`
- LLM feature configuration
- Model parameters

### App Entry Point

**File**: `src/App.tsx`
- Lines 20-28: Early executorch initialization attempt (may need update)

### Build Configuration

**File**: `android/app/build.gradle`
- Current packaging options (lines 124-129)
- May need updates for development build

**File**: `android/gradle.properties`
- `newArchEnabled=true` (line 38)
- Keep this enabled!

## Success Criteria

✅ **Build completes** without errors
✅ **App launches** on Android device
✅ **Module loads**: Console shows "react-native-executorch initialized"
✅ **Model downloads**: First use downloads Llama 3.2 1B (~1.5GB)
✅ **AI works**: "Explain with AI" generates text summary

## Fallback Plan

If Development Build has blocking issues after 2 hours:

### Alternative: Disable LLM Feature

```typescript
// src/config/featureFlags.ts
export const FEATURES = {
  LLM_ENABLED: false,  // Disable on-device AI
  // ... other flags
};
```

The app works perfectly without LLM - it's an experimental feature. Core functionality (alerts, radar, devices, analytics) is unaffected.

### Alternative: Cloud-Based LLM

Replace on-device model with API calls:

```typescript
// src/services/llm/cloudLLMService.ts
async generateSummary(alert: Alert): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Explain this alert: ${JSON.stringify(alert)}` }],
    }),
  });
  return response.data.choices[0].message.content;
}
```

## Project Documentation

**Complete system overview**: `CLAUDE.md` (root directory)
**Mobile app architecture**: `START-HERE.md`
**ESP32 firmware**: `../TrailSenseDevice/PROJECT-HANDOFF-PROMPT.md`

## Environment

- **OS**: macOS (Darwin 23.4.0)
- **Node**: 18+
- **React Native**: 0.81.5
- **Expo SDK**: 54
- **Android Device**: Connected via ADB (`R9TX908MBYV`)

## Notes

- **Time estimate**: 30-60 minutes for full setup
- **Disk space**: Prebuild adds ~200MB to project
- **Build time**: First build takes 10-15 minutes
- **Model storage**: 1.5GB on device after first use
- **Git**: Add `android/` to `.gitignore` if not already there (development builds are typically not committed)

## Questions to Ask User

Before starting, clarify:
1. Do they have an Expo account? (needed for EAS CLI)
2. Is there a `google-services.json` file for Firebase?
3. What's the acceptable APK size? (development builds are larger)
4. Should you commit `android/` directory to git or add to `.gitignore`?

## Getting Started

```bash
# Navigate to project
cd /Users/home/Documents/Project/TrailSense

# Check current state
npm list react-native-executorch  # Should show 0.5.15
adb devices  # Should show R9TX908MBYV

# Start with prebuild
npx expo prebuild --platform android --clean
```

Good luck! The goal is to get `TurboModuleRegistry.get('ETInstaller')` to return a valid module object instead of null.
