import React from 'react';
import { Text } from './Typography';
import { GlassModal } from './GlassModal';
import { useTheme } from '../theme/themeContext';
export function NotificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  return <GlassModal visible={visible} onClose={onClose}><Text style={{ color: colors.textPrimary, fontSize: 23, fontWeight: '600' }}>Уведомления</Text><Text style={{ color: colors.textMuted, marginTop: 20, marginBottom: 24 }}>В разработке</Text></GlassModal>;
}
