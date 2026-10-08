import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Bell, ChevronDown, Clock } from 'lucide-react-native';
import { Alert, Pressable, Text, TextInput } from '../components/Typography';
import { GlassHeader } from '../components/GlassHeader';
import { GlassModal } from '../components/GlassModal';
import { GlassTool } from '../components/GlassTool';
import { Lesson, UserProfile } from '../types';
import { CATEC_GROUPS, CATEC_LESSONS } from '../data/catecData';
import { BELL_TIMES, collegeClock, countdown, scheduleStatus } from '../services/scheduleClock';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
export function ScheduleScreen({ profile, onUpdateGroup }: { profile: UserProfile; onOpenNotifications: () => void; onUpdateGroup: (name: string) => void | Promise<void> }) {
  const { colors } = useTheme();
  const [now, setNow] = useState(() => new Date());
  const [day, setDay] = useState(() => { const today = collegeClock(new Date()).day; return today >= 1 && today <= 5 ? today : 1; });
  const [subgroupValue, setSubgroup] = useState<0 | 1 | 2>(0);
  const [loadedSubgroupKey, setLoadedSubgroupKey] = useState('');
  const [picker, setPicker] = useState(false);
  const [bells, setBells] = useState(false);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const groupLessons = useMemo(() => CATEC_LESSONS.filter(item => item.group === profile.group), [profile.group]);
  const subgroupKey = `@catec_subgroup:${profile.cloudId || profile.id}:${profile.group}`;
  const subgroupReady = loadedSubgroupKey === subgroupKey;
  const subgroup = subgroupReady ? subgroupValue : 0;
  const lessons = groupLessons.filter(item => !item.variant || !subgroup || item.variant === subgroup);
  const dayLessons = lessons.filter(item => item.dayOfWeek === day).sort((a, b) => a.pairNumber - b.pairNumber);
  const status = scheduleStatus(lessons, now);
  const noteKey = (lesson: Lesson) => `${profile.cloudId || profile.id}:${lesson.id}`;
  useEffect(() => { void StorageService.getLessonNotes().then(setNotes); }, []);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(subgroupKey).then(value => { if (active) { setSubgroup(value === '1' ? 1 : value === '2' ? 2 : 0); setLoadedSubgroupKey(subgroupKey); } }).catch(() => { if (active) setLoadedSubgroupKey(subgroupKey); });
    return () => { active = false; };
  }, [subgroupKey]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const saveNote = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try { const key = noteKey(selected); await StorageService.saveLessonNote(key, note); setNotes(previous => ({ ...previous, [key]: note })); setSelected(null); }
    catch { Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.'); }
    finally { setSaving(false); }
  };
  return <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <GlassHeader title="Расписание" showNotificationBell={false} />
    <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.groupRow}><Pressable accessibilityLabel="Учебная группа" onPress={() => setPicker(true)} style={[s.groupButton, { backgroundColor: colors.cardBg }]}><Text translate={false} style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{profile.group}</Text><ChevronDown size={17} color={colors.textSecondary} /></Pressable><GlassTool label="Расписание звонков" onPress={() => setBells(true)}><Bell size={20} color={colors.textPrimary} /></GlassTool></View>
      {groupLessons.some(item => item.variant) && <View style={[s.days, { marginTop: 0 }]}>{([0, 1, 2] as const).map(value => <Pressable key={value} disabled={!subgroupReady} onPress={() => { setSubgroup(value); void AsyncStorage.setItem(subgroupKey, String(value)).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.')); }} style={[s.day, { backgroundColor: subgroup === value ? colors.accent : colors.cardBg }]}><Text style={{ color: subgroup === value ? colors.onAccent : colors.textSecondary, fontSize: 12 }}>{value === 0 ? 'Обе' : 'Подгруппа'}{value > 0 ? ` ${value}` : ''}</Text></Pressable>)}</View>}
      <View style={[s.clock, { backgroundColor: colors.cardBg }]}>
        <View style={s.clockRow}><Clock size={17} color={colors.textMuted} /><Text style={{ color: colors.textSecondary, fontSize: 13 }}>Алматы</Text><Text style={{ color: colors.textPrimary, marginLeft: 'auto', fontSize: 22, fontVariant: ['tabular-nums'] }}>{status.time}</Text></View>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 18 }}>{status.current.length ? 'Сейчас идёт пара' : 'Сейчас занятий нет'}</Text>
        {status.current.map(lesson => <Text translate={false} key={lesson.id} style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6 }}>{lesson.subject}</Text>)}
        {status.remaining !== undefined && <View style={s.countdown}><Text style={{ color: colors.textMuted, fontSize: 13 }}>До конца пары</Text><Text style={{ color: colors.textPrimary, fontSize: 16, fontVariant: ['tabular-nums'] }}>{countdown(status.remaining)}</Text></View>}
        {status.wait !== undefined && <><View style={s.countdown}><Text style={{ color: colors.textMuted, fontSize: 13 }}>До следующей пары</Text><Text style={{ color: colors.textPrimary, fontSize: 16, fontVariant: ['tabular-nums'] }}>{countdown(status.wait)}</Text></View><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>{DAYS[status.next[0].dayOfWeek - 1]} · {status.next[0].timeStart}</Text></>}
      </View>
      <View style={s.days}>{DAYS.map((label, index) => <Pressable key={label} onPress={() => setDay(index + 1)} accessibilityRole="button" accessibilityState={{ selected: day === index + 1 }} style={[s.day, { backgroundColor: day === index + 1 ? colors.accent : colors.cardBg }]}><Text style={{ color: day === index + 1 ? colors.onAccent : colors.textSecondary, fontSize: 15, fontWeight: '600' }}>{label}</Text></Pressable>)}</View>
      {!dayLessons.length && <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 36 }}>Занятий нет</Text>}
      {dayLessons.map(lesson => {
        const savedNote = notes[noteKey(lesson)] || notes[lesson.id];
        return <Pressable key={lesson.id} onPress={() => { setSelected(lesson); setNote(savedNote || ''); }} style={[s.lesson, { backgroundColor: colors.cardBg, borderColor: status.current.some(item => item.id === lesson.id) ? colors.accent : colors.cardBorder }]}>
          <View style={s.lessonTop}><View><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{'Пара'} {lesson.pairNumber}</Text>{lesson.variant && <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{'Подгруппа'} {lesson.variant}</Text>}</View><Text style={{ color: colors.textPrimary, fontSize: 13, fontVariant: ['tabular-nums'] }}>{lesson.timeStart}–{lesson.timeEnd}</Text></View>
          <Text translate={false} style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, marginTop: 12 }}>{lesson.subject}</Text>
          {lesson.teacher ? <Text translate={false} style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>{lesson.teacher}</Text> : null}
          <Text translate={false} style={{ color: colors.textMuted, fontSize: 13, marginTop: 6 }}>{lesson.room}</Text>
          {savedNote && <Text translate={false} numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>{savedNote}</Text>}
        </Pressable>;
      })}
      {profile.group === 'П4 В' && <View style={[s.lesson, { backgroundColor: colors.cardBg }]}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Время не указано</Text><Text translate={false} style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 23, marginTop: 10 }}>Моделировать методы атаки и защиты информационных ресурсов</Text><Text translate={false} style={{ color: colors.textSecondary, marginTop: 8 }}>Науменко В.В.</Text></View>}
    </ScrollView>
    <GlassModal visible={bells} onClose={() => setBells(false)}><Text style={[s.title, { color: colors.textPrimary }]}>Расписание звонков</Text>{BELL_TIMES.map(item => <View key={item.pair} style={[s.bellRow, { borderBottomColor: colors.divider }]}><Text style={{ color: colors.textSecondary }}>{'Пара'} {item.pair}</Text><Text style={{ color: colors.textPrimary, fontSize: 18, fontVariant: ['tabular-nums'] }}>{item.start}–{item.end}</Text></View>)}</GlassModal>
    <GlassModal visible={picker} onClose={() => { if (!saving) setPicker(false); }}><Text style={[s.title, { color: colors.textPrimary }]}>Учебная группа</Text>{CATEC_GROUPS.map(group => <Pressable key={group.id} disabled={saving} onPress={() => { setSaving(true); void Promise.resolve(onUpdateGroup(group.name)).then(() => setPicker(false)).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.')).finally(() => setSaving(false)); }} style={[s.bellRow, { borderBottomColor: colors.divider }]}><Text translate={false} style={{ color: colors.textPrimary, fontSize: 17 }}>{group.name}</Text>{group.name === profile.group && <Text style={{ color: colors.accent }}>✓</Text>}</Pressable>)}</GlassModal>
    <GlassModal visible={!!selected} onClose={() => { if (!saving) setSelected(null); }}>{selected && <><Text translate={false} style={[s.title, { color: colors.textPrimary }]}>{selected.subject}</Text><Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 16 }}>{selected.timeStart}–{selected.timeEnd}</Text><Text translate={false} style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8 }}>{selected.teacher}</Text><Text translate={false} style={{ color: colors.textMuted, fontSize: 14, marginTop: 8 }}>{selected.room}</Text><Text style={{ color: colors.textSecondary, marginTop: 22, marginBottom: 10 }}>Личная заметка</Text><TextInput multiline maxLength={4000} value={note} onChangeText={setNote} placeholder="Задание или заметка..." placeholderTextColor={colors.textMuted} style={[s.note, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} /><Pressable disabled={saving} onPress={() => void saveNote()} style={[s.save, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: '600' }}>Сохранить</Text></Pressable></>}</GlassModal>
  </View>;
}
const s = StyleSheet.create({ content: { paddingHorizontal: 20, paddingBottom: 28 }, groupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, groupButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 44, borderRadius: 22 }, clock: { padding: 18, borderRadius: 22 }, clockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, countdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }, days: { flexDirection: 'row', gap: 8, marginVertical: 20 }, day: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }, lesson: { borderRadius: 20, padding: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 }, lessonTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, title: { fontSize: 22, fontWeight: '600', lineHeight: 29, marginBottom: 12 }, bellRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth }, note: { minHeight: 100, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, fontSize: 16, textAlignVertical: 'top' }, save: { alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 18 } });
