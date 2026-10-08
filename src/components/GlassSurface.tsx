import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/themeContext';

// Keep opacity on content only: opacity on a native glass surface disables the effect.
export function GlassSurface({ children, style, interactive = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; interactive?: boolean }) {
  const { colors, mode } = useTheme();
  if (Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable()) {
    return <GlassView glassEffectStyle="regular" isInteractive={interactive} style={[s.surface, style]}>{children}</GlassView>;
  }
  const web = Platform.OS === 'web' ? { backdropFilter: 'blur(18px) saturate(150%)', backgroundColor: mode === 'dark' ? 'rgba(35,37,36,0.62)' : 'rgba(255,255,255,0.68)' } as ViewStyle : {};
  return <View style={[s.surface, { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder }, web, style]}>
    {Platform.OS === 'ios' ? <BlurView pointerEvents="none" intensity={40} tint={mode} style={StyleSheet.absoluteFill} /> : Platform.OS !== 'web' ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardBg }]} /> : null}
    {children}
  </View>;
}
const s = StyleSheet.create({ surface: { borderRadius: 22, overflow: 'hidden' } });
