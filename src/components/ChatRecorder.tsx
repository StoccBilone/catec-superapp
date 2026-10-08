import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from "react-native";
import { Alert, Pressable, Text } from "./Typography";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Send, Trash2 } from 'lucide-react-native';
import { GlassModal } from './GlassModal';
import { MaterialView, durationLabel } from './MaterialView';
import { Material } from '../types';
import { persistMaterial } from '../services/materials';
import { useTheme } from '../theme/themeContext';

export interface RecorderHandle { start: (kind: 'voice' | 'videoNote') => void; release: () => void; }
export const ChatRecorder = forwardRef<RecorderHandle, { onSend: (item: Material) => Promise<void> }>(function ChatRecorder({ onSend }, ref) {
  const { colors } = useTheme();
  const audio = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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
  const alive = useRef(true);
  const canceled = useRef(false);
  const stopping = useRef(false);

  const finish = async (uri: string | null) => {
    const duration = (Date.now() - started.current) / 1000;
    try {
      if (uri && !canceled.current && duration >= 0.5) {
        const item: Material = { id: `recording-${Date.now()}`, title: kindRef.current === 'voice' ? 'Голосовое сообщение' : 'Видеосообщение', type: kindRef.current, duration, uri: await persistMaterial(uri), mimeType: kindRef.current === 'voice' ? Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4' : 'video/mp4' };
        if (alive.current) setDraft(item);
      }
    } catch { if (alive.current) Alert.alert('Не удалось сохранить запись', 'Попробуйте ещё раз.'); }
    finally { busy.current = false; stopping.current = false; if (alive.current) { setKind(null); setRecording(false); } }
  };
  const stop = async (cancel = false) => {
    held.current = false;
    if (cancel) canceled.current = true;
    if (!started.current || stopping.current) return;
    stopping.current = true;
    if (kindRef.current === 'videoNote') camera.current?.stopRecording();
    else {
      const timestamp = started.current;
      started.current = 0;
      try { await audio.stop(); started.current = timestamp; await finish(audio.uri); }
      catch { busy.current = false; if (alive.current) { setKind(null); setRecording(false); } }
      finally { started.current = 0; stopping.current = false; await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {}); }
    }
  };
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - started.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= (kindRef.current === 'videoNote' ? 60 : 300)) void stop();
    }, 200);
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') void stop(true); });
    return () => { clearInterval(timer); subscription.remove(); };
  });
  useEffect(() => { alive.current = true; return () => { alive.current = false; held.current = false; canceled.current = true; if (audio.isRecording) void audio.stop().catch(() => {}).finally(() => setAudioModeAsync({ allowsRecording: false }).catch(() => {})); }; }, [audio]);
  useImperativeHandle(ref, () => ({
    start: async requested => {
      if (busy.current || draft) return;
      busy.current = true; held.current = true; canceled.current = false; stopping.current = false; kindRef.current = requested; setSeconds(0);
      try {
        if (requested === 'videoNote') {
          if (Platform.OS === 'web') { Alert.alert('Видеосообщение', 'Запись видеосообщений доступна в приложении на телефоне.'); busy.current = false; return; }
          const permissions = await Promise.all([requestCamera(), requestMic()]);
          if (permissions.some(permission => !permission.granted)) throw new Error('Разрешите доступ к камере и микрофону в настройках.');
          if (!held.current || !alive.current) { busy.current = false; return; }
          setKind(requested);
        } else {
          const permission = await AudioModule.requestRecordingPermissionsAsync();
          if (!permission.granted) throw new Error('Разрешите доступ к микрофону в настройках.');
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
          await audio.prepareToRecordAsync();
          if (!held.current || !alive.current) { await audio.stop(); await setAudioModeAsync({ allowsRecording: false }); busy.current = false; return; }
          started.current = Date.now(); audio.record(); setKind(requested); setRecording(true);
        }
      } catch (error) { busy.current = false; await setAudioModeAsync({ allowsRecording: false }).catch(() => {}); if (alive.current) { setKind(null); Alert.alert('Не удалось начать запись', error instanceof Error ? error.message : 'Попробуйте ещё раз.'); } }
    }, release: () => { void stop(); },
  }));
  const cameraReady = async () => {
    if (started.current) return;
    if (!held.current) { busy.current = false; setKind(null); return; }
    started.current = Date.now(); setRecording(true);
    try { const video = await camera.current?.recordAsync({ maxDuration: 60, maxFileSize: 25 * 1024 * 1024 }); await finish(video?.uri || null); }
    catch { busy.current = false; stopping.current = false; if (alive.current) { setKind(null); setRecording(false); Alert.alert('Не удалось записать видео', 'Попробуйте ещё раз.'); } }
    finally { started.current = 0; }
  };
  const overlayPosition = StyleSheet.flatten(StyleSheet.absoluteFill);
  return <>
    {kind && <View pointerEvents="box-none" style={[overlayPosition, s.overlay]}>
      <View pointerEvents="none" style={[s.recording, { backgroundColor: colors.canvasElevated }]}>
        {kind === 'videoNote' && <View style={s.camera}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" mode="video" videoQuality="720p" onCameraReady={() => void cameraReady()} onMountError={() => { busy.current = false; setKind(null); }} /></View>}
        <Text style={{ color: colors.danger, fontSize: 17, fontWeight: '600' }}>● {durationLabel(seconds)}</Text><Text style={{ color: colors.textSecondary, marginTop: 8 }}>Отпустите, чтобы завершить запись</Text>
      </View>
      <Pressable onPress={() => void stop(true)} style={[s.cancel, { backgroundColor: colors.canvasElevated }]}><Trash2 color={colors.danger} size={21} /><Text style={{ color: colors.danger }}>Отменить</Text></Pressable>
    </View>}
    <GlassModal visible={!!draft} onClose={() => { if (!sending) setDraft(null); }}><Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 18 }}>Запись готова</Text>{draft && <MaterialView item={draft} />}<View style={s.actions}><Pressable disabled={sending} onPress={() => setDraft(null)} style={s.action}><Trash2 color={colors.danger} /><Text style={{ color: colors.danger }}>Удалить</Text></Pressable><Pressable disabled={sending} onPress={() => { if (!draft) return; setSending(true); void onSend(draft).then(() => setDraft(null)).catch(() => Alert.alert('Не удалось отправить', 'Запись сохранена. Попробуйте ещё раз.')).finally(() => setSending(false)); }} style={[s.action, { backgroundColor: colors.accent, borderRadius: 16 }]}><Send color="#fff" /><Text style={{ color: '#fff' }}>{sending ? 'Отправка...' : 'Отправить'}</Text></Pressable></View></GlassModal>
  </>;
});
const s = StyleSheet.create({ overlay: { justifyContent: 'center', alignItems: 'center', zIndex: 10 }, recording: { padding: 22, borderRadius: 28, alignItems: 'center' }, camera: { width: 250, height: 250, borderRadius: 125, overflow: 'hidden', marginBottom: 18 }, cancel: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 18, marginTop: 12 }, actions: { flexDirection: 'row', gap: 12, marginTop: 20 }, action: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 } });
