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

  return state;
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
