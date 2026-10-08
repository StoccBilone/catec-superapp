import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  canvas: string;
  canvasElevated: string;
  cardBg: string;
  cardElevated: string;
  cardBorder: string;
  cardBorderHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textHighlight: string;
  accent: string;
  accentLight: string;
  navBarBg: string;
  navBarBorder: string;
  navPillBg: string;
  navPillBorder: string;
  inputBg: string;
  inputBorder: string;
  tagBg: string;
  divider: string;
  // Specific
  danger: string;
  success: string;
  warning: string;
  // Shadows
  shadowColor: string;
}

const lightColors: ThemeColors = {
  mode: 'light',
  canvas: '#ffffff',
  canvasElevated: '#ffffff',
  cardBg: 'rgba(255, 255, 255, 0.94)',
  cardElevated: '#ffffff',
  cardBorder: '#e7edf3',
  cardBorderHighlight: '#b4d7f3',
  textPrimary: '#172536',
  textSecondary: '#586b7e',
  textMuted: '#718195',
  textHighlight: '#126cb5',
  accent: '#197fc4',
  accentLight: '#eaf5fc',
  navBarBg: 'rgba(255, 255, 255, 0.92)',
  navBarBorder: '#e7edf3',
  navPillBg: '#eaf5fc',
  navPillBorder: '#b4d7f3',
  inputBg: '#ffffff',
  inputBorder: '#e7edf3',
  tagBg: '#eaf5fc',
  divider: '#edf1f5',
  danger: '#e11d48',
  success: '#059669',
  warning: '#d97706',
  shadowColor: '#23384d',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = '@campus_theme_mode_v3';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    void AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  const setTheme = (_requestedMode: ThemeMode) => {
    setModeState('light');
    void AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
  };

  const toggleTheme = () => setTheme('light');

  const colors = lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
