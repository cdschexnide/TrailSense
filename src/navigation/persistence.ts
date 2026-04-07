import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState } from '@react-navigation/native';

export const NAVIGATION_STATE_KEY = '@trailsense:navigation_state';

export type PersistedNavigationState = Pick<
  NavigationState,
  'index' | 'routes'
>;

function getActiveRootRouteName(
  state: PersistedNavigationState | undefined
): string | undefined {
  if (!state || !state.routes.length) {
    return undefined;
  }

  const routeIndex =
    typeof state.index === 'number' && state.index >= 0
      ? state.index
      : state.routes.length - 1;

  return state.routes[routeIndex]?.name;
}

/**
 * Strip nested stack states from tab routes so the app only restores
 * which tab was active, not deep screen states like DeviceDetail.
 * This prevents stale deep links from trapping users on detail screens
 * after app restart.
 */
function stripNestedStackStates(
  state: PersistedNavigationState
): PersistedNavigationState {
  return {
    ...state,
    routes: state.routes.map(route => {
      if (!route.state) return route;

      // For the Main tab navigator, preserve which tab is selected
      // but reset each tab's internal stack to its root screen
      const nested = route.state as PersistedNavigationState;
      return {
        ...route,
        state: {
          ...nested,
          routes: nested.routes.map(tabRoute => {
            // Strip both the tab's internal stack state AND params so it
            // starts fresh. Cross-tab navigations (e.g. navigate('DevicesTab',
            // { screen: 'DeviceDetail' })) store the target screen in params,
            // which would otherwise survive and re-navigate on restore.
            const {
              state: _tabStack,
              params: _tabParams,
              ...tabRouteWithoutStackOrParams
            } = tabRoute;
            return tabRouteWithoutStackOrParams;
          }),
        },
      };
    }),
  };
}

export function sanitizeNavigationState(
  state: PersistedNavigationState | undefined,
  isAuthenticated: boolean
): PersistedNavigationState | undefined {
  if (!state) {
    return undefined;
  }

  const expectedRootRoute = isAuthenticated ? 'Main' : 'Auth';
  const actualRootRoute = getActiveRootRouteName(state);

  if (actualRootRoute !== expectedRootRoute) {
    console.warn('[Navigation] Discarding persisted navigation state', {
      expectedRootRoute,
      actualRootRoute,
    });
    return undefined;
  }

  return stripNestedStackStates(state);
}

export async function restoreNavigationState(): Promise<
  NavigationState | undefined
> {
  const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
  if (!savedStateString) {
    return undefined;
  }

  return JSON.parse(savedStateString) as NavigationState;
}

export async function persistNavigationState(
  state: NavigationState | undefined
): Promise<void> {
  await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
}

export async function clearNavigationState(): Promise<void> {
  await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
}
