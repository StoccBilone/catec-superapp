import React, { useEffect } from 'react';
import { ActivityIndicator, Appearance, Platform, View } from 'react-native';
import { Stack, ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppProviders from '../../App';
import { useCampus } from '../context/CampusContext';
import { useTheme } from '../theme/themeContext';
import { NotificationModal } from '../components/NotificationModal';

function Navigation() {
  const { colors, mode } = useTheme();
  const { profile, isLoggedIn, isLoading, showNotifications, closeNotifications } = useCampus();
  const authenticated = isLoggedIn && !!profile;

  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(mode);
  }, [mode]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.accent} size="large" />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Protected guard={authenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="conversation" />
        </Stack.Protected>
        <Stack.Protected guard={!authenticated}>
          <Stack.Screen name="auth" />
        </Stack.Protected>
      </Stack>
      <NotificationModal visible={showNotifications} onClose={closeNotifications} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return <AppProviders><Navigation /></AppProviders>;
}
