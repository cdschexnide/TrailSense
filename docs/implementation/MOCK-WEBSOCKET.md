# Mock WebSocket Implementation

## Overview

The mock WebSocket system simulates real-time detection events for the TrailSense app, enabling development and testing of the Live Radar screen without requiring a backend server.

## Features

### Real-Time Event Generation

The mock WebSocket service automatically generates realistic detection events with:

- **Alert Events** - Every 5 seconds
- **Device Status Updates** - Every 15 seconds

### Realistic Data

All generated events include:

- ✓ Weighted threat levels (low 40%, medium 35%, high 20%, critical 5%)
- ✓ Multiple detection types (WiFi 50%, Bluetooth 30%, Cellular 20%)
- ✓ Realistic RSSI values based on detection type
- ✓ Random MAC addresses
- ✓ Multi-band detections (30% chance)
- ✓ Location data with slight variance around devices
- ✓ Appropriate metadata (SSID, device names, providers)

## Architecture

```
┌─────────────────────────────────────────────┐
│  LiveRadarScreen                            │
│  - Subscribes to 'alert' events            │
│  - Converts to Detection objects           │
│  - Displays on RadarDisplay component      │
└──────────────┬──────────────────────────────┘
               │
               │ websocketService.on('alert', ...)
               │
┌──────────────▼──────────────────────────────┐
│  WebSocketService (src/api/websocket.ts)   │
│  - Checks mockConfig.mockWebSocket         │
│  - Routes to mock or real WebSocket        │
└──────────────┬──────────────────────────────┘
               │
               │ (if mock mode enabled)
               │
┌──────────────▼──────────────────────────────┐
│  MockWebSocketService                       │
│  (src/mocks/mockWebSocket.ts)              │
│                                             │
│  - Generates alert events every 5s          │
│  - Generates device status every 15s        │
│  - Emits events to subscribers              │
└─────────────────────────────────────────────┘
```

## Files Created/Modified

### New Files

1. **src/mocks/mockWebSocket.ts** - Mock WebSocket service implementation

### Modified Files

1. **src/api/websocket.ts** - Routes to mock service when enabled
2. **src/config/mockConfig.ts** - Added WebSocket configuration
3. **docs/implementation/MOCK-WEBSOCKET.md** - This documentation

## Configuration

Mock WebSocket is automatically enabled when `USE_MOCK_API=true` in `.env`:

```typescript
// src/config/mockConfig.ts
export const mockConfig = {
  // Mock WebSocket events (enabled by default in mock mode)
  mockWebSocket: isMockMode,

  // Alert event interval (ms)
  wsEventInterval: 5000, // 5 seconds

  // Device status update interval (ms)
  wsDeviceStatusInterval: 15000, // 15 seconds
};
```

## Event Types

### 1. Alert Events

Generated every 5 seconds with realistic data:

```typescript
{
  id: "live-alert-123",
  deviceId: "device-001",
  timestamp: "2025-11-16T10:30:45Z",
  threatLevel: "high", // Weighted: 40% low, 35% medium, 20% high, 5% critical
  detectionType: "wifi", // Weighted: 50% wifi, 30% bluetooth, 20% cellular
  rssi: -68,
  macAddress: "AA:BB:CC:DD:EE:FF",
  cellularStrength: -62, // If cellular
  isReviewed: false,
  isFalsePositive: false,
  location: {
    latitude: 29.7604,
    longitude: -95.3698
  },
  wifiDetected: true,
  bluetoothDetected: false,
  multiband: false, // 30% chance
  isStationary: true, // 30% chance
  seenCount: 1,
  duration: 180,
  metadata: {
    ssid: "iPhone", // For WiFi
    vendor: "Apple Inc."
    // OR deviceName: "AirPods Pro" for Bluetooth
    // OR band: "850MHz", provider: "Verizon" for Cellular
  }
}
```

### 2. Device Status Events

Generated every 15 seconds:

```typescript
{
  id: "device-001",
  battery: 87, // Random +/- 2% change
  lastSeen: "2025-11-16T10:30:45Z",
  online: true // False if battery < 5%
}
```

## Usage

### Automatic in Mock Mode

When `USE_MOCK_API=true`, the mock WebSocket is automatically used:

```bash
npm start
```

Console output:
```
═══════════════════════════════════════════
          🎭 MOCK MODE ENABLED 🎭
═══════════════════════════════════════════

  ✓ Static mock data loaded
  ✓ Mock WebSocket enabled
  ✓ Live radar events every 5 seconds
  ✓ No backend connection required

  To disable: Set USE_MOCK_API=false in .env
═══════════════════════════════════════════

[MockWebSocket] 🎭 Connecting to mock WebSocket...
[MockWebSocket] ✓ Connected
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm from North Gate Sensor
[MockWebSocket] 📡 Alert: MEDIUM bluetooth @ -78dBm from East Trail Monitor
[MockWebSocket] 🔋 Device Status: North Gate Sensor battery: 87%
```

### Live Radar Screen

Navigate to the **Radar** tab to see:

- Real-time detections appearing every 5 seconds
- Animated radar display with threat level colors
- Detection counter updating automatically
- Detections auto-removed after 30 seconds

### Event Details

Each detection shows:
- **Distance** - Estimated from RSSI
- **Angle** - Calculated from MAC address hash
- **Threat Level** - Color-coded (red=critical, orange=high, yellow=medium, green=low)
- **Detection Type** - Cellular/WiFi/Bluetooth icon

## Disabling Mock WebSocket

To use real WebSocket (requires backend):

1. Edit `.env`:
   ```env
   USE_MOCK_API=false
   ```

2. Restart the app

OR manually override in code:

```typescript
// src/config/mockConfig.ts
export const mockConfig = {
  mockWebSocket: false, // Force disable even in mock mode
  // ... other config
};
```

## Customization

### Adjust Event Frequency

```typescript
// src/mocks/mockWebSocket.ts
class MockWebSocketService {
  // Change these values
  private readonly EVENT_INTERVAL = 3000; // 3 seconds (faster)
  private readonly DEVICE_STATUS_INTERVAL = 30000; // 30 seconds (slower)
}
```

### Adjust Threat Level Distribution

```typescript
// In generateMockAlert()
const threatWeights = [20, 30, 30, 20]; // More critical/high alerts
// [low, medium, high, critical]
```

### Adjust Detection Type Distribution

```typescript
// In generateMockAlert()
const typeWeights = [40, 40, 20]; // More cellular detections
// [cellular, wifi, bluetooth]
```

## Testing Scenarios

### Test High Alert Activity

Temporarily increase event frequency:

```typescript
private readonly EVENT_INTERVAL = 1000; // 1 alert per second
```

### Test Critical Alerts Only

Modify threat weights:

```typescript
const threatWeights = [0, 0, 0, 100]; // 100% critical
```

### Test Specific Detection Type

```typescript
const detectionType = 'cellular'; // Force cellular only
```

## Integration Points

### 1. WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
export const useWebSocket = (token: string | null) => {
  // Automatically uses mock service when enabled
  websocketService.connect(token);

  websocketService.on('alert', handleAlert);
  websocketService.on('device-status', handleDeviceStatus);
};
```

### 2. Live Radar Screen

```typescript
// src/screens/radar/LiveRadarScreen.tsx
useEffect(() => {
  const handleAlert = (alert: Alert) => {
    const newDetection = convertToDetection(alert);
    setDetections(prev => [...prev, newDetection]);
  };

  websocketService.on('alert', handleAlert);
  return () => websocketService.off('alert', handleAlert);
}, []);
```

### 3. Alert List Updates

Real-time alerts are also added to the alerts list cache via `useWebSocket` hook.

## Benefits

✓ **No Backend Required** - Develop Live Radar without server
✓ **Realistic Data** - Weighted distributions match production patterns
✓ **Consistent Testing** - Reproducible detection scenarios
✓ **Performance Testing** - Stress test with high event frequency
✓ **UI Development** - See real-time updates immediately
✓ **Demo Ready** - Impressive live radar for presentations

## Troubleshooting

### No Events Appearing

1. Check mock mode is enabled:
   ```bash
   # .env file
   USE_MOCK_API=true
   ```

2. Check console for connection:
   ```
   [MockWebSocket] 🎭 Connecting to mock WebSocket...
   [MockWebSocket] ✓ Connected
   ```

3. Verify you're on the Live Radar screen (Radar tab)

### Events Too Fast/Slow

Adjust intervals in `src/mocks/mockWebSocket.ts`:

```typescript
private readonly EVENT_INTERVAL = 5000; // milliseconds
```

### Only Seeing One Detection Type

Check type weights in `generateMockAlert()` - all weights should be > 0

## Next Steps

- Add ability to trigger specific event types manually
- Add developer menu to control event frequency in real-time
- Add ability to replay specific detection scenarios
- Add detection event history/playback

---

**Last Updated:** November 16, 2025
**Status:** ✅ Implemented and Tested
