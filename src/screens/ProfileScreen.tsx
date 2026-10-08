import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LogOut,
  Sun,
  Users,
  Image as ImageIcon,
  KeyRound,
} from 'lucide-react-native';
import { NewsItem, UserProfile } from '../types';
import { CATEC_GROUPS, PROFILE_BANNERS } from '../data/catecData';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { GlassCard } from '../components/GlassCard';
import { GlassHeader } from '../components/GlassHeader';
import { GlassModal } from '../components/GlassModal';
import { GlassButton } from '../components/GlassButton';
import { pickPhoto } from '../services/photos';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onLogout,
  onOpenNotifications,
}) => {
  const { colors } = useTheme();
  const [profileTab, setProfileTab] = useState<'profile' | 'posts'>('profile');
  const [posts, setPosts] = useState<NewsItem[]>([]);
  useEffect(() => {
    let active = true;
    void StorageService.getAllNewsAndPosts().then(items => { if (active) setPosts(items.filter(item => item.isUserCreated && item.author.startsWith(profile.fullName))); });
    return () => { active = false; };
  }, [profile.fullName, profileTab]);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const changePhoto = async (kind: 'avatar' | 'cover') => {
    if (pickingPhoto) return;
    setPickingPhoto(true);
    try {
      const uri = await pickPhoto(kind);
      if (!uri) return;
      const updated = { ...profile, ...(kind === 'avatar' ? { avatarUrl: uri } : { coverUrl: uri }) };
      await StorageService.saveUserProfile(updated);
      onUpdateProfile(updated);
    } catch { Alert.alert('Не удалось добавить фото', 'Попробуйте выбрать изображение ещё раз.'); }
    finally { setPickingPhoto(false); }
  };

  // Active banner colors
  const activeBanner = PROFILE_BANNERS.find((b) => b.id === profile.bannerId) || PROFILE_BANNERS[0];

  const handleGroupChange = async (groupName: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const groupMeta = CATEC_GROUPS.find((g) => g.name === groupName) || CATEC_GROUPS[0];
    const updated: UserProfile = {
      ...profile,
      group: groupName,
      course: groupMeta.course,
      faculty: 'Отделение информационных технологий ЦАТЭК',
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
    setShowGroupModal(false);
  };

  const handleBannerSelect = async (bannerId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const updated: UserProfile = {
      ...profile,
      bannerId,
      coverUrl: undefined,
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
    setShowBannerModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <GlassHeader
        title="Профиль"
        onNotificationPress={onOpenNotifications}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.socialCover}>
          <LinearGradient colors={activeBanner.colors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.socialCoverGradient}>
            {profile.coverUrl && <Image source={{ uri: profile.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
            <TouchableOpacity accessibilityLabel="Выбрать фото обложки" disabled={pickingPhoto} onPress={() => void changePhoto('cover')} style={styles.changeBannerPill}><ImageIcon size={16} color="#fff" /><Text style={styles.changeBannerText}>Своё фото</Text></TouchableOpacity>
          </LinearGradient>
          <LinearGradient colors={['rgba(255,255,255,0)', '#ffffff']} style={styles.coverFade} pointerEvents="none" />
        </View>
        <View style={styles.socialIdentity}>
          <TouchableOpacity accessibilityLabel="Выбрать фото профиля" disabled={pickingPhoto} onPress={() => void changePhoto('avatar')} style={[styles.socialAvatar, { backgroundColor: colors.accentLight }]}>{profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 23 }} /> : <Text style={[styles.socialInitials, { color: colors.accent }]}>{profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>}<View style={[styles.avatarEdit, { backgroundColor: colors.accent }]}><ImageIcon size={12} color="#fff" /></View></TouchableOpacity>
          <Text style={[styles.socialName, { color: colors.textPrimary }]}>{profile.fullName}</Text>
          <Text style={[styles.socialHandle, { color: colors.textMuted }]}>Студент ЦАТЭК · № {profile.studentId}</Text>
          <View style={styles.socialTags}><Text style={[styles.socialGroup, { color: colors.accent, backgroundColor: colors.accentLight }]}>{profile.group}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{profile.course} курс</Text></View>
          <Text style={[styles.socialBio, { color: colors.textSecondary }]}>{profile.faculty}</Text>
        </View>
        <View style={[styles.profileTabs, { borderBottomColor: colors.divider }]}>
          {(['profile', 'posts'] as const).map(item => <TouchableOpacity key={item} onPress={() => setProfileTab(item)} style={[styles.profileTab, { borderBottomColor: profileTab === item ? colors.accent : 'transparent' }]}><Text style={{ fontSize: 14, fontWeight: '700', color: profileTab === item ? colors.accent : colors.textMuted }}>{item === 'profile' ? 'О студенте' : 'Публикации'}</Text></TouchableOpacity>)}
        </View>
        {profileTab === 'posts' && <View style={styles.profilePosts}>
          {posts.length ? posts.map(post => <View key={post.id} style={[styles.profilePost, { borderBottomColor: colors.divider }]}><Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{profile.fullName}</Text><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{post.date}</Text><Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 22, marginTop: 10 }}>{post.content}</Text>{post.imageUri && <Image source={{ uri: post.imageUri }} resizeMode="cover" style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginTop: 12 }} />}</View>) : <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 28 }}>Ваши публикации появятся здесь.</Text>}
        </View>}
        {profileTab === 'profile' && <>

        {/* Academic Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Award size={18} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {profile.averageGrade.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Средний GPA</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {profile.attendancePercent}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Посещаемость</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <GraduationCap size={18} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>7 сем.</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Аттестация</Text>
          </GlassCard>
        </View>

        {/* Settings & Appearance */}
        <TouchableOpacity onPress={() => setShowBannerModal(true)} style={{ paddingHorizontal: 22, paddingBottom: 20 }}><Text style={{ color: colors.accent, fontSize: 14 }}>Выбрать готовую обложку</Text></TouchableOpacity>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            ВНЕШНИЙ ВИД И НАСТРОЙКИ
          </Text>

          <GlassCard style={styles.menuCard}>
            {/* Fixed light appearance */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.tagBg }]}>
                  <Sun size={18} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                    Светлое оформление
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Основная тема приложения
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            {/* View PIN PassCode */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowCodeModal(true)}
              style={styles.menuItem}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.tagBg }]}>
                  <KeyRound size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                    Спец-код для входа (PIN)
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Ваш 4-значный код: {profile.passCode}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            {/* Change Group */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowGroupModal(true)}
              style={styles.menuItem}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.tagBg }]}>
                  <Users size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                    Сменить учебную группу
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Текущая группа: {profile.group}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutWrapper}>
          <GlassButton
            title="Выйти из аккаунта (Вход по PIN)"
            variant="glass"
            size="md"
            icon={<LogOut size={16} color={colors.danger} />}
            onPress={() => {
              Alert.alert(
                'Выход из профиля',
                'При следующем входе потребуется ввести ваш 4-значный код.',
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Выйти',
                    style: 'destructive',
                    onPress: onLogout,
                  },
                ]
              );
            }}
          />
        </View>
        </>}
      </ScrollView>

      {/* Code Reminder Modal */}
      <GlassModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalCenterBody}>
          <KeyRound size={36} color={colors.accent} />
          <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
            Ваш 4-значный спец-код
          </Text>
          <Text style={[styles.modalDescText, { color: colors.textSecondary }]}>
            Используется для быстрого входа при выходе из приложения:
          </Text>

          <View style={[styles.codeDisplayBox, { backgroundColor: colors.cardElevated, borderColor: colors.accent }]}>
            <Text style={[styles.codeDisplayText, { color: colors.accent }]}>
              {profile.passCode}
            </Text>
          </View>

          <GlassButton
            title="Понятно"
            onPress={() => setShowCodeModal(false)}
            variant="primary"
          />
        </View>
      </GlassModal>

      {/* Group Picker Modal */}
      <GlassModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalBody}>
          <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
            Выберите группу ЦАТЭК
          </Text>

          <View style={styles.groupsGridModal}>
            {CATEC_GROUPS.map((grp) => {
              const isSelected = grp.name === profile.group;
              return (
                <TouchableOpacity
                  key={grp.id}
                  activeOpacity={0.7}
                  onPress={() => handleGroupChange(grp.name)}
                  style={[
                    styles.groupModalTile,
                    {
                      backgroundColor: isSelected ? colors.accentLight : colors.cardBg,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.groupModalName, { color: isSelected ? colors.accent : colors.textPrimary }]}>
                    {grp.name}
                  </Text>
                  <Text style={[styles.groupModalSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {grp.specialty.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GlassModal>

      {/* Banner Picker Modal */}
      <GlassModal
        visible={showBannerModal}
        onClose={() => setShowBannerModal(false)}
      >
        <View style={styles.modalBody}>
          <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
            Выберите баннер профиля
          </Text>

          <View style={styles.bannersList}>
            {PROFILE_BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.8}
                onPress={() => handleBannerSelect(banner.id)}
                style={styles.bannerItemBtn}
              >
                <LinearGradient
                  colors={banner.colors as [string, string, ...string[]]}
                  style={styles.bannerPreview}
                >
                  <Text style={styles.bannerItemText}>{banner.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GlassModal>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarEdit: { position: 'absolute', right: -3, bottom: -3, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  socialCover: { height: 190, position: 'relative' },
  socialCoverGradient: { flex: 1, alignItems: 'flex-end', padding: 18 },
  coverFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  socialIdentity: { paddingHorizontal: 22, marginTop: -48 },
  socialAvatar: { width: 82, height: 82, borderRadius: 27, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  socialInitials: { fontSize: 27, fontWeight: '700' },
  socialName: { fontSize: 25, fontWeight: '700', letterSpacing: -0.6, marginTop: 12 },
  socialHandle: { fontSize: 13, marginTop: 4 },
  socialTags: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  socialGroup: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  socialBio: { fontSize: 14, lineHeight: 21, marginTop: 12 },
  profileTabs: { flexDirection: 'row', marginHorizontal: 20, marginTop: 22, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  profileTab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2 },
  profilePosts: { paddingHorizontal: 22 },
  profilePost: { paddingBottom: 20, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  bannerWrapper: {
    marginBottom: 16,
  },
  bannerHeader: {
    height: 110,
    width: '100%',
    padding: 14,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  changeBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  changeBannerText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  passCardOverlap: {
    marginTop: -45,
    paddingHorizontal: 20,
  },
  passCardBody: {
    padding: 2,
  },
  passCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  passCrestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  crestSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  passMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '700',
  },
  passDetailsCol: {
    flex: 1,
  },
  passName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  passFaculty: {
    fontSize: 11,
    marginBottom: 6,
  },
  passTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  groupTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  groupTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  courseTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  passCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  idLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  idValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  validPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  validDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  validText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuCard: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSub: {
    fontSize: 11,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 10,
  },
  logoutWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalCenterBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDescText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeDisplayBox: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 20,
  },
  codeDisplayText: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 6,
  },
  modalBody: {
    paddingVertical: 10,
  },
  groupsGridModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  groupModalTile: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  groupModalName: {
    fontSize: 15,
    fontWeight: '700',
  },
  groupModalSub: {
    fontSize: 10,
    marginTop: 2,
  },
  bannersList: {
    gap: 10,
    marginTop: 14,
  },
  bannerItemBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bannerPreview: {
    padding: 18,
    justifyContent: 'center',
  },
  bannerItemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
