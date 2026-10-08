import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  rightBadge?: string;
  onNotificationPress?: () => void;
  showNotificationBell?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  rightBadge,
  onNotificationPress,
  showNotificationBell = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.accent }]}>
            {subtitle}
          </Text>
        )}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {rightBadge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.tagBg,
                  borderColor: colors.cardBorderHighlight,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.accent }]}>{rightBadge}</Text>
            </View>
          )}
        </View>
      </View>

      {showNotificationBell && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={[
            styles.bellButton,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Bell size={20} color={colors.textPrimary} />
          <View style={[styles.bellDot, { backgroundColor: colors.danger }]} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    position: 'relative',
  },
  bellDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    position: 'absolute',
    top: 9,
    right: 9,
  },
});
