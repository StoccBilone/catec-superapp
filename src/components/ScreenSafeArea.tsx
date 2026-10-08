import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// iOS uses the device's actual insets. The web preview has a simulated status bar.
export function ScreenSafeArea({ modal, ...props }: React.ComponentProps<typeof SafeAreaView> & { modal?: boolean }) {
  const insets = useSafeAreaInsets();
  return <SafeAreaView {...props} edges={modal ? props.edges || ['left', 'right', 'bottom'] : props.edges} style={[{ paddingTop: Platform.OS === 'web' ? 54 : modal ? insets.top : 0 }, props.style]} />;
}
