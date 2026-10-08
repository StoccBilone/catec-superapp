import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, TouchableOpacity, TextInput } from "../components/Typography";
import * as Haptics from 'expo-haptics';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Layers,
  FileText,
  BookOpen,
  ChevronDown,
} from 'lucide-react-native';
import { Lesson, UserProfile } from '../types';
import { CATEC_LESSONS, CATEC_GROUPS } from '../data/catecData';
import { useTheme } from '../theme/themeContext';
import { GlassCard } from '../components/GlassCard';
import { GlassHeader } from '../components/GlassHeader';
import { GlassModal } from '../components/GlassModal';
import { GlassButton } from '../components/GlassButton';

interface ScheduleScreenProps {
  profile: UserProfile;
  onOpenNotifications: () => void;
  onUpdateGroup: (groupName: string) => void;
}

const DAYS = [
  { id: 1, label: 'Пн', full: 'Дүйсенбі / Понедельник' },
  { id: 2, label: 'Вт', full: 'Сейсенбі / Вторник' },
  { id: 3, label: 'Ср', full: 'Сәрсенбі / Среда' },
  { id: 4, label: 'Чт', full: 'Бейсенбі / Четверг' },
  { id: 5, label: 'Пт', full: 'Жұма / Пятница' },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  profile,
  onOpenNotifications,
  onUpdateGroup,
}) => {
  const { colors, mode } = useTheme();

  // Current day default
  const todayDay = new Date().getDay();
  const initialDay = todayDay >= 1 && todayDay <= 5 ? todayDay : 1;

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonNote, setLessonNote] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [showGroupPickerModal, setShowGroupPickerModal] = useState(false);

  // Filter lessons based on user's selected CATEC group
  const dayLessons = useMemo(() => {
    return CATEC_LESSONS
      .filter((lesson) => {
        return (
          lesson.group.toLowerCase() === profile.group.toLowerCase() &&
          lesson.dayOfWeek === selectedDay
        );
      })
      .sort((a, b) => a.pairNumber - b.pairNumber);
  }, [profile.group, selectedDay]);

  const handleDaySelect = (dayId: number) => {
    if (dayId === selectedDay) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedDay(dayId);
  };

  const handleLessonClick = (lesson: Lesson) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedLesson(lesson);
    setLessonNote(savedNotes[lesson.id] || lesson.notes || '');
  };

  const handleSaveNote = () => {
    if (!selectedLesson) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setSavedNotes((prev) => ({
      ...prev,
      [selectedLesson.id]: lessonNote,
    }));
    setSelectedLesson(null);
  };

  const activeDayObj = DAYS.find((d) => d.id === selectedDay) || DAYS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <GlassHeader
        title="Расписание"
        subtitle={`ЦАТЭК • ${profile.group}`}
        rightBadge={profile.group}
        onNotificationPress={onOpenNotifications}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Group Switcher Bar */}
        <View style={styles.groupBarRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowGroupPickerModal(true)}
            style={[
              styles.groupPillBtn,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <BookOpen size={14} color={colors.accent} />
            <Text style={[styles.groupPillText, { color: colors.textPrimary }]}>
              Группа: {profile.group}
            </Text>
            <ChevronDown size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.semesterBadge}>
            <Text style={[styles.semesterText, { color: colors.accent }]}>
              4 КУРС • 7 СЕМЕСТР
            </Text>
          </View>
        </View>

        {/* Days of Week Bar (Пн - Пт) */}
        <View style={styles.daysContainer}>
          {DAYS.map((day) => {
            const isSelected = day.id === selectedDay;
            const hasLessons = CATEC_LESSONS.some(
              (l) => l.group.toLowerCase() === profile.group.toLowerCase() && l.dayOfWeek === day.id
            );

            return (
              <TouchableOpacity
                key={day.id}
                activeOpacity={0.7}
                onPress={() => handleDaySelect(day.id)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: isSelected ? colors.accentLight : colors.cardBg,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: isSelected ? colors.accent : colors.textSecondary },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {day.label}
                </Text>
                {hasLessons && (
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: isSelected ? colors.accent : colors.textMuted },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day Title Row */}
        <View style={styles.dayTitleRow}>
          <Text style={[styles.dayTitleText, { color: colors.textPrimary }]}>
            {activeDayObj.full}
          </Text>
          <Text style={[styles.lessonsCountText, { color: colors.accent }]}>
            {dayLessons.length} {dayLessons.length === 1 ? 'пара' : dayLessons.length < 5 ? 'пары' : 'пар'}
          </Text>
        </View>

        {/* Lessons List */}
        {dayLessons.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Calendar size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Нет пар на этот день
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              В этот день занятий для группы {profile.group} не запланировано.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.lessonsList}>
            {dayLessons.map((lesson, idx) => {
              const note = savedNotes[lesson.id] || lesson.notes;
              const isFirst = idx === 0;

              return (
                <TouchableOpacity
                  key={lesson.id}
                  activeOpacity={0.85}
                  onPress={() => handleLessonClick(lesson)}
                >
                  <GlassCard
                    style={styles.lessonCard}
                    glowColor={isFirst ? 'cyan' : 'none'}
                  >
                    {/* Pair & Time */}
                    <View style={styles.lessonTopRow}>
                      <View style={[styles.pairNumberBadge, { backgroundColor: colors.tagBg }]}>
                        <Text style={[styles.pairNumberText, { color: colors.accent }]}>
                          {lesson.pairNumber} ПАРА
                        </Text>
                      </View>

                      <View style={styles.timeRow}>
                        <Clock size={13} color={colors.textSecondary} />
                        <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                          {lesson.timeStart} – {lesson.timeEnd}
                        </Text>
                      </View>

                      <View style={[styles.roomBadge, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                        <MapPin size={11} color={colors.accent} />
                        <Text style={[styles.roomBadgeText, { color: colors.textPrimary }]}>
                          {lesson.room}
                        </Text>
                      </View>
                    </View>

                    {/* Subject Title */}
                    <Text style={[styles.subjectText, { color: colors.textPrimary }]}>
                      {lesson.subject}
                    </Text>

                    {/* Teacher & Building */}
                    <View style={styles.lessonMetaRow}>
                      <View style={styles.metaItem}>
                        <User size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {lesson.teacher}
                        </Text>
                      </View>
                      <Text style={[styles.buildingSub, { color: colors.textMuted }]}>
                        • {lesson.building}
                      </Text>
                    </View>

                    {/* Note Preview if exists */}
                    {note && (
                      <View style={[styles.notePreview, { backgroundColor: colors.inputBg }]}>
                        <FileText size={12} color={colors.warning} />
                        <Text style={[styles.notePreviewText, { color: colors.textPrimary }]} numberOfLines={1}>
                          {note}
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Lesson Details Modal */}
      <GlassModal
        visible={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
      >
        {selectedLesson && (
          <View style={styles.modalBody}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.pairNumberBadge, { backgroundColor: colors.tagBg }]}>
                <Text style={[styles.pairNumberText, { color: colors.accent }]}>
                  {selectedLesson.pairNumber} ПАРА
                </Text>
              </View>
              <Text style={[styles.modalTimeText, { color: colors.accent }]}>
                {selectedLesson.timeStart} — {selectedLesson.timeEnd}
              </Text>
            </View>

            <Text style={[styles.modalSubject, { color: colors.textPrimary }]}>
              {selectedLesson.subject}
            </Text>

            <View style={[styles.infoCard, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <MapPin size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.infoTitle, { color: colors.textMuted }]}>Аудитория</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {selectedLesson.room} ({selectedLesson.building})
                  </Text>
                </View>
              </View>

              <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoRow}>
                <User size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.infoTitle, { color: colors.textMuted }]}>Преподаватель</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {selectedLesson.teacher}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoRow}>
                <BookOpen size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.infoTitle, { color: colors.textMuted }]}>Группа</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {selectedLesson.group} (4 курс, 7 семестр)
                  </Text>
                </View>
              </View>
            </View>

            {/* Note Editor */}
            <View style={styles.notesSection}>
              <Text style={[styles.notesTitle, { color: colors.accent }]}>
                ЛИЧНАЯ ЗАМЕТКА К ЗАНЯТИЮ
              </Text>
              <TextInput
                value={lessonNote}
                onChangeText={setLessonNote}
                placeholder="Записать домашнее задание, тему лабы или дедлайн..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            <GlassButton
              title="Сохранить заметку"
              onPress={handleSaveNote}
              variant="primary"
              size="md"
            />
          </View>
        )}
      </GlassModal>

      {/* Group Picker Modal */}
      <GlassModal
        visible={showGroupPickerModal}
        onClose={() => setShowGroupPickerModal(false)}
      >
        <View style={styles.modalBody}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Выберите группу ЦАТЭК
          </Text>
          <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
            Расписание автоматически покажет пары выбранной группы:
          </Text>

          <View style={styles.modalGroupsGrid}>
            {CATEC_GROUPS.map((grp) => {
              const isSelected = grp.name === profile.group;
              return (
                <TouchableOpacity
                  key={grp.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch (e) {}
                    onUpdateGroup(grp.name);
                    setShowGroupPickerModal(false);
                  }}
                  style={[
                    styles.modalGroupTile,
                    {
                      backgroundColor: isSelected ? colors.accentLight : colors.cardBg,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.modalGroupName, { color: isSelected ? colors.accent : colors.textPrimary }]}>
                    {grp.name}
                  </Text>
                  <Text style={[styles.modalGroupSpecialty, { color: colors.textMuted }]} numberOfLines={1}>
                    {grp.specialty.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
    paddingBottom: 28,
  },
  groupBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  groupPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  semesterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  semesterText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  daysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  dayTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
  },
  dayTitleText: {
    fontSize: 17,
    fontWeight: '700',
  },
  lessonsCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lessonsList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  lessonCard: {
    marginBottom: 2,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pairNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pairNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  roomBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buildingSub: {
    fontSize: 12,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  notePreviewText: {
    fontSize: 12,
    flex: 1,
  },
  emptyCard: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  modalBody: {
    paddingVertical: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTimeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubject: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    marginVertical: 10,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalGroupTile: {
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalGroupName: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalGroupSpecialty: {
    fontSize: 10,
    marginTop: 2,
  },
});
