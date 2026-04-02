# Expo 54 + ExecuTorch 0.8.1 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade TrailSense from Expo 52 + executorch 0.5.3 to Expo 54 + executorch 0.8.1, migrate the LLMModule API to the new static factory pattern, and produce a buildable iOS project that can run real on-device inference with Llama 3.2 1B SpinQuant.

**Architecture:** The LLM service layer (`AIProvider` → `LLMService` → `modelManager` → `react-native-executorch`) stays the same. Core changes: `modelManager.ts` migrates to the 0.8.x static factory API, `AIProvider.tsx` gets a progress-bar math fix, the dead `modelDownloader.ts` is removed, and a non-mock test is added. The dependency upgrade eliminates the dual-Expo native module conflict that blocked iOS builds.

**Tech Stack:** Expo SDK 54, React Native (Expo-pinned), react-native-executorch 0.8.1, Llama 3.2 1B SpinQuant, Jest + RNTL

**Spec:** `docs/superpowers/specs/2026-04-02-expo54-executorch-upgrade-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Bump expo to ~54, executorch to 0.8.1, remove worklets-core, bump jest-expo |
| `package-lock.json` | Regenerate | Via `npm install` |
| `app.json` | Verify (no changes expected) | newArchEnabled, iOS deployment target |
| `src/services/llm/modelManager.ts` | Modify | Migrate to `LLMModule.fromModelName()` static factory, remove dead imports |
| `src/services/llm/AIProvider.tsx` | Modify | Fix download progress bar (0..1 → 0-100% conversion) |
| `src/services/llm/modelDownloader.ts` | Delete | Dead code — never imported outside barrel export; 0.8.x handles downloads internally |
| `src/services/llm/index.ts` | Modify | Remove modelDownloader barrel export |
| `src/config/llmConfig.ts` | Modify | Remove dead `MODEL_DOWNLOAD_URL`/`TOKENIZER_DOWNLOAD_URL` fields |
| `__tests__/services/llm/mockModeFlow.test.tsx` | Verify | Ensure mock mode test still passes after changes |
| `__tests__/services/llm/modelManagerLoad.test.tsx` | Create | Test that non-mock loadModel calls LLMModule.fromModelName correctly |
| `ios/` | Regenerate | Via `npx expo prebuild --clean` (manual step) |

---

### Task 1: Upgrade Expo SDK and Dependencies

**Files:**
- Modify: `package.json`
- Regenerate: `package-lock.json`

This task upgrades the core Expo SDK and lets Expo's dependency resolver handle all `expo-*` package version bumps. It also swaps `react-native-executorch` to 0.8.1 and removes the unused `react-native-worklets-core`.

- [ ] **Step 1: Upgrade Expo SDK to 54**

Run:
```bash
npx expo install expo@^54
```

This will update `expo` in `package.json` and adjust `react-native` and other core Expo packages to SDK 54-compatible versions.

Expected: `package.json` shows `expo` at `~54.x.x`.

- [ ] **Step 2: Fix all Expo-managed dependency versions**

Run:
```bash
npx expo install --fix
```

This resolves all `expo-*` packages, `react-native`, `react-native-reanimated`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, and `react-native-svg` to versions compatible with SDK 54.

Expected: No version warnings from `npx expo install --fix`.

- [ ] **Step 3: Upgrade react-native-executorch to 0.8.1**

Run:
```bash
npm install react-native-executorch@0.8.1
```

Expected: `package.json` shows `"react-native-executorch": "0.8.1"`.

- [ ] **Step 4: Remove react-native-worklets-core**

This package is not imported anywhere in `src/` and was only a transitive dependency of executorch 0.5.x.

Run:
```bash
npm uninstall react-native-worklets-core
```

Expected: `react-native-worklets-core` no longer appears in `package.json`.

- [ ] **Step 5: Upgrade jest-expo to SDK 54**

Run:
```bash
npx expo install jest-expo
```

Expected: `package.json` devDependencies shows `jest-expo` at `~54.x.x`.

- [ ] **Step 6: Verify no dual Expo tree**

Run:
```bash
npm ls expo 2>&1 | grep -E "expo@|UNMET|invalid" || true
```

Expected: Only one `expo@54.x.x` appears in the tree. No nested `expo@53.x.x` inside `react-native-executorch`. No `UNMET PEER DEP` errors for expo. The `|| true` prevents non-zero exit if grep finds no UNMET/invalid lines (which is the success case).

- [ ] **Step 7: Validate third-party native package compatibility**

`npx expo install --fix` only covers packages in Expo's known-version mappings. These third-party native packages must be validated explicitly:

Run:
```bash
echo "=== Checking third-party native package compatibility with Expo 54 ==="
npm view @rnmapbox/maps peerDependencies --json 2>/dev/null || echo "@rnmapbox/maps: no peer deps"
npm view @shopify/react-native-skia peerDependencies --json 2>/dev/null || echo "react-native-skia: no peer deps"
npm view react-native-maps peerDependencies --json 2>/dev/null || echo "react-native-maps: no peer deps"
```

For each package, check that its `react-native` peer dependency range includes the version Expo 54 pins. If a package is incompatible:
- Check if a newer version supports the required RN version: `npm view <package> versions --json | tail -5`
- Update to the compatible version: `npm install <package>@<compatible-version>`

Expected: All third-party native packages are compatible or have been updated to compatible versions.

- [ ] **Step 8: Run Expo doctor**

Run:
```bash
npx expo-doctor
```

Expected: No critical errors. Informational warnings are acceptable.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: upgrade Expo 52→54, executorch 0.5.3→0.8.1, remove worklets-core"
```

---

### Task 2: Migrate modelManager.ts to ExecuTorch 0.8.x API

**Files:**
- Modify: `src/services/llm/modelManager.ts`

The core API change: `LLMModule` constructor is now private. Use `LLMModule.fromModelName()` static factory which loads the model and returns a ready instance. Also remove the dead `HAMMER2_1_1_5B_QUANTIZED` import and the `responseCallback` (removed in 0.8.x).

- [ ] **Step 1: Update the import block**

In `src/services/llm/modelManager.ts`, replace lines 1–34 (the import block and conditional require) with:

```typescript
import { Platform } from 'react-native';
import { llmLogger } from '@/utils/llmLogger';
import { performanceTracker } from '@/utils/llmPerformance';
import { LLMError, LLMErrorCode, Message } from '@/types/llm';
import { LLM_CONFIG } from '@/config/llmConfig';

// Conditionally import react-native-executorch to avoid crashes in Expo Go / managed workflow
let LLMModule: any = null;
let LLAMA3_2_1B_SPINQUANT: any = null;

try {
  const executorch = require('react-native-executorch');
  LLMModule = executorch.LLMModule;
  LLAMA3_2_1B_SPINQUANT = executorch.LLAMA3_2_1B_SPINQUANT;

  console.log('[ModelManager] react-native-executorch loaded successfully');
  console.log('[ModelManager] LLMModule:', typeof LLMModule);
  console.log('[ModelManager] LLAMA3_2_1B_SPINQUANT:', !!LLAMA3_2_1B_SPINQUANT);
} catch (error) {
  console.warn(
    '[ModelManager] react-native-executorch not available. LLM features disabled.'
  );
  console.warn('[ModelManager] Error details:', error);
}
```

This removes the unused `LLAMA3_2_1B` and `HAMMER2_1_1_5B_QUANTIZED` imports.

- [ ] **Step 2: Rewrite the `loadModel()` method**

Replace the existing `loadModel()` method (lines 120–237) with:

```typescript
  /**
   * Load the LLM model into memory
   * Uses LLMModule.fromModelName() static factory from react-native-executorch 0.8.x
   */
  async loadModel(): Promise<void> {
    // Check if already loaded
    if (this.isLoaded && this.llmModule) {
      llmLogger.info('Model already loaded');
      return;
    }

    // Check if already loading
    if (this.isLoading) {
      llmLogger.warn('Model load already in progress');
      return this.waitForLoad();
    }

    // Check if module is available
    const moduleAvailable = await this.isModuleAvailable();
    if (!moduleAvailable) {
      throw new LLMError(
        LLMErrorCode.MODULE_NOT_AVAILABLE,
        'ExecuTorch LLMModule not available'
      );
    }

    this.isLoading = true;
    this.loadAttempts++;
    const endTimer = performanceTracker.startTimer('Model Load');

    try {
      llmLogger.info('Loading LLM model...', {
        attempt: this.loadAttempts,
        platform: Platform.OS,
      });

      if (!LLAMA3_2_1B_SPINQUANT) {
        throw new Error('LLAMA3_2_1B_SPINQUANT model constant not available');
      }

      llmLogger.info('Using model: Llama 3.2 1B SpinQuant');

      // 0.8.x API: static factory that loads and returns a ready instance
      this.llmModule = await LLMModule.fromModelName(
        LLAMA3_2_1B_SPINQUANT,
        (progress: number) => {
          this.downloadProgress = progress;
          const percentage = (progress * 100).toFixed(1);
          llmLogger.info(`Model download/load progress: ${percentage}%`);
        },
        (newToken: string) => {
          this._token = newToken;
          this._response += newToken;

          if (this.onTokenReceived) {
            this.onTokenReceived(newToken);
          }
          if (this.onResponseUpdated) {
            this.onResponseUpdated(this._response);
          }

          llmLogger.debug('Token received:', newToken.substring(0, 20) + '...');
        },
        (messageHistory: Message[]) => {
          this._messageHistory = messageHistory;
          llmLogger.debug(
            `Message history updated: ${messageHistory.length} messages`
          );
        }
      );

      const loadTime = endTimer();
      performanceTracker.recordModelLoad(loadTime);

      llmLogger.info(`Model loaded successfully in ${loadTime}ms`);

      this.isLoaded = true;
      this.loadAttempts = 0;
    } catch (error) {
      const loadTime = endTimer();
      llmLogger.error(`Failed to load model after ${loadTime}ms`, error);

      // Retry logic
      if (this.loadAttempts < this.MAX_LOAD_ATTEMPTS) {
        llmLogger.info(
          `Retrying model load (attempt ${this.loadAttempts + 1}/${this.MAX_LOAD_ATTEMPTS})`
        );

        await this.sleep(LLM_CONFIG.RETRY_DELAY_MS);

        this.isLoading = false;
        return this.loadModel();
      }

      throw new LLMError(
        LLMErrorCode.MODEL_LOAD_FAILED,
        'Failed to load LLM model after multiple attempts',
        error
      );
    } finally {
      this.isLoading = false;
    }
  }
```

Key changes from the old version:
- Removed `new LLMModule({...})` + `this.llmModule.load(...)` two-step pattern
- Now uses `LLMModule.fromModelName(model, progressCb, tokenCb, historyCb)` single call
- Removed `responseCallback` (not available in 0.8.x) — response accumulation already happens in `tokenCallback` via `this._response += newToken`
- Removed `LLAMA3_2_1B` fallback — single model only (SPINQUANT)

- [ ] **Step 3: Update `sendMessage()` to use message history fallback**

In the `sendMessage()` method, the return value from `this.llmModule.sendMessage()` is `Promise<Message[]>` (the full history), but we return `this._response` (built from tokenCallback). Add a fallback in case tokenCallback doesn't fire.

Replace the try block in `sendMessage()` (lines 349–358) with:

```typescript
    try {
      llmLogger.info('Sending message...');

      // sendMessage returns Message[] (full history).
      // Response text is accumulated via tokenCallback, but use
      // the returned history as a fallback.
      const history = await this.llmModule.sendMessage(message);

      if (!this._response && history.length > 0) {
        const lastAssistant = [...history]
          .reverse()
          .find((m: Message) => m.role === 'assistant');
        if (lastAssistant) {
          this._response = lastAssistant.content;
        }
      }

      llmLogger.info('Message sent, response received', {
        responseLength: this._response.length,
      });

      return this._response;
    }
```

- [ ] **Step 4: Verify no new TypeScript errors in modelManager**

Run:
```bash
npx tsc --noEmit 2>&1 | grep "modelManager" || echo "No errors in modelManager.ts (expected)"
```

Expected: "No errors in modelManager.ts (expected)". The `|| echo` ensures the command succeeds even when grep finds no matches (which is the success case). Pre-existing errors in other files are not in scope.

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/modelManager.ts
git commit -m "refactor: migrate modelManager to ExecuTorch 0.8.x fromModelName() API"
```

---

### Task 3: Fix AIProvider Download Progress Bar

**Files:**
- Modify: `src/services/llm/AIProvider.tsx`

The AIProvider has a download progress modal that renders `width: ${downloadProgress}%`. But `modelManager.getDownloadProgress()` returns a value between 0 and 1 (not 0-100). This means the progress bar shows 0.3% instead of 30% during the real model download. The `AIAssistantScreen.tsx` already handles this correctly with `downloadProgress * 100`, but the AIProvider modal does not.

The callback wiring (`onTokenReceived`, `onResponseUpdated`, `onGeneratingChanged`) is correct and needs no changes — AIProvider never touched `responseCallback` directly.

- [ ] **Step 1: Fix the download progress modal percentage**

In `src/services/llm/AIProvider.tsx`, find the modal progress bar (around line 390):

```typescript
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${downloadProgress}%` },
                      ]}
                    />
```

Replace with:

```typescript
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${downloadProgress * 100}%` },
                      ]}
                    />
```

- [ ] **Step 2: Fix the isDownloading threshold check**

In the `enableAI` callback (around line 169), the polling interval checks:

```typescript
          setIsDownloading(progress > 0 && progress < 100);
```

Since `modelManager.getDownloadProgress()` returns 0..1, this should be:

```typescript
          setIsDownloading(progress > 0 && progress < 1);
```

- [ ] **Step 3: Commit**

```bash
git add src/services/llm/AIProvider.tsx
git commit -m "fix: correct download progress bar percentage in AIProvider modal (0..1 → 0-100%)"
```

---

### Task 4: Remove Dead modelDownloader and Clean Up llmConfig

**Files:**
- Delete: `src/services/llm/modelDownloader.ts`
- Modify: `src/services/llm/index.ts`
- Modify: `src/config/llmConfig.ts`

The `modelDownloader.ts` module uses `react-native-fs` to manually download model files via `LLM_CONFIG.MODEL_DOWNLOAD_URL` and `LLM_CONFIG.TOKENIZER_DOWNLOAD_URL`. In 0.8.x, `LLMModule.fromModelName()` handles model downloading internally — the downloader is dead code. It is only referenced in its own file and the barrel export (`src/services/llm/index.ts`); no other file imports it.

Removing just the config fields without removing the downloader would create a compile error (the downloader references those fields at lines 221 and 239). Remove the entire downloader first, then the config fields.

- [ ] **Step 1: Delete modelDownloader.ts**

```bash
rm src/services/llm/modelDownloader.ts
```

- [ ] **Step 2: Remove the barrel export from index.ts**

In `src/services/llm/index.ts`, remove this line:

```typescript
export { modelDownloader } from './modelDownloader';
```

- [ ] **Step 3: Verify no code imports modelDownloader**

Run:
```bash
grep -r "modelDownloader" src/ --include="*.ts" --include="*.tsx" || echo "No references found (expected)"
```

Expected: "No references found (expected)" — the only references were in the deleted file and the barrel export you just removed.

- [ ] **Step 4: Remove dead config fields from llmConfig.ts**

In `src/config/llmConfig.ts`, remove these lines:

```typescript
  MODEL_DOWNLOAD_URL: '',
  TOKENIZER_DOWNLOAD_URL: '',
```

And remove this stale comment block:

```typescript
  // Model URLs (provided by react-native-executorch package)
  // Import these from: 'react-native-executorch'
  // LLAMA3_2_1B, LLAMA3_2_TOKENIZER, LLAMA3_2_TOKENIZER_CONFIG
```

- [ ] **Step 5: Verify no code references the removed fields**

Run:
```bash
grep -r "MODEL_DOWNLOAD_URL\|TOKENIZER_DOWNLOAD_URL" src/ --include="*.ts" --include="*.tsx" || echo "No references found (expected)"
```

Expected: "No references found (expected)".

- [ ] **Step 6: Commit**

```bash
git add -u src/services/llm/modelDownloader.ts src/services/llm/index.ts src/config/llmConfig.ts
git commit -m "chore: remove dead modelDownloader and unused download URL config fields"
```

---

### Task 5: Add Non-Mock loadModel Test and Run All LLM Tests

**Files:**
- Create: `__tests__/services/llm/modelManagerLoad.test.tsx`
- Verify: `__tests__/services/llm/mockModeFlow.test.tsx`

The existing mock mode test only verifies that `loadModel()` is never called in mock mode. We need a test that exercises the real (non-mock) code path to verify the `LLMModule.fromModelName()` migration is wired correctly. Since Jest has no native runtime, we mock `react-native-executorch` at the module level and verify the correct arguments are passed.

- [ ] **Step 1: Write the non-mock loadModel test**

Create `__tests__/services/llm/modelManagerLoad.test.tsx`:

```typescript
import { Platform } from 'react-native';

// Mock react-native-executorch before importing modelManager
const mockFromModelName = jest.fn();
const mockDelete = jest.fn();

jest.mock('react-native-executorch', () => ({
  LLMModule: {
    fromModelName: mockFromModelName,
  },
  LLAMA3_2_1B_SPINQUANT: {
    modelName: 'llama-3.2-1b-spinquant',
    modelSource: 'https://example.com/model.pte',
    tokenizerSource: 'https://example.com/tokenizer.json',
    tokenizerConfigSource: 'https://example.com/tokenizer_config.json',
  },
}));

// Must import after mock is set up
import { ModelManager } from '@/services/llm/modelManager';

describe('ModelManager.loadModel (non-mock path)', () => {
  let manager: ModelManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ModelManager();

    // Mock the module as available
    mockFromModelName.mockResolvedValue({
      generate: jest.fn(),
      sendMessage: jest.fn(),
      interrupt: jest.fn(),
      delete: mockDelete,
      deleteMessage: jest.fn(),
    });
  });

  afterEach(() => {
    manager.reset();
  });

  it('calls LLMModule.fromModelName with LLAMA3_2_1B_SPINQUANT', async () => {
    await manager.loadModel();

    expect(mockFromModelName).toHaveBeenCalledTimes(1);

    const [model, progressCb, tokenCb, historyCb] =
      mockFromModelName.mock.calls[0];

    // Verify model constant is passed through
    expect(model).toEqual(
      expect.objectContaining({
        modelName: 'llama-3.2-1b-spinquant',
      })
    );

    // Verify callbacks are functions
    expect(typeof progressCb).toBe('function');
    expect(typeof tokenCb).toBe('function');
    expect(typeof historyCb).toBe('function');
  });

  it('reports isModelLoaded() true after successful load', async () => {
    expect(manager.isModelLoaded()).toBe(false);

    await manager.loadModel();

    expect(manager.isModelLoaded()).toBe(true);
  });

  it('accumulates response text via token callback', async () => {
    await manager.loadModel();

    // Simulate token callback firing (the callback was captured in fromModelName)
    const tokenCb = mockFromModelName.mock.calls[0][2];
    tokenCb('Hello');
    tokenCb(' world');

    expect(manager.response).toBe('Hello world');
  });

  it('updates download progress via progress callback', async () => {
    await manager.loadModel();

    const progressCb = mockFromModelName.mock.calls[0][1];
    progressCb(0.5);

    expect(manager.getDownloadProgress()).toBe(0.5);
  });
});
```

- [ ] **Step 2: Run the new test to verify it passes**

Run:
```bash
npx jest __tests__/services/llm/modelManagerLoad.test.tsx --verbose --no-coverage
```

Expected: All 4 tests pass.

- [ ] **Step 3: Run the existing mock mode test**

Run:
```bash
npx jest __tests__/services/llm/mockModeFlow.test.tsx --verbose --no-coverage
```

Expected: Both existing tests still pass:
```
✓ enables AI in mock mode without loading the native model
✓ uses mock inference for chat without loading the native model
```

- [ ] **Step 4: Run the full test suite and check exit code**

Run:
```bash
npx jest --coverage 2>&1; echo "Exit code: $?"
```

Expected: The LLM-related tests pass. Exit code 0 means all tests pass. If exit code is non-zero, check which tests failed — pre-existing failures in unrelated areas are acceptable and not in scope.

- [ ] **Step 5: Commit**

```bash
git add __tests__/services/llm/modelManagerLoad.test.tsx
git commit -m "test: add non-mock loadModel test verifying fromModelName() wiring"
```

If existing test fixes were also needed:
```bash
git add __tests__/
git commit -m "test: fix LLM tests after executorch 0.8.x migration"
```

---

### Task 6: Verify app.json and Prebuild Readiness

**Files:**
- Verify: `app.json`

Confirm that `app.json` is correctly configured for the Expo 54 + ExecuTorch build.

- [ ] **Step 1: Check app.json configuration**

Read `app.json` and verify:
1. `"newArchEnabled": true` — required for ExecuTorch's Turbo Modules
2. iOS deployment target is set to 17.0 (in `Podfile.properties.json`)
3. The `plugins` array does not need a manual ExecuTorch plugin entry (autolinking handles it)

Expected: `app.json` already has `"newArchEnabled": true`. `ios/Podfile.properties.json` already has `"ios.deploymentTarget": "17.0"`. No changes needed.

- [ ] **Step 2: Document manual next steps for the developer**

After all code tasks are complete, the developer must run these commands on their Mac:

```bash
# 1. Install dependencies (resolves new Expo 54 tree)
npm install

# 2. Regenerate native iOS project for Expo 54
npx expo prebuild --clean

# 3. Build custom dev client for iOS Simulator
npx expo run:ios

# OR: Build for physical iPhone
npx expo run:ios --device

# 4. Verify native module loads (check Metro console for):
# [ModelManager] react-native-executorch loaded successfully
# [ModelManager] LLMModule: function
# [ModelManager] LLAMA3_2_1B_SPINQUANT: true

# 5. Open AI Assistant tab, tap "Download & Enable"
# Wait for ~1.1GB model download
# Send a test prompt
# Verify real tokens stream back
```

- [ ] **Step 3: Verify no dual Expo in final state**

After `npm install`, run:
```bash
npm ls expo 2>&1 | head -5
```

Expected: Single `expo@54.x.x` at root. No nested expo inside `react-native-executorch/node_modules/`.

---

## Known Gaps (Not Regressions — Pre-existing)

These are documented in the spec and are not caused by this upgrade:

- **Generation settings passthrough:** `LLMService` passes `maxTokens`/`temperature` to `inferenceEngine`, but they are never forwarded to `modelManager.generate()`. The 0.8.x API adds `configure({ generationConfig })` that could bridge this in a future task.
- **AIProvider `messageHistory` state:** The `messageHistoryCallback` fires in modelManager but nothing bridges it to `setMessageHistory` in AIProvider. The current UX (`AIAssistantScreen`) manages its own messages state, so this has no user-visible impact.

## Post-Plan Verification Checklist

After all tasks are complete:

- [ ] `package.json` has `expo@~54`, `react-native-executorch@0.8.1`, no `react-native-worklets-core`
- [ ] `npm ls expo` shows single Expo version (no nested duplicates)
- [ ] `modelManager.ts` uses `LLMModule.fromModelName()` instead of `new LLMModule()` + `.load()`
- [ ] `modelManager.ts` has no `HAMMER2_1` or `LLAMA3_2_1B` (non-spinquant) imports
- [ ] `src/services/llm/modelDownloader.ts` is deleted
- [ ] `src/services/llm/index.ts` does not export `modelDownloader`
- [ ] `llmConfig.ts` has no empty `MODEL_DOWNLOAD_URL`/`TOKENIZER_DOWNLOAD_URL`
- [ ] AIProvider modal progress bar uses `downloadProgress * 100` (not raw `downloadProgress`)
- [ ] AIProvider `isDownloading` check uses `progress < 1` (not `progress < 100`)
- [ ] `__tests__/services/llm/mockModeFlow.test.tsx` passes
- [ ] `__tests__/services/llm/modelManagerLoad.test.tsx` passes (non-mock path)
- [ ] No new TypeScript errors introduced in modified files
- [ ] Third-party native packages (@rnmapbox/maps, @shopify/react-native-skia) validated for Expo 54 compatibility
