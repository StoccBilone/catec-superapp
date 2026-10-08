import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config/cloud';
import { ChatMessage, Material, NewsItem, UserProfile } from '../types';

export const cloud = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
if (Platform.OS !== 'web') AppState.addEventListener('change', state => {
  if (state === 'active') cloud.auth.startAutoRefresh(); else cloud.auth.stopAutoRefresh();
});
let signingIn: Promise<string> | null = null;
export function cloudSession(): Promise<string> {
  if (!signingIn) signingIn = (async () => {
    const { data: { session } } = await cloud.auth.getSession();
    if (session) return session.user.id;
    const { data, error } = await cloud.auth.signInAnonymously();
    if (error || !data.user) throw error || new Error('Не удалось подключиться к базе.');
    return data.user.id;
  })().finally(() => { signingIn = null; });
  return signingIn;
}
const uploadCache = new Map<string, string>();
export async function uploadMaterial(item: Material): Promise<Material> {
  if (item.storagePath || !item.uri) return { ...item, uri: undefined };
  const id = await cloudSession();
  let path = uploadCache.get(item.uri);
  if (!path) {
    const data = Platform.OS === 'web' ? await (await fetch(item.uri)).arrayBuffer() : await new File(item.uri).arrayBuffer();
    if (data.byteLength > 25 * 1024 * 1024) throw new Error('Максимальный размер файла — 25 МБ.');
    const ext = item.uri.match(/\.([a-zA-Z0-9]{1,6})(?:\?|$)/)?.[1] || item.mimeType?.split('/')[1]?.split(';')[0] || 'bin';
    path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext.replace(/[^a-zA-Z0-9]/g, '')}`;
    const { error } = await cloud.storage.from('materials').upload(path, data, { contentType: item.mimeType || item.uri.match(/^data:([^;]+);/)?.[1] || 'application/octet-stream' });
    if (error) throw error;
    uploadCache.set(item.uri, path);
  }
  return { ...item, uri: undefined, storagePath: path };
}
export async function resolveMaterial(item: Material): Promise<Material> {
  if (!item.storagePath) return item;
  const { data, error } = await cloud.storage.from('materials').createSignedUrl(item.storagePath, 3600);
  if (error) throw error;
  return { ...item, uri: data.signedUrl };
}
export async function syncCloudProfile(profile: UserProfile): Promise<UserProfile> {
  const id = await cloudSession();
  const { data: previous } = await cloud.from('profiles').select('avatar_path,cover_path').eq('id', id).maybeSingle();
  const photoPath = async (uri?: string, old?: string | null) => {
    if (!uri || /^https?:/.test(uri)) return old || null;
    // Legacy web previews stored blob URLs which expire after a page reload.
    if (uri.startsWith('blob:')) {
      try { await fetch(uri); } catch { return old || null; }
    }
    return (await uploadMaterial({ id: 'profile', type: 'image', title: 'Фото', uri })).storagePath;
  };
  const avatarPath = await photoPath(profile.avatarUrl, previous?.avatar_path);
  const coverPath = profile.coverUrl ? await photoPath(profile.coverUrl, previous?.cover_path) : null;
  const fields = { full_name: profile.fullName, group_name: profile.group, bio: profile.bio || '', avatar_path: avatarPath, cover_path: coverPath };
  const request = previous ? cloud.from('profiles').update(fields).eq('id', id) : cloud.from('profiles').insert({ id, ...fields });
  const { data, error } = await request.select('id,student_id').single();
  if (error) throw error;
  return { ...profile, cloudId: data.id, studentId: String(data.student_id) };
}
export interface DirectoryUser { id: string; fullName: string; studentId: string; group: string; }
export async function searchStudents(query: string, mode: 'name' | 'id'): Promise<DirectoryUser[]> {
  const id = await cloudSession();
  let request = cloud.from('profiles').select('id,full_name,student_id,group_name').neq('id', id).limit(20);
  if (mode === 'id') {
    if (!/^\d{6,12}$/.test(query.trim())) return [];
    request = request.eq('student_id', query.trim());
  } else request = request.ilike('full_name', `%${query.trim().replace(/[%_\\]/g, '')}%`);
  const { data, error } = await request;
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, fullName: row.full_name, studentId: String(row.student_id), group: row.group_name }));
}
const messageCache = new Map<string, ChatMessage[]>();
export async function loadCloudMessages(roomId: string): Promise<ChatMessage[]> {
  const id = await cloudSession();
  const { data, error } = await cloud.from('messages').select('*,profiles!sender_id(full_name)').eq('room_id', roomId).order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const messages = await Promise.all((data || []).reverse().map(async row => ({ id: row.id, senderId: row.sender_id, senderName: row.profiles.full_name, senderRole: 'student' as const, avatarColor: '#197fc4', text: row.body, createdAt: new Date(row.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), isOwn: row.sender_id === id, attachments: await Promise.all((row.attachments as Material[]).map(resolveMaterial)) })));
  messageCache.set(roomId, messages);
  return messages;
}
export async function sendCloudMessage(roomId: string, message: ChatMessage) {
  const id = await cloudSession();
  const attachments = await Promise.all((message.attachments || []).map(uploadMaterial));
  const { data, error } = await cloud.from('messages').insert({ room_id: roomId, sender_id: id, body: message.text, attachments }).select('id').single();
  if (error) throw error;
  // A failed refresh after successful delivery must not invite a duplicate send.
  const delivered = [...(messageCache.get(roomId) || []), { ...message, id: data.id, senderId: id, isOwn: true }];
  messageCache.set(roomId, delivered);
  try { return await loadCloudMessages(roomId); } catch { return delivered; }
}
export async function loadCloudPosts(): Promise<NewsItem[]> {
  await cloudSession();
  const { data, error } = await cloud.from('posts').select('*,profiles!author_id(full_name,group_name,avatar_path)').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return Promise.all((data || []).map(async row => ({ id: row.id, title: row.title, content: row.body, summary: row.body.slice(0, 120), category: row.category, date: new Date(row.created_at).toLocaleDateString('ru'), author: `${row.profiles.full_name} · ${row.profiles.group_name}`, authorId: row.author_id, authorRole: 'Студент ЦАТЭК', likes: 0, isUserCreated: true, avatarUrl: row.profiles.avatar_path ? (await resolveMaterial({ id: 'avatar', title: '', type: 'image', storagePath: row.profiles.avatar_path })).uri : undefined, attachments: await Promise.all((row.attachments as Material[]).map(resolveMaterial)) })));
}
export async function publishCloudPost(post: NewsItem) {
  const id = await cloudSession();
  const attachments = [...(post.attachments || [])];
  if (post.imageUri) attachments.unshift({ id: `${post.id}-photo`, title: 'Фото', type: 'image', uri: post.imageUri });
  if (attachments.length > 5) throw new Error('Можно добавить до 5 вложений.');
  const { error } = await cloud.from('posts').insert({ author_id: id, title: post.title, body: post.content, category: post.category, attachments: await Promise.all(attachments.map(uploadMaterial)) });
  if (error) throw error;
}
