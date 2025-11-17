# TrailSense Mobile App - Performance Optimization & Monitoring

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [13-DEPLOYMENT.md](./13-DEPLOYMENT.md)

---

## Performance Goals

| Metric                  | Target   | Critical Threshold |
| ----------------------- | -------- | ------------------ |
| **App Startup Time**    | < 2s     | < 3s               |
| **Time to Interactive** | < 3s     | < 5s               |
| **Frame Rate**          | 60 FPS   | 55 FPS             |
| **Memory Usage**        | < 150 MB | < 200 MB           |
| **Bundle Size**         | < 50 MB  | < 75 MB            |
| **API Response Time**   | < 500ms  | < 1s               |
| **Alert Latency**       | < 30s    | < 60s              |

---

## 1. React Performance Optimization

### Component Optimization

```typescript
// Use React.memo for expensive components

import React, { memo } from 'react';

export const AlertCard = memo<AlertCardProps>(
  ({ alert, onPress }) => {
    return (
      <Card onPress={onPress}>
        {/* Alert content */}
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return prevProps.alert.id === nextProps.alert.id &&
           prevProps.alert.reviewed === nextProps.alert.reviewed;
  }
);
```

### Hook Optimization

```typescript
// useMemo for expensive computations

const sortedAlerts = useMemo(() => {
  return alerts.sort((a, b) => {
    const threatOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return threatOrder[a.threatLevel] - threatOrder[b.threatLevel];
  });
}, [alerts]);

// useCallback for stable function references

const handleAlertPress = useCallback(
  (alertId: string) => {
    navigation.navigate('AlertDetail', { alertId });
  },
  [navigation]
);
```

### List Optimization

```typescript
// Optimized FlatList

import { FlatList } from 'react-native';

<FlatList
  data={alerts}
  renderItem={({ item }) => <AlertCard alert={item} />}
  keyExtractor={(item) => item.id}

  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}

  // Fixed item height for better performance
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}

  // Avoid inline functions
  renderItem={renderAlertCard}
  keyExtractor={keyExtractor}
/>
```

---

## 2. Image Optimization

### Expo Image

```typescript
import { Image } from 'expo-image';

// Optimized image component
<Image
  source={{ uri: imageUrl }}
  style={styles.image}

  // Caching
  cachePolicy="memory-disk"

  // Placeholder
  placeholder={blurhash}

  // Transitions
  transition={200}

  // Content fit
  contentFit="cover"

  // Priority
  priority="high"
/>
```

### Image Caching Strategy

```typescript
// src/utils/imageCache.ts

import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

export class ImageCache {
  static async preloadImages(urls: string[]) {
    const promises = urls.map(url => Image.prefetch(url));
    await Promise.all(promises);
  }

  static async clearCache() {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  }

  static async getCacheSize(): Promise<number> {
    const cacheDir = FileSystem.cacheDirectory + 'ImageCache/';
    const files = await FileSystem.readDirectoryAsync(cacheDir);

    let totalSize = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(cacheDir + file);
      totalSize += info.size || 0;
    }

    return totalSize;
  }
}
```

---

## 3. Bundle Size Optimization

### Code Splitting

```typescript
// Lazy load screens

import React, { lazy, Suspense } from 'react';

const AnalyticsScreen = lazy(() => import('@screens/analytics/DashboardScreen'));

function Analytics() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalyticsScreen />
    </Suspense>
  );
}
```

### Import Optimization

```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ❌ Bad
import * as Icons from '@expo/vector-icons';

// ✅ Good
import { Ionicons } from '@expo/vector-icons';
```

### Metro Bundler Configuration

```javascript
// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  transformer: {
    ...config.transformer,
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

---

## 4. Animation Performance

### React Native Reanimated

```typescript
// Use native-driven animations

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const AnimatedCard = ({ visible }: { visible: boolean }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Content */}
    </Animated.View>
  );
};
```

### Layout Animations

```typescript
import { LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const handleExpand = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpanded(!expanded);
};
```

---

## 5. Network Optimization

### Request Batching

```typescript
// src/utils/requestBatcher.ts

class RequestBatcher {
  private queue: Array<{ request: Promise<any>; resolve: Function }> = [];
  private timeout: NodeJS.Timeout | null = null;

  add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise(resolve => {
      this.queue.push({ request: request(), resolve });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => this.flush(), 100);
    });
  }

  private async flush() {
    const batch = this.queue.splice(0, this.queue.length);
    const results = await Promise.all(batch.map(item => item.request));

    batch.forEach((item, index) => {
      item.resolve(results[index]);
    });
  }
}

export const requestBatcher = new RequestBatcher();
```

### Response Caching

```typescript
// React Query caching configuration

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

---

## 6. Memory Management

### Memory Leak Prevention

```typescript
// Clean up subscriptions

useEffect(() => {
  const subscription = websocketService.on('alert', handleAlert);

  return () => {
    websocketService.off('alert', handleAlert);
  };
}, []);

// Clean up timers

useEffect(() => {
  const interval = setInterval(() => {
    checkForUpdates();
  }, 60000);

  return () => clearInterval(interval);
}, []);
```

### Memory Monitoring

```typescript
// src/utils/memoryMonitor.ts

import { Platform } from 'react-native';
import * as Device from 'expo-device';

export class MemoryMonitor {
  static async getMemoryUsage() {
    if (Platform.OS === 'ios') {
      // iOS memory monitoring
      return await Device.getDeviceMemoryAsync();
    }
    return null;
  }

  static async checkMemoryPressure() {
    const memory = await this.getMemoryUsage();
    if (memory && memory < 100 * 1024 * 1024) {
      // < 100MB
      // Low memory warning
      console.warn('Low memory detected');
      this.clearCaches();
    }
  }

  static clearCaches() {
    // Clear React Query cache
    queryClient.clear();

    // Clear image cache
    ImageCache.clearCache();

    // Clear other caches
    AsyncStorage.removeItem('@cache:temporary');
  }
}
```

---

## 7. Database Performance

### SQLite Optimization

```typescript
// Use transactions for batch operations

db.transaction(tx => {
  alerts.forEach(alert => {
    tx.executeSql('INSERT INTO alerts VALUES (?, ?, ?, ?)', [
      alert.id,
      alert.timestamp,
      alert.type,
      alert.data,
    ]);
  });
});

// Create indexes

tx.executeSql(
  'CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)'
);
tx.executeSql('CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type)');

// Use prepared statements

const stmt = db.prepareStatement('SELECT * FROM alerts WHERE type = ?');
const results = stmt.execute(['critical']);
```

---

## 8. Performance Monitoring

### React Native Performance Monitor

```typescript
// Enable performance monitor in debug mode

if (__DEV__) {
  require('react-native-performance-monitor');
}
```

### Custom Performance Tracking

```typescript
// src/utils/performanceTracker.ts

class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string) {
    const start = this.marks.get(startMark);
    if (!start) return;

    const duration = Date.now() - start;

    // Log to analytics
    analytics().logEvent('performance', {
      metric: name,
      duration,
    });

    // Log to console in dev
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }

    return duration;
  }
}

export const performanceTracker = new PerformanceTracker();

// Usage
performanceTracker.mark('app_start');

// Later
performanceTracker.measure('time_to_interactive', 'app_start');
```

### Firebase Performance

```typescript
import performance from '@react-native-firebase/perf';

// Track screen rendering
const trace = await performance().startTrace('alert_list_render');
trace.putAttribute('alert_count', alerts.length.toString());

// Render component
renderAlertList();

await trace.stop();

// Track network requests
const metric = await performance().newHttpMetric(url, 'GET');
await metric.start();

const response = await fetch(url);

metric.setHttpResponseCode(response.status);
metric.setResponseContentType(response.headers.get('Content-Type'));
await metric.stop();
```

---

## 9. Startup Optimization

### Optimize App Initialization

```typescript
// src/App.tsx

import React, { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load critical data only
        await loadFonts();
        await loadAuthState();

        // Defer non-critical operations
        InteractionManager.runAfterInteractions(() => {
          loadCachedData();
          setupNotifications();
          checkForUpdates();
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return <MainApp />;
}
```

---

## 10. Hermes Engine

### Enable Hermes (Android)

```json
// app.json

{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

### Benefits

- Faster app startup
- Reduced memory usage
- Smaller app size
- Better performance on low-end devices

---

## TODO Checklist

### React Optimization

- [ ] **1.1** Add React.memo to expensive components
- [ ] **1.2** Use useMemo for expensive computations
- [ ] **1.3** Use useCallback for stable functions
- [ ] **1.4** Optimize FlatList performance
- [ ] **1.5** Profile component renders

### Bundle Size

- [ ] **2.1** Analyze bundle size
- [ ] **2.2** Implement code splitting
- [ ] **2.3** Optimize imports
- [ ] **2.4** Remove unused dependencies
- [ ] **2.5** Enable Hermes engine

### Animation

- [ ] **3.1** Use Reanimated for animations
- [ ] **3.2** Avoid inline styles in animated components
- [ ] **3.3** Use LayoutAnimation wisely
- [ ] **3.4** Profile animation frame rates

### Network

- [ ] **4.1** Implement request batching
- [ ] **4.2** Configure React Query caching
- [ ] **4.3** Add request deduplication
- [ ] **4.4** Implement retry logic

### Memory

- [ ] **5.1** Fix memory leaks
- [ ] **5.2** Implement memory monitoring
- [ ] **5.3** Add cache clearing logic
- [ ] **5.4** Profile memory usage

### Database

- [ ] **6.1** Add database indexes
- [ ] **6.2** Use transactions for batches
- [ ] **6.3** Optimize queries
- [ ] **6.4** Profile database performance

### Monitoring

- [ ] **7.1** Set up Firebase Performance
- [ ] **7.2** Add custom performance tracking
- [ ] **7.3** Monitor startup time
- [ ] **7.4** Track critical user flows
- [ ] **7.5** Set up performance alerts

### Testing

- [ ] **8.1** Run performance tests
- [ ] **8.2** Profile on low-end devices
- [ ] **8.3** Measure bundle size
- [ ] **8.4** Test with poor network
- [ ] **8.5** Load test with many alerts

---

## Performance Checklist

✅ **App Startup**

- [ ] Startup time < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] Deferred non-critical operations

✅ **Runtime Performance**

- [ ] 60 FPS maintained during scrolling
- [ ] Animations smooth (no jank)
- [ ] Memory usage < 150 MB
- [ ] No memory leaks detected

✅ **Bundle Size**

- [ ] Total bundle < 50 MB
- [ ] JS bundle < 10 MB
- [ ] Assets optimized

✅ **Network**

- [ ] API responses < 500ms
- [ ] Offline functionality works
- [ ] Failed requests retry automatically

✅ **Monitoring**

- [ ] Firebase Performance configured
- [ ] Sentry error tracking active
- [ ] Custom metrics tracked

---

**Document Status**: ✅ Complete - All 15 implementation plans created
**Project Ready**: ✅ Ready for implementation

This is the final implementation plan document. You now have comprehensive guides for:

- Project Overview & Architecture (00)
- Project Setup (01)
- Design System (02)
- Authentication (03)
- Navigation (04)
- State Management (05)
- Backend Integration (06)
- Core Features (07)
- Advanced Features (08)
- Notifications (09)
- Maps & Location (10)
- Data Persistence (11)
- Testing (12)
- Deployment (13)
- Performance (14)

All documents include detailed TODO checklists for step-by-step implementation by other Claude Code instances.
