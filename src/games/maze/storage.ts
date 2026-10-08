import AsyncStorage from '@react-native-async-storage/async-storage';
export const MAZE_SEEDS = [112, 208, 304, 416, 512];
export interface MazeProgress { level: number; best: (number | null)[]; }
export const emptyProgress = (): MazeProgress => ({ level: 0, best: MAZE_SEEDS.map(() => null) });
const pending = new Map<string, Promise<void>>();
const keyFor = (profile: string) => `@catec_maze_v1:${profile}`;
export async function loadMazeProgress(profile: string): Promise<MazeProgress> {
  const key = keyFor(profile); await pending.get(key)?.catch(() => {});
  const raw = await AsyncStorage.getItem(key);
  try {
    const p = raw ? JSON.parse(raw) as MazeProgress : null;
    return p && Number.isInteger(p.level) && p.level >= 0 && p.level < MAZE_SEEDS.length && Array.isArray(p.best) && p.best.length === MAZE_SEEDS.length && p.best.every(n => n === null || Number.isFinite(n) && n > 0) ? p : emptyProgress();
  } catch { return emptyProgress(); }
}
export function saveMazeProgress(profile: string, progress: MazeProgress): Promise<void> {
  const key = keyFor(profile), raw = JSON.stringify(progress);
  const task = (pending.get(key) || Promise.resolve()).catch(() => {}).then(() => AsyncStorage.setItem(key, raw));
  pending.set(key, task); void task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {}); return task;
}
