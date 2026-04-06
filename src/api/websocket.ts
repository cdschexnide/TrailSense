import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@constants/config';
import { Alert } from '@/types/alert';
import { Device } from '@/types/device';
import { mockConfig } from '@/config/mockConfig';
import { mockWebSocketService } from '@/mocks/mockWebSocket';

// id is always present — backend sends { id: deviceId, ...status }
type DeviceStatusEvent = Partial<Device> & {
  id: string;
  detectionCount?: number;
  friendly_name?: string;
  whitelisted?: boolean;
  metadata?: {
    device_name?: string;
  };
};

/**
 * Normalizes backend device-status events to frontend shape.
 * Maps `detectionCount` (backend) to `alertCount` (frontend).
 * Always strips `detectionCount` so consumers never see it.
 */
export function mapDeviceStatusEvent(
  raw: DeviceStatusEvent
): DeviceStatusEvent {
  const { detectionCount, ...rest } = raw;
  if (detectionCount != null && rest.alertCount === undefined) {
    return { ...rest, alertCount: detectionCount };
  }
  return rest;
}

type PositionUpdate = {
  id?: string;
  fingerprintHash?: string;
  signalType?: string;
  latitude: number;
  longitude: number;
  updatedAt?: string;
  accuracyMeters?: number;
  confidence?: number;
  measurementCount?: number;
  presenceCertainty?: number | null;
  proximity?: number | null;
  threatLevel?: string | null;
};

type PositionsUpdatedEvent = {
  deviceId: string;
  positions: PositionUpdate[];
};

type WebSocketEventMap = {
  alert: Alert;
  'device-status': DeviceStatusEvent;
  'positions-updated': PositionsUpdatedEvent;
  connect: Record<string, never>;
  disconnect: Record<string, never>;
};

type WebSocketEventName = keyof WebSocketEventMap;
type Listener<TEvent extends WebSocketEventName> = (
  payload: WebSocketEventMap[TEvent]
) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<
    WebSocketEventName,
    Set<Listener<WebSocketEventName>>
  > = new Map();
  private mockForwardersRegistered = false;
  private mockAlertHandler: ((alert: Alert) => void) | null = null;
  private mockDeviceStatusHandler:
    | ((status: DeviceStatusEvent) => void)
    | null = null;
  private mockPositionsHandler: ((data: PositionsUpdatedEvent) => void) | null =
    null;
  private mockConnectHandler: (() => void) | null = null;
  private mockDisconnectHandler: (() => void) | null = null;

  connect(token: string) {
    // Use mock WebSocket if enabled
    if (mockConfig.mockWebSocket) {
      mockWebSocketService.connect(token);

      if (!this.mockForwardersRegistered) {
        this.mockForwardersRegistered = true;

        this.mockAlertHandler = (alert: Alert) => {
          this.emit('alert', alert);
        };
        this.mockDeviceStatusHandler = status => {
          this.emit('device-status', mapDeviceStatusEvent(status));
        };
        this.mockPositionsHandler = data => {
          this.emit('positions-updated', data);
        };
        this.mockConnectHandler = () => {
          this.emit('connect', {});
        };
        this.mockDisconnectHandler = () => {
          this.emit('disconnect', {});
        };

        mockWebSocketService.on('alert', this.mockAlertHandler);
        mockWebSocketService.on('device-status', this.mockDeviceStatusHandler);
        mockWebSocketService.on('positions-updated', this.mockPositionsHandler);
        mockWebSocketService.on('connect', this.mockConnectHandler);
        mockWebSocketService.on('disconnect', this.mockDisconnectHandler);
      }

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
      this.emit('connect', {});
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnect', {});
    });

    this.socket.on('alert', (alert: Alert) => {
      this.emit('alert', alert);
    });

    this.socket.on('device-status', (status: DeviceStatusEvent) => {
      this.emit('device-status', mapDeviceStatusEvent(status));
    });

    this.socket.on('positions-updated', (data: PositionsUpdatedEvent) => {
      this.emit('positions-updated', data);
    });
  }

  disconnect() {
    // Disconnect mock WebSocket if enabled
    if (mockConfig.mockWebSocket) {
      mockWebSocketService.disconnect();

      if (this.mockForwardersRegistered) {
        if (this.mockAlertHandler) {
          mockWebSocketService.off('alert', this.mockAlertHandler);
        }
        if (this.mockDeviceStatusHandler) {
          mockWebSocketService.off(
            'device-status',
            this.mockDeviceStatusHandler
          );
        }
        if (this.mockPositionsHandler) {
          mockWebSocketService.off(
            'positions-updated',
            this.mockPositionsHandler
          );
        }
        if (this.mockConnectHandler) {
          mockWebSocketService.off('connect', this.mockConnectHandler);
        }
        if (this.mockDisconnectHandler) {
          mockWebSocketService.off('disconnect', this.mockDisconnectHandler);
        }

        this.mockAlertHandler = null;
        this.mockDeviceStatusHandler = null;
        this.mockPositionsHandler = null;
        this.mockConnectHandler = null;
        this.mockDisconnectHandler = null;
        this.mockForwardersRegistered = false;
      }

      return;
    }

    // Disconnect real WebSocket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<TEvent extends WebSocketEventName>(
    event: TEvent,
    callback: Listener<TEvent>
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Listener<WebSocketEventName>);
  }

  off<TEvent extends WebSocketEventName>(
    event: TEvent,
    callback: Listener<TEvent>
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as Listener<WebSocketEventName>);
    }
  }

  private emit<TEvent extends WebSocketEventName>(
    event: TEvent,
    data: WebSocketEventMap[TEvent]
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback =>
        callback(data as WebSocketEventMap[WebSocketEventName])
      );
    }
  }
}

export const websocketService = new WebSocketService();
