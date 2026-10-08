import React from 'react';
import { Image, StyleSheet, View } from "react-native";
import { Alert, Pressable, Text } from "./Typography";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FileText, Pause, Play } from 'lucide-react-native';
import { Material } from '../types';
import { openMaterial } from '../services/materials';
import { useTheme } from '../theme/themeContext';

export const durationLabel = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function Voice({ item }: { item: Material }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(item.uri || null);
  const status = useAudioPlayerStatus(player);
  const toggle = async () => { if (status.playing) player.pause(); else { if (status.didJustFinish) await player.seekTo(0); player.play(); } };
  return <Pressable accessibilityLabel={status.playing ? 'Пауза' : 'Воспроизвести голосовое сообщение'} onPress={event => { event.stopPropagation(); void toggle().catch(() => Alert.alert('Не удалось открыть файл', 'Попробуйте ещё раз.')); }} style={[s.voice, { backgroundColor: colors.accentLight }]}>
    {status.playing ? <Pause size={23} color={colors.accent} /> : <Play size={23} color={colors.accent} />}
    <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontSize: 14 }}>Голосовое сообщение</Text><View style={[s.track, { backgroundColor: colors.cardBorder }]}><View style={{ height: 3, width: `${Math.min(100, status.currentTime / (status.duration || item.duration || 1) * 100)}%`, backgroundColor: colors.accent }} /></View></View>
    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{durationLabel(status.playing ? status.currentTime : status.duration || item.duration)}</Text>
  </Pressable>;
}
function Video({ item }: { item: Material }) {
  const round = item.type === 'videoNote';
  const player = useVideoPlayer(item.uri || null);
  return <View style={round ? s.circle : s.video}>
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={!round} />
    {round && <Pressable accessibilityLabel="Воспроизвести видеосообщение" onPress={event => { event.stopPropagation(); if (player.playing) player.pause(); else player.play(); }} style={StyleSheet.absoluteFill}><View style={s.videoBadge}><Play size={16} color="#fff" /><Text style={{ color: '#fff', fontSize: 12 }}>{durationLabel(item.duration)}</Text></View></Pressable>}
  </View>;
}
export function MaterialView({ item }: { item: Material }) {
  const { colors } = useTheme();
  if (item.type === 'voice' && item.uri) return <Voice item={item} />;
  if ((item.type === 'video' || item.type === 'videoNote') && item.uri) return <Video item={item} />;
  if (item.type === 'image' && item.uri) return <Image source={{ uri: item.uri }} resizeMode="cover" style={s.image} />;
  return <Pressable accessibilityLabel={`Открыть ${item.title}`} onPress={event => { event.stopPropagation(); void openMaterial(item).catch(() => Alert.alert('Не удалось открыть файл', 'Попробуйте ещё раз.')); }} style={[s.document, { backgroundColor: colors.accentLight }]}><FileText color={colors.accent} size={25} /><View style={{ flex: 1 }}><Text translate={false} numberOfLines={2} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{item.title}</Text>{item.size && <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.size}</Text>}</View></Pressable>;
}
const s = StyleSheet.create({ image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginVertical: 8 }, document: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, marginVertical: 6 }, voice: { minWidth: 220, padding: 13, gap: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 18, marginVertical: 6 }, track: { height: 3, marginTop: 8, borderRadius: 2, overflow: 'hidden' }, video: { width: '100%', aspectRatio: 4 / 3, borderRadius: 18, overflow: 'hidden', marginVertical: 8 }, circle: { width: 220, height: 220, borderRadius: 110, overflow: 'hidden', marginVertical: 8, backgroundColor: '#172536' }, videoBadge: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 } });
