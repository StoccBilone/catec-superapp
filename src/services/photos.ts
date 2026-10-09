import * as ImagePicker from 'expo-image-picker';
import { persistMaterial } from './materials';

export async function pickPhoto(kind: 'avatar' | 'cover' | 'post'): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    aspect: kind === 'avatar' ? [1, 1] : [16, 9],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return persistMaterial(asset.uri);
}
