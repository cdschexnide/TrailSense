import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = 'trailsense_demo_mode';

let demoModeEnabled = false;

export async function initDemoMode(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(DEMO_MODE_KEY);
    demoModeEnabled = stored === 'true';
  } catch (error) {
    console.error('Failed to initialize demo mode:', error);
    demoModeEnabled = false;
  }

  return demoModeEnabled;
}

export function isDemoMode(): boolean {
  return demoModeEnabled;
}

export async function setDemoMode(enabled: boolean): Promise<void> {
  demoModeEnabled = enabled;
  await AsyncStorage.setItem(DEMO_MODE_KEY, String(enabled));
}
