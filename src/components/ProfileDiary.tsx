import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, Text, TextInput } from './Typography';
import { GlassModal } from './GlassModal';
import { useTheme } from '../theme/themeContext';
import { usePreferences } from '../context/PreferencesContext';
interface Entry { id: string; text: string; date: string; }
export function ProfileDiary({ profileId }: { profileId: string }) {
  const { colors } = useTheme();
  const { language } = usePreferences();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const key = `@catec_diary:${profileId}`;
  const ready = loadedKey === key;
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key).then(raw => { if (active) { setEntries(raw ? JSON.parse(raw) : []); setLoadedKey(key); } }).catch(() => { if (active) Alert.alert('Не удалось открыть дневник', 'Попробуйте ещё раз.'); });
    return () => { active = false; };
  }, [key]);
  const persist = async (next: Entry[]) => {
    setSaving(true);
    try { await AsyncStorage.setItem(key, JSON.stringify(next)); setEntries(next); setEditing(null); }
    catch { Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.'); }
    finally { setSaving(false); }
  };
  const save = () => {
    if (!text.trim() || saving) return;
    const existing = entries.find(item => item.id === editing);
    const entry = { id: existing?.id || `${Date.now()}`, text: text.trim(), date: existing?.date || new Date().toISOString() };
    void persist(existing ? entries.map(item => item.id === entry.id ? entry : item) : [entry, ...entries]);
  };
  return <View>
    <View style={s.heading}><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '600' }}>Дневник</Text><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 5 }}>Видно только вам · на этом устройстве</Text></View><Pressable disabled={!ready} accessibilityLabel="Добавить запись" onPress={() => { setText(''); setEditing('new'); }} style={[s.add, { backgroundColor: colors.accentLight }]}><Plus color={colors.accent} size={22} /></Pressable></View>
    {ready && !entries.length && <Text style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22, marginVertical: 20 }}>Записывайте мысли и планы.</Text>}
    {(ready ? entries : []).map(entry => <Pressable key={entry.id} onPress={() => { setText(entry.text); setEditing(entry.id); }} style={[s.entry, { backgroundColor: colors.cardBg }]}><View style={s.heading}><Text style={{ flex: 1, color: colors.textMuted, fontSize: 12 }}>{new Date(entry.date).toLocaleDateString({ ru: 'ru-RU', en: 'en-GB', kk: 'kk-KZ' }[language], { day: 'numeric', month: 'long', year: 'numeric' })}</Text><Pencil size={14} color={colors.textMuted} /></View><Text translate={false} style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 24, marginTop: 10 }}>{entry.text}</Text></Pressable>)}
    <GlassModal visible={!!editing} onClose={() => { if (!saving) setEditing(null); }}><Text style={{ color: colors.textPrimary, fontSize: 23, fontWeight: '600', marginBottom: 16 }}>Запись в дневнике</Text><TextInput multiline maxLength={10000} value={text} onChangeText={setText} placeholder="Мысли, заметки, планы..." placeholderTextColor={colors.textMuted} style={[s.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.inputBorder }]} /><View style={s.actions}>{editing !== 'new' && <Pressable disabled={saving} accessibilityLabel="Удалить запись" onPress={() => Alert.alert('Удалить запись?', undefined, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => void persist(entries.filter(item => item.id !== editing)) }])} style={s.add}><Trash2 size={21} color={colors.danger} /></Pressable>}<Pressable disabled={saving || !text.trim()} onPress={save} style={[s.save, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: '600' }}>Сохранить</Text></Pressable></View></GlassModal>
  </View>;
}
const s = StyleSheet.create({ heading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, add: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }, entry: { borderRadius: 20, padding: 18, marginTop: 14 }, input: { minHeight: 180, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, textAlignVertical: 'top', fontSize: 17 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 }, save: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' } });
