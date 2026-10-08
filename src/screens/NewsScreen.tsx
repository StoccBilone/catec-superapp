import React, { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, Image, KeyboardAvoidingView, Platform, RefreshControl, Keyboard } from "react-native";
import { useFocusEffect } from 'expo-router';
import { Text, TextInput, TouchableOpacity, Alert, Pressable } from "../components/Typography";
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Bookmark,
  ChevronLeft,
  FileText,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Paperclip,
  PenLine,
  Share2,
  X,
} from 'lucide-react-native';
import { Material, NewsItem, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';
import { StudentPass } from '../components/StudentPass';
import { ScreenSafeArea as SafeAreaView } from '../components/ScreenSafeArea';
import { pickPhoto } from '../services/photos';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickMaterial } from '../services/materials';
import { GlassTool } from '../components/GlassTool';
import { MaterialView } from '../components/MaterialView';
import { usePreferences } from '../context/PreferencesContext';

interface NewsScreenProps {
  profile: UserProfile;
  onOpenNotifications: () => void;
}

const CATEGORIES: (NewsItem['category'] | 'Все')[] = [
  'Все', 'CATEC', 'AI & IT', 'Хакатон', 'Сессия', 'Студенты',
];

const initials = (name: string) => name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

export const NewsScreen: React.FC<NewsScreenProps> = ({ profile, onOpenNotifications }) => {
  const { colors } = useTheme();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState<NewsItem['category'] | 'Все'>('Все');
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [composerVisible, setComposerVisible] = useState(false);
  const [topic, setTopic] = useState<NewsItem['category']>('Студенты');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const attachMaterial = async (kind: 'media' | 'document') => {
    if (pickingPhoto) return;
    if (materials.length + (photoUri ? 1 : 0) >= 5) { Alert.alert('Вложения', 'Можно добавить до 5 вложений.'); return; }
    setPickingPhoto(true);
    try { const item = await pickMaterial(kind); if (item) setMaterials(current => [...current, item]); }
    catch (error) { Alert.alert('Не удалось добавить вложение', error instanceof Error ? error.message : 'Попробуйте ещё раз.'); }
    finally { setPickingPhoto(false); }
  };
  const attachPhoto = async () => {
    if (pickingPhoto) return;
    if (!photoUri && materials.length >= 5) { Alert.alert('Вложения', 'Можно добавить до 5 вложений.'); return; }
    setPickingPhoto(true);
    try {
      const uri = await pickPhoto('post');
      if (uri) setPhotoUri(uri);
    } catch { Alert.alert('Не удалось добавить фото', 'Попробуйте выбрать изображение ещё раз.'); }
    finally { setPickingPhoto(false); }
  };

  useFocusEffect(useCallback(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try { const items = await StorageService.getAllNewsAndPosts(); if (active) setNews(items); }
      finally { loading = false; }
    };
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => { active = false; clearInterval(timer); };
  }, []));
  const refresh = async () => {
    setRefreshing(true);
    try { setNews(await StorageService.getAllNewsAndPosts()); }
    finally { setRefreshing(false); }
  };

  const filteredNews = useMemo(() => news.filter(item => {
    const text = `${item.title} ${item.summary} ${item.content}`.toLocaleLowerCase();
    return (category === 'Все' || item.category === category) && text.length > 0;
  }), [category, news]);

  const openComposer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setComposerVisible(true);
  };

  const publish = async () => {
    if (publishing || (!body.trim() && !photoUri && !materials.length)) return;
    setPublishing(true);
    try {
    const post: NewsItem = {
      id: `post-${Date.now()}`,
      title: title.trim() || `Публикация от ${profile.fullName}`,
      summary: body.trim().slice(0, 120),
      content: body.trim(),
      category: topic,
      date: 'Только что',
      author: `${profile.fullName} · ${profile.group}`,
      authorRole: 'Студент ЦАТЭК',
      likes: 0,
      commentsCount: 0,
      isUserCreated: true,
      avatarUrl: profile.avatarUrl,
      imageUri: photoUri || undefined,
      attachments: materials,
      authorId: profile.id,
    };
    const updated = await StorageService.createPost(post);
    setNews(updated);
    setTitle('');
    setBody('');
    setPhotoUri(null);
    setMaterials([]);
    setComposerVisible(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch { Alert.alert('Не удалось опубликовать', 'Черновик сохранён. Попробуйте ещё раз.'); }
    finally { setPublishing(false); }
  };

  const toggleLike = (id: string) => {
    setLikes(current => ({ ...current, [id]: !current[id] }));
    void Haptics.selectionAsync().catch(() => {});
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.canvas }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: colors.textPrimary }]}>ЦАТЭК</Text>

          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onOpenNotifications} accessibilityLabel="Уведомления" style={[styles.headerButton, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}>
              <Bell color={colors.textPrimary} size={21} />

            </TouchableOpacity>
            <TouchableOpacity onPress={openComposer} accessibilityLabel="Создать публикацию" style={[styles.composeButton, { backgroundColor: colors.accent }]}>
              <PenLine color={colors.onAccent} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <StudentPass profile={profile} />
          <TouchableOpacity onPress={openComposer} activeOpacity={0.86} style={[styles.startPost, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>{profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarPhoto} /> : <Text style={[styles.avatarText, { color: colors.accent }]}>{initials(profile.fullName)}</Text>}</View>
            <Text style={[styles.startPostText, { color: colors.textMuted }]}>Что нового?</Text>
            <PenLine color={colors.accent} size={19} />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {CATEGORIES.map(item => {
              const selected = item === category;
              return <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: selected ? colors.accent : colors.cardBg, borderColor: selected ? colors.accent : colors.cardBorder }]}>
                <Text style={[styles.categoryText, { color: selected ? colors.onAccent : colors.textSecondary }]}>{item}</Text>
              </TouchableOpacity>;
            })}
          </ScrollView>

          <View style={[styles.feedTitleRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.feedTitle, { color: colors.textPrimary }]}>Лента колледжа</Text>
            <Text style={[styles.feedCount, { color: colors.textMuted }]}>{filteredNews.length}</Text>
          </View>

          {filteredNews.map(item => {
            const liked = !!likes[item.id];
            return (
              <TouchableOpacity key={item.id} activeOpacity={0.92} onPress={() => setArticle(item)} style={[styles.post, { borderBottomColor: colors.divider }]}>
                <View style={styles.threadRail}>
                  <View style={[styles.authorAvatar, { backgroundColor: item.isUserCreated ? colors.accent : colors.accentLight }]}>
                    {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.avatarPhoto} /> : <Text style={[styles.authorAvatarText, { color: item.isUserCreated ? colors.onAccent : colors.accent }]}>{initials(item.author)}</Text>}
                  </View>
                  <View style={[styles.threadLine, { backgroundColor: colors.divider }]} />
                </View>
                <View style={styles.postContent}>
                  <View style={styles.postTop}>
                    <View style={styles.authorMeta}>
                      <Text translate={false} numberOfLines={1} style={[styles.authorName, { color: colors.textPrimary }]}>{item.author}</Text>
                      <Text style={[styles.authorRole, { color: colors.textMuted }]}>{item.authorRole || 'ЦАТЭК'} · {item.date}</Text>
                    </View>
                    <Text style={[styles.topicText, { color: item.isImportant ? '#8a5c00' : colors.accent }]}>{item.isImportant ? 'Важно' : item.category}</Text>
                  </View>
                  <Text translate={false} style={[styles.postTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text translate={false} numberOfLines={4} style={[styles.postBody, { color: colors.textSecondary }]}>{item.content}</Text>
                  {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.postImage} resizeMode="cover" />}
                  {item.attachments?.map(material => <MaterialView key={material.id} item={material} />)}
                  <View style={styles.postFooter}>
                    <TouchableOpacity onPress={(event) => { event.stopPropagation(); toggleLike(item.id); }} style={styles.footerAction}>
                      <Heart size={19} color={liked ? '#d84d4d' : colors.textSecondary} fill={liked ? '#d84d4d' : 'none'} />
                      <Text style={[styles.footerText, { color: liked ? '#c13f3f' : colors.textMuted }]}>{item.likes + (liked ? 1 : 0)}</Text>
                    </TouchableOpacity>
                    <View style={styles.footerAction}><MessageCircle size={19} color={colors.textSecondary} /><Text style={[styles.footerText, { color: colors.textMuted }]}>{item.commentsCount || 0}</Text></View>
                    <View style={styles.footerAction}><Share2 size={18} color={colors.textSecondary} /></View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>


      <ArticleModal article={article} colors={colors} onClose={() => setArticle(null)} />
      <ComposerModal visible={composerVisible} profile={profile} colors={colors} topic={topic} title={title} body={body}
        materials={materials} publishing={publishing} onMaterial={kind => void attachMaterial(kind)} onRemoveMaterial={id => setMaterials(current => current.filter(item => item.id !== id))}
        photoUri={photoUri} pickingPhoto={pickingPhoto} onPhoto={() => void attachPhoto()} onRemovePhoto={() => setPhotoUri(null)}
        onClose={() => { if (!publishing) setComposerVisible(false); }} onTopic={setTopic} onTitle={setTitle} onBody={setBody} onPublish={publish} />
    </View>
  );
};

function ArticleModal({ article, colors, onClose }: { article: NewsItem | null; colors: ReturnType<typeof useTheme>['colors']; onClose: () => void }) {
  const { motionReduced } = usePreferences();
  return <Modal visible={!!article} animationType={motionReduced ? 'none' : 'slide'} onRequestClose={onClose}>
    <SafeAreaView modal style={[styles.modalPage, { backgroundColor: colors.canvasElevated }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.modalIcon}><ChevronLeft color={colors.textPrimary} size={28} /></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Публикация</Text>
        <TouchableOpacity style={styles.modalIcon}><Bookmark color={colors.textPrimary} size={21} /></TouchableOpacity>
      </View>
      {article && <ScrollView contentContainerStyle={styles.articleContent}>
        <Text style={[styles.articleTopic, { color: colors.accent }]}>{article.category}</Text>
        <Text translate={false} style={[styles.articleHeading, { color: colors.textPrimary }]}>{article.title}</Text>
        <Text style={[styles.articleByline, { color: colors.textMuted }]}>{article.author} · {article.date}</Text>
        {article.imageUri && <Image source={{ uri: article.imageUri }} style={styles.postImage} resizeMode="cover" />}
        {article.attachments?.map(material => <MaterialView key={material.id} item={material} />)}
        <Text translate={false} style={[styles.articleText, { color: colors.textSecondary }]}>{article.content}</Text>
      </ScrollView>}
    </SafeAreaView>
  </Modal>;
}

interface ComposerProps {
  materials: Material[];
  publishing: boolean;
  onMaterial: (kind: 'media' | 'document') => void;
  onRemoveMaterial: (id: string) => void;
  visible: boolean;
  profile: UserProfile;
  colors: ReturnType<typeof useTheme>['colors'];
  topic: NewsItem['category'];
  title: string;
  body: string;
  onClose: () => void;
  onTopic: (topic: NewsItem['category']) => void;
  onTitle: (title: string) => void;
  onBody: (body: string) => void;
  onPublish: () => void;
  photoUri: string | null;
  pickingPhoto: boolean;
  onPhoto: () => void;
  onRemovePhoto: () => void;
}

function ComposerModal(props: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const { motionReduced } = usePreferences();
  const canPublish = !props.publishing && (props.body.trim().length > 0 || !!props.photoUri || props.materials.length > 0);
  return <Modal visible={props.visible} animationType={motionReduced ? 'none' : 'slide'} onRequestClose={props.onClose}>
    <SafeAreaView modal edges={['left', 'right']} style={[styles.modalPage, { backgroundColor: props.colors.canvasElevated }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <View style={[styles.modalHeader, { borderBottomColor: props.colors.divider }]}>
        <TouchableOpacity onPress={props.onClose} style={styles.cancelButton}><Text style={[styles.cancelText, { color: props.colors.textSecondary }]}>Отмена</Text></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: props.colors.textPrimary }]}>Новая ветка</Text>
        <TouchableOpacity disabled={!canPublish} onPress={props.onPublish} style={[styles.publishButton, { backgroundColor: canPublish ? props.colors.accent : props.colors.inputBorder }]}><Text style={[styles.publishText, { color: props.colors.onAccent }]}>Опубликовать</Text></TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="never" automaticallyAdjustKeyboardInsets={false} contentContainerStyle={styles.composerContent} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        <View style={styles.composerAuthor}>
          <View style={[styles.avatar, { backgroundColor: props.colors.accentLight }]}>{props.profile.avatarUrl ? <Image source={{ uri: props.profile.avatarUrl }} style={styles.avatarPhoto} /> : <Text style={[styles.avatarText, { color: props.colors.accent }]}>{initials(props.profile.fullName)}</Text>}</View>
          <View><Text translate={false} style={[styles.authorName, { color: props.colors.textPrimary }]}>{props.profile.fullName}</Text><Text style={[styles.authorRole, { color: props.colors.textMuted }]}>{props.profile.group} · Студент ЦАТЭК</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.composerTopics}>
          {CATEGORIES.filter(item => item !== 'Все').map(item => <TouchableOpacity key={item} onPress={() => props.onTopic(item)} style={[styles.composerTopic, { backgroundColor: props.topic === item ? props.colors.accentLight : props.colors.inputBg, borderColor: props.topic === item ? props.colors.accent : 'transparent' }]}><Text style={{ color: props.topic === item ? props.colors.accent : props.colors.textSecondary, fontWeight: '700', fontSize: 13 }}>{item}</Text></TouchableOpacity>)}
        </ScrollView>
        <TextInput maxLength={160} value={props.title} onChangeText={props.onTitle} placeholder="Заголовок (необязательно)" placeholderTextColor={props.colors.textMuted} style={[styles.composerTitleInput, { color: props.colors.textPrimary, borderBottomColor: props.colors.divider }]} />
        <TextInput maxLength={10000} value={props.body} onChangeText={props.onBody} multiline autoFocus placeholder="Что нового?" placeholderTextColor={props.colors.textMuted} textAlignVertical="top" style={[styles.composerBodyInput, { color: props.colors.textPrimary }]} />
        {props.photoUri && <View style={{ position: 'relative' }}><Image source={{ uri: props.photoUri }} style={styles.postImage} resizeMode="cover" /><TouchableOpacity accessibilityLabel="Удалить фото из черновика" onPress={props.onRemovePhoto} style={styles.removePhoto}><X color="#fff" size={18} /></TouchableOpacity></View>}
        {props.materials.map(item => <View key={item.id}><MaterialView item={item} /><Pressable accessibilityLabel="Удалить вложение" onPress={() => props.onRemoveMaterial(item.id)} style={{ alignSelf: 'flex-end', padding: 10 }}><X color={props.colors.textMuted} size={18} /></Pressable></View>)}
      </ScrollView>
        <View style={[styles.attachmentPanel, { backgroundColor: props.colors.canvasElevated, paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 12) }]}>
          <GlassTool label="Фото" disabled={props.pickingPhoto} onPress={props.onPhoto}><ImageIcon color={props.colors.textPrimary} size={20} /></GlassTool>
          <GlassTool label="Документ" disabled={props.pickingPhoto} onPress={() => props.onMaterial('document')}><FileText color={props.colors.textPrimary} size={20} /></GlassTool>
          <GlassTool label="Фото / видео" disabled={props.pickingPhoto} onPress={() => props.onMaterial('media')}><Paperclip color={props.colors.textPrimary} size={20} /></GlassTool>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  avatarPhoto: { width: 38, height: 38, borderRadius: 19 },
  postImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginTop: 12, marginBottom: 12, backgroundColor: '#f1f5f9' },
  removePhoto: { position: 'absolute', top: 20, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1 },
  header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 72 },
  brand: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7 }, headerCaption: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 9 }, headerButton: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, composeButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, right: 10, top: 10, borderWidth: 1.5, borderColor: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  startPost: { minHeight: 64, borderRadius: 19, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontWeight: '700', fontSize: 13 }, startPostText: { flex: 1, fontSize: 14 },
  categories: { paddingTop: 13, paddingBottom: 5, gap: 8 }, category: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 }, categoryText: { fontSize: 13, fontWeight: '700' },
  feedTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, marginBottom: 0, paddingBottom: 11, borderBottomWidth: StyleSheet.hairlineWidth }, feedTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.25 }, feedCount: { fontSize: 12 },
  post: { flexDirection: 'row', paddingTop: 14, paddingBottom: 15, borderBottomWidth: StyleSheet.hairlineWidth }, threadRail: { width: 48, alignItems: 'center' }, threadLine: { flex: 1, width: 1, marginTop: 7 }, postContent: { flex: 1, minWidth: 0, paddingRight: 2 }, postTop: { flexDirection: 'row', alignItems: 'flex-start' }, authorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, authorAvatarText: { fontWeight: '700', fontSize: 12 }, authorMeta: { flex: 1, minWidth: 0 }, authorName: { fontSize: 14, fontWeight: '700' }, authorRole: { fontSize: 11, marginTop: 2 }, topicText: { fontSize: 11, fontWeight: '700', marginLeft: 8, paddingTop: 1 },
  postTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.12, marginTop: 11 }, postBody: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  postFooter: { marginTop: 12, flexDirection: 'row', gap: 22 }, footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 }, footerText: { fontSize: 12, fontWeight: '600' },
  modalPage: { flex: 1 }, modalHeader: { height: 72, flexShrink: 0, gap: 8, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 }, modalIcon: { width: 40, alignItems: 'center' }, cancelButton: { width: 64 }, cancelText: { fontSize: 15, fontWeight: '600' }, publishButton: { minWidth: 80, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' }, publishText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  articleContent: { padding: 22, paddingBottom: 50 }, articleTopic: { fontSize: 13, fontWeight: '700', marginBottom: 10 }, articleHeading: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 }, articleByline: { fontSize: 13, lineHeight: 18, marginTop: 14, marginBottom: 25 }, articleText: { fontSize: 17, lineHeight: 27 },
  composerContent: { padding: 20, paddingBottom: 42 }, composerAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 }, composerTopics: { gap: 6, paddingVertical: 14 }, composerTopic: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }, composerTitleInput: { fontSize: 19, fontWeight: '700', paddingVertical: 12, borderBottomWidth: 1 }, composerBodyInput: { fontSize: 17, lineHeight: 25, minHeight: 210, paddingTop: 17 }, attachmentPanel: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, gap: 12, flexShrink: 0 }, attachmentButton: { alignItems: 'center', gap: 6 }, attachmentText: { fontSize: 11, fontWeight: '600' },
});
