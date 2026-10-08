import AsyncStorage from '@react-native-async-storage/async-storage';
import { Saved2048, decodeSavedGame } from './engine';

const pending = new Map<string, Promise<void>>();
const keyFor = (profileId: string) => `@catec_games_2048_v1:${profileId}`;

export async function load2048(profileId: string) {
  const key = keyFor(profileId);
  // Opening immediately after leaving must read the last queued move.
  await pending.get(key)?.catch(() => {});
  return decodeSavedGame(await AsyncStorage.getItem(key));
}

export function save2048(profileId: string, state: Saved2048): Promise<void> {
  const key = keyFor(profileId);
  const encoded = JSON.stringify(state);
  const task = (pending.get(key) || Promise.resolve()).catch(() => {}).then(() => AsyncStorage.setItem(key, encoded));
  pending.set(key, task);
  void task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {});
  return task;
}
