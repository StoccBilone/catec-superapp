import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatRoom {
  id: string;
  title: string;
  kind: 'chat' | 'group';
  storageKey: string;
}

const key = (profileId: string) => `@campus_rooms_${profileId}`;

export async function getChatRooms(profileId: string): Promise<ChatRoom[]> {
  const raw = await AsyncStorage.getItem(key(profileId));
  return raw ? JSON.parse(raw) : [];
}

export async function createChatRoom(profileId: string, title: string, kind: ChatRoom['kind'], group?: string) {
  const rooms = await getChatRooms(profileId);
  const existing = group ? rooms.find(room => room.storageKey === group) : undefined;
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const room: ChatRoom = { id, title: title.trim(), kind, storageKey: group || `room:${profileId}:${id}` };
  await AsyncStorage.setItem(key(profileId), JSON.stringify([room, ...rooms]));
  return room;
}
