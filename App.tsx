import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/themeContext';
import { CampusProvider } from './src/context/CampusContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider><ThemeProvider><CampusProvider>{children}</CampusProvider></ThemeProvider></SafeAreaProvider>;
}
