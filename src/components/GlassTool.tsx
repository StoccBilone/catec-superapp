import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { Pressable } from './Typography';
import { useTheme } from '../theme/themeContext';
export function GlassTool({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  const { colors, mode } = useTheme();
  const nativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const button = <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}><View style={{ opacity: disabled ? 0.4 : 1 }}>{children}</View></Pressable>;
  if (nativeGlass) return <GlassView glassEffectStyle="regular" isInteractive={!disabled} style={s.shell}>{button}</GlassView>;
  const webGlass = Platform.OS === 'web' ? { backdropFilter: 'blur(18px)', backgroundColor: mode === 'dark' ? 'rgba(35,37,36,0.62)' : 'rgba(255,255,255,0.68)' } as ViewStyle : {};
  return <View style={[s.shell, { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder }, webGlass]}>
    {Platform.OS === 'ios' ? <BlurView pointerEvents="none" intensity={40} tint={mode} style={StyleSheet.absoluteFill} /> : Platform.OS !== 'web' ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardBg }]} /> : null}
    {button}
  </View>;
}
const s = StyleSheet.create({ shell: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }, button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
