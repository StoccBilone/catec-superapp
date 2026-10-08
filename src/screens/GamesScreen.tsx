import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { GlassHeader } from '../components/GlassHeader';
import { Pressable, Text } from '../components/Typography';
import { useTheme } from '../theme/themeContext';
import { GAME_CATALOG } from '../games/catalog';
import { GameArtwork } from '../games/GameArtwork';

export function GamesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width - 40, 560) - 12) / 2;
  return <View style={{ flex: 1 }}>
    <GlassHeader title="Игры" showNotificationBell={false} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        {GAME_CATALOG.map(game => <Pressable
          key={game.id}
          accessibilityRole="button"
          accessibilityLabel={game.title}
          accessibilityState={{ disabled: !game.route }}
          disabled={!game.route}
          onPress={() => { if (game.route) router.push(game.route); }}
          style={({ pressed }) => [styles.card, { width: cardWidth, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, opacity: pressed ? 0.72 : 1 }]}
        >
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}><GameArtwork game={game.id} /></View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.title, { color: colors.textPrimary }]}>{game.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{game.description}</Text>
          <View style={styles.footer}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: game.route ? colors.textPrimary : colors.textMuted }}>{game.route ? 'Играть' : 'Скоро'}</Text>
            {game.route && <ChevronRight size={16} color={colors.textPrimary} />}
          </View>
        </Pressable>)}
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  grid: { width: '100%', maxWidth: 560, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 26, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  art: { height: 136, marginHorizontal: -4, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '600', letterSpacing: -0.4 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, minHeight: 52 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
});
