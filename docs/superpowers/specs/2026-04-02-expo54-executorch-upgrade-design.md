# Expo 54 + ExecuTorch 0.8.1 Upgrade Design

**Date:** 2026-04-02
**Goal:** Get TrailSense to run a real on-device LLM (Llama 3.2 1B SpinQuant) on iPhone via ExecuTorch, replacing the current scaffolding with actual inference.

## Context

TrailSense has an AI assistant screen (`AIAssistantScreen.tsx`) backed by a service layer (`LLMService.ts` → `modelManager.ts` → `react-native-executorch`). The wiring is in place but no real on-device generation has occurred because:

1. **Expo SDK mismatch:** `react-native-executorch@0.5.3` bundles `expo@53.0.27` as a direct dependency, creating a dual Expo 52/53 native module conflict with the app's `expo@52.0.47`.
2. **No custom dev build:** The iOS binary has never been rebuilt with the ExecuTorch native module linked.
3. **API drift:** The `LLMModule` API changed between 0.5.3 and 0.8.x (constructor is now private).

## Decision: Expo 54 + executorch 0.8.1

- **Expo 54** (not 55): Expo 55 is days old. Expo 54 is the stable SDK that executorch 0.8.x was developed against.
- **executorch 0.8.1** (not 0.5.3): Version 0.8.x removed `expo` as a direct dependency entirely, eliminating the dual-Expo problem. Only peer deps on `react` and `react-native`.
- **Model: Llama 3.2 1B SpinQuant only.** Single model, simplest path. The `LLAMA3_2_1B_SPINQUANT` constant is exported by both 0.5.3 and 0.8.x with the same name.

## Dependency Changes

| Package                      | Current         | Target                                          | Notes                                                                   |
| ---------------------------- | --------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `expo`                       | `~52.0.0`       | `~54.0.0`                                       | Core SDK upgrade                                                        |
| `react-native`               | `0.76.6`        | Expo 54 pinned (resolved by `npx expo install`) | Managed by Expo                                                         |
| `react-native-executorch`    | `0.5.3`         | `0.8.1`                                         | No more bundled Expo                                                    |
| `react-native-worklets-core` | `^1.6.2`        | Remove                                          | Not imported anywhere in src/; was a transitive dep of executorch 0.5.x |
| All `expo-*` packages        | SDK 52 versions | SDK 54 versions                                 | Via `npx expo install --fix`                                            |

Expo-managed dependencies (`react-native-reanimated`, `react-native-screens`, etc.) will be resolved by `npx expo install --fix`. Third-party native packages (`@rnmapbox/maps`, `@shopify/react-native-skia`, etc.) are outside Expo's known-version mappings and must be validated explicitly for compatibility with the React Native version Expo 54 pins.

## LLMModule API Migration

### Breaking change: Private constructor + static factory

The `LLMModule` constructor became private in 0.8.x. Model loading now happens via a static factory method that returns a ready-to-use instance.

**Old API (0.5.3):**

```typescript
const llm = new LLMModule({
  tokenCallback,
  responseCallback,
  messageHistoryCallback,
});
await llm.load(LLAMA3_2_1B_SPINQUANT, progressCallback);
```

**New API (0.8.1):**

```typescript
const llm = await LLMModule.fromModelName(
  LLAMA3_2_1B_SPINQUANT, // includes modelName field
  progressCallback, // (progress: number) => void
  tokenCallback, // (token: string) => void
  messageHistoryCallback // (messageHistory: Message[]) => void
);
```

### Other API changes

- `responseCallback` removed from constructor — accumulate response via `tokenCallback`
- Model constants now include a `modelName` field (e.g., `'llama-3.2-1b-spinquant'`)
- `sendMessage()` signature unchanged: `(message: string) => Promise<Message[]>`
- `generate()`, `interrupt()`, `delete()`, `deleteMessage()` — unchanged
- New methods available: `getGeneratedTokenCount()`, `getPromptTokensCount()`, `getTotalTokensCount()`
- New `configure()` accepts `generationConfig` with `temperature`, `topp`, `outputTokenBatchSize`

### Impact on modelManager.ts

The `loadModel()` method must be rewritten from construct-then-load to a single `LLMModule.fromModelName()` call. The `_response` accumulation currently done via `responseCallback` must move to `tokenCallback` (which already accumulates `_response` in the current code, so this is a deletion not an addition).

The remaining public methods (`generate`, `sendMessage`, `interrupt`, `delete`, `deleteMessage`, state getters) require no API changes — they delegate to the same `llmModule` instance methods.

### Impact on AIProvider.tsx

The `isRuntimeSupported()` check in modelManager is still the correct gate. The callback wiring (`onTokenReceived`, `onResponseUpdated`, `onGeneratingChanged`) is correct and needs no changes — AIProvider never passed a `responseCallback` to `LLMModule` directly; it uses modelManager's callback properties, which are unaffected by the API change.

**Bug fix required:** The AIProvider download modal renders `width: ${downloadProgress}%` but `modelManager.getDownloadProgress()` returns 0..1 (not 0..100). This means the modal progress bar shows 0.3% instead of 30%. The fix is to multiply by 100 in the modal rendering. Note: `AIAssistantScreen.tsx` already does `downloadProgress * 100` correctly.

## Files Changed

| File                                  | Change Type           | Description                                                                                                   |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `package.json`                        | Modify                | Bump expo, executorch, remove worklets-core                                                                   |
| `package-lock.json`                   | Regenerate            | Via npm install                                                                                               |
| `app.json`                            | Review                | Verify newArchEnabled, deployment target (already correct)                                                    |
| `src/services/llm/modelManager.ts`    | Rewrite `loadModel()` | Static factory pattern, remove responseCallback, remove HAMMER2_1 import                                      |
| `src/services/llm/AIProvider.tsx`     | Fix                   | Progress bar renders `downloadProgress` as 0-100% but modelManager reports 0..1; multiply by 100              |
| `src/config/llmConfig.ts`             | Cleanup               | Remove empty MODEL_DOWNLOAD_URL/TOKENIZER_DOWNLOAD_URL                                                        |
| `src/services/llm/modelDownloader.ts` | Delete                | Dead code — never imported outside barrel export. Download is handled by `LLMModule.fromModelName()` in 0.8.x |
| `src/services/llm/index.ts`           | Modify                | Remove modelDownloader barrel export                                                                          |
| `ios/`                                | Regenerate            | Via `npx expo prebuild --clean`                                                                               |

## Files NOT Changed

| File                                   | Reason                                                       |
| -------------------------------------- | ------------------------------------------------------------ |
| `src/screens/ai/AIAssistantScreen.tsx` | UI layer, no dependency on LLMModule API                     |
| `src/services/llm/LLMService.ts`       | Talks to modelManager, not LLMModule directly                |
| `src/services/llm/inferenceEngine.ts`  | Talks to modelManager, not LLMModule directly                |
| `src/config/featureFlags.ts`           | Already configured correctly                                 |
| `src/types/llm.ts`                     | Project's Message type is structurally compatible with 0.8.x |

## Post-Code Manual Steps

These steps require a Mac with Xcode and cannot be performed by Claude:

1. `npm install` — resolve the new dependency tree
2. `npx expo prebuild --clean` — regenerate ios/ directory for Expo 54
3. `npx expo run:ios` (or `npx expo run:ios --device` for physical iPhone) — build the custom dev client
4. Verify Metro console shows: `[ModelManager] react-native-executorch loaded successfully`
5. Open AI Assistant screen, tap "Download & Enable"
6. Wait for Llama 3.2 1B SpinQuant download (~1.1GB)
7. Send a test prompt, verify real tokens stream back via tokenCallback

## Success Criteria

- `npm install` produces no dual-Expo tree (verify with `npm ls expo`)
- `npx expo run:ios` compiles without native errors
- `require('react-native-executorch')` returns a valid module at runtime
- `LLMModule.fromModelName(LLAMA3_2_1B_SPINQUANT, ...)` loads the model successfully
- A real prompt produces real token-by-token output in the AI Assistant screen
- Mock mode (`EXPO_PUBLIC_LLM_MOCK_MODE=true`) still works as a fallback

## Known Gaps (Not Regressions — Pre-existing)

These are not caused by the upgrade but are worth documenting:

- **Generation settings passthrough:** `LLMService` passes `maxTokens`/`temperature` via `GenerationOptions` to `inferenceEngine`, but `inferenceEngine.generate()` never forwards them to `modelManager.generate()`. They are silently dropped. The 0.8.x API adds `configure({ generationConfig: { temperature, topp } })` that could bridge this, but wiring it is a separate feature, not part of this migration.
- **AIProvider `messageHistory` state is never updated from modelManager:** The `messageHistoryCallback` fires in modelManager but nothing bridges it to `setMessageHistory` in AIProvider. The current UX (`AIAssistantScreen`) manages its own messages state independently, so this has no user-visible impact.
- **`npx expo install --fix` scope:** Expo's `--fix` command only covers packages in its known-version mappings. Third-party native packages like `@rnmapbox/maps`, `@shopify/react-native-skia`, and `react-native-chart-kit` need explicit compatibility validation after the SDK upgrade.

## Risks

- **Expo 52→54 breaking changes** in non-LLM packages (Mapbox, Skia, Reanimated). Mitigation: `npx expo install --fix` handles most version bumps; test each screen after upgrade.
- **ExecuTorch native compilation issues** on specific Xcode versions. Mitigation: executorch 0.8.x is actively maintained; check their GitHub issues if build fails.
- **Model download size (~1.1GB)** on first launch. This is inherent to on-device LLM; the UI already shows download progress.
