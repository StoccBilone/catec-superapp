import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell, Calendar, AlertTriangle, Sparkles } from 'lucide-react-native';
import { GlassModal } from './GlassModal';
import { GlassCard } from './GlassCard';
import { useTheme } from '../theme/themeContext';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();

  const notifications = [
    {
      id: '1',
      title: 'Изменение аудитории по Базам данных',
      text: 'В понедельник 0 пара для групп П4 А перенесена в 304 ауд. Преподаватель Тойшибаева А.М.',
      time: '15 минут назад',
      type: 'warning',
    },
    {
      id: '2',
      title: 'Almaty AI Hackathon 2026',
      text: 'Студенческий совет ЦАТЭК: открыта регистрация команд до 20 октября.',
      time: '2 часа назад',
      type: 'info',
    },
    {
      id: '3',
      title: 'Рубежный контроль №1',
      text: 'Напоминание учебного отдела: сдача контрольных точек 4 курса с 20 по 26 октября.',
      time: 'Вчера',
      type: 'calendar',
    },
  ];

  return (
    <GlassModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Bell size={22} color={colors.accent} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Уведомления</Text>
        </View>

        <View style={styles.list}>
          {notifications.map((n) => (
            <GlassCard key={n.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.typeRow}>
                  {n.type === 'warning' ? (
                    <AlertTriangle size={14} color={colors.warning} />
                  ) : n.type === 'calendar' ? (
                    <Calendar size={14} color={colors.success} />
                  ) : (
                    <Sparkles size={14} color={colors.accent} />
                  )}
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{n.title}</Text>
                </View>
                <Text style={[styles.cardTime, { color: colors.textMuted }]}>{n.time}</Text>
              </View>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>{n.text}</Text>
            </GlassCard>
          ))}
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  card: {
    marginBottom: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 10,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
