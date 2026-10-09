import React from 'react';
import { Image, StyleSheet, View } from "react-native";
import { Alert, Pressable, Text } from "./Typography";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VoiceWaveform } from './VoiceWaveform';
import { GlassTool } from './GlassTool';
import { FileText, Pause, Play } from 'lucide-react-native';
import { Material } from '../types';
import { openMaterial } from '../services/materials';
import { useTheme } from '../theme/themeContext';

export const durationLabel = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function Voice({ item }: { item: Material }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(item.uri || null);
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = React.useState(1);
  const toggle = async () => { if (status.playing) player.pause(); else { if (status.didJustFinish) await player.seekTo(0); player.play(); } };
  const duration = status.duration || item.duration || 1;
  return <Pressable onPress={event => event.stopPropagation()} style={s.voice}>
    <GlassTool label={status.playing ? 'Пауза' : 'Воспроизвести голосовое сообщение'} onPress={() => void toggle().catch(() => Alert.alert('Не удалось открыть файл', 'Попробуйте ещё раз.'))}>{status.playing ? <Pause size={22} color={colors.textPrimary} /> : <Play size={22} color={colors.textPrimary} />}</GlassTool>
    <View style={{ flex: 1 }}><VoiceWaveform samples={item.waveform || []} progress={Math.min(1, status.currentTime / duration)} onSeek={fraction => void player.seekTo(fraction * duration).catch(() => {})} /><Text translate={false} style={{ color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] }}>{durationLabel(status.currentTime || duration)}</Text></View>
    <Pressable accessibilityLabel="Скорость воспроизведения" onPress={() => { const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1; player.setPlaybackRate(next); setRate(next); }} style={{ minHeight: 44, minWidth: 36, alignItems: 'center', justifyContent: 'center' }}><Text translate={false} style={{ color: colors.textSecondary, fontSize: 12 }}>{rate}×</Text></Pressable>
  </Pressable>;
}
function Video({ item }: { item: Material }) {
  const round = item.type === 'videoNote';
  const player = useVideoPlayer(item.uri || null);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  return <View style={round ? s.circle : s.video}>
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={!round} />
    {round && <Pressable accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести видеосообщение'} onPress={event => { event.stopPropagation(); if (player.playing) player.pause(); else player.play(); }} style={StyleSheet.absoluteFill}><View style={s.videoBadge}>{isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}<Text style={{ color: '#fff', fontSize: 12 }}>{durationLabel(item.duration)}</Text></View></Pressable>}
  </View>;
}
export function MaterialView({ item }: { item: Material }) {
  const { colors } = useTheme();
  if (item.type === 'voice' && item.uri) return <Voice item={item} />;
  if ((item.type === 'video' || item.type === 'videoNote') && item.uri) return <Video item={item} />;
  if (item.type === 'image' && item.uri) return <Image source={{ uri: item.uri }} resizeMode="cover" style={s.image} />;
  return <Pressable accessibilityLabel={`Открыть ${item.title}`} onPress={event => { event.stopPropagation(); void openMaterial(item).catch(() => Alert.alert('Не удалось открыть файл', 'Попробуйте ещё раз.')); }} style={[s.document, { backgroundColor: colors.accentLight }]}><FileText color={colors.accent} size={25} /><View style={{ flex: 1 }}><Text translate={false} numberOfLines={2} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{item.title}</Text>{item.size && <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.size}</Text>}</View></Pressable>;
}
const s = StyleSheet.create({ image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginVertical: 8 }, document: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, marginVertical: 6 }, voice: { width: 260, maxWidth: '100%', padding: 0, gap: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 18, marginVertical: 6 }, track: { height: 3, marginTop: 8, borderRadius: 2, overflow: 'hidden' }, video: { width: '100%', aspectRatio: 4 / 3, borderRadius: 18, overflow: 'hidden', marginVertical: 8 }, circle: { width: 220, height: 220, borderRadius: 110, overflow: 'hidden', marginVertical: 8, backgroundColor: '#0A0A0A' }, videoBadge: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 } });
