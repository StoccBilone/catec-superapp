import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ChatMessage, NewsItem } from '../types';
import { CATEC_NEWS } from '../data/catecData';
import { loadCloudPosts, publishCloudPost, syncCloudProfile, loadCloudMessages, sendCloudMessage } from './cloud';

const KEYS = {
  USER_PROFILE: '@catec_user_profile_v2',
  IS_LOGGED_IN: '@catec_is_logged_in_v2',
  CHAT_MESSAGES: '@catec_chat_messages_v2',
  USER_POSTS: '@catec_user_posts_v2',
  SAVED_NOTES: '@catec_saved_notes_v2',
};

export const StorageService = {
  // --- USER PROFILE ---
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading profile', e);
    }
    return null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const synced = await syncCloudProfile(profile);
      Object.assign(profile, synced);
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(synced));
      await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    } catch (e) {
      console.warn('Error saving profile', e);
      throw e;
    }
  },

  async isUserLoggedIn(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.IS_LOGGED_IN);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  async setLoggedIn(status: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, status ? 'true' : 'false');
    } catch (e) {}
  },

  async resetProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(KEYS.IS_LOGGED_IN);
    } catch (e) {}
  },

  // --- NEWS & POSTS ---
  async getAllNewsAndPosts(): Promise<NewsItem[]> {
    try {
      const posts = await loadCloudPosts();
      await AsyncStorage.setItem(KEYS.USER_POSTS, JSON.stringify(posts));
      return [...posts, ...CATEC_NEWS];
    } catch { /* Show cached posts when offline. */ }
    try {
      const customPostsRaw = await AsyncStorage.getItem(KEYS.USER_POSTS);
      const customPosts: NewsItem[] = customPostsRaw ? JSON.parse(customPostsRaw) : [];
      return [...customPosts, ...CATEC_NEWS];
    } catch (e) {
      return CATEC_NEWS;
    }
  },

  async createPost(post: NewsItem): Promise<NewsItem[]> {
    await publishCloudPost(post);
    return this.getAllNewsAndPosts();
  },

  async cachePost(post: NewsItem): Promise<NewsItem[]> {
    try {
      const customPostsRaw = await AsyncStorage.getItem(KEYS.USER_POSTS);
      const customPosts: NewsItem[] = customPostsRaw ? JSON.parse(customPostsRaw) : [];
      const updated = [post, ...customPosts];
      await AsyncStorage.setItem(KEYS.USER_POSTS, JSON.stringify(updated));
      return [...updated, ...CATEC_NEWS];
    } catch (e) {
      console.warn('Error saving post', e);
      return CATEC_NEWS;
    }
  },

  // --- CHAT MESSAGES ---
  async getChatMessages(groupId: string): Promise<ChatMessage[]> {
    if (groupId.startsWith('cloud:')) return loadCloudMessages(groupId.slice(6));
    try {
      const allRaw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      if (allRaw) {
        const parsed = JSON.parse(allRaw);
        if (parsed[groupId]) return parsed[groupId];
      }
    } catch (e) {}
    // Default initial mock message for the group
    if (groupId.startsWith('room:')) return [];
    return [
      {
        id: `init-${groupId}-1`,
        senderId: 'curator',
        senderName: 'Куратор группы',
        senderRole: 'teacher',
        avatarColor: '#0284c7',
        text: `Уважаемые студенты группы ${groupId}! Добро пожаловать в официальную цифровую систему колледжа ЦАТЭК. Проверьте актуальное расписание на 7 семестр.`,
        createdAt: '11:25',
      },
    ];
  },

  async addChatMessage(groupId: string, message: ChatMessage): Promise<ChatMessage[]> {
    if (groupId.startsWith('cloud:')) return sendCloudMessage(groupId.slice(6), message);
    try {
      const allRaw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      const chatsMap = allRaw ? JSON.parse(allRaw) : {};
      const currentList: ChatMessage[] = chatsMap[groupId] || await this.getChatMessages(groupId);
      const updatedList = [...currentList, message];
      chatsMap[groupId] = updatedList;
      await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(chatsMap));
      return updatedList;
    } catch (e) {
      return [];
    }
  },

  // --- LESSON USER NOTES ---
  async getLessonNotes(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_NOTES);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {};
  },

  async saveLessonNote(lessonId: string, note: string): Promise<void> {
    try {
      const existing = await this.getLessonNotes();
      existing[lessonId] = note;
      await AsyncStorage.setItem(KEYS.SAVED_NOTES, JSON.stringify(existing));
    } catch (e) {}
  },

  // --- SUPABASE CONFIG ---
  async getSupabaseConfig(): Promise<{ url: string; anonKey: string; isEnabled: boolean }> {
    try {
      const data = await AsyncStorage.getItem('@catec_supabase_config');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { url: '', anonKey: '', isEnabled: false };
  },

  async saveSupabaseConfig(config: { url: string; anonKey: string; isEnabled: boolean }): Promise<void> {
    try {
      await AsyncStorage.setItem('@catec_supabase_config', JSON.stringify(config));
    } catch (e) {}
  },
};
