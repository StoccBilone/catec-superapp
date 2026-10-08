import React from 'react';
import { View } from 'react-native';
import { Pressable } from './Typography';
import { useTheme } from '../theme/themeContext';

export function compactWaveform(samples: number[], count = 64): number[] {
  if (!samples.length) return [];
  const size = Math.min(count, samples.length);
  return Array.from({ length: size }, (_, i) => {
    let peak = 0;
    for (let j = Math.floor(i * samples.length / size); j < Math.floor((i + 1) * samples.length / size); j++) {
      if (Number.isFinite(samples[j])) peak = Math.max(peak, Math.min(1, Math.max(0, samples[j])));
    }
    return peak;
  });
}
export function VoiceWaveform({ samples, progress = 0, onSeek }: { samples: number[]; progress?: number; onSeek?: (fraction: number) => void }) {
  const { colors } = useTheme();
  const [width, setWidth] = React.useState(1);
  const bars = compactWaveform(samples, 40);
  return <Pressable accessibilityRole={onSeek ? 'adjustable' : undefined} accessibilityLabel="Звуковая волна" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} accessibilityActions={onSeek ? [{ name: 'increment' }, { name: 'decrement' }] : undefined} onAccessibilityAction={event => onSeek?.(Math.max(0, Math.min(1, progress + (event.nativeEvent.actionName === 'increment' ? .05 : -.05))))} onLayout={event => setWidth(event.nativeEvent.layout.width)} onPress={onSeek ? event => { event.stopPropagation(); onSeek(Math.max(0, Math.min(1, event.nativeEvent.locationX / width))); } : undefined} style={{ flex: 1, height: 44, flexDirection: 'row', gap: 2, alignItems: 'center' }}>
    {bars.length ? bars.map((value, index) => <View key={index} style={{ flex: 1, height: Math.max(3, value * 30), borderRadius: 2, backgroundColor: index / bars.length < progress ? colors.textPrimary : colors.textMuted }} />) : <View style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: colors.cardBorder, overflow: 'hidden' }}><View style={{ height: 3, width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: colors.textPrimary }} /></View>}
  </Pressable>;
}
