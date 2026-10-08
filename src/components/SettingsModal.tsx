import React, { useState } from 'react';
import { Modal, StyleSheet, Switch, View, ScrollView } from "react-native";
import { Alert, Pressable, Text } from "./Typography";
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenSafeArea } from './ScreenSafeArea';
import { useTheme, ThemePreference } from '../theme/themeContext';
import { Language, usePreferences } from '../context/PreferencesContext';
import { CATEC_GROUPS, PROFILE_BANNERS } from '../data/catecData';
import { UserProfile } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

type Page = 'settings' | 'language' | 'theme' | 'pin' | 'group' | 'cover' | 'about';
export function SettingsModal({ visible, onClose, profile, onUpdate, onLogout, onNotifications }: { visible: boolean; onClose: () => void; profile: UserProfile; onUpdate: (profile: UserProfile) => Promise<void>; onLogout: () => void; onNotifications: () => void; }) {
  const { colors, preference, setTheme } = useTheme();
  const preferences = usePreferences();
  const [page, setPage] = useState<Page>('settings');
  const title = { settings: 'Настройки', language: 'Язык', theme: 'Оформление', pin: 'Код входа', group: 'Учебная группа', cover: 'Обложка', about: 'О приложении' }[page];
  const close = () => { setPage('settings'); onClose(); };
  const row = (label: string, value: string, action: () => void) => <Pressable onPress={action} style={[s.row, { borderBottomColor: colors.divider }]}><Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text><Text style={[s.value, { color: colors.textMuted }]}>{value}</Text><ChevronRight size={18} color={colors.textMuted} /></Pressable>;
  const choice = (label: string, selected: boolean, action: () => void) => <Pressable onPress={action} style={[s.row, { borderBottomColor: colors.divider }]}><Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text><Text style={{ color: colors.accent, fontSize: 20 }}>{selected ? '✓' : ''}</Text></Pressable>;
  return <Modal visible={visible} animationType={preferences.motionReduced ? 'none' : 'slide'} onRequestClose={close}><ScreenSafeArea style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={s.header}><Pressable accessibilityLabel="Назад" onPress={() => page === 'settings' ? close() : setPage('settings')} style={s.back}><ChevronLeft color={colors.accent} size={28} /></Pressable><Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text></View>
    <ScrollView contentContainerStyle={s.content}>
      {page === 'settings' && <>
        {row('Язык', { ru: 'Русский', en: 'English', kk: 'Қазақша' }[preferences.language], () => setPage('language'))}
        {row('Оформление', { light: 'Светлое', dark: 'Тёмное', system: 'Системное' }[preference], () => setPage('theme'))}
        {row('Размер текста', preferences.textSize === 'large' ? 'Увеличенный' : 'Стандартный', () => preferences.update({ textSize: preferences.textSize === 'large' ? 'standard' : 'large' }))}
        <View style={[s.row, { borderBottomColor: colors.divider }]}><Text style={[s.label, { color: colors.textPrimary }]}>Уменьшить анимации</Text><Switch value={preferences.reduceMotion} onValueChange={reduceMotion => preferences.update({ reduceMotion })} trackColor={{ true: colors.accent }} /></View>
        {row('Уведомления', '', () => { close(); setTimeout(onNotifications, 350); })}
        {row('Код входа', '••••', () => setPage('pin'))}
        {row('Учебная группа', profile.group, () => setPage('group'))}
        {row('Готовые обложки', '', () => setPage('cover'))}
        {row('О приложении', '1.0.0', () => setPage('about'))}
        <Pressable style={s.row} onPress={() => Alert.alert('Выход из профиля', 'При следующем входе потребуется PIN-код.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', style: 'destructive', onPress: () => { close(); onLogout(); } }])}><Text style={{ color: colors.danger, fontSize: 17 }}>Выйти из аккаунта</Text></Pressable>
      </>}
      {page === 'language' && (['ru', 'kk', 'en'] as Language[]).map(language => <React.Fragment key={language}>{choice({ ru: 'Русский', en: 'English', kk: 'Қазақша' }[language], preferences.language === language, () => preferences.update({ language }))}</React.Fragment>)}
      {page === 'theme' && (['light', 'dark', 'system'] as ThemePreference[]).map(theme => <React.Fragment key={theme}>{choice({ light: 'Светлое', dark: 'Тёмное', system: 'Системное' }[theme], preference === theme, () => setTheme(theme))}</React.Fragment>)}
      {page === 'pin' && <View style={s.center}><Text style={{ color: colors.textSecondary, fontSize: 16 }}>Ваш код для входа</Text><Text style={{ color: colors.accent, fontSize: 36, letterSpacing: 8, marginTop: 20 }}>{profile.passCode}</Text></View>}
      {page === 'group' && CATEC_GROUPS.map(group => <React.Fragment key={group.id}>{choice(group.name, profile.group === group.name, () => void onUpdate({ ...profile, group: group.name, course: group.course }).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.')))}</React.Fragment>)}
      {page === 'cover' && PROFILE_BANNERS.map(banner => <Pressable key={banner.id} onPress={() => void onUpdate({ ...profile, bannerId: banner.id, coverUrl: undefined }).then(() => setPage('settings')).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.'))}><LinearGradient colors={banner.colors as [string, string, ...string[]]} style={s.banner}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{banner.title}</Text></LinearGradient></Pressable>)}
      {page === 'about' && <View style={s.center}><Text style={[s.title, { color: colors.textPrimary }]}>ЦАТЭК</Text><Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 16, textAlign: 'center' }}>Расписание, новости и общение студентов колледжа.</Text><Text style={{ color: colors.textMuted, marginTop: 14 }}>Версия 1.0.0</Text></View>}
    </ScrollView>
  </ScreenSafeArea></Modal>;
}
const s = StyleSheet.create({ header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 23, fontWeight: '700' }, content: { paddingHorizontal: 22, paddingBottom: 30 }, row: { minHeight: 64, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, label: { flex: 1, fontSize: 17 }, value: { maxWidth: '40%', fontSize: 14, textAlign: 'right' }, center: { alignItems: 'center', paddingVertical: 40 }, banner: { borderRadius: 20, height: 110, marginVertical: 8, padding: 20, justifyContent: 'flex-end' } });
