import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-screens/experimental';
import { useTheme } from '../theme/themeContext';

export function CampusScreen({ children, bottomInset = false }: { children: React.ReactNode; bottomInset?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      {bottomInset ? <NativeSafeAreaView edges={{ bottom: true }} style={{ flex: 1 }}>{children}</NativeSafeAreaView> : children}
    </SafeAreaView>
  );
}
