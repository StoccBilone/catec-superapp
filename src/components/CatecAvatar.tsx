import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const poses = {
  welcome: require('../../assets/mascot/welcome.jpg'),
  neutral: require('../../assets/mascot/neutral.jpg'),
  pass: require('../../assets/mascot/pass.jpg'),
};

/** Original artwork has a white background; the rounded surface preserves it in both themes. */
export function CatecAvatar({ size = 180, pose = 'neutral' }: { size?: number; pose?: keyof typeof poses }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.surface, { width: size, height: size, borderRadius: size * .18 }]}>
    <Image source={poses[pose]} resizeMode="contain" fadeDuration={0} style={styles.image}/>
  </View>;
}
const styles = StyleSheet.create({
  surface: { backgroundColor: '#FFFFFF', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
