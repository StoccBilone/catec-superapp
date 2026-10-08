import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from './Typography';
import { GlassSurface } from './GlassSurface';
export function GlassTool({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <GlassSurface interactive={!disabled} style={s.shell}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}><View style={{ opacity: disabled ? 0.4 : 1 }}>{children}</View></Pressable></GlassSurface>;
}
const s = StyleSheet.create({ shell: { width: 44, height: 44 }, button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
