import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, useColorScheme } from 'react-native';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

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

const darkColors: ThemeColors = {
  ...lightColors, mode: 'dark', canvas: '#0e131b', canvasElevated: '#171e28',
  cardBg: '#171e28', cardElevated: '#202b38', cardBorder: '#2b3948', cardBorderHighlight: '#365b77',
  textPrimary: '#f1f6fb', textSecondary: '#b5c5d5', textMuted: '#92a6bb', textHighlight: '#75c7ff',
  accent: '#65b9f0', accentLight: '#18334a', navBarBg: 'rgba(23,30,40,0.92)', navBarBorder: '#2b3948',
  navPillBg: '#18334a', navPillBorder: '#365b77', inputBg: '#202b38', inputBorder: '#344455',
  tagBg: '#18334a', divider: '#2b3948', shadowColor: '#000000',
};

interface ThemeContextType {
  mode: ThemeMode;
  preference: ThemePreference;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  preference: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = '@campus_theme_mode_v3';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<ThemePreference>('light');
  const systemMode = useColorScheme();
  const mode: ThemeMode = preference === 'system' ? systemMode === 'dark' ? 'dark' : 'light' : preference;
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then(value => {
      if (value === 'light' || value === 'dark' || value === 'system') setPreference(value);
    });
  }, []);

  const setTheme = (requestedMode: ThemePreference) => {
    setPreference(requestedMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, requestedMode);
  };

  const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light');

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, preference, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
