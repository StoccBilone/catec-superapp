import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, PanResponder, Platform, ScrollView, StyleSheet, Text as BoardNumber, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Pause, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenSafeArea } from '../../components/ScreenSafeArea';
import { GlassTool } from '../../components/GlassTool';
import { GlassModal } from '../../components/GlassModal';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { translate } from '../../i18n/strings';
import { Direction, Saved2048, Tile, canMove, hasWon, moveGame, newGame } from './engine';
import { load2048, save2048 } from './storage';

function NumberTile({ tile, size, gap }: { tile: Tile; size: number; gap: number }) {
  const { mode, colors } = useTheme();
  const { motionReduced } = usePreferences();
  const x = gap + tile.column * (size + gap);
  const y = gap + tile.row * (size + gap);
  const [position] = useState(() => new Animated.ValueXY({ x, y }));
  const [scale] = useState(() => new Animated.Value(motionReduced ? 1 : 0.65));
  const previousValue = useRef(tile.value);
  useEffect(() => {
    const merged = previousValue.current !== tile.value;
    previousValue.current = tile.value;
    if (merged && !motionReduced) scale.setValue(1.12);
    const animation = Animated.parallel([
      Animated.timing(position, { toValue: { x, y }, duration: motionReduced ? 0 : 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: motionReduced ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [x, y, tile.value, motionReduced, position, scale]);
  const level = Math.min(11, Math.log2(tile.value));
  const shade = mode === 'light' ? Math.round(235 - (level - 1) * 19) : Math.round(46 + (level - 1) * 19);
  const inverse = level >= 6;
  const fontSize = Math.min(36, size * (String(tile.value).length > 3 ? 0.3 : 0.42));
  return <Animated.View accessible={false} style={[styles.tile, {
    width: size, height: size, borderRadius: Math.min(17, size * 0.2),
    backgroundColor: `rgb(${shade},${shade},${shade})`,
    transform: [{ translateX: position.x }, { translateY: position.y }, { scale }],
  }]}>
    <BoardNumber allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize, fontWeight: '700', letterSpacing: -1, color: inverse ? colors.onAccent : colors.textPrimary }}>{tile.value}</BoardNumber>
  </Animated.View>;
}

function Board({ tiles, size, onMove, blocked }: { tiles: Tile[]; size: number; onMove: (direction: Direction) => void; blocked: boolean }) {
  const { colors } = useTheme();
  const { language } = usePreferences();
  const callbacks = useRef({ onMove, blocked });
  useEffect(() => { callbacks.current = { onMove, blocked }; }, [onMove, blocked]);
  // The responder reads current callbacks only during touch events.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !callbacks.current.blocked,
    onMoveShouldSetPanResponder: () => !callbacks.current.blocked,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gesture) => {
      if (callbacks.current.blocked || Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) < 20) return;
      const direction = Math.abs(gesture.dx) > Math.abs(gesture.dy)
        ? gesture.dx > 0 ? 'right' : 'left'
        : gesture.dy > 0 ? 'down' : 'up';
      callbacks.current.onMove(direction);
    },
  }));
  const gap = size < 280 ? 7 : 10;
  const cell = (size - gap * 5) / 4;
  const rows = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => tiles.find(tile => tile.row === row && tile.column === column)?.value || 0).join(', ')).join('; ');
  const directions: Direction[] = ['left', 'up', 'down', 'right'];
  return <View {...responder.panHandlers} accessible accessibilityLabel={`${translate('Игровое поле', language)}. ${rows}`}
    accessibilityActions={directions.map((name, index) => ({ name, label: translate(['Сдвинуть влево', 'Сдвинуть вверх', 'Сдвинуть вниз', 'Сдвинуть вправо'][index], language) }))}
    onAccessibilityAction={event => { const direction = event.nativeEvent.actionName as Direction; if (!blocked && directions.includes(direction)) onMove(direction); }}
    style={[styles.board, { width: size, height: size, backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
    {Array.from({ length: 16 }, (_, index) => <View key={index} style={{ position: 'absolute', width: cell, height: cell, borderRadius: Math.min(17, cell * 0.2), backgroundColor: colors.canvas, left: gap + (index % 4) * (cell + gap), top: gap + Math.floor(index / 4) * (cell + gap) }} />)}
    {tiles.map(tile => <NumberTile key={tile.id} tile={tile} size={cell} gap={gap} />)}
  </View>;
}

export function Game2048Screen({ profileId }: { profileId: string }) {
  const { colors } = useTheme();
  const { motionReduced, interfaceScale } = usePreferences();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [saved, setSaved] = useState<Saved2048 | null>(null);
  const current = useRef<Saved2048 | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [sheet, setSheet] = useState<'pause' | 'restart' | null>(null);
  const mounted = useRef(true);
  const saveRevision = useRef(0);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void load2048(profileId).then(value => {
      if (cancelled) return;
      const initial: Saved2048 = value || { version: 1, game: newGame(), best: 0 };
      current.current = initial;
      setSaved(initial);
      setLoadError(false);
      // Save the initial two tiles, even if the player leaves before their first move.
      return save2048(profileId, initial).catch(() => { if (!cancelled) setSaveError(true); });
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; mounted.current = false; };
  }, [profileId, retry]);

  const commit = (next: Saved2048) => {
    current.current = next;
    setSaved(next);
    const revision = ++saveRevision.current;
    void save2048(profileId, next).then(() => {
      if (mounted.current && revision === saveRevision.current) setSaveError(false);
    }).catch(() => { if (mounted.current && revision === saveRevision.current) setSaveError(true); });
  };
  const won = !!saved && hasWon(saved.game) && !saved.game.acknowledgedWin;
  const lost = !!saved && !canMove(saved.game);
  const move = (direction: Direction) => {
    const before = current.current;
    if (!before || sheet || (!before.game.acknowledgedWin && hasWon(before.game)) || !canMove(before.game)) return;
    const result = moveGame(before.game, direction);
    if (!result.changed) return;
    commit({ ...before, game: result.game, best: Math.max(before.best, result.game.score) });
    if (result.gained > 0 && !motionReduced) void Haptics.selectionAsync().catch(() => {});
  };
  const restart = () => {
    const before = current.current;
    if (!before) return;
    commit({ ...before, game: newGame() });
    setSheet(null);
  };
  const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/games'); };
  const topSpace = Platform.OS === 'web' ? 54 : insets.top;
  const centerOffset = Math.max(0, 72 + topSpace - insets.bottom + 34 * interfaceScale);
  const boardSize = Math.floor(Math.min(width - 40, 430, Math.max(160, height - topSpace - insets.bottom - 72 - 48 - centerOffset - 170 * interfaceScale)));

  return <ScreenSafeArea edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={styles.header}>
      <GlassTool label="Назад" onPress={leave}><ChevronLeft size={22} color={colors.textPrimary} /></GlassTool>
      <Text translate={false} style={[styles.heading, { color: colors.textPrimary }]}>2048</Text>
      <GlassTool label="Пауза" onPress={() => setSheet('pause')} disabled={!saved}><Pause size={19} color={colors.textPrimary} /></GlassTool>
    </View>
    {!saved ? <View style={styles.loading}>{loadError ? <>
      <Text style={{ color: colors.textSecondary }}>Не удалось открыть игру</Text>
      <Pressable onPress={() => { setLoadError(false); setRetry(value => value + 1); }} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent }}>Повторить</Text></Pressable>
    </> : <ActivityIndicator color={colors.textPrimary} />}</View> : <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 24 + centerOffset }]}>
      <View style={[styles.scores, { width: boardSize }]}>
        {[{ label: 'Счёт', value: saved.game.score }, { label: 'Рекорд', value: saved.best }].map(item => <View key={item.label} style={[styles.score, { backgroundColor: colors.cardBg }]}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text>
          <Text translate={false} numberOfLines={1} adjustsFontSizeToFit style={[styles.number, { color: colors.textPrimary }]}>{item.value}</Text>
        </View>)}
      </View>
      <Board tiles={saved.game.tiles} size={boardSize} onMove={move} blocked={won || lost || !!sheet} />
      <View style={[styles.bottom, { width: boardSize }]}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{'Ходы'}: <Text translate={false}>{saved.game.moves}</Text></Text>
        <Pressable accessibilityRole="button" onPress={() => setSheet('restart')} style={styles.restart}><RotateCcw size={15} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: 13 }}>Новая игра</Text></Pressable>
      </View>
      {saveError && <Pressable onPress={() => { if (current.current) commit(current.current); }} style={styles.saveError}><Text style={{ fontSize: 13, color: colors.textSecondary }}>Не удалось сохранить игру. Нажмите, чтобы повторить.</Text></Pressable>}
    </ScrollView>}
    <GlassModal visible={!!sheet} onClose={() => setSheet(null)}>
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{sheet === 'restart' ? 'Начать заново?' : 'Пауза'}</Text>
      <Text style={[styles.sheetText, { color: colors.textSecondary }]}>{sheet === 'restart' ? 'Текущая партия будет заменена. Рекорд останется.' : 'Сдвигайте плитки в любую сторону. Одинаковые числа складываются. Соберите 2048.'}</Text>
      <Pressable onPress={sheet === 'restart' ? restart : () => setSheet(null)} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent, fontWeight: '600' }}>{sheet === 'restart' ? 'Начать заново' : 'Продолжить'}</Text></Pressable>
      <Pressable onPress={sheet === 'restart' ? () => setSheet(null) : leave} style={styles.secondaryAction}><Text style={{ color: colors.textSecondary }}>{sheet === 'restart' ? 'Отмена' : 'К играм'}</Text></Pressable>
    </GlassModal>
    <GlassModal visible={(won || lost) && !sheet} onClose={() => { if (won && !lost && current.current) commit({ ...current.current, game: { ...current.current.game, acknowledgedWin: true } }); else leave(); }}>
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{won ? '2048 собрано!' : 'Ходов больше нет'}</Text>
      <Text style={[styles.sheetText, { color: colors.textSecondary }]}>{won ? 'Можно продолжить и собрать больше.' : 'Попробуйте ещё раз — рекорд сохранён.'}</Text>
      <Text style={{ fontSize: 15, color: colors.textSecondary }}>{'Счёт'}: <Text translate={false}>{saved?.game.score}</Text></Text>
      <Pressable onPress={() => { if (won && !lost && current.current) commit({ ...current.current, game: { ...current.current.game, acknowledgedWin: true } }); else restart(); }} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent, fontWeight: '600' }}>{won && !lost ? 'Продолжить' : 'Новая игра'}</Text></Pressable>
      <Pressable onPress={leave} style={styles.secondaryAction}><Text style={{ color: colors.textSecondary }}>К играм</Text></Pressable>
    </GlassModal>
  </ScreenSafeArea>;
}

const styles = StyleSheet.create({
  header: { height: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  scores: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  score: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  number: { fontSize: 25, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 4 },
  board: { borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tile: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  bottom: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restart: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center' },
  action: { minHeight: 50, padding: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  secondaryAction: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  sheetTitle: { fontSize: 25, fontWeight: '600', marginTop: 8, marginRight: 28 },
  sheetText: { fontSize: 16, lineHeight: 24, marginTop: 14, marginBottom: 8 },
  saveError: { maxWidth: 380, padding: 12, marginTop: 8 },
});
