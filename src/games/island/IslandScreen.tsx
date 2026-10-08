import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Easing, PanResponder, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, ChevronLeft, Pause } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassTool } from '../../components/GlassTool';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Arena, BALL_RADIUS, PADDLE_HEIGHT, createArena, createIslandGame, movePaddle, stepIsland, targetForDevice } from './engine';
import { loadIslandBest, saveIslandBest } from './storage';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

function GamePanel({ children }: { children: React.ReactNode }) {
  const { motionReduced } = usePreferences();
  const [opacity] = useState(() => new Animated.Value(motionReduced ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: 1, duration: motionReduced ? 0 : 200, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity, motionReduced]);
  return <Animated.View style={[styles.panel, { opacity }]}>{children}</Animated.View>;
}

function IslandRound({ profileId, arena, topInset, bottomInset }: { profileId: string; arena: Arena; topInset: number; bottomInset: number }) {
  const { colors, mode } = useTheme();
  const { motionReduced } = usePreferences();
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [focused, setFocused] = useState(true);
  const [initialGame] = useState(() => createIslandGame(arena));
  const game = useRef(initialGame);
  const record = useRef(0);
  const alive = useRef(true);
  const phaseRef = useRef<Phase>('loading');
  const saveRevision = useRef(0);
  const [ball] = useState(() => new Animated.ValueXY({ x: initialGame.x - BALL_RADIUS, y: initialGame.y - BALL_RADIUS }));
  const [paddle] = useState(() => new Animated.Value(initialGame.paddleX - arena.paddleWidth / 2));
  const [pulse] = useState(() => new Animated.Value(0));
  const paint = () => {
    ball.setValue({ x: game.current.x - BALL_RADIUS, y: game.current.y - BALL_RADIUS });
    paddle.setValue(game.current.paddleX - arena.paddleWidth / 2);
  };
  const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const pause = () => { if (phaseRef.current === 'playing') changePhase('paused'); };
  const actions = useRef({ pause, move: (_x: number) => {} });
  useEffect(() => {
    actions.current = { pause, move: x => {
      if (phaseRef.current !== 'playing') return;
      game.current = movePaddle(game.current, arena, x);
      paddle.setValue(game.current.paddleX - arena.paddleWidth / 2);
    } };
  });
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { setFocused(false); actions.current.pause(); };
  }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') actions.current.pause(); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    void loadIslandBest(profileId).then(value => {
      if (cancelled) return;
      record.current = value; setBest(value);
      phaseRef.current = 'ready'; setPhase('ready');
    }).catch(() => { if (!cancelled) { phaseRef.current = 'error'; setPhase('error'); } });
    return () => { cancelled = true; alive.current = false; };
  }, [profileId, retry]);
  const persistBest = (value: number) => {
    const revision = ++saveRevision.current;
    void saveIslandBest(profileId, value).then(() => {
      if (alive.current && revision === saveRevision.current) setSaveError(false);
    }).catch(() => { if (alive.current && revision === saveRevision.current) setSaveError(true); });
  };
  useEffect(() => {
    if (phase !== 'playing' || !focused) return;
    let frame = 0;
    let previous: number | null = null;
    const tick = (time: number) => {
      if (phaseRef.current !== 'playing') return;
      if (previous !== null) {
        const result = stepIsland(game.current, arena, (time - previous) / 1000);
        game.current = result.game;
        paint();
        if (result.hit) {
          setScore(result.game.score);
          if (result.game.score > record.current) {
            record.current = result.game.score;
            setBest(record.current);
            persistBest(record.current);
          }
          if (!motionReduced) {
            pulse.stopAnimation(); pulse.setValue(1);
            Animated.timing(pulse, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        }
        if (result.paddleHit && !motionReduced) void Haptics.selectionAsync().catch(() => {});
        if (result.game.ended) { changePhase('ended'); return; }
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // The frame loop reads mutable physics refs; score renders must not restart its clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, focused, arena, motionReduced, ball, paddle, pulse]);
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => phaseRef.current === 'playing',
    onMoveShouldSetPanResponder: () => phaseRef.current === 'playing',
    onPanResponderGrant: event => actions.current.move(event.nativeEvent.locationX),
    onPanResponderMove: event => actions.current.move(event.nativeEvent.locationX),
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => actions.current.pause(),
  }));
  const start = () => {
    game.current = createIslandGame(arena);
    setScore(0); paint(); pulse.setValue(0);
    changePhase('playing');
  };
  const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/games'); };
  const target = arena.target;
  const controlsTop = Math.max(topInset, 54) + 12;

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas, overflow: 'hidden' }]}>
    {focused && <StatusBar hidden />}
    <View {...responder.panHandlers} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[styles.target, { left: target.x, top: target.y, width: target.width, height: target.height, borderRadius: target.kind === 'notch' ? 0 : target.height / 2, borderBottomLeftRadius: target.kind === 'notch' ? 18 : target.height / 2, borderBottomRightRadius: target.kind === 'notch' ? 18 : target.height / 2, borderColor: mode === 'dark' ? '#343734' : '#000000' }]} />
    <Animated.View pointerEvents="none" style={[styles.ring, { left: target.x - 7, top: target.y - 7, width: target.width + 14, height: target.height + 14, borderRadius: target.height / 2 + 7, borderColor: colors.textPrimary, opacity: pulse, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }] }]} />
    <Animated.View pointerEvents="none" style={[styles.paddle, { top: arena.paddleY, width: arena.paddleWidth, backgroundColor: colors.textPrimary, transform: [{ translateX: paddle }] }]} />
    <View pointerEvents="box-none" style={[styles.hud, { top: controlsTop }]}>
      <GlassTool label="Назад" onPress={leave}><ChevronLeft size={22} color={colors.textPrimary} /></GlassTool>
      <View pointerEvents="none" style={styles.score}><Text style={{ fontSize: 11, color: colors.textMuted }}>Счёт</Text><Text translate={false} style={{ fontSize: 30, fontWeight: '600', fontVariant: ['tabular-nums'], color: colors.textPrimary }}>{score}</Text></View>
      <GlassTool label="Пауза" onPress={pause} disabled={phase !== 'playing'}><Pause size={19} color={colors.textPrimary} /></GlassTool>
    </View>
    <Animated.View pointerEvents="none" style={[styles.ball, { backgroundColor: colors.textPrimary, transform: [{ translateX: ball.x }, { translateY: ball.y }] }]} />
    {phase !== 'playing' && <GamePanel key={phase}>
      {phase === 'loading' ? <ActivityIndicator color={colors.textPrimary} /> : <>
        <Text translate={phase === 'paused'} style={[styles.title, { color: colors.textPrimary }]}>{phase === 'paused' ? 'Пауза' : 'Hit the Island'}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{phase === 'ready' ? 'Двигайте ракетку пальцем. Попадайте мячом в островок.' : phase === 'ended' ? 'Мяч упущен. Попробуем ещё раз?' : phase === 'error' ? 'Не удалось открыть игру' : 'Продолжим с того же места.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => {
          if (phase === 'error') { changePhase('loading'); setRetry(value => value + 1); }
          else if (phase === 'paused') changePhase('playing');
          else start();
        }} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ fontSize: 16, fontWeight: '600', color: colors.onAccent }}>{phase === 'error' ? 'Повторить' : phase === 'paused' ? 'Продолжить' : phase === 'ended' ? 'Ещё раз' : 'Играть'}</Text></Pressable>
        {phase === 'paused' && <Pressable accessibilityRole="button" onPress={start} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Новая игра</Text></Pressable>}
      </>}
      {saveError && <Pressable onPress={() => persistBest(record.current)} style={styles.secondary}><Text style={{ fontSize: 13, color: colors.textSecondary }}>Не удалось сохранить рекорд. Нажмите, чтобы повторить.</Text></Pressable>}
    </GamePanel>}
    <View pointerEvents="box-none" style={[styles.footer, { bottom: Math.max(bottomInset, 16) + 12 }]}>
      <GlassTool label="Ракетка влево" disabled={phase !== 'playing'} onPress={() => actions.current.move(game.current.paddleX - 36)}><ArrowLeft size={19} color={colors.textPrimary} /></GlassTool>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{'Рекорд'}: <Text translate={false}>{best}</Text></Text>
      <GlassTool label="Ракетка вправо" disabled={phase !== 'playing'} onPress={() => actions.current.move(game.current.paddleX + 36)}><ArrowRight size={19} color={colors.textPrimary} /></GlassTool>
    </View>
  </View>;
}

export function IslandScreen({ profileId }: { profileId: string }) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [initialTop] = useState(insets.top);
  const [size, setSize] = useState({ width: window.width, height: window.height });
  const top = Math.max(initialTop, insets.top);
  const arena = useMemo(() => createArena(size.width, size.height, insets.bottom, targetForDevice(size.width, top, Device.modelId, Device.modelName, Platform.OS === 'ios')), [size.width, size.height, insets.bottom, top]);
  return <View style={{ flex: 1 }} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}><IslandRound key={`${profileId}:${size.width}:${size.height}`} profileId={profileId} arena={arena} topInset={top} bottomInset={insets.bottom} /></View>;
}

const styles = StyleSheet.create({
  target: { position: 'absolute', backgroundColor: '#000000', borderWidth: 1 },
  ring: { position: 'absolute', borderWidth: 1.5 },
  ball: { position: 'absolute', left: 0, top: 0, width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, borderRadius: BALL_RADIUS },
  paddle: { position: 'absolute', left: 0, height: PADDLE_HEIGHT, borderRadius: PADDLE_HEIGHT / 2 },
  hud: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  score: { alignItems: 'center' },
  panel: { position: 'absolute', top: '32%', left: 32, right: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.9, textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 280, marginTop: 16 },
  action: { minHeight: 52, minWidth: 160, paddingHorizontal: 26, paddingVertical: 15, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  secondary: { padding: 14, marginTop: 8, alignItems: 'center' },
  footer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
