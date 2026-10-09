import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlocksGame, decodeBlocks } from './engine';
const pending = new Map<string,Promise<void>>();
const keyFor = (id:string) => `@catec_games_blocks_v1:${id}`;
export async function loadBlocks(id:string) { const key=keyFor(id); await pending.get(key)?.catch(()=>{}); return decodeBlocks(await AsyncStorage.getItem(key)); }
export function saveBlocks(id:string, game:BlocksGame) {
  const key=keyFor(id), raw=JSON.stringify(game);
  const task=(pending.get(key)||Promise.resolve()).catch(()=>{}).then(()=>AsyncStorage.setItem(key,raw));
  pending.set(key,task); void task.finally(()=>{if(pending.get(key)===task)pending.delete(key);}).catch(()=>{}); return task;
}
