import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const poses = {
  welcome: require('../../assets/mascot/welcome-cutout.png'),
  neutral: require('../../assets/mascot/neutral-cutout.png'),
  pass: require('../../assets/mascot/pass-cutout.png'),
};

/** Transparent artwork keeps the mascot on the screen surface, without a separate tile. */
export function CatecAvatar({ size = 180, pose = 'neutral' }: { size?: number; pose?: keyof typeof poses }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.surface, { width: size, height: size }]}>
    <Image source={poses[pose]} resizeMode="contain" fadeDuration={0} style={styles.image}/>
  </View>;
}
const styles = StyleSheet.create({
  surface: { overflow: 'visible' },
  image: { width: '100%', height: '100%' },
});
