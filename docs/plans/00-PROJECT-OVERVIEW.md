# TrailSense Mobile App - Project Overview

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** Implementation Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Key Architectural Decisions](#key-architectural-decisions)
5. [Feature Overview](#feature-overview)
6. [Development Phases](#development-phases)
7. [Success Criteria](#success-criteria)

---

## Executive Summary

### Purpose

TrailSense is a production-grade React Native mobile application designed to receive, process, and display real-time intrusion detection alerts from ESP32-based BPDevice detection units deployed in remote property locations. The app provides property owners with immediate threat awareness through multi-band device detection (cellular uplink, WiFi, Bluetooth) with advanced analytics, threat classification, and actionable response capabilities.

### Core Value Proposition

- **Extended Detection Range**: 500-800+ ft cellular detection, 300ft WiFi, 100ft Bluetooth
- **Real-Time Alerts**: Immediate push notifications with threat classification
- **Advanced Analytics**: Heatmaps, pattern recognition, visitor tracking
- **Professional UI/UX**: Production-grade design with accessibility compliance
- **Offline-First Architecture**: Works without constant connectivity
- **Enterprise-Ready**: Scalable, secure, maintainable codebase

### Target Platforms

- **iOS**: 13.0+ (iPhone and iPad support)
- **Android**: API Level 21+ (Android 5.0+)
- **Single Codebase**: React Native with Expo for maximum code reuse

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TrailSense Mobile App                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Presentation Layer                       │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│  │  │Alerts│ │Radar │ │Devices│ │Maps  │ │Settings│     │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                     │
│  ┌─────────────────────┴────────────────────────────────┐  │
│  │              State Management Layer                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Redux    │  │React Query │  │  Zustand   │    │  │
│  │  │  Toolkit   │  │  (Server)  │  │   (UI)     │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                     │
│  ┌─────────────────────┴────────────────────────────────┐  │
│  │           Communication Layer                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   HTTP     │  │ WebSocket  │  │    FCM     │    │  │
│  │  │API Client  │  │(Socket.io) │  │ Push Notif │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                     │
│  ┌─────────────────────┴────────────────────────────────┐  │
│  │            Data Persistence Layer                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │AsyncStorage│  │   SQLite   │  │SecureStore │    │  │
│  │  │  (Cache)   │  │ (Offline)  │  │   (Auth)   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │     Cloud Backend (API)      │
        │  ┌────────────────────────┐ │
        │  │  REST API Endpoints    │ │
        │  │  WebSocket Server      │ │
        │  │  FCM Service           │ │
        │  │  Database (PostgreSQL) │ │
        │  └────────────────────────┘ │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  ESP32 BPDevices (Edge)     │
        │  ┌────────────────────────┐ │
        │  │ Cellular Detector      │ │
        │  │ WiFi Scanner           │ │
        │  │ Bluetooth Scanner      │ │
        │  │ LTE Modem              │ │
        │  └────────────────────────┘ │
        └─────────────────────────────┘
```

### Data Flow Architecture

#### Alert Reception Flow

```
ESP32 Device → LTE Modem → Cloud Backend → WebSocket/FCM → Mobile App → User
    (Detect)     (Transmit)   (Process)      (Push)        (Display)   (Action)
```

#### Real-Time Communication Flow

```
1. App Active: WebSocket connection maintains real-time stream
2. App Background: FCM push notifications wake app
3. App Offline: Alerts queued on server, synced on reconnection
4. Optimistic Updates: Local UI updates immediately, server sync in background
```

---

## Technology Stack

### Core Framework

| Technology       | Version | Purpose              | Rationale                                         |
| ---------------- | ------- | -------------------- | ------------------------------------------------- |
| **React Native** | 0.73+   | Mobile framework     | Cross-platform, mature ecosystem, Expo support    |
| **Expo**         | SDK 50+ | Development platform | Faster development, OTA updates, managed workflow |
| **TypeScript**   | 5.3+    | Type system          | Type safety, better DX, fewer runtime errors      |
| **Node.js**      | 18+     | Development runtime  | Required for React Native tooling                 |

### State Management

| Library           | Version | Purpose      | Rationale                                          |
| ----------------- | ------- | ------------ | -------------------------------------------------- |
| **Redux Toolkit** | 2.0+    | Global state | Auth, user prefs, settings - predictable, DevTools |
| **React Query**   | 5.0+    | Server state | Alerts, devices, API data - caching, invalidation  |
| **Zustand**       | 4.4+    | UI state     | Modals, filters - lightweight, minimal boilerplate |

### Navigation & UI

| Library                          | Version | Purpose       | Rationale                                           |
| -------------------------------- | ------- | ------------- | --------------------------------------------------- |
| **React Navigation**             | 6.x     | Navigation    | Industry standard, deep linking, TypeScript support |
| **React Native Reanimated**      | 3.x     | Animations    | 60fps animations on native thread                   |
| **React Native Gesture Handler** | 2.x     | Gestures      | Native gesture handling, smooth interactions        |
| **Victory Native**               | 36+     | Charts/Graphs | Analytics dashboard, performance metrics            |

### Communication

| Library                              | Version | Purpose            | Rationale                                     |
| ------------------------------------ | ------- | ------------------ | --------------------------------------------- |
| **axios**                            | 1.6+    | HTTP client        | Interceptors, request/response transformation |
| **socket.io-client**                 | 4.6+    | WebSocket          | Real-time alerts, bidirectional communication |
| **@react-native-firebase/messaging** | 19+     | Push notifications | FCM integration, background notifications     |
| **@react-native-firebase/analytics** | 19+     | Analytics          | User behavior tracking, crash reporting       |

### Maps & Location

| Library               | Version | Purpose     | Rationale                                        |
| --------------------- | ------- | ----------- | ------------------------------------------------ |
| **react-native-maps** | 1.10+   | Map display | Native maps (Google/Apple), heatmap support      |
| **expo-location**     | 16+     | Geolocation | Device location, geofencing, background tracking |

### Data Persistence

| Library                                       | Version | Purpose             | Rationale                              |
| --------------------------------------------- | ------- | ------------------- | -------------------------------------- |
| **@react-native-async-storage/async-storage** | 1.21+   | Key-value storage   | Simple cache, user preferences         |
| **expo-sqlite**                               | 13+     | Relational database | Offline alert storage, complex queries |
| **expo-secure-store**                         | 12+     | Encrypted storage   | Tokens, sensitive user data            |

### Security

| Library                       | Version | Purpose             | Rationale                      |
| ----------------------------- | ------- | ------------------- | ------------------------------ |
| **expo-local-authentication** | 13+     | Biometric auth      | Face ID, Touch ID, fingerprint |
| **react-native-ssl-pinning**  | 1.5+    | Certificate pinning | Prevent MITM attacks           |
| **crypto-js**                 | 4.2+    | Encryption          | Local data encryption, hashing |

### Testing

| Library                           | Version | Purpose           | Rationale                                     |
| --------------------------------- | ------- | ----------------- | --------------------------------------------- |
| **Jest**                          | 29+     | Unit testing      | Built into React Native, fast, isolated tests |
| **@testing-library/react-native** | 12+     | Component testing | User-centric testing, accessibility           |
| **Detox**                         | 20+     | E2E testing       | Native automation, realistic user flows       |
| **MSW**                           | 2+      | API mocking       | Mock service worker for API tests             |

### Development Tools

| Tool                  | Version | Purpose         | Rationale                              |
| --------------------- | ------- | --------------- | -------------------------------------- |
| **ESLint**            | 8+      | Code linting    | Code quality, consistency              |
| **Prettier**          | 3+      | Code formatting | Automatic formatting, team consistency |
| **Husky**             | 8+      | Git hooks       | Pre-commit linting, pre-push testing   |
| **TypeScript ESLint** | 6+      | TS linting      | TypeScript-specific rules              |

### Monitoring & Analytics

| Service                  | Purpose                | Rationale                                  |
| ------------------------ | ---------------------- | ------------------------------------------ |
| **Sentry**               | Error tracking         | Production error monitoring, crash reports |
| **Firebase Analytics**   | User analytics         | User behavior, retention metrics           |
| **Firebase Performance** | Performance monitoring | App startup time, network latency          |

---

## Key Architectural Decisions

### 1. State Management Strategy

**Decision**: Triple-layer state management (Redux Toolkit + React Query + Zustand)

**Rationale**:

- **Redux Toolkit**: Global application state (auth, user profile, settings)
  - Predictable state updates with reducers
  - Excellent DevTools for debugging
  - Middleware support for complex logic
  - Persist critical state across app restarts

- **React Query**: Server state management (alerts, devices, API data)
  - Automatic caching with intelligent invalidation
  - Background refetching and synchronization
  - Optimistic updates for better UX
  - Built-in loading/error states
  - Request deduplication

- **Zustand**: Ephemeral UI state (modals, filters, temporary UI flags)
  - Minimal boilerplate for simple state
  - No provider wrapping needed
  - Perfect for component-specific state
  - Lightweight alternative to Redux for UI-only state

**Trade-offs**:

- ✅ Separation of concerns, optimal re-rendering
- ✅ Each tool used for its strengths
- ⚠️ Team must understand when to use each tool
- ⚠️ Slight learning curve for developers new to this pattern

### 2. Offline-First Architecture

**Decision**: Local-first data with background synchronization

**Implementation**:

- SQLite for relational alert/device data
- AsyncStorage for simple key-value caching
- React Query cache as first-class data source
- Background fetch for periodic sync
- Optimistic updates for immediate UI feedback

**Rationale**:

- BPDevices deployed in remote areas with spotty connectivity
- Users need access to historical alerts offline
- Better UX with instant UI updates
- Reduced server load through intelligent caching

### 3. Real-Time Communication Hybrid Approach

**Decision**: WebSocket (primary) + FCM (fallback)

**Strategy**:

- **App in Foreground**: Maintain WebSocket connection for instant alerts
- **App in Background**: FCM push notifications to wake app
- **App Offline**: Server queues alerts, synced on reconnection
- **Heartbeat Mechanism**: Detect stale connections, auto-reconnect

**Rationale**:

- WebSocket provides instant bidirectional communication when app is active
- FCM ensures alerts delivered even when app is backgrounded/terminated
- Hybrid approach maximizes reliability across all app states
- Fallback mechanism ensures no alerts are missed

### 4. Navigation Architecture

**Decision**: Bottom Tab Navigation + Stack Navigation

**Structure**:

```
BottomTabs (Main)
├── Alerts Stack
│   ├── AlertList (default)
│   ├── AlertDetail
│   └── AlertFilter
├── Radar Stack
│   ├── LiveRadar (default)
│   └── RadarSettings
├── Devices Stack
│   ├── DeviceList (default)
│   ├── DeviceDetail
│   └── AddDevice
├── Analytics Stack
│   ├── Dashboard (default)
│   ├── Heatmap
│   └── Reports
└── Settings Stack
    ├── SettingsMain (default)
    ├── Profile
    ├── Whitelist
    └── Notifications

Auth Stack (Pre-login)
├── Login
├── Register
└── ForgotPassword
```

**Rationale**:

- Bottom tabs provide quick access to main features
- Stack navigation within each tab for detailed views
- Deep linking support for push notification taps
- Persistent navigation state for better UX

### 5. Security Architecture

**Decision**: Multi-layered security approach

**Layers**:

1. **Authentication**: JWT with refresh tokens + biometric
2. **Transport**: TLS 1.3 with certificate pinning
3. **Storage**: Encrypted SecureStore for tokens, encrypted SQLite for sensitive data
4. **API**: Request signing, rate limiting, CORS
5. **Code**: Obfuscation in production builds

**Rationale**:

- Property security app requires enterprise-grade security
- Defense in depth protects against multiple attack vectors
- Compliance with OWASP Mobile Top 10
- User trust is critical for adoption

### 6. Design System Approach

**Decision**: Custom design system with atomic design principles

**Structure**:

- **Tokens**: Colors, typography, spacing, shadows
- **Atoms**: Buttons, inputs, icons, badges
- **Molecules**: Cards, form fields, list items
- **Organisms**: Alert cards, device cards, radar display
- **Templates**: Screen layouts
- **Screens**: Complete screen implementations

**Rationale**:

- Consistency across the app
- Reusable components reduce code duplication
- Easy theme switching (dark/light mode)
- Simplified maintenance and updates
- Better accessibility through standardized components

### 7. Performance Optimization Strategy

**Decision**: Proactive performance optimization from day one

**Strategies**:

- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Memoize expensive computations
- **FlatList optimization**: windowSize, getItemLayout for large lists
- **Image optimization**: expo-image with caching
- **Code splitting**: Lazy load screens and heavy components
- **Bundle optimization**: Hermes engine, minification

**Rationale**:

- Real-time alerts require instant UI updates
- Large alert history lists need smooth scrolling
- Battery efficiency critical for mobile apps
- Performance directly impacts user satisfaction

### 8. Testing Strategy

**Decision**: Comprehensive testing pyramid

**Levels**:

1. **Unit Tests** (70%): Business logic, utilities, reducers
2. **Integration Tests** (20%): Component + API interactions
3. **E2E Tests** (10%): Critical user flows

**Coverage Goals**:

- 80%+ code coverage for business logic
- 100% coverage for security-critical paths
- E2E coverage for happy paths + critical error scenarios

**Rationale**:

- Early bug detection reduces production issues
- Confidence in refactoring and feature additions
- Documentation through test cases
- Faster development long-term

---

## Feature Overview

### Core Features (MVP)

#### 1. Authentication & Security

- User registration and login
- JWT-based authentication with refresh tokens
- Biometric authentication (Face ID/Touch ID/Fingerprint)
- Multi-factor authentication (optional)
- Password reset flow
- Session management

#### 2. Alert Management

- Real-time alert reception via WebSocket/FCM
- Alert list with filtering and sorting
- Alert detail view with detection metadata
- Mark alerts as reviewed/false positive
- Alert search functionality
- Alert history with pagination
- One-tap actions (call 911, dismiss, whitelist)

#### 3. Device Management

- Add/remove BPDevice detection units
- Device status monitoring (online/offline, battery, signal)
- Device location on map
- Device configuration (sensitivity, scan intervals)
- Device naming and categorization
- Firmware update notifications

#### 4. Whitelist Management

- Add known devices to whitelist by MAC address
- Auto-learn from user feedback (mark as safe)
- Whitelist categories (family, guests, service personnel)
- Import/export whitelist
- Temporary whitelist entries (time-based)

#### 5. Settings & Configuration

- User profile management
- Notification preferences
- Quiet hours configuration
- Detection sensitivity adjustment
- Geofencing settings
- Privacy settings
- Dark/light mode toggle

### Advanced Features

#### 6. Live Radar View

- Real-time visualization of detected devices
- Radar-style display with concentric circles (range indicators)
- Device blips with threat level color coding
- Distance estimation display
- Animation for new detections
- Filter by detection type (cellular/WiFi/BT)

#### 7. Detection Analytics

- Daily/weekly/monthly activity reports
- Detection frequency charts
- Peak hours analysis
- Detection type breakdown (cellular/WiFi/BT)
- Threat level distribution
- Coverage area visualization

#### 8. Threat Classification

- **Ghost Mode Detection**: Alerts when WiFi/BT disabled (cellular only)
- **Crowd Detection**: Identifies multiple devices arriving together
- **Repeat Visitor Tracking**: Learns frequent visitors (mail carrier, etc.)
- **Movement Pattern Analysis**: Stationary vs. moving devices
- **Threat Level Scoring**: Low/Medium/High/Critical based on behavior

#### 9. Heatmap Visualization

- Geographic heatmap of detection frequency
- Time-based heatmap (hourly, daily patterns)
- Identify common intrusion paths
- Vulnerable area identification
- Historical heatmap playback

#### 10. Device Fingerprinting

- Track individual devices across time
- Detection history per device
- First seen / last seen timestamps
- Visit frequency and duration
- Device nickname assignment

#### 11. Vacation Mode

- Heightened sensitivity mode
- Immediate emergency notifications
- Auto-activate based on calendar/geofencing
- Reduced false positive thresholds
- Special notification sound/vibration

#### 12. One-Tap Emergency Actions

- **Call 911**: Direct dial from notification
- **Trigger Alarm**: Sound siren on BPDevice
- **Turn On Lights**: Integration with smart home
- **Dismiss**: Mark as false positive
- **Add to Whitelist**: Trust this device

### Premium/Future Features

#### 13. Intruder Timeline

- Chronological playback of intrusion events
- Breadcrumb trail on map
- Detection timeline with signal strength graph
- Estimated path reconstruction
- Export timeline as report

#### 14. Multi-Device Coordination

- Mesh network visualization
- Cross-device correlation
- Coverage overlap analysis
- Coordinated alerts from multiple devices

#### 15. Threat Weather

- Local crime data overlay
- Property risk scoring
- Neighborhood watch integration
- Police incident map overlay

#### 16. Machine Learning Features

- Auto-categorize regular visitors
- Anomaly detection (unusual patterns)
- Predictive alerts based on historical data
- Smart whitelist suggestions

---

## Development Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Project setup, design system, authentication

- ✅ Project initialization with Expo
- ✅ TypeScript configuration
- ✅ Design system and component library
- ✅ Authentication flow (JWT + biometric)
- ✅ Navigation structure
- ✅ State management setup (Redux + React Query)

**Deliverables**:

- Working login/registration flow
- Basic navigation between screens
- Design system with themed components
- State management foundation

### Phase 2: Core Features (Weeks 3-5)

**Goal**: Alert management, device management, basic functionality

- ✅ Alert list and detail views
- ✅ Device management screens
- ✅ Whitelist management
- ✅ Settings screens
- ✅ Push notifications
- ✅ WebSocket integration
- ✅ API client with authentication

**Deliverables**:

- End-to-end alert reception and display
- Device CRUD operations
- Working whitelist functionality
- Push notifications working on iOS/Android

### Phase 3: Advanced Features (Weeks 6-8)

**Goal**: Radar view, analytics, threat classification

- ✅ Live radar visualization
- ✅ Detection heatmaps
- ✅ Analytics dashboard
- ✅ Threat classification logic
- ✅ Device fingerprinting
- ✅ One-tap actions

**Deliverables**:

- Interactive radar view
- Comprehensive analytics
- Intelligent threat classification
- Action buttons functional

### Phase 4: Maps & Location (Week 9)

**Goal**: Map integration, geofencing

- ✅ Map view with device locations
- ✅ Detection markers on map
- ✅ Heatmap overlay
- ✅ Geofencing implementation
- ✅ Background location tracking

**Deliverables**:

- Full map functionality
- Geofence-based automation
- Location-aware features

### Phase 5: Offline & Persistence (Week 10)

**Goal**: Offline functionality, data persistence

- ✅ SQLite integration
- ✅ Offline alert storage
- ✅ Background sync
- ✅ Optimistic updates
- ✅ Cache management

**Deliverables**:

- Fully functional offline mode
- Background synchronization
- Robust data persistence

### Phase 6: Testing & Polish (Weeks 11-12)

**Goal**: Comprehensive testing, UI polish, performance optimization

- ✅ Unit tests for business logic
- ✅ Integration tests for critical flows
- ✅ E2E tests for user journeys
- ✅ Performance optimization
- ✅ Accessibility improvements
- ✅ UI/UX refinements

**Deliverables**:

- 80%+ test coverage
- Smooth 60fps animations
- WCAG 2.1 AA compliance
- Production-ready app

### Phase 7: Deployment (Week 13)

**Goal**: App store submission, CI/CD setup

- ✅ iOS build and TestFlight
- ✅ Android build and Play Store beta
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ App store listings
- ✅ Production monitoring setup

**Deliverables**:

- Apps published to stores
- Automated build/deploy pipeline
- Production monitoring active

---

## Success Criteria

### Technical Metrics

| Metric               | Target       | Measurement                             |
| -------------------- | ------------ | --------------------------------------- |
| **App Startup Time** | < 2 seconds  | Cold start to interactive               |
| **Alert Latency**    | < 30 seconds | Device detection to mobile notification |
| **UI Frame Rate**    | 60 FPS       | Consistent across all animations        |
| **Crash-Free Rate**  | > 99.5%      | Sentry crash reporting                  |
| **Test Coverage**    | > 80%        | Jest coverage reports                   |
| **Bundle Size**      | < 50 MB      | iOS/Android app size                    |
| **Memory Usage**     | < 150 MB     | Peak memory consumption                 |
| **Battery Impact**   | < 5%/hour    | Background battery drain                |

### User Experience Metrics

| Metric                    | Target         | Measurement                    |
| ------------------------- | -------------- | ------------------------------ |
| **Setup Time**            | < 10 minutes   | User onboarding to first alert |
| **App Store Rating**      | > 4.5 stars    | User reviews                   |
| **Daily Active Users**    | 70%+ retention | Firebase Analytics             |
| **Notification Delivery** | > 99%          | FCM success rate               |
| **False Positive Rate**   | < 5%           | User feedback on alerts        |

### Feature Completeness

- ✅ All core features (MVP) implemented and tested
- ✅ 80%+ of advanced features implemented
- ✅ iOS and Android feature parity
- ✅ Offline functionality working reliably
- ✅ Security audit passed
- ✅ Accessibility audit passed (WCAG 2.1 AA)

### Code Quality

- ✅ TypeScript strict mode enabled
- ✅ ESLint errors: 0
- ✅ Prettier formatting: 100% compliance
- ✅ No console.log statements in production
- ✅ All API errors handled gracefully
- ✅ Loading states for all async operations
- ✅ Error boundaries for crash prevention

### Documentation

- ✅ README with setup instructions
- ✅ Architecture documentation (this file)
- ✅ API integration guide
- ✅ Component library documentation (Storybook)
- ✅ Deployment guide
- ✅ Contributing guidelines

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk                                  | Impact | Probability | Mitigation                                     |
| ------------------------------------- | ------ | ----------- | ---------------------------------------------- |
| **Real-time connectivity issues**     | High   | Medium      | Hybrid WebSocket+FCM approach, offline queue   |
| **Battery drain from location**       | High   | Medium      | Intelligent geofencing, configurable intervals |
| **Push notification delivery**        | High   | Low         | FCM + WebSocket redundancy, delivery tracking  |
| **Map performance with many markers** | Medium | Medium      | Marker clustering, viewport culling            |
| **Large alert history performance**   | Medium | High        | Virtualized lists, pagination, SQLite indexing |
| **Expo compatibility issues**         | Medium | Low         | Use latest stable Expo SDK, prebuild if needed |

### Business Risks

| Risk                            | Impact | Probability | Mitigation                                        |
| ------------------------------- | ------ | ----------- | ------------------------------------------------- |
| **User privacy concerns**       | High   | Medium      | Clear privacy policy, minimal data collection     |
| **App store rejection**         | High   | Low         | Follow guidelines strictly, pre-submission review |
| **Backend API changes**         | Medium | Medium      | API versioning, graceful degradation              |
| **Third-party service outages** | Medium | Low         | Fallback mechanisms, service redundancy           |

---

## Next Steps

1. **Review this overview with stakeholders** ✅
2. **Proceed to 01-PROJECT-SETUP.md** for detailed implementation
3. **Set up development environment**
4. **Begin Phase 1 implementation**

---

## Appendices

### Glossary

- **BPDevice**: ESP32-based detection hardware unit
- **FCM**: Firebase Cloud Messaging
- **RSSI**: Received Signal Strength Indicator
- **MAC Address**: Media Access Control address (device identifier)
- **Geofencing**: Location-based triggers
- **OTA**: Over-The-Air updates
- **E2E**: End-to-End testing

### References

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://tanstack.com/query/latest)
- [TrailSense Hardware Spec](../TrailSense.md)

---

**Document Status**: ✅ Complete and ready for implementation
**Next Document**: [01-PROJECT-SETUP.md](./01-PROJECT-SETUP.md)
