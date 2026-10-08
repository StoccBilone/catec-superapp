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
  onAccent: string;
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
  mode: 'light', canvas: '#F2F2F2', canvasElevated: '#F8F8F8',
  cardBg: '#F8F8F8', cardElevated: '#F8F8F8', cardBorder: '#DDDEDD', cardBorderHighlight: '#C7C9C8',
  textPrimary: '#161817', textSecondary: '#555957', textMuted: '#707572', textHighlight: '#161817',
  accent: '#161817', onAccent: '#F8F8F8', accentLight: '#F2F2F2',
  navBarBg: 'rgba(248,248,248,0.92)', navBarBorder: '#DDDEDD', navPillBg: '#F2F2F2', navPillBorder: '#C7C9C8',
  inputBg: '#F8F8F8', inputBorder: '#DDDEDD', tagBg: '#F2F2F2', divider: '#DDDEDD',
  danger: '#D93345', success: '#555957', warning: '#555957', shadowColor: '#000000',
};
const darkColors: ThemeColors = {
  ...lightColors, mode: 'dark', canvas: '#0A0A0A', canvasElevated: '#161817',
  cardBg: '#161817', cardElevated: '#161817', cardBorder: '#303330', cardBorderHighlight: '#444844',
  textPrimary: '#F2F2F2', textSecondary: '#B6BBB7', textMuted: '#959C96', textHighlight: '#F2F2F2',
  accent: '#F2F2F2', onAccent: '#0A0A0A', accentLight: '#161817',
  navBarBg: 'rgba(22,24,23,0.92)', navBarBorder: '#303330', navPillBg: '#161817', navPillBorder: '#444844',
  inputBg: '#161817', inputBorder: '#303330', tagBg: '#161817', divider: '#303330',
  success: '#B6BBB7', warning: '#B6BBB7',
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
