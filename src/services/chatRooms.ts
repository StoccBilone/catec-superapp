import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloud, cloudSession } from './cloud';

export interface ChatRoom {
  id: string;
  title: string;
  kind: 'chat' | 'group';
  storageKey: string;
  recipientId?: string;
  collegeGroup?: string;
}

const key = (profileId: string) => `@campus_rooms_${profileId}`;

export async function getChatRooms(profileId: string): Promise<ChatRoom[]> {
  try {
    const id = await cloudSession();
    const { data, error } = await cloud.from('rooms').select('*,room_members(user_id,profiles(full_name))').order('created_at', { ascending: false });
    if (error) throw error;
    const list: ChatRoom[] = (data || []).map(row => {
      const peer = row.room_members.find((member: { user_id: string }) => member.user_id !== id);
      return { id: row.id, title: row.kind === 'chat' && peer ? peer.profiles.full_name : row.title, kind: row.kind, storageKey: `cloud:${row.id}`, collegeGroup: row.college_group || undefined };
    });
    const raw = await AsyncStorage.getItem(key(profileId));
    const legacy: ChatRoom[] = raw ? JSON.parse(raw) : [];
    const combined = [...list, ...legacy.filter(room => !room.storageKey.startsWith('cloud:'))];
    await AsyncStorage.setItem(key(profileId), JSON.stringify(combined));
    return combined;
  } catch { /* Keep existing conversations visible while offline. */ }
  const raw = await AsyncStorage.getItem(key(profileId));
  return raw ? JSON.parse(raw) : [];
}

export async function createChatRoom(profileId: string, title: string, kind: ChatRoom['kind'], group?: string, recipientId?: string, participants?: string[]) {
  await cloudSession();
  const request = kind === 'group' && !group
    ? cloud.rpc('create_group_conversation', { label: title.trim(), participants: participants || [] })
    : cloud.rpc('create_conversation', { label: title.trim(), room_kind: kind, recipient: recipientId || null, study_group: group || null });
  const { data: cloudId, error } = await request;
  if (error) throw error;
  const cloudRoom: ChatRoom = { id: cloudId, title: title.trim(), kind, storageKey: `cloud:${cloudId}`, recipientId, collegeGroup: group };
  const existingRooms = await getChatRooms(profileId);
  await AsyncStorage.setItem(key(profileId), JSON.stringify([cloudRoom, ...existingRooms.filter(room => room.id !== cloudId)]));
  return cloudRoom;
}

export async function createLocalChatRoom(profileId: string, title: string, kind: ChatRoom['kind'], group?: string) {
  const rooms = await getChatRooms(profileId);
  const existing = group ? rooms.find(room => room.storageKey === group) : undefined;
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const room: ChatRoom = { id, title: title.trim(), kind, storageKey: group || `room:${profileId}:${id}` };
  await AsyncStorage.setItem(key(profileId), JSON.stringify([room, ...rooms]));
  return room;
}
