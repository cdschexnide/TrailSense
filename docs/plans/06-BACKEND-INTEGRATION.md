# TrailSense Mobile App - Backend Integration

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** ✅ Complete
**Prerequisites**: [05-STATE-MANAGEMENT.md](./05-STATE-MANAGEMENT.md)

---

## Communication Layer Architecture

### Three Communication Channels

1. **HTTP/REST API**: CRUD operations (axios)
2. **WebSocket**: Real-time alerts (Socket.io)
3. **Push Notifications**: Background alerts (FCM)

---

## HTTP API Client

```typescript
// src/api/client.ts

import axios from 'axios';
import { AuthService } from '@services/authService';
import { API_BASE_URL } from '@constants/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async config => {
    const tokens = await AuthService.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await AuthService.getTokens();
        if (tokens?.refreshToken) {
          const newTokens = await AuthService.refreshToken(tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AuthService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### API Endpoints

```typescript
// src/api/endpoints/alerts.ts

import { apiClient } from '../client';
import { Alert, AlertFilters } from '@types';

export const alertsApi = {
  getAlerts: async (filters?: AlertFilters): Promise<Alert[]> => {
    const { data } = await apiClient.get('/alerts', { params: filters });
    return data;
  },

  getAlertById: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get(`/alerts/${id}`);
    return data;
  },

  markReviewed: async (id: string): Promise<void> => {
    await apiClient.patch(`/alerts/${id}/reviewed`);
  },

  deleteAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/alerts/${id}`);
  },
};

// src/api/endpoints/devices.ts

export const devicesApi = {
  getDevices: async (): Promise<Device[]> => {
    const { data } = await apiClient.get('/devices');
    return data;
  },

  getDeviceById: async (id: string): Promise<Device> => {
    const { data } = await apiClient.get(`/devices/${id}`);
    return data;
  },

  addDevice: async (device: CreateDeviceDTO): Promise<Device> => {
    const { data } = await apiClient.post('/devices', device);
    return data;
  },

  updateDevice: async (
    id: string,
    updates: Partial<Device>
  ): Promise<Device> => {
    const { data } = await apiClient.patch(`/devices/${id}`, updates);
    return data;
  },

  deleteDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/devices/${id}`);
  },
};
```

---

## WebSocket Client

```typescript
// src/api/websocket.ts

import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@constants/config';
import { Alert } from '@types';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('alert', (alert: Alert) => {
      this.emit('alert', alert);
    });

    this.socket.on('device-status', status => {
      this.emit('device-status', status);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const websocketService = new WebSocketService();
```

---

## Firebase Cloud Messaging

```typescript
// src/services/notificationService.ts

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export class NotificationService {
  static async requestPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    return true; // Android doesn't require permission request
  }

  static async getFCMToken() {
    const token = await messaging().getToken();
    return token;
  }

  static async registerDevice(fcmToken: string) {
    // Send FCM token to backend to associate with user
    await apiClient.post('/devices/fcm-token', { token: fcmToken });
  }

  static onMessage(callback: (message: any) => void) {
    return messaging().onMessage(callback);
  }

  static onBackgroundMessage(callback: (message: any) => void) {
    messaging().setBackgroundMessageHandler(callback);
  }
}
```

---

## TODO Checklist

### HTTP API

- [x] **1.1** Create axios client with interceptors
- [x] **1.2** Implement token refresh logic
- [x] **1.3** Create alerts API endpoints
- [x] **1.4** Create devices API endpoints
- [x] **1.5** Create whitelist API endpoints
- [x] **1.6** Create user/profile API endpoints
- [x] **1.7** Add error handling
- [x] **1.8** Add request/response logging (dev mode)

### WebSocket

- [x] **2.1** Create WebSocket service class
- [x] **2.2** Implement connection management
- [x] **2.3** Implement auto-reconnection
- [x] **2.4** Add event listeners for alerts
- [x] **2.5** Add event listeners for device status
- [x] **2.6** Integrate with React Query for cache updates

### Firebase Cloud Messaging

- [x] **3.1** Configure Firebase in app.json
- [ ] **3.2** Add google-services.json (Android) - _Requires Firebase Console setup_
- [ ] **3.3** Add GoogleService-Info.plist (iOS) - _Requires Firebase Console setup_
- [x] **3.4** Request notification permissions
- [x] **3.5** Get FCM token on login
- [x] **3.6** Register token with backend
- [x] **3.7** Handle foreground notifications
- [x] **3.8** Handle background notifications
- [x] **3.9** Handle notification taps (deep linking)

### Integration Testing

- [ ] **4.1** Test API authentication flow
- [ ] **4.2** Test WebSocket connection
- [ ] **4.3** Test notification delivery
- [ ] **4.4** Test offline/online transitions
- [ ] **4.5** Mock API responses for tests

### Additional Implementations (Completed)

- [x] **5.1** Create React Query hooks for alerts (useAlerts)
- [x] **5.2** Create React Query hooks for devices (useDevices)
- [x] **5.3** Create React Query hooks for whitelist (useWhitelist)
- [x] **5.4** Create React Query hooks for user profile (useUser)
- [x] **5.5** Create WebSocket integration hook (useWebSocket)
- [x] **5.6** Create notification setup hook (useNotifications)
- [x] **5.7** Create deep linking service
- [x] **5.8** Create type definitions (Alert, Device, Whitelist)
- [x] **5.9** Create API error handling utilities
- [x] **5.10** Create implementation summary documentation

---

**Next Document**: [07-CORE-FEATURES.md](./07-CORE-FEATURES.md)
