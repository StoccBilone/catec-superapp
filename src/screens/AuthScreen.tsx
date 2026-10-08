import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Shield, ArrowRight, Check, KeyRound, Delete, UserCheck } from 'lucide-react-native';
import { UserProfile } from '../types';
import { CATEC_GROUPS } from '../data/catecData';
import { useTheme } from '../theme/themeContext';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassModal } from '../components/GlassModal';

interface AuthScreenProps {
  existingProfile: UserProfile | null;
  onSuccessLogin: (profile: UserProfile) => void;
  onRegisterNew: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  existingProfile,
  onSuccessLogin,
  onRegisterNew,
}) => {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  // State
  const [isRegisterMode, setIsRegisterMode] = useState(!existingProfile);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('П4 А');

  // PIN login state
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState(false);

  // Success modal after registration
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [registeredProfile, setRegisteredProfile] = useState<UserProfile | null>(null);

  const handleKeyPress = (num: string) => {
    if (pinDigits.length >= 4) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const next = pinDigits + num;
    setPinDigits(next);
    setPinError(false);

    if (next.length === 4) {
      // Validate
      if (existingProfile && next === existingProfile.passCode) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        onSuccessLogin(existingProfile);
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        setPinError(true);
        setTimeout(() => {
          setPinDigits('');
          setPinError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    if (pinDigits.length === 0) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleRegisterSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите ваше имя и фамилию.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    // Generate random 4-digit ID
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const groupMeta = CATEC_GROUPS.find((g) => g.name === selectedGroup) || CATEC_GROUPS[0];

    const newProfile: UserProfile = {
      id: `std-${Date.now()}`,
      fullName: `${lastName.trim()} ${firstName.trim()}`,
      role: 'student',
      group: selectedGroup,
      studentId: randomCode,
      passCode: randomCode,
      course: groupMeta.course,
      faculty: 'Отделение информационных технологий ЦАТЭК',
      averageGrade: 4.82,
      attendancePercent: 96,
      bannerId: 'catec_blue',
    };

    setGeneratedCode(randomCode);
    setRegisteredProfile(newProfile);
  };

  const handleFinishRegistration = () => {
    if (registeredProfile) {
      onRegisterNew(registeredProfile);
    }
  };

  // ===================== PIN LOGIN SCREEN =====================
  if (!isRegisterMode && existingProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <View style={styles.pinWrapper}>
          <View style={styles.topBadgeRow}>
            <View style={[styles.iconShield, { backgroundColor: colors.accentLight }]}>
              <Shield size={24} color={colors.accent} />
            </View>
            <Text style={[styles.catecLabel, { color: colors.accent }]}>ЦАТЭК • PLATONUS</Text>
          </View>

          <Text style={[styles.pinTitle, { color: colors.textPrimary }]}>
            Вход в систему
          </Text>
          <Text style={[styles.pinSub, { color: colors.textSecondary }]}>
            {existingProfile.fullName} ({existingProfile.group})
          </Text>

          {/* 4 Pin Circles */}
          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinDigits.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    {
                      borderColor: pinError ? colors.danger : colors.accent,
                      backgroundColor: isFilled
                        ? (pinError ? colors.danger : colors.accent)
                        : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>

          {pinError && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              Неверный код доступа. Попробуйте снова.
            </Text>
          )}

          {/* Custom iOS Numeric Keypad */}
          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((k, kIdx) => {
                  if (k === '') {
                    return <View key={kIdx} style={styles.keypadKeyEmpty} />;
                  }
                  if (k === 'del') {
                    return (
                      <TouchableOpacity
                        key={kIdx}
                        activeOpacity={0.6}
                        onPress={handleDelete}
                        style={[styles.keypadKey, { backgroundColor: colors.cardBg }]}
                      >
                        <Delete size={22} color={colors.textPrimary} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={kIdx}
                      activeOpacity={0.6}
                      onPress={() => handleKeyPress(k)}
                      style={[styles.keypadKey, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                    >
                      <Text style={[styles.keypadText, { color: colors.textPrimary }]}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsRegisterMode(true)}
            style={styles.switchAccountBtn}
          >
            <Text style={[styles.switchAccountText, { color: colors.accent }]}>
              Регистрация другого студента
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===================== REGISTRATION SCREEN =====================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.regHeader}>
          <LinearGradient
            colors={['#0369a1', '#0284c7']}
            style={styles.logoBadge}
          >
            <Shield size={32} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.regCollegeName, { color: colors.textPrimary }]}>ЦАТЭК АЛМАТЫ</Text>
          <Text style={[styles.regSubtitle, { color: colors.textSecondary }]}>
            Информационная система расписания колледжа
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[styles.inputGroupTitle, { color: colors.accent }]}>
            ЛИЧНЫЕ ДАННЫЕ СТУДЕНТА
          </Text>

          <GlassCard style={styles.cardFields}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ФАМИЛИЯ</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Смирнов"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { color: colors.textPrimary }]}
            />

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ИМЯ</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Алексей"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { color: colors.textPrimary }]}
            />
          </GlassCard>
        </View>

        {/* Group Selection */}
        <View style={styles.formSection}>
          <View style={styles.groupHeaderRow}>
            <Text style={[styles.inputGroupTitle, { color: colors.accent }]}>
              ВЫБОР УЧЕБНОЙ ГРУППЫ (ЦАТЭК 4 КУРС)
            </Text>
            <Text style={[styles.groupHint, { color: colors.textMuted }]}>
              12 групп
            </Text>
          </View>

          <View style={styles.groupsGrid}>
            {CATEC_GROUPS.map((grp) => {
              const isSelected = selectedGroup === grp.name;
              return (
                <TouchableOpacity
                  key={grp.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch (e) {}
                    setSelectedGroup(grp.name);
                  }}
                  style={[
                    styles.groupTile,
                    {
                      backgroundColor: isSelected ? colors.accentLight : colors.cardBg,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.groupTileName,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {grp.name}
                  </Text>
                  <Text
                    style={[styles.groupTileSub, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {grp.specialty.split(' ')[0]}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkDot, { backgroundColor: colors.accent }]}>
                      <Check size={10} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.submitSection}>
          <GlassButton
            title="Зарегистрироваться и получить код"
            onPress={handleRegisterSubmit}
            size="lg"
            variant="primary"
            icon={<ArrowRight size={20} color="#ffffff" />}
          />

          {existingProfile && (
            <TouchableOpacity
              onPress={() => setIsRegisterMode(false)}
              style={styles.cancelRegBtn}
            >
              <Text style={[styles.cancelRegText, { color: colors.textSecondary }]}>
                У меня уже есть код (Войти по PIN-коду)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Code Modal Confirmation */}
      <GlassModal
        visible={!!generatedCode}
        onClose={handleFinishRegistration}
      >
        <View style={styles.codeModalBody}>
          <View style={[styles.codeIconBox, { backgroundColor: colors.accentLight }]}>
            <KeyRound size={32} color={colors.accent} />
          </View>
          <Text style={[styles.codeModalTitle, { color: colors.textPrimary }]}>
            Регистрация завершена!
          </Text>
          <Text style={[styles.codeModalDesc, { color: colors.textSecondary }]}>
            Вам присвоен персональный 4-значный код доступа в систему ЦАТЭК:
          </Text>

          {/* Big Highlighted 4-Digit Code Box */}
          <View style={[styles.codeBox, { backgroundColor: colors.cardElevated, borderColor: colors.accent }]}>
            <Text style={[styles.codeText, { color: colors.accent }]}>
              {generatedCode}
            </Text>
          </View>

          <Text style={[styles.codeNotice, { color: colors.textMuted }]}>
            Запомните этот код! Он потребуется для быстрого входа в личный кабинет при выходе из приложения.
          </Text>

          <GlassButton
            title="Перейти к расписанию"
            onPress={handleFinishRegistration}
            size="lg"
            variant="primary"
          />
        </View>
      </GlassModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
  },
  regHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  regCollegeName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  regSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupHint: {
    fontSize: 11,
  },
  cardFields: {
    padding: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupTile: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  groupTileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  groupTileSub: {
    fontSize: 10,
    marginTop: 2,
  },
  checkDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitSection: {
    marginTop: 10,
  },
  cancelRegBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  cancelRegText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // PIN View
  pinWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 50,
    alignItems: 'center',
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconShield: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catecLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pinTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  pinSub: {
    fontSize: 14,
    marginBottom: 28,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
    marginTop: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyEmpty: {
    width: 70,
    height: 70,
  },
  keypadText: {
    fontSize: 26,
    fontWeight: '600',
  },
  switchAccountBtn: {
    marginTop: 26,
    paddingVertical: 10,
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Code Modal
  codeModalBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  codeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  codeModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  codeModalDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  codeBox: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 14,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
  },
  codeNotice: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});
