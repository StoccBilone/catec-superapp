import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Anchor, Apple, Bell, Bird, BookOpen, Camera, Cherry, ChevronLeft, Circle, Cloud, Clover, Coffee, Diamond, Feather, Fish, Flag, Flower2, Gem, Heart, Hexagon, KeyRound, Leaf, Moon, Music, Pause, Shell, Snowflake, Sparkles, Sprout, Star, Sun, Triangle, Umbrella, Waves } from 'lucide-react-native';
import { ScreenSafeArea } from '../../components/ScreenSafeArea';
import { GlassTool } from '../../components/GlassTool';
import { GlassModal } from '../../components/GlassModal';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { translate } from '../../i18n/strings';
import { Difficulty, MemoryCard, memoryFinished, newMemory, pairCount, resolveCards, revealCard } from './engine';
import { emptyRecords, loadMemoryRecords, MemoryRecords, saveMemoryRecords } from './storage';

const symbols = [Moon, Sun, Star, Heart, Leaf, Flower2, Diamond, Coffee, Cloud, Umbrella, Music, Feather, Anchor, Fish, Bird, Shell, Snowflake, Waves, Sprout, Clover, Apple, Cherry, Bell, KeyRound, Camera, BookOpen, Flag, Gem, Circle, Triangle, Hexagon, Sparkles];
const labels = ['Луна', 'Солнце', 'Звезда', 'Сердце', 'Лист', 'Цветок', 'Ромб', 'Чашка', 'Облако', 'Зонт', 'Нота', 'Перо', 'Якорь', 'Рыба', 'Птица', 'Ракушка', 'Снежинка', 'Волны', 'Росток', 'Клевер', 'Яблоко', 'Вишня', 'Колокольчик', 'Ключ', 'Камера', 'Книга', 'Флаг', 'Кристалл', 'Круг', 'Треугольник', 'Шестиугольник', 'Искры'];
const difficulties = [{ size: 4 as const, title: 'Лёгкий' }, { size: 6 as const, title: 'Средний' }, { size: 8 as const, title: 'Сложный' }];
const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/games'); };

function Card({ card, revealed, side, onPress, disabled }: { card: MemoryCard; revealed: boolean; side: number; onPress: () => void; disabled: boolean }) {
  const { colors } = useTheme();
  const { motionReduced, language } = usePreferences();
  const [flip] = useState(() => new Animated.Value(revealed ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(flip, { toValue: revealed ? 1 : 0, duration: motionReduced ? 0 : 240, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [flip, revealed, motionReduced]);
  const Icon = symbols[card.symbol];
  const label = `${translate('Карточка', language)} ${card.id + 1}. ${translate(revealed ? labels[card.symbol] : 'Закрыта', language)}${card.matched ? `. ${translate('Пара найдена', language)}` : ''}`;
  const radius = Math.min(18, side * 0.23);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: revealed }} disabled={disabled} onPress={onPress} style={{ width: side, height: side }}>
    <Animated.View style={[styles.face, { borderRadius: radius, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, opacity: flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] }), transform: [{ perspective: 700 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }]}><View style={{ width: side * 0.13, height: side * 0.13, borderRadius: side, backgroundColor: colors.textMuted, opacity: 0.5 }} /></Animated.View>
    <Animated.View style={[styles.face, { borderRadius: radius, backgroundColor: card.matched ? colors.cardBg : colors.accent, borderColor: card.matched ? colors.cardBorder : colors.accent, opacity: flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] }), transform: [{ perspective: 700 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) }] }]}><Icon size={side * 0.48} strokeWidth={1.8} color={card.matched ? colors.textSecondary : colors.onAccent} /></Animated.View>
  </Pressable>;
}
export function MemoryScreen({ profileId }: { profileId: string }) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const { motionReduced } = usePreferences();
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [game, setGame] = useState<ReturnType<typeof newMemory> | null>(null);
  const [records, setRecords] = useState<MemoryRecords | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [sheet, setSheet] = useState<'pause' | 'restart' | null>(null);
  const mounted = useRef(true);
  const revision = useRef(0);
  const recorded = useRef(false);
  const activeRound = useRef(false);
  const latestRecords = useRef(emptyRecords());
  const pause = useCallback(() => { if (activeRound.current) setSheet(s => s || 'pause'); }, []);
  useFocusEffect(useCallback(() => () => pause(), [pause]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
    return () => subscription.remove();
  }, [pause]);
  useEffect(() => {
    mounted.current = true; let cancelled = false;
    void loadMemoryRecords(profileId).then(value => { if (!cancelled) { latestRecords.current = value; setRecords(value); } }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; mounted.current = false; };
  }, [profileId, retry]);
  useEffect(() => {
    if (!game || game.selected.length !== 2 || sheet) return;
    const [a, b] = game.selected.map(id => game.cards[id]);
    const timer = setTimeout(() => {
      setGame(current => current ? resolveCards(current) : current);
      if (a.symbol === b.symbol && !motionReduced) void Haptics.selectionAsync().catch(() => {});
    }, a.symbol === b.symbol ? 400 : 1000);
    return () => clearTimeout(timer);
  }, [game, sheet, motionReduced]);
  const finished = !!game && memoryFinished(game);
  const persist = useCallback((value: MemoryRecords) => {
    latestRecords.current = value;
    const version = ++revision.current;
    void saveMemoryRecords(profileId, value).then(() => { if (mounted.current && version === revision.current) { setSaveError(false); setRecords(value); } }).catch(() => { if (mounted.current && version === revision.current) setSaveError(true); });
  }, [profileId]);
  useEffect(() => {
    if (!game || !finished || !records || recorded.current) return;
    recorded.current = true; activeRound.current = false;
    const next = { ...latestRecords.current, [game.size]: Math.min(latestRecords.current[game.size] ?? Infinity, game.moves) };
    // Store the completed round once, independently of modal opening/closing.
    persist(next);
    if (!motionReduced) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [game, finished, records, persist, motionReduced]);
  const start = () => { recorded.current = false; activeRound.current = true; setGame(newMemory(difficulty)); setSheet(null); };
  const chooseDifficulty = () => {
    if (game && finished && records) setRecords({ ...records, [game.size]: Math.min(records[game.size] ?? Infinity, game.moves) });
    activeRound.current = false; setGame(null); setSheet(null);
  };
  const boardSize = Math.min(width - 24, 430, Math.max(256, height - 290));
  const gap = game?.size === 8 ? 4 : 8;
  const side = game ? Math.floor((boardSize - gap * (game.size - 1)) / game.size) : 0;
  return <ScreenSafeArea edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={styles.header}><GlassTool label="Назад" onPress={leave}><ChevronLeft size={22} color={colors.textPrimary} /></GlassTool><Text translate={false} style={[styles.title, { color: colors.textPrimary }]}>Memory</Text><GlassTool label="Пауза" onPress={pause} disabled={!game || finished}><Pause size={19} color={colors.textPrimary} /></GlassTool></View>
    {!records ? <View style={styles.loading}>{loadError ? <><Text style={{ color: colors.textPrimary }}>Не удалось открыть игру</Text><Pressable onPress={() => { setLoadError(false); setRetry(n => n + 1); }}><Text style={{ color: colors.textPrimary, padding: 16 }}>Повторить</Text></Pressable></> : <ActivityIndicator color={colors.textPrimary} />}</View> : <ScrollView bounces={false} contentContainerStyle={styles.content}>
      {!game ? <View style={{ width: Math.min(width - 40, 390), gap: 12 }}>
        <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Выберите сложность</Text>
        {difficulties.map(item => <Pressable key={item.size} accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ selected: difficulty === item.size }} onPress={() => setDifficulty(item.size)} style={[styles.difficulty, { backgroundColor: colors.cardBg, borderColor: difficulty === item.size ? colors.textPrimary : colors.cardBorder }]}><View><Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.title}</Text><Text translate={false} style={{ color: colors.textSecondary, marginTop: 4 }}>{item.size} × {item.size} · {translate('Пары')}: {item.size * item.size / 2}</Text></View><Text translate={false} style={{ color: colors.textMuted }}>{records[item.size] ? `${translate('Рекорд')}: ${records[item.size]}` : '—'}</Text></Pressable>)}
        <Pressable accessibilityRole="button" onPress={start} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent, fontWeight: '600' }}>Играть</Text></Pressable>
      </View> : <>
        <View style={[styles.stats, { width: boardSize }]}><View><Text style={{ color: colors.textMuted }}>Пары</Text><Text translate={false} style={[styles.number, { color: colors.textPrimary }]}>{pairCount(game)} / {game.cards.length / 2}</Text></View><View><Text style={{ color: colors.textMuted }}>Ходы</Text><Text translate={false} style={[styles.number, { color: colors.textPrimary }]}>{game.moves}</Text></View></View>
        <View style={{ width: boardSize, flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {game.cards.map(card => <Card key={card.id} card={card} revealed={card.matched || game.selected.includes(card.id)} side={side} disabled={!!sheet || finished || card.matched || game.selected.includes(card.id) || game.selected.length === 2} onPress={() => setGame(current => current ? revealCard(current, card.id) : current)} />)}
        </View>
        <Pressable onPress={() => setSheet('restart')} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Новая игра</Text></Pressable>
      </>}
      {saveError && <Pressable onPress={() => { persist(latestRecords.current); }}><Text style={{ color: colors.textSecondary, padding: 12 }}>Не удалось сохранить игру. Нажмите, чтобы повторить.</Text></Pressable>}
    </ScrollView>}
    <GlassModal visible={!!sheet} onClose={() => setSheet(null)}><Text style={[styles.subtitle, { color: colors.textPrimary }]}>{sheet === 'restart' ? 'Начать заново?' : 'Пауза'}</Text><Text style={{ color: colors.textSecondary, lineHeight: 24 }}>Открывайте по две карточки и находите одинаковые пары.</Text><Pressable onPress={sheet === 'restart' ? start : () => setSheet(null)} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent }}>{sheet === 'restart' ? 'Начать заново' : 'Продолжить'}</Text></Pressable><Pressable onPress={sheet === 'restart' ? () => setSheet(null) : chooseDifficulty} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>{sheet === 'restart' ? 'Отмена' : 'Выбор сложности'}</Text></Pressable></GlassModal>
    <GlassModal visible={finished && !sheet} onClose={chooseDifficulty}><Text style={[styles.subtitle, { color: colors.textPrimary }]}>Все пары найдены</Text><Text style={{ color: colors.textSecondary }}>{'Ходы'}: <Text translate={false}>{game?.moves}</Text></Text><Pressable onPress={() => { chooseDifficulty(); }} style={[styles.action, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent }}>Выбор сложности</Text></Pressable><Pressable onPress={() => { if (game && records) setRecords({ ...records, [game.size]: Math.min(records[game.size] ?? Infinity, game.moves) }); start(); }} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Ещё раз</Text></Pressable></GlassModal>
  </ScreenSafeArea>;
}
const styles = StyleSheet.create({
  header: { height: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 24, fontWeight: '600', marginBottom: 12, marginTop: 12 },
  difficulty: { minHeight: 86, padding: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  number: { fontSize: 23, fontWeight: '600', marginTop: 4, fontVariant: ['tabular-nums'] },
  face: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, backfaceVisibility: 'hidden' },
  action: { minHeight: 50, padding: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
