import React, { useState } from 'react';
import { StyleSheet, View } from "react-native";
import { Text, TouchableOpacity } from "./Typography";
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, QrCode, ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { UserProfile } from '../types';
import { GlassModal } from './GlassModal';
import { useTheme } from '../theme/themeContext';

export function StudentPass({ profile }: { profile: UserProfile }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  return <>
    <LinearGradient colors={[colors.canvasElevated, colors.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
      <View style={s.top}><View><Text style={[s.label, { color: colors.textSecondary }]}>ЦАТЭК · Алматы</Text><Text style={[s.title, { color: colors.textPrimary }]}>Студенческий пропуск</Text></View><ShieldCheck size={28} color={colors.textPrimary} /></View>
      <Text translate={false} style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{profile.fullName}</Text><Text style={[s.detail, { color: colors.textSecondary }]}>{profile.group} · {profile.course} курс · № {profile.studentId}</Text>
      <View style={s.bottom}><TouchableOpacity onPress={() => setVisible(true)} style={[s.qrButton, { backgroundColor: colors.canvasElevated }]}><QrCode color={colors.textPrimary} size={18} /><Text style={[s.buttonText, { color: colors.textPrimary }]}>Показать QR</Text></TouchableOpacity><TouchableOpacity onPress={() => setVisible(true)} style={s.detailsButton}><Text style={[s.buttonText, { color: colors.textPrimary }]}>Для входа</Text><ChevronRight color={colors.textPrimary} size={16} /></TouchableOpacity></View>
    </LinearGradient>
    <GlassModal visible={visible} onClose={() => setVisible(false)}><View style={s.modal}><Text style={[s.modalTitle, { color: colors.textPrimary }]}>Пропуск в колледж</Text><Text translate={false} style={[s.modalName, { color: colors.textSecondary }]}>{profile.fullName}</Text><View style={s.qr}><QRCode value={`CATEC-DEMO:${profile.studentId}`} size={216} quietZone={12} color="#172536" backgroundColor="#ffffff" /></View><Text style={[s.modalName, { color: colors.textSecondary }]}>{profile.group} · № {profile.studentId}</Text></View></GlassModal>
  </>;
}
const s = StyleSheet.create({ card: { padding: 20, borderRadius: 24, marginBottom: 20 }, top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, label: { color: '#2974a4', fontSize: 12, fontWeight: '600' }, title: { color: '#123e60', fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginTop: 7 }, name: { color: '#123e60', fontSize: 16, fontWeight: '600', marginTop: 20 }, detail: { color: '#356b90', fontSize: 12, marginTop: 5 }, bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, gap: 8 }, qrButton: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13 }, detailsButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 11 }, buttonText: { color: '#126cb5', fontSize: 12, fontWeight: '700' }, modal: { alignItems: 'center', paddingVertical: 18 }, modalTitle: { fontSize: 23, fontWeight: '700' }, modalName: { fontSize: 15, textAlign: 'center', marginTop: 10 }, qr: { backgroundColor: '#fff', padding: 12, borderRadius: 20, marginVertical: 24 }, demo: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16, maxWidth: 260 } });
