import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/themeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'none';
  intensity?: number;
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor = 'none',
  intensity = 35,
  elevated = false,
}) => {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  const glowBorderColors: Record<string, [string, string, string]> = {
    cyan: isDark
      ? ['rgba(56, 189, 248, 0.45)', 'rgba(56, 189, 248, 0.12)', 'rgba(255, 255, 255, 0.05)']
      : ['rgba(2, 132, 199, 0.45)', 'rgba(2, 132, 199, 0.15)', 'rgba(0, 0, 0, 0.04)'],
    violet: isDark
      ? ['rgba(168, 85, 247, 0.45)', 'rgba(168, 85, 247, 0.12)', 'rgba(255, 255, 255, 0.05)']
      : ['rgba(124, 58, 237, 0.45)', 'rgba(124, 58, 237, 0.15)', 'rgba(0, 0, 0, 0.04)'],
    emerald: isDark
      ? ['rgba(52, 211, 153, 0.45)', 'rgba(52, 211, 153, 0.12)', 'rgba(255, 255, 255, 0.05)']
      : ['rgba(5, 150, 105, 0.45)', 'rgba(5, 150, 105, 0.15)', 'rgba(0, 0, 0, 0.04)'],
    amber: isDark
      ? ['rgba(251, 191, 36, 0.45)', 'rgba(251, 191, 36, 0.12)', 'rgba(255, 255, 255, 0.05)']
      : ['rgba(217, 119, 6, 0.45)', 'rgba(217, 119, 6, 0.15)', 'rgba(0, 0, 0, 0.04)'],
    none: isDark
      ? ['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
      : ['rgba(255, 255, 255, 0.95)', 'rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.02)'],
  };

  const currentGlow = glowBorderColors.none;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          shadowColor: colors.shadowColor,
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: elevated ? 16 : 8,
          shadowOffset: { width: 0, height: elevated ? 8 : 4 },
        },
        style,
      ]}
    >
      <LinearGradient
        colors={currentGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={intensity}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <View
              style={[
                styles.innerContent,
                { backgroundColor: elevated ? colors.cardElevated : colors.cardBg },
              ]}
            >
              {children}
            </View>
          </BlurView>
        ) : (
          <View
            style={[
              styles.innerContentAndroid,
              { backgroundColor: elevated ? colors.cardElevated : colors.cardBg },
            ]}
          >
            {children}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  gradientBorder: {
    padding: 1.2,
    borderRadius: 20,
  },
  blurContainer: {
    borderRadius: 19,
    overflow: 'hidden',
  },
  innerContent: {
    padding: 16,
    borderRadius: 19,
  },
  innerContentAndroid: {
    padding: 16,
    borderRadius: 19,
  },
});
