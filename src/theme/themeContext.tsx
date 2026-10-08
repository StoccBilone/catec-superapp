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
  canvas: '#f4f6f1',
  canvasElevated: '#ffffff',
  cardBg: 'rgba(255, 255, 255, 0.94)',
  cardElevated: '#ffffff',
  cardBorder: 'rgba(31, 58, 43, 0.10)',
  cardBorderHighlight: 'rgba(37, 112, 72, 0.35)',
  textPrimary: '#17231b',
  textSecondary: '#536259',
  textMuted: '#86928a',
  textHighlight: '#1f6b43',
  accent: '#24764a',
  accentLight: 'rgba(36, 118, 74, 0.12)',
  navBarBg: 'rgba(255, 255, 255, 0.92)',
  navBarBorder: 'rgba(31, 58, 43, 0.12)',
  navPillBg: 'rgba(36, 118, 74, 0.13)',
  navPillBorder: 'rgba(36, 118, 74, 0.32)',
  inputBg: '#ffffff',
  inputBorder: 'rgba(31, 58, 43, 0.12)',
  tagBg: 'rgba(36, 118, 74, 0.09)',
  divider: 'rgba(31, 58, 43, 0.08)',
  danger: '#e11d48',
  success: '#059669',
  warning: '#d97706',
  shadowColor: '#263a2d',
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
