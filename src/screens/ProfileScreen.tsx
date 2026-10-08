import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Animated, Image, ScrollView, StyleSheet, View } from "react-native";
import { Alert, Pressable, Text, TextInput } from "../components/Typography";
import { LinearGradient } from 'expo-linear-gradient';
import { Award, CheckCircle2, GraduationCap, Image as ImageIcon, Pencil, Settings } from 'lucide-react-native';
import { NewsItem, UserProfile } from '../types';
import { PROFILE_BANNERS } from '../data/catecData';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { usePreferences } from '../context/PreferencesContext';
import { GlassModal } from '../components/GlassModal';
import { SettingsModal } from '../components/SettingsModal';
import { MaterialView } from '../components/MaterialView';
import { pickPhoto } from '../services/photos';

interface Props { profile: UserProfile; onUpdateProfile: (updated: UserProfile) => void; onLogout: () => void; onOpenNotifications: () => void; }
export function ProfileScreen({ profile, onUpdateProfile, onLogout, onOpenNotifications }: Props) {
  const { colors, mode } = useTheme();
  const { motionReduced } = usePreferences();
  const [tab, setTab] = useState<'profile' | 'posts'>('profile');
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [settings, setSettings] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [busy, setBusy] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const tabsY = useRef(0);
  const [fade] = useState(() => new Animated.Value(1));
  const activeBanner = PROFILE_BANNERS.find(banner => banner.id === profile.bannerId) || PROFILE_BANNERS[0];
  useFocusEffect(useCallback(() => {
    let active = true;
    void StorageService.getAllNewsAndPosts().then(items => { if (active) setPosts(items.filter(item => item.isUserCreated && (item.authorId ? item.authorId === (profile.cloudId || profile.id) : item.author.startsWith(`${profile.fullName} ·`)))); });
    return () => { active = false; };
  }, [profile.id, profile.cloudId, profile.fullName]));
  const update = async (next: UserProfile) => { await StorageService.saveUserProfile(next); onUpdateProfile(next); };
  const photo = async (kind: 'avatar' | 'cover') => {
    if (busy) return;
    setBusy(true);
    try { const uri = await pickPhoto(kind); if (uri) await update({ ...profile, ...(kind === 'avatar' ? { avatarUrl: uri } : { coverUrl: uri }) }); }
    catch { Alert.alert('Не удалось добавить фото', 'Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  };
  const switchTab = (next: typeof tab) => {
    if (next === tab) return;
    // Both panels retain a full viewport below the tabs, avoiding native offset clamping.
    if (offset.current > tabsY.current) scroll.current?.scrollTo({ y: tabsY.current, animated: false });
    fade.stopAnimation(); fade.setValue(motionReduced ? 1 : 0);
    setTab(next);
    Animated.timing(fade, { toValue: 1, duration: motionReduced ? 0 : 180, useNativeDriver: true }).start();
  };
  return <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={s.header}><Text style={[s.heading, { color: colors.textPrimary }]}>Профиль</Text><Pressable accessibilityLabel="Настройки" onPress={() => setSettings(true)} style={[s.settings, { borderColor: colors.cardBorder }]}><Settings size={22} color={colors.textPrimary} /></Pressable></View>
    <ScrollView ref={scroll} onLayout={event => setViewportHeight(event.nativeEvent.layout.height)} onScroll={event => { offset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <View style={s.cover}><LinearGradient colors={activeBanner.colors as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />{profile.coverUrl && <Image source={{ uri: profile.coverUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} />}<Pressable disabled={busy} accessibilityLabel="Изменить обложку" onPress={() => void photo('cover')} style={s.coverButton}>{profile.coverUrl ? <Pencil size={16} color="#fff" /> : <ImageIcon size={16} color="#fff" />}<Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{profile.coverUrl ? 'Изменить' : 'Добавить фото'}</Text></Pressable><LinearGradient colors={[mode === 'dark' ? 'rgba(14,19,27,0)' : 'rgba(255,255,255,0)', colors.canvas]} style={s.coverFade} pointerEvents="none" /></View>
      <View style={s.identity}><Pressable disabled={busy} accessibilityLabel="Изменить фото профиля" onPress={() => void photo('avatar')} style={[s.avatar, { backgroundColor: colors.accentLight, borderColor: colors.canvas }]}>{profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={s.avatarImage} /> : <Text style={{ color: colors.accent, fontSize: 27, fontWeight: '700' }}>{profile.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</Text>}<View style={[s.editBadge, { backgroundColor: colors.accent, borderColor: colors.canvas }]}><Pencil size={12} color="#fff" /></View></Pressable><Text translate={false} style={[s.name, { color: colors.textPrimary }]}>{profile.fullName}</Text><Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>Студент ЦАТЭК · № {profile.studentId}</Text><View style={s.tags}><Text style={[s.group, { color: colors.accent, backgroundColor: colors.accentLight }]}>{profile.group}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{profile.course} курс</Text></View><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 12 }}>{profile.faculty}</Text><Pressable onPress={() => { setBio(profile.bio || ''); setEditingBio(true); }} style={s.bio}><Text translate={!profile.bio} style={{ color: profile.bio ? colors.textPrimary : colors.accent, fontSize: 15, lineHeight: 22, flex: 1 }}>{profile.bio || 'Добавить биографию'}</Text><Pencil size={16} color={colors.accent} /></Pressable></View>
      <View onLayout={event => { tabsY.current = event.nativeEvent.layout.y; }} style={[s.tabs, { borderBottomColor: colors.divider }]}>{(['profile', 'posts'] as const).map(item => <Pressable key={item} onPress={() => switchTab(item)} style={[s.tab, { borderBottomColor: item === tab ? colors.accent : 'transparent' }]}><Text style={{ color: item === tab ? colors.accent : colors.textMuted, fontSize: 14, fontWeight: '600' }}>{item === 'profile' ? 'О студенте' : 'Публикации'}</Text></Pressable>)}</View>
      <Animated.View style={{ minHeight: Math.max(0, viewportHeight - 50), opacity: fade, paddingHorizontal: 22, paddingTop: 24 }}>
        {tab === 'profile' ? <View style={s.stats}>{[{ icon: Award, value: profile.averageGrade.toFixed(2), label: 'Средний GPA', color: colors.warning }, { icon: CheckCircle2, value: `${profile.attendancePercent}%`, label: 'Посещаемость', color: colors.success }, { icon: GraduationCap, value: '7 сем.', label: 'Аттестация', color: colors.accent }].map(item => <View key={item.label} style={[s.stat, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}><item.icon size={20} color={item.color} /><Text style={[s.statValue, { color: colors.textPrimary }]}>{item.value}</Text><Text numberOfLines={2} style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text></View>)}</View> : posts.length ? posts.map(post => <View key={post.id} style={[s.post, { borderBottomColor: colors.divider }]}><Text translate={false} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{profile.fullName}</Text><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{post.date}</Text><Text translate={false} style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 23, marginTop: 12 }}>{post.content}</Text>{post.imageUri && <Image source={{ uri: post.imageUri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginTop: 12 }} />}{post.attachments?.map(item => <MaterialView key={item.id} item={item} />)}</View>) : <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 30 }}>Ваши публикации появятся здесь.</Text>}
      </Animated.View>
    </ScrollView>
    <SettingsModal visible={settings} onClose={() => setSettings(false)} profile={profile} onUpdate={update} onLogout={onLogout} onNotifications={onOpenNotifications} />
    <GlassModal visible={editingBio} onClose={() => { if (!busy) setEditingBio(false); }}><Text style={[s.heading, { color: colors.textPrimary, marginBottom: 16 }]}>Биография</Text><TextInput value={bio} onChangeText={setBio} multiline maxLength={200} placeholder="Расскажите о себе" placeholderTextColor={colors.textMuted} style={[s.bioInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} /><Text style={{ color: colors.textMuted, textAlign: 'right', marginTop: 8 }}>{bio.length}/200</Text><Pressable disabled={busy} onPress={() => { setBusy(true); void update({ ...profile, bio: bio.trim() }).then(() => setEditingBio(false)).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.')).finally(() => setBusy(false)); }} style={[s.save, { backgroundColor: colors.accent }]}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Сохранить</Text></Pressable></GlassModal>
  </View>;
}
const s = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, flexShrink: 0 }, heading: { fontSize: 27, fontWeight: '700', letterSpacing: -0.4 }, settings: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, cover: { height: 190 }, coverFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }, coverButton: { position: 'absolute', top: 16, right: 18, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(0,0,0,0.28)' }, identity: { paddingHorizontal: 22, marginTop: -48 }, avatar: { width: 82, height: 82, borderRadius: 27, borderWidth: 4, alignItems: 'center', justifyContent: 'center' }, avatarImage: { width: '100%', height: '100%', borderRadius: 23 }, editBadge: { position: 'absolute', right: -3, bottom: -3, width: 25, height: 25, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 25, fontWeight: '700', marginTop: 12, letterSpacing: -0.5 }, tags: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 16 }, group: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, fontSize: 12, fontWeight: '600' }, bio: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 16 }, tabs: { flexDirection: 'row', marginHorizontal: 22, marginTop: 8, borderBottomWidth: StyleSheet.hairlineWidth }, tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2 }, stats: { flexDirection: 'row', gap: 10, alignItems: 'stretch' }, stat: { flex: 1, minWidth: 0, padding: 12, borderRadius: 20, borderWidth: 1 }, statValue: { fontSize: 22, fontWeight: '700', marginTop: 8 }, statLabel: { fontSize: 11, lineHeight: 15, marginTop: 4 }, post: { paddingBottom: 20, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth }, bioInput: { minHeight: 120, textAlignVertical: 'top', padding: 14, fontSize: 17, borderWidth: 1, borderRadius: 16 }, save: { alignItems: 'center', padding: 15, borderRadius: 16, marginTop: 18 } });
