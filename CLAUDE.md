# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrailSense is a React Native (Expo SDK 54) mobile app for property intrusion detection. It receives and displays real-time alerts from ESP32-based detection units that monitor cellular, WiFi, and Bluetooth signals. On-device AI (ExecuTorch + Llama 3.2 1B) provides alert summaries and pattern analysis.

## Commands

```bash
npm start              # Start Expo dev server (mock mode by default)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm test               # Run tests with coverage
npm run test:watch     # Run tests in watch mode
npx jest path/to/test  # Run a single test file
npm run type-check     # TypeScript type checking (tsc --noEmit)
npm run lint:fix       # Lint and auto-fix
npm run format         # Format all files with Prettier
```

## Architecture

### State Management (Three-Layer Pattern)

The app splits state across three libraries with strict boundaries:

- **Redux Toolkit + Redux Persist** (`src/store/slices/`): Persistent core state — auth, user, settings, blocked devices, UI. Selective persistence: only auth, settings, and blockedDevices slices are persisted to AsyncStorage.
- **React Query** (`src/hooks/api/`): Server/cache state — devices, alerts, positions, known devices. Query keys follow `[RESOURCE_NAME, filters?]` pattern. In mock/demo mode, staleTime is set to Infinity and refetching is disabled automatically.
- **Zustand** (`src/store/zustand/`): Ephemeral UI state only — filter selections, radar state. Never persisted.

### Navigation Hierarchy

```
RootNavigator (auth-gated)
├── AuthNavigator (unauthenticated)
└── MainNavigator (authenticated, bottom tabs)
    ├── HomeTab → HomeStack
    ├── AlertsTab → AlertsStack
    ├── AITab → AIStack
    ├── RadarTab → RadarStack
    ├── DevicesTab → DevicesStack
    └── MoreTab → MoreStack
```

Navigation state is persisted to AsyncStorage and sanitized on rehydration to prevent auth state mismatches.

### LLM Service Pipeline

```
User Query → IntentClassifier → FocusedContextBuilder → PromptTemplate → InferenceEngine → ResponseProcessor → ResponseCache
```

- Templates (`src/services/llm/templates/`) extend a `PromptTemplate` base class with sanitization and truncation
- Feature-flagged: `LLM_ENABLED`, `LLM_ALERT_SUMMARIES`, `LLM_PATTERN_ANALYSIS`, `LLM_CONVERSATIONAL_ASSISTANT`
- `LLM_MOCK_MODE` env var returns mock responses without running inference

### Mock/Demo Duality

Two distinct mock modes exist:

1. **Static mock mode** (env-based): `EXPO_PUBLIC_USE_MOCK_API=true` — enabled by default, set at boot, cannot be toggled at runtime
2. **Runtime demo mode** (UI-triggered): Entered from login screen, calls `applyDemoModeConfig()` which swaps the axios adapter and disables React Query refetching. Reversible via `revertDemoModeConfig()`

Both use the same mock data (`src/mocks/data/`) — 55 alerts, 5 devices, mock WebSocket emitting events every 5s.

### API Layer

- `src/api/axiosInstance.ts`: Base axios with auth interceptors (token injection, 401 refresh)
- `src/api/endpoints/`: Per-resource API modules exporting method objects (e.g., `devicesApi.getDevices()`)
- `src/api/websocket.ts`: Socket.io wrapper with typed event listener map; mock WebSocket uses same interface
- React Query hooks in `src/hooks/api/` normalize empty filter objects to `undefined` to avoid duplicate cache entries

### Component Pattern (Atomic Design)

```
atoms/     → Button, Icon, Text, Input, Badge, SkeletonCard
molecules/ → Card, ListItem, SearchBar, Toast, FilterChip, FloatingActionBar
organisms/ → AlertCard, DeviceCard, RadarDisplay, HeaderHero, charts/
templates/ → EmptyState, ErrorState, LoadingState, ScreenLayout
```

Each layer has `index.ts` barrel exports. Styling uses `useTheme()` for colors/shadows/spacing. Interactive components trigger `Haptics.impactAsync()` on press.

## Code Conventions

- **Prettier:** 80 chars, 2-space indent, single quotes, trailing commas (es5), arrow parens avoid, LF line endings
- **TypeScript:** Strict mode — `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- **Naming:** PascalCase for components/types, camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **Commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Pre-commit:** Husky + lint-staged runs ESLint and Prettier on staged `.ts`/`.tsx` files

## Path Aliases

Configured in tsconfig.json, babel.config.js, and jest.config.js:

`@/*` → `src/*`, plus shortcuts: `@components/*`, `@screens/*`, `@navigation/*`, `@hooks/*`, `@utils/*`, `@services/*`, `@store/*` (and `@store` → `src/store/index`), `@api/*`, `@types/*`, `@constants/*`, `@theme/*`, `@assets/*` → `assets/*`

## Testing

- Preset: `jest-expo` with `@testing-library/jest-native` and React Native Testing Library
- Tests mirror src structure in `__tests__/` (e.g., `__tests__/hooks/`, `__tests__/screens/`)
- Jest mocks configured in `jest.setup.js` for: async-storage, expo-secure-store, expo-local-authentication, vector-icons, reanimated
- Coverage collected from `src/**/*.{ts,tsx}` excluding `.d.ts`, `.stories.tsx`, and `index.ts` barrel files
