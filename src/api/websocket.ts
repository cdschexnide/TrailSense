import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@constants/config';
import { Alert } from '@/types/alert';
import { mockConfig } from '@/config/mockConfig';
import { mockWebSocketService } from '@/mocks/mockWebSocket';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    // Use mock WebSocket if enabled
    if (mockConfig.mockWebSocket) {
      console.log('[WebSocket] Using mock WebSocket service');
      mockWebSocketService.connect(token);

      // Forward events from mock service to our listeners
      mockWebSocketService.on('alert', (alert: Alert) => {
        this.emit('alert', alert);
      });

      mockWebSocketService.on('device-status', status => {
        this.emit('device-status', status);
      });

      mockWebSocketService.on('positions-updated', (data: { deviceId: string; positions: any[] }) => {
        this.emit('positions-updated', data);
      });

      mockWebSocketService.on('connect', () => {
        this.emit('connect', {});
      });

      mockWebSocketService.on('disconnect', () => {
        this.emit('disconnect', {});
      });

      return;
    }

    // Real WebSocket connection
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

    // Handle positions-updated event
    this.socket.on('positions-updated', (data: { deviceId: string; positions: any[] }) => {
      console.log('[WebSocket] Positions updated:', data.deviceId, data.positions.length);
      this.emit('positions-updated', data);
    });
  }

  disconnect() {
    // Disconnect mock WebSocket if enabled
    if (mockConfig.mockWebSocket) {
      mockWebSocketService.disconnect();
      return;
    }

    // Disconnect real WebSocket
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
