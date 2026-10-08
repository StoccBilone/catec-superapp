import React, { useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Pressable } from "./Typography";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';
import { usePreferences } from '../context/PreferencesContext';

interface GlassModalProps { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; }
export function GlassModal({ visible, onClose, children }: GlassModalProps) {
  const { colors, mode } = useTheme();
  const { motionReduced } = usePreferences();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0, duration: motionReduced ? 0 : visible ? 280 : 200,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished && !visible) setMounted(false); });
    return () => animation.stop();
  }, [visible, motionReduced, progress]);
  return <Modal visible={visible || mounted} onShow={() => setMounted(true)} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress, backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.58)' : 'rgba(12,23,36,0.32)' }]}>
        <Pressable accessibilityLabel="Закрыть окно" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.position, { paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 54 : 0) + 12 }]}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.canvasElevated, paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] }]}>
          <View style={styles.grabber}><View style={[styles.handle, { backgroundColor: colors.textMuted }]} /></View>
          <Pressable accessibilityLabel="Закрыть окно" onPress={onClose} style={[styles.close, { backgroundColor: colors.inputBg }]}><X size={18} color={colors.textSecondary} /></Pressable>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, position: { flex: 1, justifyContent: 'flex-end' }, sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', overflow: 'hidden' }, grabber: { alignItems: 'center', paddingVertical: 14 }, handle: { width: 38, height: 5, borderRadius: 3, opacity: 0.35 }, close: { position: 'absolute', top: 14, right: 18, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 24 } });
