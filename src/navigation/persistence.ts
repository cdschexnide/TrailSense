import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState } from '@react-navigation/native';

export const NAVIGATION_STATE_KEY = '@trailsense:navigation_state';

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
