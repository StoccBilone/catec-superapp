import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
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
  if (Platform.OS === 'web') return persistMaterial(asset.uri);
  const original = new File(asset.uri);
  const photo = new File(Paths.document, `campus-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${original.extension || '.jpg'}`);
  original.copy(photo);
  return photo.uri;
}
