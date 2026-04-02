import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { store } from '@store/index';
import { logout } from '@store/slices/authSlice';

class InactivityService {
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;
  private lastActivityTime: number = Date.now();
  private readonly INACTIVITY_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  start() {
    this.resetInactivityTimer();
    this.setupAppStateListener();
  }

  stop() {
    this.clearInactivityTimer();
    this.removeAppStateListener();
  }

  resetInactivityTimer() {
    this.lastActivityTime = Date.now();
    this.clearInactivityTimer();

    this.inactivityTimeout = setTimeout(() => {
      this.handleInactivityLogout();
    }, this.INACTIVITY_DURATION);
  }

  private clearInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }

  private removeAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Check if user has been inactive for too long
      const inactiveDuration = Date.now() - this.lastActivityTime;

      if (inactiveDuration >= this.INACTIVITY_DURATION) {
        this.handleInactivityLogout();
      } else {
        this.resetInactivityTimer();
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - clear timer
      this.clearInactivityTimer();
    }
  };

  private async handleInactivityLogout() {
    this.clearInactivityTimer();
    await store.dispatch(logout());
  }
}

export const inactivityService = new InactivityService();
