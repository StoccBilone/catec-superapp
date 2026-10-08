import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { Pressable } from './Typography';
import { useTheme } from '../theme/themeContext';
export function GlassTool({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  const { colors, mode } = useTheme();
  const nativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return <View style={s.shell}>
    {nativeGlass ? <GlassView glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} /> : Platform.OS === 'ios' ? <BlurView intensity={40} tint={mode} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: 22 }]} />}
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={s.button}>{children}</Pressable>
  </View>;
}
const s = StyleSheet.create({ shell: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }, button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
