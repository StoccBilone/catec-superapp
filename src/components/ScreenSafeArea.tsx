import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// iOS uses the device's actual insets. The web preview has a simulated status bar.
export function ScreenSafeArea(props: React.ComponentProps<typeof SafeAreaView>) {
  return <SafeAreaView {...props} style={[{ paddingTop: Platform.OS === 'web' ? 54 : 0 }, props.style]} />;
}
