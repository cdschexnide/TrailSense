import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ColorScheme } from './types';
import { lightTheme } from './light';
import { darkTheme } from './dark';

const THEME_STORAGE_KEY = '@trailsense:theme';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<ColorScheme | 'auto'>(
    'auto'
  );

  const activeColorScheme: ColorScheme =
    userPreference === 'auto'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : userPreference;

  const theme: Theme = activeColorScheme === 'dark' ? darkTheme : lightTheme;

  const loadThemePreference = React.useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setUserPreference(saved as ColorScheme | 'auto');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  }, []);

  useEffect(() => {
    // Load saved theme preference on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThemePreference();
  }, [loadThemePreference]);

  const setColorScheme = async (scheme: ColorScheme | 'auto') => {
    setUserPreference(scheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, colorScheme: activeColorScheme, setColorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export * from './types';
export { lightTheme, darkTheme };
