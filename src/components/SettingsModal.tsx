import React, { useState } from 'react';
import { Modal, StyleSheet, Switch, View, ScrollView } from 'react-native';
import { Alert, Pressable, Text } from './Typography';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { ScreenSafeArea } from './ScreenSafeArea';
import { useTheme, ThemePreference } from '../theme/themeContext';
import { Language, usePreferences } from '../context/PreferencesContext';
import { CATEC_GROUPS } from '../data/catecData';
import { UserProfile } from '../types';
import { GlassModal } from './GlassModal';
import { ScaleSlider } from './ScaleSlider';

type Page = 'language' | 'theme' | 'size' | 'pin' | 'group' | 'about';
const titles = { language: 'Язык', theme: 'Оформление', size: 'Размер текста', pin: 'Код входа', group: 'Учебная группа', about: 'О приложении' };
export function SettingsModal({ visible, onClose, profile, onUpdate, onLogout }: { visible: boolean; onClose: () => void; profile: UserProfile; onUpdate: (profile: UserProfile) => Promise<void>; onLogout: () => void; onNotifications?: () => void }) {
  const { colors, preference, setTheme } = useTheme();
  const preferences = usePreferences();
  const [page, setPage] = useState<Page | null>(null);
  const close = () => { setPage(null); onClose(); };
  const row = (label: string, value: string, target?: Page) => <Pressable disabled={!target} onPress={() => target && setPage(target)} style={[s.row, { borderBottomColor: colors.divider }]}><Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text><Text style={[s.value, { color: colors.textMuted }]}>{value}</Text>{target && <ChevronRight size={17} color={colors.textMuted} />}</Pressable>;
  const choice = (label: string, selected: boolean, action: () => void) => <Pressable onPress={action} style={[s.row, { borderBottomColor: colors.divider }]}><Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text>{selected && <Check size={22} color={colors.accent} />}</Pressable>;
  const group = (title: string, children: React.ReactNode) => <View style={s.section}><Text style={[s.sectionTitle, { color: colors.textMuted }]}>{title}</Text><View style={[s.group, { backgroundColor: colors.cardBg }]}>{children}</View></View>;
  return <Modal visible={visible} animationType={preferences.motionReduced ? 'none' : 'slide'} onRequestClose={close} presentationStyle="fullScreen">
    <ScreenSafeArea modal style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={s.header}><Pressable accessibilityLabel="Назад" onPress={close} style={s.back}><ChevronLeft color={colors.accent} size={28} /></Pressable><Text style={[s.title, { color: colors.textPrimary }]}>Настройки</Text></View>
      <ScrollView contentContainerStyle={s.content}>
        {group('Интерфейс', <>{row('Оформление', { light: 'Светлое', dark: 'Тёмное', system: 'Системное' }[preference], 'theme')}{row('Размер текста', `${Math.round(preferences.interfaceScale * 100)}%`, 'size')}{row('Язык', { ru: 'Русский', en: 'English', kk: 'Қазақша' }[preferences.language], 'language')}<View style={[s.row, { borderBottomWidth: 0 }]}><Text style={[s.label, { color: colors.textPrimary }]}>Уменьшить анимации</Text><Switch value={preferences.reduceMotion} onValueChange={reduceMotion => preferences.update({ reduceMotion })} trackColor={{ true: colors.textSecondary }} /></View></>)}
        {group('Аккаунт', <>{row('Учебная группа', profile.group, 'group')}{row('Код входа', '••••', 'pin')}</>)}
        {group('Приложение', <>{row('Уведомления', 'В разработке')}{row('О приложении', '1.0.0', 'about')}</>)}
        <Pressable style={[s.logout, { backgroundColor: colors.cardBg }]} onPress={() => Alert.alert('Выход из профиля', 'При следующем входе потребуется PIN-код.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', style: 'destructive', onPress: () => { close(); onLogout(); } }])}><Text style={{ color: colors.danger, fontSize: 17 }}>Выйти из аккаунта</Text></Pressable>
      </ScrollView>
      <GlassModal visible={!!page} onClose={() => setPage(null)}>
        <Text style={[s.title, { color: colors.textPrimary, marginBottom: 20 }]}>{page ? titles[page] : ''}</Text>
        {page === 'language' && (['ru', 'kk', 'en'] as Language[]).map(language => <React.Fragment key={language}>{choice({ ru: 'Русский', en: 'English', kk: 'Қазақша' }[language], preferences.language === language, () => preferences.update({ language }))}</React.Fragment>)}
        {page === 'theme' && (['light', 'dark', 'system'] as ThemePreference[]).map(theme => <React.Fragment key={theme}>{choice({ light: 'Светлое', dark: 'Тёмное', system: 'Системное' }[theme], preference === theme, () => setTheme(theme))}</React.Fragment>)}
        {page === 'size' && <><View style={[s.preview, { backgroundColor: colors.canvas }]}><Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '600' }}>CATEC SuperApp</Text><Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 10 }}>Расписание, новости и общение студентов колледжа.</Text><View style={[s.previewRow, { backgroundColor: colors.cardBg, padding: 12 * preferences.interfaceScale }]}><Text style={{ color: colors.textPrimary, fontSize: 16 }}>Сообщение</Text><ChevronRight size={18 * preferences.interfaceScale} color={colors.textMuted} /></View></View><ScaleSlider value={preferences.interfaceScale} onChange={interfaceScale => preferences.update({ interfaceScale })} /><Pressable onPress={() => preferences.update({ interfaceScale: 1 })} style={s.reset}><Text style={{ color: colors.accent }}>Стандартный</Text></Pressable></>}
        {page === 'pin' && <View style={s.center}><Text style={{ color: colors.textSecondary, fontSize: 16 }}>Ваш код для входа</Text><Text style={{ color: colors.accent, fontSize: 36, letterSpacing: 8, marginTop: 20 }}>{profile.passCode}</Text></View>}
        {page === 'group' && CATEC_GROUPS.map(item => <React.Fragment key={item.id}>{choice(item.name, profile.group === item.name, () => void onUpdate({ ...profile, group: item.name, course: item.course }).then(() => setPage(null)).catch(() => Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.')))}</React.Fragment>)}
        {page === 'about' && <View style={s.center}><Text style={[s.title, { color: colors.textPrimary }]}>CATEC SuperApp</Text><Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 16, textAlign: 'center' }}>Расписание, новости и общение студентов колледжа.</Text><Text style={{ color: colors.textMuted, marginTop: 14 }}>Версия 1.0.0</Text></View>}
      </GlassModal>
    </ScreenSafeArea>
  </Modal>;
}
const s = StyleSheet.create({ header: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 23, fontWeight: '600' }, content: { padding: 20, paddingBottom: 40 }, section: { marginBottom: 26 }, sectionTitle: { fontSize: 13, marginLeft: 16, marginBottom: 9 }, group: { borderRadius: 18, overflow: 'hidden', paddingHorizontal: 16 }, row: { minHeight: 58, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth }, label: { flex: 1, fontSize: 16 }, value: { maxWidth: '42%', fontSize: 13, textAlign: 'right' }, center: { alignItems: 'center', paddingVertical: 30 }, logout: { padding: 18, alignItems: 'center', borderRadius: 18 }, preview: { padding: 20, borderRadius: 20 }, previewRow: { marginTop: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reset: { alignItems: 'center', padding: 12 } });
