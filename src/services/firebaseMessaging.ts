type AuthorizationStatusValue = 0 | 1 | 2 | 3 | 4;

export interface MessagingAuthorizationStatus {
  AUTHORIZED: AuthorizationStatusValue;
  DENIED: AuthorizationStatusValue;
  NOT_DETERMINED: AuthorizationStatusValue;
  PROVISIONAL: AuthorizationStatusValue;
  EPHEMERAL: AuthorizationStatusValue;
}

export interface RemoteMessage {
  data?: Record<string, string>;
}

export interface MessagingModule {
  AuthorizationStatus: MessagingAuthorizationStatus;
  requestPermission(): Promise<AuthorizationStatusValue>;
  getToken(): Promise<string>;
  onMessage(callback: (message: RemoteMessage) => void): () => void;
  setBackgroundMessageHandler(
    callback: (message: RemoteMessage) => Promise<void>
  ): void;
  getInitialNotification(): Promise<RemoteMessage | null>;
  onNotificationOpenedApp(
    callback: (message: RemoteMessage) => void
  ): () => void;
}

export function getMessagingModule(): MessagingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messagingImport = require('@react-native-firebase/messaging') as {
      default?: () => MessagingModule;
    };
    return messagingImport.default ? messagingImport.default() : null;
  } catch {
    return null;
  }
}
