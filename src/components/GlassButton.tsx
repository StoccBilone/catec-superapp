import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidTheme } from '../theme/liquidTheme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onPress();
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary':
        return ['#0284c7', '#2563eb'];
      case 'secondary':
        return ['#7c3aed', '#9333ea'];
      case 'danger':
        return ['#e11d48', '#be123c'];
      case 'glass':
      default:
        return ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)'];
    }
  };

  const isGlass = variant === 'glass';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.base, styles[size], disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientInner,
          styles[`inner_${size}`],
          isGlass && styles.glassBorder,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <Text style={[styles.text, styles[`text_${size}`], isGlass && styles.glassText]}>
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: LiquidTheme.radius.md,
    overflow: 'hidden',
  },
  sm: {
    borderRadius: LiquidTheme.radius.sm,
  },
  md: {
    borderRadius: LiquidTheme.radius.md,
  },
  lg: {
    borderRadius: LiquidTheme.radius.lg,
  },
  gradientInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  inner_md: {
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  inner_lg: {
    paddingVertical: 16,
    paddingHorizontal: 26,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
    fontWeight: '700',
  },
  glassText: {
    color: LiquidTheme.colors.textPrimary,
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: LiquidTheme.colors.borderSpecular,
  },
  disabled: {
    opacity: 0.45,
  },
});
