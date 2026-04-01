export const AnalyticsEvents = {
  HOME_SCREEN_LOADED: 'home_screen_loaded',
  HOME_STATUS_TAPPED: 'home_status_tapped',
  HOME_MAP_EXPANDED: 'home_map_expanded',
  HOME_VISITOR_TAPPED: 'home_visitor_tapped',
  REPLAY_RADAR_OPENED: 'replay_radar_opened',
  REPLAY_RADAR_SCRUBBED: 'replay_radar_scrubbed',
  REPLAY_AUTOPLAY_STARTED: 'replay_autoplay_started',
  REPLAY_SPEED_CHANGED: 'replay_speed_changed',
  FINGERPRINT_VIEWED: 'fingerprint_viewed',
  DEVICE_ADDED_TO_KNOWN: 'device_added_to_known',
  DEVICE_BLOCKED: 'device_blocked',
  DEMO_MODE_TOGGLED: 'demo_mode_toggled',
  OFFLINE_BANNER_SHOWN: 'offline_banner_shown',
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export function logEvent(
  event: AnalyticsEvent,
  params?: Record<string, unknown>
): void {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, params ?? '');
  }
}
