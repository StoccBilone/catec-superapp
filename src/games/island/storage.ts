import AsyncStorage from '@react-native-async-storage/async-storage';

const pending = new Map<string, Promise<void>>();
const keyFor = (profileId: string) => `@catec_island_best_v1:${profileId}`;
export async function loadIslandBest(profileId: string): Promise<number> {
  const key = keyFor(profileId);
  await pending.get(key)?.catch(() => {});
  const raw = await AsyncStorage.getItem(key);
  const value = raw ? Number(raw) : 0;
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
export function saveIslandBest(profileId: string, best: number): Promise<void> {
  const key = keyFor(profileId);
  const task = (pending.get(key) || Promise.resolve()).catch(() => {}).then(() => AsyncStorage.setItem(key, String(best)));
  pending.set(key, task);
  void task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {});
  return task;
}
