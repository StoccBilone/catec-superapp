import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Newspaper,
  MessageSquare,
  User,
} from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

export type TabKey = 'schedule' | 'news' | 'chat' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  badge?: number;
}

const TABS: TabItem[] = [
  { key: 'schedule', label: 'Расписание', icon: Calendar },
  { key: 'news', label: 'Новости', icon: Newspaper },
  { key: 'chat', label: 'Беседа', icon: MessageSquare, badge: 3 },
  { key: 'profile', label: 'Кабинет', icon: User },
];

interface LiquidTabBarProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  chatBadgeCount?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DOCK_MARGIN = 16;
const DOCK_WIDTH = SCREEN_WIDTH - DOCK_MARGIN * 2;
const TAB_COUNT = TABS.length;
const TAB_WIDTH = (DOCK_WIDTH - 8) / TAB_COUNT;

export const LiquidTabBar: React.FC<LiquidTabBarProps> = ({
  currentTab,
  onTabChange,
  chatBadgeCount = 3,
}) => {
  const { colors, mode } = useTheme();

  // Animated value for the sliding oval indicator
  const [animatedX] = useState(() => new Animated.Value(0));
  const isDragging = useRef(false);
  const activeIndexRef = useRef(0);

  const getIndexFromKey = (key: TabKey) => {
    const idx = TABS.findIndex((t) => t.key === key);
    return idx >= 0 ? idx : 0;
  };

  const getXForIndex = (index: number) => {
    return index * TAB_WIDTH + 4;
  };

  useEffect(() => {
    const targetIdx = getIndexFromKey(currentTab);
    activeIndexRef.current = targetIdx;
    if (!isDragging.current) {
      Animated.spring(animatedX, {
        toValue: getXForIndex(targetIdx),
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }).start();
    }
  }, [animatedX, currentTab]);

  // PanResponder for smooth finger dragging following iOS liquid glass behavior
  const panResponder = useMemo(
    // Event callbacks access refs only when the user touches the dock.
    // eslint-disable-next-line react-hooks/refs
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}

        const touchX = evt.nativeEvent.locationX - 4;
        const clampedX = Math.max(4, Math.min(DOCK_WIDTH - TAB_WIDTH - 4, touchX - TAB_WIDTH / 2));
        animatedX.setValue(clampedX);

        const newIndex = Math.min(
          TAB_COUNT - 1,
          Math.max(0, Math.floor((touchX) / TAB_WIDTH))
        );
        if (newIndex !== activeIndexRef.current) {
          activeIndexRef.current = newIndex;
          onTabChange(TABS[newIndex].key);
        }
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX - 4;
        const clampedX = Math.max(4, Math.min(DOCK_WIDTH - TAB_WIDTH - 4, touchX - TAB_WIDTH / 2));
        animatedX.setValue(clampedX);

        const newIndex = Math.min(
          TAB_COUNT - 1,
          Math.max(0, Math.floor((touchX) / TAB_WIDTH))
        );
        if (newIndex !== activeIndexRef.current) {
          activeIndexRef.current = newIndex;
          try {
            Haptics.selectionAsync();
          } catch {}
          onTabChange(TABS[newIndex].key);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        const finalIdx = activeIndexRef.current;
        Animated.spring(animatedX, {
          toValue: getXForIndex(finalIdx),
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }).start();
        onTabChange(TABS[finalIdx].key);
      },
    }),
    [animatedX, onTabChange]
  );

  const isDark = mode === 'dark';

  return (
    <View style={styles.dockWrapper}>
      {/* Specular Rim Border */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(2, 132, 199, 0.18)', 'rgba(0, 0, 0, 0.06)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.dockRim, isDark ? styles.shadowDark : styles.shadowLight]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? (isDark ? 55 : 65) : 30}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}
        >
          <View style={[styles.innerDock, { backgroundColor: colors.navBarBg }]} {...panResponder.panHandlers}>
            {/* Liquid Floating Glass Oval Pill */}
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: TAB_WIDTH,
                  transform: [{ translateX: animatedX }],
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.14)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.35)',
                },
              ]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.22)', 'rgba(56, 189, 248, 0.06)']
                    : ['rgba(255, 255, 255, 0.8)', 'rgba(2, 132, 199, 0.08)']
                }
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Icons Layer */}
            <View style={styles.tabIconsRow} pointerEvents="none">
              {TABS.map((tab, idx) => {
                const isActive = currentTab === tab.key;
                const Icon = tab.icon;

                return (
                  <View key={tab.key} style={[styles.tabSlot, { width: TAB_WIDTH }]}>
                    <View style={styles.iconContainer}>
                      <Icon
                        size={21}
                        color={isActive ? colors.accent : colors.textSecondary}
                        strokeWidth={isActive ? 2.4 : 1.7}
                      />
                      {tab.key === 'chat' && chatBadgeCount > 0 && (
                        <View style={styles.redBadge}>
                          <Text style={styles.redBadgeText}>{chatBadgeCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? colors.textHighlight : colors.textMuted },
                        isActive && styles.tabLabelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: DOCK_MARGIN,
    right: DOCK_MARGIN,
    zIndex: 999,
  },
  dockRim: {
    padding: 1.2,
    borderRadius: 36,
  },
  shadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 12,
  },
  shadowLight: {
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  blurContainer: {
    borderRadius: 35,
    overflow: 'hidden',
  },
  innerDock: {
    height: 62,
    borderRadius: 35,
    justifyContent: 'center',
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
  tabIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
  },
  tabSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  redBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  redBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

