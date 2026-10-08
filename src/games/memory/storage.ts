import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from './engine';
export type MemoryRecords = Record<Difficulty, number | null>;
export const emptyRecords = (): MemoryRecords => ({ 4: null, 6: null, 8: null });
const pending = new Map<string, Promise<void>>();
const keyFor = (profile: string) => `@catec_memory_v1:${profile}`;
export async function loadMemoryRecords(profile: string): Promise<MemoryRecords> {
  const key = keyFor(profile); await pending.get(key)?.catch(() => {});
  const raw = await AsyncStorage.getItem(key);
  try {
    const saved = raw ? JSON.parse(raw) : null;
    return saved && [4, 6, 8].every(size => saved[size] === null || Number.isSafeInteger(saved[size]) && saved[size] >= size * size / 2) ? saved : emptyRecords();
  } catch { return emptyRecords(); }
}
export function saveMemoryRecords(profile: string, records: MemoryRecords): Promise<void> {
  const key = keyFor(profile), raw = JSON.stringify(records);
  const task = (pending.get(key) || Promise.resolve()).catch(() => {}).then(() => AsyncStorage.setItem(key, raw));
  pending.set(key, task); void task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {}); return task;
}
