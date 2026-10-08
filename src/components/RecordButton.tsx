import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Mic, Video } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';
import { usePreferences } from '../context/PreferencesContext';
import { Pressable } from './Typography';

export function RecordButton({ mode, disabled, onToggle, onStart, onMove, onRelease, onCancel }: { mode: 'voice' | 'videoNote'; disabled: boolean; onToggle: () => void; onStart: () => void; onMove: (distance: number) => void; onRelease: () => void; onCancel: () => void }) {
  const { colors } = useTheme();
  const { interfaceScale } = usePreferences();
  const callbacks = useRef({ disabled, onToggle, onStart, onMove, onRelease, onCancel });
  useEffect(() => { callbacks.current = { disabled, onToggle, onStart, onMove, onRelease, onCancel }; }, [disabled, onToggle, onStart, onMove, onRelease, onCancel]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const long = useRef(false);
  const canceled = useRef(false);
  const dy = useRef(0);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  // PanResponder stores these callbacks; it never reads their refs during construction.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !callbacks.current.disabled,
    onMoveShouldSetPanResponder: () => !callbacks.current.disabled,
    onPanResponderGrant: () => {
      long.current = false; canceled.current = false; dy.current = 0;
      clear();
      timer.current = setTimeout(() => { long.current = true; callbacks.current.onStart(); callbacks.current.onMove(dy.current); }, 280);
    },
    onPanResponderMove: (_event, gesture) => {
      dy.current = gesture.dy;
      if (long.current && !canceled.current) {
        if (gesture.dx < -100) { canceled.current = true; callbacks.current.onCancel(); }
        else callbacks.current.onMove(gesture.dy);
      }
    },
    onPanResponderRelease: () => { clear(); if (canceled.current) return; if (long.current) callbacks.current.onRelease(); else if (!callbacks.current.disabled) callbacks.current.onToggle(); },
    onPanResponderTerminationRequest: () => !long.current,
    onPanResponderTerminate: () => { clear(); if (long.current) callbacks.current.onCancel(); },
  }));
  useEffect(() => () => clear(), []);
  return <View {...responder.panHandlers} style={[s.button, { backgroundColor: colors.accentLight }]}>
    <Pressable accessible accessibilityRole="button" accessibilityLabel={mode === 'voice' ? 'Голосовое сообщение: удерживайте для записи, нажмите для видео' : 'Видеосообщение: удерживайте для записи, нажмите для голосового'} accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]} onAccessibilityAction={event => { if (disabled) return; if (event.nativeEvent.actionName === 'longpress') { onStart(); onMove(-80); } else onToggle(); }} pointerEvents="none" style={s.button}>{mode === 'voice' ? <Mic color={colors.accent} size={22 * interfaceScale} /> : <Video color={colors.accent} size={22 * interfaceScale} />}</Pressable>
  </View>;
}
const s = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } });
