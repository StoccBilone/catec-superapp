import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text } from './Typography';
import { useTheme } from '../theme/themeContext';
const min = 0.9, max = 1.25;
export function ScaleSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(1);
  const current = useRef({ value, onChange, width });
  useEffect(() => { current.current = { value, onChange, width }; }, [value, onChange, width]);
  const origin = useRef(0);
  const set = (next: number) => current.current.onChange(Math.round(Math.min(max, Math.max(min, next)) * 100) / 100);
  // PanResponder stores these callbacks; it never reads their refs during construction.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => { origin.current = event.nativeEvent.locationX; set(min + origin.current / current.current.width * (max - min)); },
    onPanResponderMove: (_event, gesture) => set(min + (origin.current + gesture.dx) / current.current.width * (max - min)),
  }));
  const fraction = (value - min) / (max - min);
  return <View style={s.row}>
    <Pressable accessibilityLabel="Уменьшить размер" onPress={() => set(value - 0.05)} style={s.button}><Minus size={19} color={colors.textPrimary} /></Pressable>
    <View {...responder.panHandlers} onLayout={event => setWidth(event.nativeEvent.layout.width)} accessible accessibilityRole="adjustable" accessibilityLabel="Размер текста" accessibilityValue={{ min: 90, max: 125, now: Math.round(value * 100), text: `${Math.round(value * 100)}%` }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => set(value + (event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))} style={s.slider}>
      <View pointerEvents="none" style={[s.track, { backgroundColor: colors.cardBorder }]}><View style={{ backgroundColor: colors.accent, width: `${fraction * 100}%`, height: 4 }} /></View>
      <View pointerEvents="none" style={[s.thumb, { left: `${fraction * 100}%`, backgroundColor: colors.accent, borderColor: colors.canvasElevated }]} />
    </View>
    <Pressable accessibilityLabel="Увеличить размер" onPress={() => set(value + 0.05)} style={s.button}><Plus size={19} color={colors.textPrimary} /></Pressable>
    <Text style={{ width: 48, textAlign: 'right', color: colors.textSecondary, fontSize: 12 }}>{Math.round(value * 100)}%</Text>
  </View>;
}
const s = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 }, button: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' }, slider: { flex: 1, height: 44, justifyContent: 'center', marginHorizontal: 12 }, track: { height: 4, borderRadius: 2, overflow: 'hidden' }, thumb: { position: 'absolute', top: 9, width: 26, height: 26, marginLeft: -13, borderRadius: 13, borderWidth: 3 } });
