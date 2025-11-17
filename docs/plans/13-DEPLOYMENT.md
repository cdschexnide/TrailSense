# TrailSense Mobile App - Deployment

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [12-TESTING.md](./12-TESTING.md)

---

## Deployment Strategy

### Build Types

1. **Development**: Local testing, debugging
2. **Preview**: Internal testing, TestFlight/Play Store Beta
3. **Production**: Public app store release

---

## EAS (Expo Application Services) Build

### EAS Configuration

```json
// eas.json

{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.trailsense.app"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "123456789",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Build Commands

```bash
# iOS Development Build
eas build --platform ios --profile development

# Android Development Build
eas build --platform android --profile development

# iOS Preview Build (TestFlight)
eas build --platform ios --profile preview

# Android Preview Build (Internal Testing)
eas build --platform android --profile preview

# Production Build (Both Platforms)
eas build --platform all --profile production
```

---

## iOS Deployment

### App Store Connect Setup

1. **Create App Store Connect Account**
   - Apple Developer Program membership ($99/year)
   - Create app identifier: `com.trailsense.app`

2. **Certificates & Provisioning Profiles**

   ```bash
   # EAS handles this automatically
   eas credentials
   ```

3. **App Store Connect Configuration**
   - Create new app in App Store Connect
   - Fill in app metadata:
     - Name: TrailSense
     - Subtitle: Property Intrusion Detection
     - Category: Utilities
     - Privacy Policy URL
     - Support URL

4. **TestFlight Beta Testing**

   ```bash
   # Build and submit to TestFlight
   eas build --platform ios --profile preview
   eas submit --platform ios
   ```

5. **Production Release**

   ```bash
   # Production build
   eas build --platform ios --profile production

   # Submit to App Store
   eas submit --platform ios --profile production
   ```

### iOS Screenshots

Required sizes:

- 6.7" (iPhone 14 Pro Max): 1290x2796
- 6.5" (iPhone 14 Plus): 1284x2778
- 5.5" (iPhone 8 Plus): 1242x2208

### App Store Metadata

```
Name: TrailSense
Subtitle: Smart Property Security
Description:
TrailSense is a professional property intrusion detection system that uses
advanced wireless scanning technology to detect and alert you of unauthorized
presence on your property.

Features:
• Real-time detection of mobile devices (500-800+ ft range)
• Multi-band detection: Cellular, WiFi, and Bluetooth
• Live radar view of detected devices
• Intelligent threat classification
• Analytics and heatmaps
• One-tap emergency actions
• Offline support

Perfect for:
- Remote property monitoring
- Ranch and farm security
- Vacation home surveillance
- Construction site monitoring

Keywords:
property security, intrusion detection, mobile device detection, security alert,
property monitoring, wireless detection, radar, surveillance
```

---

## Android Deployment

### Google Play Console Setup

1. **Create Google Play Developer Account**
   - One-time fee: $25
   - Create app: TrailSense

2. **Generate Upload Key**

   ```bash
   # EAS handles this automatically
   eas credentials
   ```

3. **Google Play Console Configuration**
   - App category: Tools
   - Content rating questionnaire
   - Privacy policy
   - Target audience

4. **Internal Testing**

   ```bash
   # Build APK for internal testing
   eas build --platform android --profile preview

   # Submit to internal testing track
   eas submit --platform android --track internal
   ```

5. **Production Release**

   ```bash
   # Production AAB build
   eas build --platform android --profile production

   # Submit to production
   eas submit --platform android --profile production
   ```

### Android Screenshots

Required sizes:

- Phone: 1080x1920 (minimum 2 screenshots)
- 7" Tablet: 1200x1920
- 10" Tablet: 1600x2560

### Play Store Metadata

```
Short Description (80 chars):
Smart property security with 800ft+ detection range. Real-time alerts.

Full Description (4000 chars):
[Same as iOS description]

Categories:
Primary: Tools
Secondary: Productivity
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml

name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build-preview:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build on EAS
        run: eas build --platform all --profile preview --non-interactive

  build-production:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build on EAS
        run: eas build --platform all --profile production --non-interactive

      - name: Submit to stores
        run: |
          eas submit --platform ios --profile production --non-interactive
          eas submit --platform android --profile production --non-interactive
```

---

## Over-The-Air (OTA) Updates

### EAS Update Configuration

```json
// eas.json (update section)

{
  "update": {
    "development": {
      "channel": "development"
    },
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### Publishing Updates

```bash
# Publish OTA update to production
eas update --branch production --message "Fix critical bug"

# Publish to specific channel
eas update --channel preview --message "Beta features"

# View update history
eas update:list --branch production
```

### Update Implementation

```typescript
// src/App.tsx

import * as Updates from 'expo-updates';

export default function App() {
  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();

        // Notify user
        Alert.alert(
          'Update Available',
          'A new version is available. Restart to apply?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart',
              onPress: () => Updates.reloadAsync(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  // Rest of app
}
```

---

## Environment Management

### Environment Files

```env
# .env.development
API_BASE_URL=http://localhost:3000
WS_URL=ws://localhost:3000
ENABLE_DEBUG_LOGS=true

# .env.preview
API_BASE_URL=https://api-staging.trailsense.com
WS_URL=wss://ws-staging.trailsense.com
ENABLE_DEBUG_LOGS=true

# .env.production
API_BASE_URL=https://api.trailsense.com
WS_URL=wss://ws.trailsense.com
ENABLE_DEBUG_LOGS=false
```

### Build-time Configuration

```typescript
// src/constants/config.ts

import Constants from 'expo-constants';

const ENV = {
  development: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },
  preview: {
    apiUrl: 'https://api-staging.trailsense.com',
    wsUrl: 'wss://ws-staging.trailsense.com',
  },
  production: {
    apiUrl: 'https://api.trailsense.com',
    wsUrl: 'wss://ws.trailsense.com',
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.manifest?.releaseChannel;

  if (releaseChannel === 'production') {
    return ENV.production;
  } else if (releaseChannel === 'preview') {
    return ENV.preview;
  } else {
    return ENV.development;
  }
};

export const { apiUrl: API_BASE_URL, wsUrl: WS_URL } = getEnvVars();
```

---

## Monitoring & Analytics

### Sentry Setup

```typescript
// src/App.tsx

import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  },
});

export default Sentry.wrap(App);
```

### Firebase Analytics

```typescript
import analytics from '@react-native-firebase/analytics';

// Track screen views
analytics().logScreenView({
  screen_name: 'AlertList',
  screen_class: 'AlertListScreen',
});

// Track events
analytics().logEvent('alert_viewed', {
  alert_id: alert.id,
  threat_level: alert.threatLevel,
});
```

---

## TODO Checklist

### EAS Setup

- [ ] **1.1** Install EAS CLI globally
- [ ] **1.2** Login to Expo account
- [ ] **1.3** Configure eas.json
- [ ] **1.4** Test development build
- [ ] **1.5** Test preview build

### iOS Deployment

- [ ] **2.1** Enroll in Apple Developer Program
- [ ] **2.2** Create app in App Store Connect
- [ ] **2.3** Configure app identifier
- [ ] **2.4** Generate certificates with EAS
- [ ] **2.5** Prepare screenshots
- [ ] **2.6** Write app description
- [ ] **2.7** Build production version
- [ ] **2.8** Submit to TestFlight
- [ ] **2.9** Submit to App Store
- [ ] **2.10** Pass app review

### Android Deployment

- [ ] **3.1** Create Google Play Developer account
- [ ] **3.2** Create app in Play Console
- [ ] **3.3** Generate upload key
- [ ] **3.4** Configure Play Console
- [ ] **3.5** Prepare screenshots
- [ ] **3.6** Write store listing
- [ ] **3.7** Build production AAB
- [ ] **3.8** Submit to internal testing
- [ ] **3.9** Submit to production
- [ ] **3.10** Pass review

### CI/CD

- [ ] **4.1** Create GitHub Actions workflow
- [ ] **4.2** Add Expo token to secrets
- [ ] **4.3** Configure automated builds
- [ ] **4.4** Set up automated testing
- [ ] **4.5** Configure code coverage reports

### OTA Updates

- [ ] **5.1** Configure EAS Update
- [ ] **5.2** Implement update checking
- [ ] **5.3** Test OTA updates
- [ ] **5.4** Set up update channels

### Monitoring

- [ ] **6.1** Set up Sentry
- [ ] **6.2** Configure Firebase Analytics
- [ ] **6.3** Add crash reporting
- [ ] **6.4** Set up performance monitoring

---

**Next Document**: [14-PERFORMANCE.md](./14-PERFORMANCE.md)
