import React from 'react';
import { View, StyleSheet } from "react-native";
import { Text } from "./Typography";
import { LinearGradient } from 'expo-linear-gradient';
import { QrCode, Shield, Wifi } from 'lucide-react-native';
import { UserProfile } from '../types';
import { LiquidTheme } from '../theme/liquidTheme';

interface StudentCardProps {
  profile: UserProfile;
}

export const StudentCard: React.FC<StudentCardProps> = ({ profile }) => {
  const isTeacher = profile.role === 'teacher';

  return (
    <View style={styles.cardWrapper}>
      {/* Dynamic Specular Holographic Rim */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.45)',
          'rgba(56, 189, 248, 0.35)',
          'rgba(168, 85, 247, 0.25)',
          'rgba(255, 255, 255, 0.05)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rimGradient}
      >
        <LinearGradient
          colors={
            isTeacher
              ? ['#1e1b4b', '#17142b', '#0a0914']
              : ['#0f172a', '#111827', '#080d1a']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBody}
        >
          {/* Ambient Refraction Glow Orbs */}
          <View style={styles.glowOrbTop} />
          <View style={styles.glowOrbBottom} />

          {/* Card Top: Institution and Contactless Icon */}
          <View style={styles.topRow}>
            <View style={styles.institutionRow}>
              <View style={styles.crestCircle}>
                <Shield size={16} color={LiquidTheme.colors.cyan} />
              </View>
              <View>
                <Text style={styles.institutionTitle}>IT CAMPUS COLLEGE</Text>
                <Text style={styles.institutionSub}>
                  {isTeacher ? 'ПРЕПОДАВАТЕЛЬСКИЙ ПРОПУСК' : 'ЭЛЕКТРОННЫЙ СТУДЕНЧЕСКИЙ'}
                </Text>
              </View>
            </View>
            <Wifi size={20} color={LiquidTheme.colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
          </View>

          {/* Card Middle: Profile Details */}
          <View style={styles.middleRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>

            <View style={styles.detailsCol}>
              <Text translate={false} style={styles.nameText} numberOfLines={1}>
                {profile.fullName}
              </Text>
              <Text style={styles.facultyText} numberOfLines={1}>
                {profile.faculty}
              </Text>

              <View style={styles.tagsRow}>
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>
                    {isTeacher ? 'Кафедра ИТ' : `Группа: ${profile.group}`}
                  </Text>
                </View>
                {!isTeacher && (
                  <View style={styles.courseBadge}>
                    <Text style={styles.courseBadgeText}>{profile.course} КУРС</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Card Bottom: Barcode / QR & Validity */}
          <View style={styles.bottomRow}>
            <View style={styles.idCol}>
              <Text style={styles.idLabel}>ID БИЛЕТА</Text>
              <Text style={styles.idValue}>{profile.studentId}</Text>
            </View>

            <View style={styles.statusCol}>
              <View style={styles.statusPill}>
                <View style={styles.statusBeacon} />
                <Text style={styles.statusText}>АКТИВЕН 2025/2026</Text>
              </View>
            </View>

            <View style={styles.qrIconWrapper}>
              <QrCode size={28} color={LiquidTheme.colors.textPrimary} />
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: LiquidTheme.radius.xl,
    overflow: 'hidden',
    marginVertical: 12,
    ...LiquidTheme.shadows.floating,
  },
  rimGradient: {
    padding: 1.5,
    borderRadius: LiquidTheme.radius.xl,
  },
  cardBody: {
    padding: 20,
    borderRadius: LiquidTheme.radius.xl - 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionTitle: {
    color: LiquidTheme.colors.textHighlight,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  institutionSub: {
    color: LiquidTheme.colors.cyan,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: LiquidTheme.colors.borderSpecular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: LiquidTheme.colors.cyan,
    fontSize: 20,
    fontWeight: '700',
  },
  detailsCol: {
    flex: 1,
  },
  nameText: {
    color: LiquidTheme.colors.textHighlight,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  facultyText: {
    color: LiquidTheme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  groupBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LiquidTheme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  groupBadgeText: {
    color: LiquidTheme.colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  courseBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: LiquidTheme.radius.sm,
    borderWidth: 1,
    borderColor: LiquidTheme.colors.borderHairline,
  },
  courseBadgeText: {
    color: LiquidTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  idCol: {},
  idLabel: {
    color: LiquidTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  idValue: {
    color: LiquidTheme.colors.textHighlight,
    fontSize: 12,
    fontWeight: '700',
  },
  statusCol: {},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LiquidTheme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    gap: 6,
  },
  statusBeacon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LiquidTheme.colors.emerald,
  },
  statusText: {
    color: LiquidTheme.colors.emerald,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  qrIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LiquidTheme.colors.borderHairline,
  },
});
