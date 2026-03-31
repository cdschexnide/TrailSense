# CLAUDE.md - TrailSense

## Project Overview

TrailSense is a React Native (Expo SDK 52) mobile app for property intrusion detection. It receives and displays real-time alerts from ESP32-based detection units that monitor cellular, WiFi, and Bluetooth signals.

## Quick Commands

```bash
npm start              # Start Expo dev server (mock mode by default)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm test               # Run tests with coverage
npm run type-check     # TypeScript type checking
npm run lint:fix       # Lint and auto-fix
npm run format         # Format all files with Prettier
```

## Tech Stack

- **Framework:** React Native 0.76 + Expo SDK 52
- **Language:** TypeScript 5.9 (strict mode)
- **Navigation:** React Navigation 7.x
- **State:** Redux Toolkit + Redux Persist (auth/settings), React Query (server state), Zustand (local UI state)
- **API:** Axios + Socket.io for real-time WebSocket events
- **Maps:** Mapbox (@rnmapbox/maps)
- **Graphics:** Shopify React Native Skia
- **On-device AI:** ExecuTorch with Llama 3.2 1B
- **Testing:** Jest + React Native Testing Library

## Project Structure

```
src/
  api/          # Axios client, endpoints/, websocket, React Query client
  components/   # Atomic design: atoms/ -> molecules/ -> organisms/ -> templates/
  screens/      # Feature screens: auth/, alerts/, devices/, radar/, analytics/, settings/, ai/
  navigation/   # React Navigation config (Root, Main, Auth navigators)
  store/        # Redux store + slices/ (auth, user, settings, ui) + zustand/
  services/     # Business logic (auth, threatClassifier, notifications, llm/)
  hooks/        # Custom hooks including api/ subfolder
  types/        # TypeScript type definitions
  constants/    # Colors, typography, spacing, config
  theme/        # ThemeProvider and color definitions
  config/       # Feature flags, mock config, LLM config
  utils/        # Utility functions
  mocks/        # Mock data for development
__tests__/      # Tests organized by hooks/, screens/, services/
docs/           # Design docs and implementation plans
```

## Path Aliases

Configured in tsconfig.json and babel.config.js:

- `@/*` -> `src/*`
- `@components/*`, `@screens/*`, `@navigation/*`, `@hooks/*`, `@utils/*`
- `@services/*`, `@store/*`, `@api/*`, `@types/*`, `@constants/*`, `@theme/*`
- `@assets/*` -> `assets/*`

## Code Conventions

- **Components/Types:** PascalCase (`AlertCard.tsx`, `ThreatLevel`)
- **Functions/Variables:** camelCase (`getAlerts`, `handlePress`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Prettier:** 80 char width, 2-space indent, single quotes, trailing commas (es5), arrow parens avoid
- **TypeScript:** Strict mode - no `any` without justification, explicit return types
- **Commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Pre-commit hooks:** Husky + lint-staged runs ESLint and Prettier on staged files

## Mock Mode

Development works without a backend. Mock mode is enabled by default (`USE_MOCK_API=true`):
- 55 pre-seeded alerts, 5 devices with realistic status
- Simulated WebSocket events every 5 seconds
- Auto-login as admin@trailsense.com

## Architecture Notes

- **Offline-first:** Redux Persist + SQLite for local persistence, React Query caching
- **Real-time:** WebSocket for live detections, graceful fallback to polling
- **Auth:** Secure token storage (Expo SecureStore), biometric auth, token refresh via interceptors
- **Feature flags:** Centralized `FeatureFlagsManager` with A/B testing support

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
