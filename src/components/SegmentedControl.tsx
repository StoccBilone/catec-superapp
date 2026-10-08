import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidTheme } from '../theme/liquidTheme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onChange,
  style,
}) => {
  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onChange(index);
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.8}
            onPress={() => handleSelect(index)}
            style={[styles.segment, isSelected && styles.selectedSegment]}
          >
            {isSelected ? (
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.25)', 'rgba(59, 130, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedGradient}
              >
                <Text style={styles.selectedText}>{option}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.text}>{option}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: LiquidTheme.radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: LiquidTheme.colors.borderHairline,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LiquidTheme.radius.md - 2,
  },
  selectedSegment: {
    borderRadius: LiquidTheme.radius.md - 2,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    overflow: 'hidden',
  },
  selectedGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: LiquidTheme.radius.md - 2,
  },
  text: {
    color: LiquidTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedText: {
    color: LiquidTheme.colors.textHighlight,
    fontSize: 13,
    fontWeight: '700',
  },
});
