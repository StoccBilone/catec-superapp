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
  ChevronLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMessage, UserProfile } from '../types';
import { CATEC_GROUPS } from '../data/catecData';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { GlassModal } from '../components/GlassModal';

interface ChatScreenProps {
  profile: UserProfile;
  onOpenNotifications: () => void;
  title?: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  profile,
  title,
  onBack,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const groupMeta = CATEC_GROUPS.find(
    (g) => g.name.toLowerCase() === profile.group.toLowerCase()
  );

  useEffect(() => {
    let active = true;
    void StorageService.getChatMessages(profile.group).then(list => { if (active) setMessages(list); });
    return () => { active = false; };
  }, [profile.group]);

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
      <View style={[styles.conversationHeader, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Назад к чатам" style={styles.backButton}><ChevronLeft color={colors.accent} size={28} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.conversationTitle, { color: colors.textPrimary }]}>{title || profile.group}</Text><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>{groupMeta ? `${groupMeta.studentCount} студентов` : 'Локальная демобеседа'}</Text></View>
        <TouchableOpacity onPress={() => setShowInfoModal(true)} style={styles.backButton} accessibilityLabel="О беседе"><Info color={colors.textSecondary} size={22} /></TouchableOpacity>
      </View>

      {/* Subheader: Curator Info Bar */}
      {groupMeta && <View style={[styles.groupSubHeader, { borderBottomColor: colors.divider }]}>
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
      </View>}

      {/* Message Feed */}
      <KeyboardAvoidingView style={{ flex: 1, overflow: 'hidden' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <ScrollView
        style={{ flex: 1, overflow: 'hidden' }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustKeyboardInsets={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
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
            placeholder="Сообщение..."
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
            disabled={!inputText.trim()}
            accessibilityLabel="Отправить сообщение"
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
            {title || groupMeta?.name || 'Беседа'}
          </Text>
          <Text style={[styles.modalFaculty, { color: colors.textSecondary }]}>
            {groupMeta?.specialty || 'Демонстрационный разговор на этом устройстве'}
          </Text>

          {groupMeta && <View style={styles.statGrid}>
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
          </View>}

          {groupMeta && <View style={[styles.curatorCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Shield size={20} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.curatorCardTitle, { color: colors.textMuted }]}>Куратор группы</Text>
              <Text style={[styles.curatorCardName, { color: colors.textPrimary }]}>{groupMeta.curator}</Text>
            </View>
          </View>}
        </View>
      </GlassModal>
    </View>
  );
};

const styles = StyleSheet.create({
  conversationHeader: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  conversationTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
  },
  groupSubHeader: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  subLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  curatorText: {
    flexShrink: 1,
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
    fontSize: 17,
    lineHeight: 23,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
