import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, AppState, Platform, StyleSheet, View } from "react-native";
import { Alert, Pressable, Text } from "./Typography";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Send, Trash2, Lock, ArrowUp, Square } from 'lucide-react-native';
import { GlassModal } from './GlassModal';
import { MaterialView, durationLabel } from './MaterialView';
import { GlassSurface } from './GlassSurface';
import { GlassTool } from './GlassTool';
import { VoiceWaveform, compactWaveform } from './VoiceWaveform';
import * as Haptics from 'expo-haptics';
import { Material } from '../types';
import { persistMaterial } from '../services/materials';
import { usePreferences } from '../context/PreferencesContext';
import { useTheme } from '../theme/themeContext';

export interface RecorderHandle { start: (kind: 'voice' | 'videoNote') => void; release: () => void; move: (distance: number) => void; cancel: () => void; }
export const ChatRecorder = forwardRef<RecorderHandle, { onSend: (item: Material) => Promise<void>; onActiveChange: (active: boolean) => void }>(function ChatRecorder({ onSend, onActiveChange }, ref) {
  const { colors } = useTheme();
  const { motionReduced } = usePreferences();
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const [lift] = useState(() => new Animated.Value(0));
  const [appear] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));
  const audio = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const samples = useRef<number[]>([]);
  const [waveform, setWaveform] = useState<number[]>([]);
  const autoSend = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const camera = useRef<CameraView>(null);
  const [, requestCamera] = useCameraPermissions();
  const [, requestMic] = useMicrophonePermissions();
  const held = useRef(false);
  const busy = useRef(false);
  const started = useRef(0);
  const kindRef = useRef<'voice' | 'videoNote'>('voice');
  const [kind, setKind] = useState<'voice' | 'videoNote' | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState<Material | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const alive = useRef(true);
  const canceled = useRef(false);
  const stopping = useRef(false);

  const finish = async (uri: string | null) => {
    const duration = (Date.now() - started.current) / 1000;
    try {
      if (uri && !canceled.current && duration >= 0.5) {
        const item: Material = { id: `recording-${Date.now()}`, title: kindRef.current === 'voice' ? 'Голосовое сообщение' : 'Видеосообщение', type: kindRef.current, duration, uri: await persistMaterial(uri), mimeType: kindRef.current === 'voice' ? Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4' : 'video/mp4' };
        if (alive.current) {
          if (item.type === 'voice') item.waveform = compactWaveform(samples.current, 96);
          if (autoSend.current) {
            setSending(true);
            try { await onSend(item); if (alive.current) setDraft(null); }
            catch { if (alive.current) { setDraft(item); Alert.alert('Не удалось отправить', 'Запись сохранена. Попробуйте ещё раз.'); } }
            finally { if (alive.current) setSending(false); }
          } else setDraft(item);
        }
      }
    } catch { if (alive.current) Alert.alert('Не удалось сохранить запись', 'Попробуйте ещё раз.'); }
    finally { busy.current = false; stopping.current = false; if (alive.current) { setPreparing(false); setKind(null); setRecording(false); lockedRef.current = false; setLocked(false); } }
  };
  const stop = async (cancel = false) => {
    held.current = false;
    lockedRef.current = false; setLocked(false);
    if (cancel) canceled.current = true;
    if (!started.current || stopping.current) { if (alive.current) setPreparing(false); return; }
    stopping.current = true;
    setRecording(false);
    if (kindRef.current === 'videoNote') camera.current?.stopRecording();
    else {
      const timestamp = started.current;
      started.current = 0;
      try { await audio.stop(); started.current = timestamp; await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); if (alive.current) await finish(audio.uri); }
      catch { busy.current = false; if (alive.current) { setPreparing(false); setKind(null); setRecording(false); lockedRef.current = false; setLocked(false); } }
      finally { started.current = 0; stopping.current = false; await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {}); }
    }
  };
  useEffect(() => { onActiveChange(!!kind || preparing || sending || !!draft); }, [kind, preparing, sending, draft, onActiveChange]);
  useEffect(() => {
    if (!kind) { appear.setValue(0); return; }
    if (motionReduced) { appear.setValue(1); return; }
    Animated.spring(appear, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.8 }).start();
  }, [kind, appear, motionReduced]);
  useEffect(() => {
    if (!recording || motionReduced) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.04, duration: 650, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [recording, motionReduced, pulse]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - started.current) / 1000;
      if (!alive.current) return;
      setSeconds(elapsed);
      if (kindRef.current === 'voice') {
        const level = audio.getStatus().metering;
        if (typeof level === 'number' && Number.isFinite(level)) {
          samples.current.push(Math.max(0, Math.min(1, Math.pow(10, level / 40))));
          setWaveform(samples.current.slice(-40));
        }
      }
      if (elapsed >= (kindRef.current === 'videoNote' ? 60 : 300)) void stop();
    }, 100);
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') void stop(true); });
    return () => { clearInterval(timer); subscription.remove(); };
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false; held.current = false; canceled.current = true;
      // useAudioRecorder owns native cleanup and stops recording on release.
      // Its cleanup runs first: accessing audio here would use a released object.
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [audio]);
  useImperativeHandle(ref, () => ({
    start: async requested => {
      if (!alive.current || busy.current || draft || sending) return;
      busy.current = true; setPreparing(true); samples.current = []; setWaveform([]); autoSend.current = false; held.current = true; lockedRef.current = false; setLocked(false); lift.setValue(0); canceled.current = false; stopping.current = false; kindRef.current = requested; setSeconds(0); started.current = 0;
      try {
        if (requested === 'videoNote') {
          if (Platform.OS === 'web') { Alert.alert('Видеосообщение', 'Запись видеосообщений доступна в приложении на телефоне.'); busy.current = false; if (alive.current) setPreparing(false); return; }
          const permissions = await Promise.all([requestCamera(), requestMic()]);
          if (permissions.some(permission => !permission.granted)) throw new Error('Разрешите доступ к камере и микрофону в настройках.');
          if (!held.current || !alive.current || AppState.currentState !== 'active') { busy.current = false; if (alive.current) setPreparing(false); return; }
          setPreparing(false); setKind(requested);
        } else {
          const permission = await AudioModule.requestRecordingPermissionsAsync();
          if (!alive.current || !held.current) { busy.current = false; if (alive.current) setPreparing(false); return; }
          if (!permission.granted) throw new Error('Разрешите доступ к микрофону в настройках.');
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
          if (!alive.current || !held.current) { await setAudioModeAsync({ allowsRecording: false }); busy.current = false; if (alive.current) setPreparing(false); return; }
          await audio.prepareToRecordAsync();
          if (!alive.current) { await setAudioModeAsync({ allowsRecording: false }); busy.current = false; if (alive.current) setPreparing(false); return; }
          if (!held.current || !alive.current || AppState.currentState !== 'active') { await audio.stop(); await setAudioModeAsync({ allowsRecording: false }); busy.current = false; if (alive.current) setPreparing(false); return; }
          started.current = Date.now(); audio.record(); setPreparing(false); setKind(requested); setRecording(true);
        }
      } catch (error) { busy.current = false; await setAudioModeAsync({ allowsRecording: false }).catch(() => {}); if (alive.current) { setPreparing(false); setKind(null); Alert.alert('Не удалось начать запись', error instanceof Error ? error.message : 'Попробуйте ещё раз.'); } }
    },
    release: () => { if (!lockedRef.current) { autoSend.current = true; void stop(); } },
    cancel: () => { void stop(true); },
    move: distance => {
      if (!busy.current || lockedRef.current) return;
      lift.setValue(Math.min(72, Math.max(0, -distance)));
      if (distance <= -72) { lockedRef.current = true; setLocked(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
    },
  }));
  const cameraReady = async () => {
    if (started.current) return;
    if (!held.current) { busy.current = false; setKind(null); return; }
    started.current = Date.now(); setRecording(true);
    try { const video = await camera.current?.recordAsync({ maxDuration: 60, maxFileSize: 25 * 1024 * 1024 }); await finish(video?.uri || null); }
    catch { busy.current = false; stopping.current = false; if (alive.current) { setPreparing(false); setKind(null); setRecording(false); lockedRef.current = false; setLocked(false); Alert.alert('Не удалось записать видео', 'Попробуйте ещё раз.'); } }
    finally { started.current = 0; }
  };
  const overlayPosition = StyleSheet.flatten(StyleSheet.absoluteFill);
  return <>
    {(kind || preparing) && <View pointerEvents="box-none" style={[overlayPosition, s.overlay]}>
      {kind === 'videoNote' && <Animated.View style={[s.camera, { transform: [{ scale: pulse }] }]}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" mode="video" videoQuality="720p" onCameraReady={() => void cameraReady()} onMountError={() => { busy.current = false; setPreparing(false); setKind(null); Alert.alert('Не удалось начать запись', 'Попробуйте ещё раз.'); }} /></Animated.View>}
      {!locked && <Animated.View style={{ alignSelf: 'flex-end', marginRight: 12, marginBottom: 10, transform: [{ translateY: lift.interpolate({ inputRange: [0, 72], outputRange: [0, -20] }) }] }}><GlassSurface interactive={false} style={{ width: 44, height: 88, alignItems: 'center', justifyContent: 'space-evenly' }}><Lock size={18} color={colors.textPrimary} /><ArrowUp size={18} color={colors.textMuted} /></GlassSurface></Animated.View>}
      <Animated.View style={{ transform: [{ translateY: motionReduced ? 0 : appear.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <GlassSurface interactive={false} style={s.recording}>
          {locked && <Lock size={16} color={colors.textPrimary} />}
          <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }}>● {durationLabel(seconds)}</Text>
          {kind === 'voice' ? <VoiceWaveform samples={waveform} /> : <View style={{ flex: 1 }} />}
          {locked ? <><GlassTool label="Удалить запись" onPress={() => void stop(true)}><Trash2 color={colors.danger} size={20} /></GlassTool><GlassTool label="Завершить запись" onPress={() => { autoSend.current = false; void stop(); }}><Square color={colors.textPrimary} size={18} /></GlassTool><GlassTool label="Отправить запись" onPress={() => { autoSend.current = true; void stop(); }}><Send color={colors.textPrimary} size={20} /></GlassTool></> : <Text style={{ color: colors.textMuted, fontSize: 12 }}>← Отмена</Text>}
        </GlassSurface>
      </Animated.View>
    </View>}
    <GlassModal visible={!!draft} onClose={() => { if (!sending) setDraft(null); }}><Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 18 }}>Запись готова</Text>{draft && <MaterialView item={draft} />}<View style={s.actions}><Pressable disabled={sending} onPress={() => setDraft(null)} style={s.action}><Trash2 color={colors.danger} /><Text style={{ color: colors.danger }}>Удалить</Text></Pressable><Pressable disabled={sending} onPress={() => { if (!draft || sendingRef.current) return; sendingRef.current = true; setSending(true); void onSend(draft).then(() => { if (alive.current) setDraft(null); }).catch(() => Alert.alert('Не удалось отправить', 'Запись сохранена. Попробуйте ещё раз.')).finally(() => { sendingRef.current = false; if (alive.current) setSending(false); }); }} style={[s.action, { backgroundColor: colors.accent, borderRadius: 16 }]}><Send color={colors.onAccent} /><Text style={{ color: colors.onAccent }}>{sending ? 'Отправка...' : 'Отправить'}</Text></Pressable></View></GlassModal>
  </>;
});
const s = StyleSheet.create({ hint: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 18 }, stop: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 22, marginTop: 20 }, overlay: { justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 68, zIndex: 10 }, recording: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 }, camera: { width: 250, height: 250, borderRadius: 125, overflow: 'hidden', marginBottom: 18, alignSelf: 'center' }, cancel: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 18, marginTop: 12 }, actions: { flexDirection: 'row', gap: 12, marginTop: 20 }, action: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 } });
