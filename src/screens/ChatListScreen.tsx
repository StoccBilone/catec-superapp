import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MessageCircle, Plus, Search, Users } from 'lucide-react-native';
import { UserProfile } from '../types';
import { useTheme } from '../theme/themeContext';
import { GlassModal } from '../components/GlassModal';
import { ChatRoom, createChatRoom, getChatRooms } from '../services/chatRooms';
import { StorageService } from '../services/storage';

export function ChatListScreen({ profile }: { profile: UserProfile }) {
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ChatRoom['kind']>('chat');
  const [saving, setSaving] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void getChatRooms(profile.id).then(async list => {
      const entries = await Promise.all(list.map(async room => {
        const messages = await StorageService.getChatMessages(room.storageKey);
        return [room.id, messages[messages.length - 1]?.text || 'Начните разговор'] as const;
      }));
      if (active) { setRooms(list); setPreviews(Object.fromEntries(entries)); }
    }).catch(() => Alert.alert('Чаты', 'Не удалось загрузить беседы. Попробуйте открыть экран снова.'));
    return () => { active = false; };
  }, [profile.id]));
  const open = (room: ChatRoom) => router.push({ pathname: '/conversation', params: { id: room.id } });
  const create = async (group = false) => {
    if (saving || (!group && !title.trim())) return;
    setSaving(true);
    try {
      const room = await createChatRoom(profile.id, group ? profile.group : title, group ? 'group' : kind, group ? profile.group : undefined);
      setVisible(false); setTitle(''); open(room);
    } catch { Alert.alert('Не удалось создать чат', 'Попробуйте ещё раз.'); }
    finally { setSaving(false); }
  };
  const filtered = rooms.filter(room => room.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <View style={s.page}>
    <View style={s.header}><Text style={[s.heading, { color: colors.textPrimary }]}>Сообщения</Text><TouchableOpacity accessibilityLabel="Создать чат или беседу" onPress={() => setVisible(true)} style={[s.plus, { backgroundColor: colors.accentLight }]}><Plus size={25} color={colors.accent} /></TouchableOpacity></View>
    <View style={s.search}><Search size={19} color={colors.textMuted} /><TextInput value={query} onChangeText={setQuery} placeholder="Поиск" placeholderTextColor={colors.textMuted} style={[s.input, { color: colors.textPrimary }]} /></View>
    {rooms.length === 0 ? <View style={s.empty}><View style={[s.emptyIcon, { backgroundColor: colors.accentLight }]}><MessageCircle size={36} color={colors.accent} /></View><Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Здесь будут ваши чаты</Text><Text style={[s.emptyText, { color: colors.textSecondary }]}>Создайте личный чат или беседу для учебной группы.</Text><TouchableOpacity onPress={() => setVisible(true)} style={[s.button, { backgroundColor: colors.accent }]}><Plus color="#fff" size={19} /><Text style={s.buttonText}>Создать чат</Text></TouchableOpacity></View> : <ScrollView style={s.list} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 20 }}>
      {filtered.map(room => <TouchableOpacity key={room.id} onPress={() => open(room)} style={[s.row, { borderBottomColor: colors.divider }]}><View style={[s.avatar, { backgroundColor: colors.accentLight }]}>{room.kind === 'group' ? <Users size={24} color={colors.accent} /> : <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 19 }}>{room.title.slice(0, 1).toUpperCase()}</Text>}</View><View style={{ flex: 1 }}><Text numberOfLines={1} style={[s.roomTitle, { color: colors.textPrimary }]}>{room.title}</Text><Text numberOfLines={2} style={[s.preview, { color: colors.textSecondary }]}>{previews[room.id]}</Text></View></TouchableOpacity>)}
      {!filtered.length && <Text style={[s.emptyText, { color: colors.textMuted }]}>Ничего не найдено</Text>}
    </ScrollView>}
    <GlassModal visible={visible} onClose={() => setVisible(false)}><Text style={[s.emptyTitle, { color: colors.textPrimary, marginBottom: 20 }]}>Новый разговор</Text><View style={s.kindRow}>{(['chat', 'group'] as const).map(item => <TouchableOpacity key={item} onPress={() => setKind(item)} style={[s.kind, { backgroundColor: kind === item ? colors.accentLight : '#f5f7fa' }]}><Text style={{ color: kind === item ? colors.accent : colors.textSecondary }}>{item === 'chat' ? 'Личный чат' : 'Беседа'}</Text></TouchableOpacity>)}</View><TextInput value={title} onChangeText={setTitle} maxLength={60} placeholder={kind === 'chat' ? 'Имя собеседника' : 'Название беседы'} placeholderTextColor={colors.textMuted} style={[s.titleInput, { borderColor: colors.inputBorder, color: colors.textPrimary }]} /><Text style={[s.hint, { color: colors.textMuted }]}>Демо: разговор сохраняется на этом устройстве.</Text><TouchableOpacity disabled={!title.trim() || saving} onPress={() => void create()} style={[s.button, { backgroundColor: colors.accent, opacity: title.trim() && !saving ? 1 : 0.4 }]}><Text style={s.buttonText}>Создать</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => void create(true)} style={s.groupButton}><Users color={colors.accent} size={18} /><Text style={{ color: colors.accent }}>Добавить группу {profile.group}</Text></TouchableOpacity></GlassModal>
  </View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, flexShrink: 0 }, heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }, plus: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, search: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: '#f3f6f9', borderRadius: 16, height: 48 }, input: { flex: 1, height: 48, fontSize: 16 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, emptyIcon: { width: 82, height: 82, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 22 }, emptyTitle: { fontSize: 23, fontWeight: '700', letterSpacing: -0.4 }, emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginVertical: 12 }, button: { minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 16, marginTop: 12 }, buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' }, list: { flex: 1, marginTop: 14, overflow: 'hidden' }, row: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth }, avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }, roomTitle: { fontSize: 17, fontWeight: '700' }, preview: { fontSize: 14, lineHeight: 20, marginTop: 4 }, kindRow: { flexDirection: 'row', gap: 8 }, kind: { padding: 12, borderRadius: 12, flex: 1, alignItems: 'center' }, titleInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16, marginTop: 16 }, hint: { fontSize: 12, lineHeight: 18, marginTop: 12 }, groupButton: { paddingVertical: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
});
