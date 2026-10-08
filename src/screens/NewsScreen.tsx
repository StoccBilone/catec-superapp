import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
} from 'lucide-react-native';
import { NewsItem, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { useTheme } from '../theme/themeContext';

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
  const [attachment, setAttachment] = useState<'photo' | 'file' | null>(null);

  useEffect(() => {
    void StorageService.getAllNewsAndPosts().then(setNews);
  }, []);

  const filteredNews = useMemo(() => news.filter(item => {
    const text = `${item.title} ${item.summary} ${item.content}`.toLocaleLowerCase();
    return (category === 'Все' || item.category === category) && text.length > 0;
  }), [category, news]);

  const openComposer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setComposerVisible(true);
  };

  const publish = async () => {
    if (!body.trim()) return;
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
    };
    const updated = await StorageService.createPost(post);
    setNews(updated);
    setTitle('');
    setBody('');
    setAttachment(null);
    setComposerVisible(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
            <Text style={[styles.headerCaption, { color: colors.textSecondary }]}>Новости колледжа</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onOpenNotifications} accessibilityLabel="Уведомления" style={[styles.headerButton, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}>
              <Bell color={colors.textPrimary} size={21} />
              <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openComposer} accessibilityLabel="Создать публикацию" style={[styles.composeButton, { backgroundColor: colors.accent }]}>
              <PenLine color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={openComposer} activeOpacity={0.86} style={[styles.startPost, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}><Text style={[styles.avatarText, { color: colors.accent }]}>{initials(profile.fullName)}</Text></View>
            <Text style={[styles.startPostText, { color: colors.textMuted }]}>Поделитесь новостью с колледжем</Text>
            <PenLine color={colors.accent} size={19} />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {CATEGORIES.map(item => {
              const selected = item === category;
              return <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: selected ? colors.accent : colors.cardBg, borderColor: selected ? colors.accent : colors.cardBorder }]}>
                <Text style={[styles.categoryText, { color: selected ? '#fff' : colors.textSecondary }]}>{item}</Text>
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
                  <View style={[styles.authorAvatar, { backgroundColor: item.isUserCreated ? colors.accent : '#e7eee8' }]}>
                    <Text style={[styles.authorAvatarText, { color: item.isUserCreated ? '#fff' : colors.accent }]}>{initials(item.author)}</Text>
                  </View>
                  <View style={[styles.threadLine, { backgroundColor: colors.divider }]} />
                </View>
                <View style={styles.postContent}>
                  <View style={styles.postTop}>
                    <View style={styles.authorMeta}>
                      <Text numberOfLines={1} style={[styles.authorName, { color: colors.textPrimary }]}>{item.author}</Text>
                      <Text style={[styles.authorRole, { color: colors.textMuted }]}>{item.authorRole || 'ЦАТЭК'} · {item.date}</Text>
                    </View>
                    <Text style={[styles.topicText, { color: item.isImportant ? '#8a5c00' : colors.accent }]}>{item.isImportant ? 'Важно' : item.category}</Text>
                  </View>
                  <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text numberOfLines={4} style={[styles.postBody, { color: colors.textSecondary }]}>{item.content}</Text>
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
      <ComposerModal visible={composerVisible} profile={profile} colors={colors} topic={topic} title={title} body={body} attachment={attachment}
        onClose={() => setComposerVisible(false)} onTopic={setTopic} onTitle={setTitle} onBody={setBody} onAttachment={setAttachment} onPublish={publish} />
    </View>
  );
};

function ArticleModal({ article, colors, onClose }: { article: NewsItem | null; colors: ReturnType<typeof useTheme>['colors']; onClose: () => void }) {
  return <Modal visible={!!article} animationType="slide" onRequestClose={onClose}>
    <View style={[styles.modalPage, { backgroundColor: colors.canvasElevated }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.modalIcon}><ChevronLeft color={colors.textPrimary} size={28} /></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Публикация</Text>
        <TouchableOpacity style={styles.modalIcon}><Bookmark color={colors.textPrimary} size={21} /></TouchableOpacity>
      </View>
      {article && <ScrollView contentContainerStyle={styles.articleContent}>
        <Text style={[styles.articleTopic, { color: colors.accent }]}>{article.category}</Text>
        <Text style={[styles.articleHeading, { color: colors.textPrimary }]}>{article.title}</Text>
        <Text style={[styles.articleByline, { color: colors.textMuted }]}>{article.author} · {article.date}</Text>
        <Text style={[styles.articleText, { color: colors.textSecondary }]}>{article.content}</Text>
      </ScrollView>}
    </View>
  </Modal>;
}

interface ComposerProps {
  visible: boolean;
  profile: UserProfile;
  colors: ReturnType<typeof useTheme>['colors'];
  topic: NewsItem['category'];
  title: string;
  body: string;
  attachment: 'photo' | 'file' | null;
  onClose: () => void;
  onTopic: (topic: NewsItem['category']) => void;
  onTitle: (title: string) => void;
  onBody: (body: string) => void;
  onAttachment: (attachment: 'photo' | 'file') => void;
  onPublish: () => void;
}

function ComposerModal(props: ComposerProps) {
  const canPublish = props.body.trim().length > 0;
  return <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
    <View style={[styles.modalPage, { backgroundColor: props.colors.canvasElevated }]}>
      <View style={[styles.modalHeader, { borderBottomColor: props.colors.divider }]}>
        <TouchableOpacity onPress={props.onClose} style={styles.cancelButton}><Text style={[styles.cancelText, { color: props.colors.textSecondary }]}>Отмена</Text></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: props.colors.textPrimary }]}>Новая ветка</Text>
        <TouchableOpacity disabled={!canPublish} onPress={props.onPublish} style={[styles.publishButton, { backgroundColor: canPublish ? props.colors.accent : '#d9dfda' }]}><Text style={styles.publishText}>Опубликовать</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.composerContent} keyboardShouldPersistTaps="handled">
        <View style={styles.composerAuthor}>
          <View style={[styles.avatar, { backgroundColor: props.colors.accentLight }]}><Text style={[styles.avatarText, { color: props.colors.accent }]}>{initials(props.profile.fullName)}</Text></View>
          <View><Text style={[styles.authorName, { color: props.colors.textPrimary }]}>{props.profile.fullName}</Text><Text style={[styles.authorRole, { color: props.colors.textMuted }]}>{props.profile.group} · Студент ЦАТЭК</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.composerTopics}>
          {CATEGORIES.filter(item => item !== 'Все').map(item => <TouchableOpacity key={item} onPress={() => props.onTopic(item)} style={[styles.composerTopic, { backgroundColor: props.topic === item ? props.colors.accentLight : '#f2f4f1', borderColor: props.topic === item ? props.colors.accent : 'transparent' }]}><Text style={{ color: props.topic === item ? props.colors.accent : props.colors.textSecondary, fontWeight: '700', fontSize: 13 }}>{item}</Text></TouchableOpacity>)}
        </ScrollView>
        <TextInput value={props.title} onChangeText={props.onTitle} placeholder="Заголовок (необязательно)" placeholderTextColor={props.colors.textMuted} style={[styles.composerTitleInput, { color: props.colors.textPrimary, borderBottomColor: props.colors.divider }]} />
        <TextInput value={props.body} onChangeText={props.onBody} multiline autoFocus placeholder="Что нового?" placeholderTextColor={props.colors.textMuted} textAlignVertical="top" style={[styles.composerBodyInput, { color: props.colors.textPrimary }]} />
        <View style={[styles.attachmentPanel, { borderTopColor: props.colors.divider }]}>
          <TouchableOpacity onPress={() => props.onAttachment('photo')} style={styles.attachmentButton}><ImageIcon color={props.colors.accent} size={21} /><Text style={[styles.attachmentText, { color: props.colors.textSecondary }]}>{props.attachment === 'photo' ? 'Фото выбрано' : 'Фото'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => props.onAttachment('file')} style={styles.attachmentButton}><FileText color={props.colors.accent} size={21} /><Text style={[styles.attachmentText, { color: props.colors.textSecondary }]}>{props.attachment === 'file' ? 'Файл выбран' : 'Файл'}</Text></TouchableOpacity>
          <View style={styles.attachmentButton}><Paperclip color={props.colors.textMuted} size={21} /><Text style={[styles.attachmentText, { color: props.colors.textSecondary }]}>Вложение</Text></View>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 13, paddingBottom: 12 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 }, headerCaption: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 9 }, headerButton: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, composeButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, right: 10, top: 10, borderWidth: 1.5, borderColor: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 108 },
  startPost: { minHeight: 64, borderRadius: 19, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontWeight: '800', fontSize: 13 }, startPostText: { flex: 1, fontSize: 14 },
  categories: { paddingTop: 13, paddingBottom: 5, gap: 8 }, category: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 }, categoryText: { fontSize: 13, fontWeight: '700' },
  feedTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, marginBottom: 0, paddingBottom: 11, borderBottomWidth: StyleSheet.hairlineWidth }, feedTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.25 }, feedCount: { fontSize: 12 },
  post: { flexDirection: 'row', paddingTop: 14, paddingBottom: 15, borderBottomWidth: StyleSheet.hairlineWidth }, threadRail: { width: 48, alignItems: 'center' }, threadLine: { flex: 1, width: 1, marginTop: 7 }, postContent: { flex: 1, minWidth: 0, paddingRight: 2 }, postTop: { flexDirection: 'row', alignItems: 'flex-start' }, authorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, authorAvatarText: { fontWeight: '800', fontSize: 12 }, authorMeta: { flex: 1, minWidth: 0 }, authorName: { fontSize: 14, fontWeight: '800' }, authorRole: { fontSize: 11, marginTop: 2 }, topicText: { fontSize: 11, fontWeight: '700', marginLeft: 8, paddingTop: 1 },
  postTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: -0.12, marginTop: 11 }, postBody: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  postFooter: { marginTop: 12, flexDirection: 'row', gap: 22 }, footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 }, footerText: { fontSize: 12, fontWeight: '600' },
  modalPage: { flex: 1 }, modalHeader: { height: 64, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontSize: 17, fontWeight: '800' }, modalIcon: { width: 40, alignItems: 'center' }, cancelButton: { width: 74 }, cancelText: { fontSize: 15, fontWeight: '600' }, publishButton: { minWidth: 108, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center' }, publishText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  articleContent: { padding: 22, paddingBottom: 50 }, articleTopic: { fontSize: 13, fontWeight: '800', marginBottom: 10 }, articleHeading: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 }, articleByline: { fontSize: 13, lineHeight: 18, marginTop: 14, marginBottom: 25 }, articleText: { fontSize: 17, lineHeight: 27 },
  composerContent: { padding: 20, paddingBottom: 42 }, composerAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 }, composerTopics: { gap: 8, paddingVertical: 18 }, composerTopic: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }, composerTitleInput: { fontSize: 19, fontWeight: '800', paddingVertical: 12, borderBottomWidth: 1 }, composerBodyInput: { fontSize: 17, lineHeight: 25, minHeight: 210, paddingTop: 17 }, attachmentPanel: { borderTopWidth: 1, flexDirection: 'row', paddingTop: 15, gap: 28 }, attachmentButton: { alignItems: 'center', gap: 6 }, attachmentText: { fontSize: 11, fontWeight: '600' },
});
