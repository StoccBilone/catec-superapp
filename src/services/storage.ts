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

let profileVersion = 0;
let pendingWrite: Promise<unknown> = Promise.resolve();
function writeInOrder<T>(action: () => Promise<T>): Promise<T> {
  const task = pendingWrite.catch(() => {}).then(action);
  pendingWrite = task;
  return task;
}
async function cacheChat(groupId: string, messages: ChatMessage[]) {
  await writeInOrder(async () => {
    const raw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
    const map = raw ? JSON.parse(raw) : {};
    map[groupId] = messages;
    await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(map));
  });
}
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

  async saveLocalProfile(profile: UserProfile): Promise<void> {
    profileVersion += 1;
    await writeInOrder(() => AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile)));
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const version = ++profileVersion;
    try {
      const synced = await syncCloudProfile(profile);
      await writeInOrder(async () => {
        if (version !== profileVersion) return;
        Object.assign(profile, synced);
        await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(synced));
      });
    } catch (e) {
      console.warn('Error saving profile', e);
      throw e;
    }
  },

  async isUserLoggedIn(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.IS_LOGGED_IN);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setLoggedIn(status: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, status ? 'true' : 'false');
  },

  async resetProfile(): Promise<void> {
    profileVersion += 1;
    try {
      await AsyncStorage.removeItem(KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(KEYS.IS_LOGGED_IN);
    } catch {}
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
    } catch {
      return CATEC_NEWS;
    }
  },

  async createPost(post: NewsItem): Promise<NewsItem[]> {
    const published = await publishCloudPost(post);
    await this.cachePost(published);
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
    if (groupId.startsWith('cloud:')) {
      try {
        const messages = await loadCloudMessages(groupId.slice(6));
        await cacheChat(groupId, messages).catch(() => {});
        return messages;
      } catch (error) {
        const raw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
        const cached = raw ? JSON.parse(raw)[groupId] : undefined;
        if (Array.isArray(cached)) return cached;
        throw error;
      }
    }
    try {
      const allRaw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      if (allRaw) {
        const parsed = JSON.parse(allRaw);
        if (parsed[groupId]) return parsed[groupId];
      }
    } catch {}
    return [];
  },

  async addChatMessage(groupId: string, message: ChatMessage): Promise<ChatMessage[]> {
    if (groupId.startsWith('cloud:')) {
      const messages = await sendCloudMessage(groupId.slice(6), message);
      // Delivery already succeeded; a failed cache write must not prompt a duplicate send.
      await cacheChat(groupId, messages).catch(() => {});
      return messages;
    }
    return writeInOrder(async () => {
      const allRaw = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      const chatsMap = allRaw ? JSON.parse(allRaw) : {};
      const currentList: ChatMessage[] = chatsMap[groupId] || [];
      const updatedList = [...currentList, message];
      chatsMap[groupId] = updatedList;
      await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(chatsMap));
      return updatedList;
    });
  },

  // --- LESSON USER NOTES ---
  async getLessonNotes(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_NOTES);
      if (data) return JSON.parse(data);
    } catch {}
    return {};
  },

  async saveLessonNote(lessonId: string, note: string): Promise<void> {
    await writeInOrder(async () => {
      const existing = await this.getLessonNotes();
      existing[lessonId] = note;
      await AsyncStorage.setItem(KEYS.SAVED_NOTES, JSON.stringify(existing));
    });
  },

  // --- SUPABASE CONFIG ---
  async getSupabaseConfig(): Promise<{ url: string; anonKey: string; isEnabled: boolean }> {
    try {
      const data = await AsyncStorage.getItem('@catec_supabase_config');
      if (data) return JSON.parse(data);
    } catch {}
    return { url: '', anonKey: '', isEnabled: false };
  },

  async saveSupabaseConfig(config: { url: string; anonKey: string; isEnabled: boolean }): Promise<void> {
    try {
      await AsyncStorage.setItem('@catec_supabase_config', JSON.stringify(config));
    } catch {}
  },
};
