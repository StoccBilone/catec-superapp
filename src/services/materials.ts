import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Material } from '../types';

const MAX_BYTES = 25 * 1024 * 1024;
export async function persistMaterial(uri: string) {
  if (Platform.OS === 'web') {
    if (!uri.startsWith('blob:')) return uri;
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Не удалось открыть файл');
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) throw new Error('Максимальный размер файла — 25 МБ.');
    return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
  }
  const original = new File(uri);
  if (original.size > MAX_BYTES) throw new Error('Максимальный размер файла — 25 МБ.');
  const saved = new File(Paths.document, `material-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${original.extension || '.bin'}`);
  original.copy(saved);
  return saved.uri;
}
export async function pickMaterial(kind: 'media' | 'document'): Promise<Material | null> {
  if (kind === 'media') {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.85, videoMaxDuration: 60 });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if ((asset.fileSize || 0) > MAX_BYTES) throw new Error('Максимальный размер файла — 25 МБ.');
    return { id: `material-${Date.now()}`, title: asset.fileName || (asset.type === 'video' ? 'Видео' : 'Фото'), type: asset.type === 'video' ? 'video' : 'image', uri: await persistMaterial(asset.uri), mimeType: asset.mimeType, duration: asset.duration ? asset.duration / 1000 : undefined };
  }
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size || 0) > MAX_BYTES) throw new Error('Максимальный размер файла — 25 МБ.');
  return { id: `material-${Date.now()}`, title: asset.name, type: asset.mimeType === 'application/pdf' ? 'pdf' : 'doc', uri: await persistMaterial(asset.uri), mimeType: asset.mimeType, size: asset.size ? `${(asset.size / 1024 / 1024).toFixed(1)} МБ` : undefined };
}
export async function openMaterial(item: Material) {
  if (!item.uri) return;
  if (Platform.OS !== 'web' && item.uri.startsWith('file:') && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(item.uri, { mimeType: item.mimeType });
  } else await Linking.openURL(item.uri);
}
