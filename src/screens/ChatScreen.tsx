import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableOpacity, Alert, Pressable } from "../components/Typography";
import * as Haptics from 'expo-haptics';
import {
  Send,
  Paperclip,
  Users,
  Shield,
  Info,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { ChatMessage, Material, UserProfile } from '../types';
import { CATEC_GROUPS } from '../data/catecData';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { GlassModal } from '../components/GlassModal';
import { MaterialView } from '../components/MaterialView';
import { pickMaterial } from '../services/materials';
import { RecordButton } from '../components/RecordButton';
import { GlassTool } from '../components/GlassTool';
import { ChatRecorder, RecorderHandle } from '../components/ChatRecorder';

interface ChatScreenProps {
  profile: UserProfile;
  onOpenNotifications: () => void;
  title?: string;
  onBack?: () => void;
  groupName?: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  profile,
  title,
  onBack,
  groupName,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const nearBottom = useRef(true);
  const recorder = useRef<RecorderHandle>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordMode, setRecordMode] = useState<'voice' | 'videoNote'>('voice');
  const [attachments, setAttachments] = useState<Material[]>([]);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const attach = async (kind: 'media' | 'document') => {
    if (busy || attachments.length >= 5) return;
    setShowAttachmentPicker(false); setBusy(true);
    try { await new Promise(resolve => setTimeout(resolve, 240)); const item = await pickMaterial(kind); if (item) setAttachments(current => [...current, item]); }
    catch (error) { Alert.alert('Не удалось добавить вложение', error instanceof Error ? error.message : 'Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  };

  const groupMeta = CATEC_GROUPS.find(
    (g) => g.name.toLowerCase() === (groupName || profile.group).toLowerCase()
  );

  useEffect(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading || AppState.currentState !== 'active') return;
      loading = true;
      try { const list = await StorageService.getChatMessages(profile.group); if (active) setMessages(list); }
      catch { /* Keep the last messages while a connection recovers. */ }
      finally { loading = false; }
    };
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => { active = false; clearInterval(timer); };
  }, [profile.group]);

  const send = async (recorded?: Material) => {
    if (busy) throw new Error('Дождитесь завершения отправки.');
    if (!recorded && !inputText.trim() && !attachments.length) return;
    setBusy(true);
    try {

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

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
      attachments: recorded ? [recorded] : attachments,
    };

    const updated = await StorageService.addChatMessage(profile.group, newMsg);
    nearBottom.current = true;
    setMessages(updated);
    setInputText('');
    setAttachments([]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.canvas }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <View style={[styles.conversationHeader, { borderBottomColor: colors.divider }]}>
        <GlassTool label="Назад к чатам" onPress={() => onBack?.()} disabled={!onBack}><ChevronLeft color={colors.textPrimary} size={22} /></GlassTool>
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.conversationTitle, { color: colors.textPrimary }]}>{title || profile.group}</Text>{groupMeta && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>{groupMeta.studentCount} студентов</Text>}</View>
        <GlassTool label="О беседе" onPress={() => setShowInfoModal(true)}><Info color={colors.textPrimary} size={22} /></GlassTool>
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

      <ScrollView
        style={{ flex: 1, overflow: 'hidden' }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustKeyboardInsets={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; nearBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80; }}
        scrollEventThrottle={100}
        onContentSizeChange={() => { if (nearBottom.current) scrollViewRef.current?.scrollToEnd({ animated: true }); }}
      >
        {messages.map((msg) => {
          const isOwn = msg.isOwn || msg.senderId === profile.id;
          const bareMedia = !msg.text.trim() && !!msg.attachments?.length && msg.attachments.every(item => item.type === 'voice' || item.type === 'videoNote');
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
                  isTeacher && !isOwn && !bareMedia && { borderLeftColor: colors.accent, borderLeftWidth: 3 },
                  bareMedia && { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 },
                ]}
              >
                {!isOwn && (
                  <View style={styles.senderHeader}>
                    <Text translate={false}
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

                {msg.text ? <Text translate={false}
                  style={[
                    styles.messageText,
                    { color: isOwn ? colors.onAccent : colors.textPrimary },
                  ]}
                >
                  {msg.text}
                </Text> : null}

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <View style={[styles.attachmentsList, bareMedia && { marginTop: 0 }]}>
                    {msg.attachments.map((att, i) => <MaterialView key={att.id || i} item={att} />)}
                  </View>
                )}

                <Text
                  style={[
                    styles.timeText,
                    { color: bareMedia || !isOwn ? colors.textMuted : colors.onAccent },
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
        {attachments.length > 0 && <ScrollView horizontal style={{ maxHeight: 52 }} keyboardShouldPersistTaps="handled">{attachments.map(item => <Pressable key={item.id} onPress={() => setAttachments(current => current.filter(value => value.id !== item.id))} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 }}><Text translate={false} numberOfLines={1} style={{ color: colors.accent, maxWidth: 180 }}>{item.title}</Text><X size={16} color={colors.textMuted} /></Pressable>)}</ScrollView>}
        <View style={[styles.inputBar, { backgroundColor: colors.canvasElevated, borderTopColor: colors.divider, paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8) }]}>
          <GlassTool label="Добавить вложение" onPress={() => setShowAttachmentPicker(true)}><Paperclip size={20} color={colors.textPrimary} /></GlassTool>

          <TextInput
            editable={!recordingActive} maxLength={10000} value={inputText}
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

          {(inputText.trim() || attachments.length) ? <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => void send().catch(() => Alert.alert('Не удалось отправить', 'Попробуйте ещё раз.'))}
            disabled={busy}
            accessibilityLabel="Отправить сообщение"
            style={[
              styles.sendBtn,
              {
                backgroundColor: colors.accent,
              },
            ]}
          >
            <Send size={18} color={colors.onAccent} />
          </TouchableOpacity> : <RecordButton mode={recordMode} disabled={busy || recordingActive} onToggle={() => setRecordMode(recordMode === 'voice' ? 'videoNote' : 'voice')} onStart={() => recorder.current?.start(recordMode)} onMove={distance => recorder.current?.move(distance)} onRelease={() => recorder.current?.release()} onCancel={() => recorder.current?.cancel()} />}
        </View>

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
            {groupMeta?.specialty || 'Личная беседа'}
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
      <GlassModal visible={showAttachmentPicker} onClose={() => setShowAttachmentPicker(false)}><Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 18 }}>Добавить вложение</Text><Pressable onPress={() => void attach('media')} style={{ paddingVertical: 16 }}><Text style={{ color: colors.accent, fontSize: 17 }}>Фото / видео</Text></Pressable><Pressable onPress={() => void attach('document')} style={{ paddingVertical: 16 }}><Text style={{ color: colors.accent, fontSize: 17 }}>Документ</Text></Pressable></GlassModal>
      <ChatRecorder ref={recorder} onSend={item => send(item)} onActiveChange={setRecordingActive} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  conversationHeader: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8, height: 72, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth },
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginBottom: 0,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 16,
    minHeight: 44,
    maxHeight: 110,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
