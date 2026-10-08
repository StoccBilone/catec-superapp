import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, PanResponder, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { GLView } from 'expo-gl';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Crosshair, Pause } from 'lucide-react-native';
import { ScreenSafeArea } from '../../components/ScreenSafeArea';
import { GlassTool } from '../../components/GlassTool';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { makeMaze, newMarble, stepMarble } from './engine';
import { createMazeRenderer } from './renderer';
import { emptyProgress, loadMazeProgress, MAZE_SIZES, MazeProgress, saveMazeProgress } from './storage';

type Phase = 'ready' | 'playing' | 'paused' | 'won';
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/games'); };

function TouchSurface({ size, enabled, onMove, children }: { size: number; enabled: boolean; onMove: (x: number, z: number) => void; children: React.ReactNode }) {
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => enabled,
    onMoveShouldSetPanResponder: () => enabled,
    onPanResponderMove: (_, gesture) => onMove(Math.max(-1, Math.min(1, gesture.dx / 60)), Math.max(-1, Math.min(1, gesture.dy / 60))),
    onPanResponderRelease: () => onMove(0, 0),
    onPanResponderTerminate: () => onMove(0, 0),
    onPanResponderTerminationRequest: () => false,
  }), [enabled, onMove]);
  return <View {...pan.panHandlers} accessibilityLabel="Лабиринт" style={{ width: size, height: size }}>{children}</View>;
}
function MazeRound({ level, best, onWin, onNext }: { level: number; best: number | null; onWin: (time: number) => void; onNext: () => void }) {
  const { colors, mode } = useTheme();
  const { motionReduced } = usePreferences();
  const { width, height } = useWindowDimensions();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x100000000));
  const maze = useMemo(() => makeMaze(seed, MAZE_SIZES[level]), [seed, level]);
  const [initial] = useState(() => newMarble(maze));
  const marble = useRef(initial);
  const renderer = useRef<ReturnType<typeof createMazeRenderer> | null>(null);
  const input = useRef({ x: 0, z: 0 });
  const baseline = useRef({ x: 0, y: 0, count: 0 });
  const active = useRef(false);
  const mounted = useRef(true);
  const winCallback = useRef(onWin);
  const [phase, setPhase] = useState<Phase>('ready');
  const [control, setControl] = useState<'tilt' | 'touch'>(Platform.OS === 'web' ? 'touch' : 'tilt');
  const [time, setTime] = useState(0);
  const [glReady, setGlReady] = useState(false);
  const [glError, setGlError] = useState(false);
  const [glAttempt, setGlAttempt] = useState(0);
  const [starting, setStarting] = useState(false);
  const [sensorUnavailable, setSensorUnavailable] = useState(false);
  const size = Math.max(190, Math.min(width - 32, 430, height - 340));
  const pause = useCallback(() => { active.current = false; input.current = { x: 0, z: 0 }; setPhase(p => p === 'playing' ? 'paused' : p); }, []);
  useFocusEffect(useCallback(() => {
    mounted.current = true;
    return () => { mounted.current = false; pause(); };
  }, [pause]));
  useEffect(() => {
    winCallback.current = onWin;
  }, [onWin]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
    return () => subscription.remove();
  }, [pause]);
  useEffect(() => () => { mounted.current = false; active.current = false; renderer.current?.dispose(); renderer.current = null; }, []);

  const calibrate = () => { baseline.current = { x: 0, y: 0, count: 0 }; input.current = { x: 0, z: 0 }; };
  const start = async () => {
    if (starting || !glReady || glError) return;
    setStarting(true);
    try {
      if (control === 'tilt') {
        const available = await Accelerometer.isAvailableAsync();
        const permission = available ? await Accelerometer.requestPermissionsAsync() : null;
        if (!mounted.current) return;
        if (!available || !permission?.granted) { setControl('touch'); setSensorUnavailable(true); }
      }
      if (!mounted.current) return;
      calibrate(); marble.current = { ...marble.current, vx: 0, vz: 0 };
      active.current = true; setPhase('playing');
    } catch {
      if (mounted.current) { setControl('touch'); setSensorUnavailable(true); active.current = true; setPhase('playing'); }
    } finally { if (mounted.current) setStarting(false); }
  };
  useEffect(() => {
    if (phase !== 'playing' || control !== 'tilt') return;
    Accelerometer.setUpdateInterval(16);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      if (!active.current) return;
      const b = baseline.current;
      if (b.count < 10) { b.x += x; b.y += y; b.count++; input.current = { x: 0, z: 0 }; return; }
      const clamp = (n: number) => Math.max(-1, Math.min(1, n));
      input.current = { x: clamp((x - b.x / 10) * 3), z: clamp(-(y - b.y / 10) * 3) };
    });
    return () => subscription.remove();
  }, [phase, control]);
  useEffect(() => {
    if (phase !== 'playing' || !glReady) return;
    let frame = 0, previous = 0, display = 0, lastHaptic = 0, accumulator = 0;
    let before = marble.current;
    const smooth = { x: 0, z: 0 };
    const fixed = 1 / 120;
    const tick = (now: number) => {
      if (!active.current) return;
      if (previous) {
        accumulator += Math.min((now - previous) / 1000, 0.05);
        let collision = false;
        while (accumulator >= fixed && !marble.current.won) {
          const blend = 1 - Math.exp(-fixed / 0.055);
          smooth.x += (input.current.x - smooth.x) * blend;
          smooth.z += (input.current.z - smooth.z) * blend;
          before = marble.current;
          const result = stepMarble(before, maze, smooth, fixed);
          marble.current = result.marble; collision ||= result.collision; accumulator -= fixed;
        }
        const ball = marble.current, alpha = accumulator / fixed;
        const rendered = ball.won ? ball : { ...ball, x: before.x + (ball.x - before.x) * alpha, z: before.z + (ball.z - before.z) * alpha };
        try { renderer.current?.draw(rendered); } catch { active.current = false; setGlError(true); pause(); return; }
        if (now - display > 250 || ball.won) { setTime(ball.elapsed); display = now; }
        if (collision && !motionReduced && now - lastHaptic > 180) { lastHaptic = now; void Haptics.selectionAsync().catch(() => {}); }
        if (ball.won) {
          active.current = false; setPhase('won'); winCallback.current(Math.round(ball.elapsed * 1000));
          if (!motionReduced) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return;
        }
      }
      previous = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, glReady, maze, motionReduced, pause]);
  const moveTouch = useCallback((x: number, z: number) => { input.current = { x, z }; }, []);
  const reset = () => { active.current = false; calibrate(); marble.current = newMarble(maze); setTime(0); setPhase('ready'); renderer.current?.draw(marble.current); };
  const randomize = () => { reset(); setGlReady(false); setSeed(Math.floor(Math.random() * 0x100000000)); };
  useEffect(() => { marble.current = newMarble(maze); }, [maze]);
  return <ScreenSafeArea edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={styles.header}>
      <GlassTool label="Назад" onPress={leave}><ChevronLeft size={22} color={colors.textPrimary} /></GlassTool>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Лабиринт</Text>
      <GlassTool label="Пауза" onPress={pause} disabled={phase !== 'playing'}><Pause size={19} color={colors.textPrimary} /></GlassTool>
    </View>
    <ScrollView scrollEnabled={phase !== 'playing'} bounces={false} contentContainerStyle={styles.content}>
      <View style={[styles.stats, { width: size }]}>
        <View><Text style={{ color: colors.textMuted, fontSize: 12 }}>Уровень</Text><Text translate={false} style={[styles.number, { color: colors.textPrimary }]}>{level + 1} / {MAZE_SIZES.length}</Text></View>
        <View><Text style={{ color: colors.textMuted, fontSize: 12 }}>Время</Text><Text translate={false} style={[styles.number, { color: colors.textPrimary }]}>{formatTime(time)}</Text></View>
        <View><Text style={{ color: colors.textMuted, fontSize: 12 }}>Рекорд</Text><Text translate={false} style={[styles.number, { color: colors.textPrimary }]}>{best ? formatTime(best / 1000) : '—'}</Text></View>
      </View>
      <TouchSurface size={size} enabled={control === 'touch' && phase === 'playing'} onMove={moveTouch}>
        {!glError && <GLView key={`${seed}:${glAttempt}`} style={{ flex: 1 }} onContextCreate={gl => {
          try {
            renderer.current?.dispose(); renderer.current = createMazeRenderer(gl, maze, mode === 'dark');
            renderer.current.draw(marble.current); setGlReady(true);
          } catch { setGlError(true); setGlReady(false); }
        }} />}
        {!glReady && !glError && <ActivityIndicator color={colors.textPrimary} style={StyleSheet.absoluteFill} />}
        {glError && <View style={styles.error}><Text style={{ color: colors.textSecondary }}>Не удалось открыть 3D-сцену</Text><Pressable onPress={() => { renderer.current?.dispose(); renderer.current = null; setGlReady(false); setGlError(false); setGlAttempt(n => n + 1); setPhase('ready'); }}><Text style={{ color: colors.textPrimary, marginTop: 16 }}>Повторить</Text></Pressable></View>}
      </TouchSurface>
      <View style={[styles.controls, { width: size }]}>
        {phase === 'playing' ? <View style={styles.row}><Text style={{ color: colors.textSecondary, flex: 1 }}>{control === 'tilt' ? 'Наклоняйте телефон' : 'Ведите пальцем по полю'}</Text>{control === 'tilt' && <GlassTool label="Калибровка" onPress={calibrate}><Crosshair size={21} color={colors.textPrimary} /></GlassTool>}</View> : <>
          <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>{phase === 'won' ? 'Лабиринт пройден' : phase === 'paused' ? 'Пауза' : 'Доведите шарик до лунки'}</Text>
          {phase !== 'won' && <View style={styles.row}>{(['tilt', 'touch'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: control === value }} onPress={() => { calibrate(); setControl(value); }} style={[styles.choice, { backgroundColor: control === value ? colors.accent : colors.cardBg }]}><Text style={{ color: control === value ? colors.onAccent : colors.textPrimary }}>{value === 'tilt' ? 'Наклон' : 'Касание'}</Text></Pressable>)}</View>}
          {sensorUnavailable && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Датчик недоступен. Управляйте касанием.</Text>}
          <Pressable accessibilityRole="button" disabled={starting || !glReady || glError} onPress={phase === 'won' ? onNext : () => { void start(); }} style={[styles.action, { backgroundColor: colors.accent, opacity: glReady && !glError ? 1 : 0.4 }]}><Text style={{ color: colors.onAccent, fontWeight: '600' }}>{starting ? 'Подготовка...' : phase === 'won' ? level === MAZE_SIZES.length - 1 ? 'К играм' : 'Следующий уровень' : phase === 'paused' ? 'Продолжить' : 'Играть'}</Text></Pressable>
          {phase === 'ready' && <Pressable onPress={randomize} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Другой лабиринт</Text></Pressable>}
          {phase === 'paused' && <Pressable onPress={reset} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Начать заново</Text></Pressable>}
        </>}
      </View>
    </ScrollView>
  </ScreenSafeArea>;
}

export function MazeScreen({ profileId }: { profileId: string }) {
  const { colors, mode } = useTheme();
  const [progress, setProgress] = useState<MazeProgress | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retry, setRetry] = useState(0);
  const current = useRef(emptyProgress());
  const mounted = useRef(true);
  const revision = useRef(0);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void loadMazeProgress(profileId).then(value => { if (!cancelled) { current.current = value; setProgress(value); } }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; mounted.current = false; };
  }, [profileId, retry]);
  const persist = useCallback((value: MazeProgress) => {
    current.current = value; setProgress(value);
    const version = ++revision.current;
    void saveMazeProgress(profileId, value).then(() => { if (mounted.current && version === revision.current) setSaveError(false); }).catch(() => { if (mounted.current && version === revision.current) setSaveError(true); });
  }, [profileId]);
  const win = useCallback((time: number) => {
    const value = current.current, best = [...value.best];
    best[value.level] = Math.min(best[value.level] ?? Infinity, Math.max(1, time));
    persist({ ...value, best });
  }, [persist]);
  if (!progress) return <ScreenSafeArea style={[styles.loading, { backgroundColor: colors.canvas }]}>{loadError ? <><Text style={{ color: colors.textPrimary }}>Не удалось открыть игру</Text><Pressable onPress={() => { setLoadError(false); setRetry(n => n + 1); }}><Text style={{ color: colors.textPrimary, marginTop: 16 }}>Повторить</Text></Pressable><Pressable onPress={leave}><Text style={{ color: colors.textSecondary, marginTop: 16 }}>К играм</Text></Pressable></> : <ActivityIndicator color={colors.textPrimary} />}</ScreenSafeArea>;
  return <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <MazeRound key={`${progress.level}:${mode}`} level={progress.level} best={progress.best[progress.level]} onWin={win} onNext={() => { if (progress.level === MAZE_SIZES.length - 1) { persist({ ...progress, level: 0 }); leave(); } else persist({ ...progress, level: progress.level + 1 }); }} />
    {saveError && <Pressable onPress={() => persist(current.current)} style={{ padding: 12 }}><Text style={{ color: colors.textSecondary }}>Не удалось сохранить игру. Нажмите, чтобы повторить.</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  header: { height: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  number: { fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 5 },
  controls: { gap: 12, padding: 12, minHeight: 230 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelTitle: { fontSize: 18, fontWeight: '600' },
  choice: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
