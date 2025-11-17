# TrailSense Mobile App - Advanced Features

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [07-CORE-FEATURES.md](./07-CORE-FEATURES.md)

---

## Advanced Features Overview

1. Live Radar View
2. Detection Heatmap
3. Threat Classification
4. Analytics Dashboard
5. Device Fingerprinting
6. Vacation Mode

---

## 1. Live Radar View

### Radar Screen

```typescript
// src/screens/radar/LiveRadarScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';
import { websocketService } from '@api/websocket';
import { RadarDisplay } from '@components/organisms';

export const LiveRadarScreen = () => {
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    const handleAlert = (alert: Alert) => {
      setDetections(prev => [...prev, {
        id: alert.id,
        distance: estimateDistance(alert.rssi),
        angle: Math.random() * 360, // Will be calculated based on device location
        threatLevel: alert.threatLevel,
        type: alert.detectionType,
      }]);
    };

    websocketService.on('alert', handleAlert);
    return () => websocketService.off('alert', handleAlert);
  }, []);

  return (
    <View style={styles.container}>
      <RadarDisplay
        detections={detections}
        range={800} // feet
      />
    </View>
  );
};
```

### Radar Display Component

```typescript
// src/components/organisms/RadarDisplay/RadarDisplay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export const RadarDisplay: React.FC<{
  detections: Detection[];
  range: number;
}> = ({ detections, range }) => {
  const size = 350;
  const center = size / 2;

  // Radar sweep animation
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false
    );
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Concentric circles for range */}
        <Circle cx={center} cy={center} r={140} stroke="#333" strokeWidth={1} fill="none" />
        <Circle cx={center} cy={center} r={105} stroke="#333" strokeWidth={1} fill="none" />
        <Circle cx={center} cy={center} r={70} stroke="#333" strokeWidth={1} fill="none" />
        <Circle cx={center} cy={center} r={35} stroke="#333" strokeWidth={1} fill="none" />

        {/* Crosshairs */}
        <Line x1={center} y1={0} x2={center} y2={size} stroke="#333" strokeWidth={1} />
        <Line x1={0} y1={center} x2={size} y2={center} stroke="#333" strokeWidth={1} />

        {/* Range labels */}
        <SvgText x={center + 145} y={center} fill="#666" fontSize={10}>
          {range}ft
        </SvgText>

        {/* Detections */}
        {detections.map(detection => {
          const distance = (detection.distance / range) * 140;
          const radian = (detection.angle * Math.PI) / 180;
          const x = center + distance * Math.cos(radian);
          const y = center + distance * Math.sin(radian);

          return (
            <Circle
              key={detection.id}
              cx={x}
              cy={y}
              r={6}
              fill={getThreatColor(detection.threatLevel)}
              opacity={0.8}
            />
          );
        })}
      </Svg>

      {/* Sweeping radar line (animated) */}
      <Animated.View style={[styles.sweep, animatedStyle]} />
    </View>
  );
};
```

---

## 2. Detection Heatmap

```typescript
// src/screens/analytics/HeatmapScreen.tsx

import React from 'react';
import MapView, { Heatmap } from 'react-native-maps';
import { useHeatmapData } from '@hooks/useAnalytics';

export const HeatmapScreen = () => {
  const { data: heatmapPoints } = useHeatmapData();

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Heatmap
        points={heatmapPoints}
        radius={50}
        opacity={0.7}
        gradient={{
          colors: ['green', 'yellow', 'orange', 'red'],
          startPoints: [0.01, 0.25, 0.5, 1],
          colorMapSize: 256,
        }}
      />
    </MapView>
  );
};
```

---

## 3. Threat Classification

```typescript
// src/services/threatClassifier.ts

import { Alert } from '@types';

export class ThreatClassifier {
  static classifyAlert(alert: Alert): ThreatLevel {
    let score = 0;

    // Cellular-only detection (WiFi/BT disabled)
    if (
      alert.detectionType === 'cellular' &&
      !alert.wifiDetected &&
      !alert.bluetoothDetected
    ) {
      score += 40; // Suspicious - stealth mode
    }

    // Multi-band detection
    if (alert.multiband) {
      score += 20; // High confidence
    }

    // Signal strength (closer = higher threat)
    if (alert.rssi > -50) {
      score += 30; // Very close
    } else if (alert.rssi > -70) {
      score += 15; // Moderately close
    }

    // Time of day (nighttime is higher threat)
    const hour = new Date(alert.timestamp).getHours();
    if (hour >= 22 || hour <= 6) {
      score += 20; // Night time
    }

    // Movement pattern
    if (alert.isStationary) {
      score += 15; // Lurking
    }

    // Repeat visitor
    if (alert.seenCount > 3) {
      score -= 30; // Likely familiar
    }

    // Classify based on score
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  static categorizeDevice(alert: Alert): string {
    // Pattern recognition
    if (this.isDeliveryDriver(alert)) return 'Delivery Driver';
    if (this.isMailCarrier(alert)) return 'Mail Carrier';
    if (this.isNeighbor(alert)) return 'Neighbor';
    return 'Unknown';
  }

  private static isDeliveryDriver(alert: Alert): boolean {
    // Check for quick visit pattern
    return (
      alert.duration < 300 && // Less than 5 minutes
      alert.detectedBetween(9, 20)
    ); // Business hours
  }
}
```

---

## 4. Analytics Dashboard

```typescript
// src/screens/analytics/DashboardScreen.tsx

import React from 'react';
import { ScrollView, View } from 'react-native';
import { VictoryChart, VictoryLine, VictoryBar, VictoryPie } from 'victory-native';
import { useAnalytics } from '@hooks/useAnalytics';
import { StatCard, ChartCard } from '@components/molecules';

export const DashboardScreen = () => {
  const { data: analytics } = useAnalytics({ period: 'week' });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsRow}>
        <StatCard
          title="Total Detections"
          value={analytics.totalDetections}
          change="+12%"
        />
        <StatCard
          title="Unknown Devices"
          value={analytics.unknownDevices}
          change="-5%"
        />
      </View>

      <ChartCard title="Detections Over Time">
        <VictoryChart>
          <VictoryLine
            data={analytics.dailyDetections}
            x="date"
            y="count"
          />
        </VictoryChart>
      </ChartCard>

      <ChartCard title="Detection Types">
        <VictoryPie
          data={[
            { x: 'Cellular', y: analytics.cellularCount },
            { x: 'WiFi', y: analytics.wifiCount },
            { x: 'Bluetooth', y: analytics.bluetoothCount },
          ]}
          colorScale={['purple', 'blue', 'cyan']}
        />
      </ChartCard>

      <ChartCard title="Peak Hours">
        <VictoryBar
          data={analytics.hourlyDistribution}
          x="hour"
          y="count"
        />
      </ChartCard>
    </ScrollView>
  );
};
```

---

## 5. Device Fingerprinting

```typescript
// src/services/deviceFingerprinting.ts

export class DeviceFingerprintingService {
  static async trackDevice(macAddress: string, alert: Alert) {
    const fingerprint = await this.getOrCreateFingerprint(macAddress);

    fingerprint.detections.push({
      timestamp: alert.timestamp,
      rssi: alert.rssi,
      location: alert.location,
      type: alert.detectionType,
    });

    fingerprint.lastSeen = alert.timestamp;
    fingerprint.totalVisits++;

    // Calculate patterns
    fingerprint.averageDuration = this.calculateAverageDuration(
      fingerprint.detections
    );
    fingerprint.commonHours = this.findCommonHours(fingerprint.detections);

    await this.saveFingerprint(fingerprint);
  }

  static async getDeviceHistory(macAddress: string) {
    return await database.fingerprints.find({ macAddress });
  }
}
```

---

## 6. Vacation Mode

```typescript
// src/services/vacationModeService.ts

export class VacationModeService {
  static async enableVacationMode(startDate: Date, endDate: Date) {
    await settingsApi.updateVacationMode({
      enabled: true,
      startDate,
      endDate,
      sensitivity: 'high', // Increased sensitivity
      alertPriority: 'critical', // All alerts are critical
      notificationVolume: 'max',
    });

    // Schedule local notification reminders
    await scheduleNotification({
      title: 'Vacation Mode Active',
      body: 'TrailSense is monitoring your property with heightened sensitivity',
      date: startDate,
    });
  }

  static async disableVacationMode() {
    await settingsApi.updateVacationMode({ enabled: false });
  }
}
```

---

## TODO Checklist

### Live Radar

- [ ] **1.1** Create RadarDisplay component with SVG
- [ ] **1.2** Implement radar sweep animation
- [ ] **1.3** Add detection blips with threat colors
- [ ] **1.4** Calculate device position from RSSI
- [ ] **1.5** Add zoom controls
- [ ] **1.6** Add range selector
- [ ] **1.7** Connect to WebSocket for real-time updates

### Heatmap

- [ ] **2.1** Integrate react-native-maps
- [ ] **2.2** Fetch heatmap data from API
- [ ] **2.3** Implement heatmap overlay
- [ ] **2.4** Add time range filter
- [ ] **2.5** Add detection type filter

### Threat Classification

- [ ] **3.1** Implement threat scoring algorithm
- [ ] **3.2** Add pattern recognition
- [ ] **3.3** Create device categorization logic
- [ ] **3.4** Add ML model (future enhancement)

### Analytics

- [ ] **4.1** Create analytics API endpoints
- [ ] **4.2** Implement charts with Victory Native
- [ ] **4.3** Add date range selector
- [ ] **4.4** Create export reports feature
- [ ] **4.5** Add comparison views (week over week)

### Device Fingerprinting

- [ ] **5.1** Create fingerprint database schema
- [ ] **5.2** Implement tracking logic
- [ ] **5.3** Build device history view
- [ ] **5.4** Add pattern detection

### Vacation Mode

- [ ] **6.1** Create vacation mode settings screen
- [ ] **6.2** Implement date picker
- [ ] **6.3** Add auto-enable based on calendar
- [ ] **6.4** Add geofence-based auto-enable
- [ ] **6.5** Send reminders when active

---

**Next Document**: [09-NOTIFICATIONS.md](./09-NOTIFICATIONS.md)
