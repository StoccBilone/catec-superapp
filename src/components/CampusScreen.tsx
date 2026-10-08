import React from 'react';
import { ScreenSafeArea as SafeAreaView } from './ScreenSafeArea';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-screens/experimental';
import { useTheme } from '../theme/themeContext';

export function CampusScreen({ children, bottomInset = true }: { children: React.ReactNode; bottomInset?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, overflow: 'hidden', backgroundColor: colors.canvas }}>
      {bottomInset ? <NativeSafeAreaView edges={{ bottom: true }} style={{ flex: 1 }}>{children}</NativeSafeAreaView> : children}
    </SafeAreaView>
  );
}
