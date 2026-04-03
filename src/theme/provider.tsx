import React, { createContext, useContext } from 'react';
import { Theme, ColorScheme } from './types';
import { darkTheme } from './dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = darkTheme;

  const setColorScheme = (_scheme: string) => {
    // No-op: app is dark-only.
  };

  return (
    <ThemeContext.Provider
      value={{ theme, colorScheme: 'dark', setColorScheme }}
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
export { darkTheme };
export { darkTheme as lightTheme } from './dark';
