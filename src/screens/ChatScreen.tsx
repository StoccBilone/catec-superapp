import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Send,
  Paperclip,
  Users,
  FileText,
  Shield,
  Info,
} from 'lucide-react-native';
import { ChatMessage, UserProfile } from '../types';
import { CATEC_GROUPS } from '../data/catecData';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { GlassHeader } from '../components/GlassHeader';
import { GlassModal } from '../components/GlassModal';

interface ChatScreenProps {
  profile: UserProfile;
  onOpenNotifications: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  profile,
  onOpenNotifications,
}) => {
  const { colors, mode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const groupMeta = CATEC_GROUPS.find(
    (g) => g.name.toLowerCase() === profile.group.toLowerCase()
  ) || CATEC_GROUPS[0];

  useEffect(() => {
    loadMessages();
  }, [profile.group]);

  const loadMessages = async () => {
    const list = await StorageService.getChatMessages(profile.group);
    setMessages(list);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: profile.id,
      senderName: profile.fullName,
      senderRole: 'student',
      avatarColor: colors.accent,
      text: inputText.trim(),
      createdAt: timeStr,
      isOwn: true,
    };

    const updated = await StorageService.addChatMessage(profile.group, newMsg);
    setMessages(updated);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <GlassHeader
        title={`Беседа ${profile.group}`}
        subtitle="Чат учебной группы"
        rightBadge={`${groupMeta.studentCount} студ.`}
        onNotificationPress={onOpenNotifications}
      />

      {/* Subheader: Curator Info Bar */}
      <View style={[styles.groupSubHeader, { borderBottomColor: colors.divider }]}>
        <View style={styles.subLeft}>
          <Users size={16} color={colors.accent} />
          <Text style={[styles.curatorText, { color: colors.textSecondary }]}>
            Куратор: {groupMeta.curator}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowInfoModal(true)}
          style={[styles.infoBtn, { backgroundColor: colors.cardBg }]}
        >
          <Info size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Message Feed */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isOwn = msg.isOwn || msg.senderId === profile.id;
          const isTeacher = msg.senderRole === 'teacher';

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isOwn ? styles.rowRight : styles.rowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubbleContainer,
                  isOwn
                    ? [styles.bubbleOwn, { backgroundColor: colors.accent }]
                    : [
                        styles.bubbleOther,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.cardBorder,
                        },
                      ],
                  isTeacher && !isOwn && { borderLeftColor: colors.accent, borderLeftWidth: 3 },
                ]}
              >
                {!isOwn && (
                  <View style={styles.senderHeader}>
                    <Text
                      style={[
                        styles.senderName,
                        { color: isTeacher ? colors.accent : colors.textPrimary },
                      ]}
                    >
                      {msg.senderName}
                    </Text>
                    {isTeacher && (
                      <View style={[styles.teacherPill, { backgroundColor: colors.tagBg }]}>
                        <Shield size={9} color={colors.accent} />
                        <Text style={[styles.teacherPillText, { color: colors.accent }]}>Куратор</Text>
                      </View>
                    )}
                  </View>
                )}

                <Text
                  style={[
                    styles.messageText,
                    { color: isOwn ? '#ffffff' : colors.textPrimary },
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <View style={styles.attachmentsList}>
                    {msg.attachments.map((att, i) => (
                      <View key={i} style={[styles.attachmentCard, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                        <FileText size={16} color={colors.accent} />
                        <View style={styles.attDetails}>
                          <Text style={[styles.attTitle, { color: '#ffffff' }]} numberOfLines={1}>
                            {att.title}
                          </Text>
                          {att.size && (
                            <Text style={styles.attSub}>{att.size}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <Text
                  style={[
                    styles.timeText,
                    { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}
                >
                  {msg.createdAt}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 0}
      >
        <View style={[styles.inputBar, { backgroundColor: colors.canvasElevated, borderTopColor: colors.divider }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch (e) {}
            }}
            style={[styles.attachBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
          >
            <Paperclip size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Сообщение в группу ${profile.group}...`}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.chatInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSend}
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim().length > 0 ? colors.accent : colors.tagBg,
              },
            ]}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Group Info Modal */}
      <GlassModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBody}>
          <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
            Группа {groupMeta.name}
          </Text>
          <Text style={[styles.modalFaculty, { color: colors.textSecondary }]}>
            {groupMeta.specialty}
          </Text>

          <View style={styles.statGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{groupMeta.studentCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Студентов</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>4</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Курс</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>7</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Семестр</Text>
            </View>
          </View>

          <View style={[styles.curatorCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Shield size={20} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.curatorCardTitle, { color: colors.textMuted }]}>Куратор группы</Text>
              <Text style={[styles.curatorCardName, { color: colors.textPrimary }]}>{groupMeta.curator}</Text>
            </View>
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
  groupSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  curatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBtn: {
    padding: 6,
    borderRadius: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  teacherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teacherPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  attachmentsList: {
    marginTop: 8,
    gap: 6,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    gap: 8,
  },
  attDetails: {
    flex: 1,
  },
  attTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  attSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
    marginBottom: 0,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingVertical: 12,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalFaculty: {
    fontSize: 13,
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  curatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  curatorCardTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  curatorCardName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
