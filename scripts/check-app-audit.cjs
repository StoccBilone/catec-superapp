const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function load(file, dependencies) {
  const filename = path.resolve(__dirname, '..', file);
  const target = new Module(filename, module);
  target.require = name => { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`); return dependencies[name]; };
  target._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, filename);
  return target.exports;
}
async function check() {
  const data = new Map(); let fail = false; let online = true; let finishProfile;
  const storage = { getItem: async key => data.get(key) || null, setItem: async (key, value) => { if (fail) throw Error('Disk full'); await Promise.resolve(); data.set(key, value); } };
  const { StorageService: service } = load('src/services/storage.ts', {
    '@react-native-async-storage/async-storage': { default: storage, __esModule: true },
    '../data/catecData': { CATEC_NEWS: [] },
    './cloud': { loadCloudMessages: async () => { if (!online) throw Error('Offline'); return [{ id: 'cloud-one' }]; }, sendCloudMessage: async () => [{ id: 'cloud-one' }, { id: 'cloud-two' }], syncCloudProfile: async profile => { if (profile.id === 'slow') await new Promise(resolve => { finishProfile = resolve; }); return { ...profile, cloudId: 'user-a' }; }, loadCloudPosts: async () => { throw Error('Offline'); }, publishCloudPost: async post => ({ ...post, id: 'published-id', authorId: 'user-a' }) },
  });
  await service.setLoggedIn(false); await service.saveUserProfile({ id: 'a' });
  assert.equal(await service.isUserLoggedIn(), false, 'late profile sync must not undo logout');
  const pendingProfile = service.saveUserProfile({ id: 'slow' });
  await service.saveLocalProfile({ id: 'new' }); finishProfile(); await pendingProfile;
  assert.equal((await service.getUserProfile()).id, 'new', 'late startup sync must not overwrite newer profile edits');
  await Promise.all([service.addChatMessage('a', { id: '1' }), service.addChatMessage('a', { id: '2' }), service.addChatMessage('b', { id: '3' })]);
  assert.deepEqual((await service.getChatMessages('a')).map(item => item.id), ['1', '2']);
  assert.equal((await service.getChatMessages('b')).length, 1, 'parallel saves must not overwrite another room');
  await Promise.all([service.saveLessonNote('a', 'One'), service.saveLessonNote('b', 'Two')]);
  assert.deepEqual(await service.getLessonNotes(), { a: 'One', b: 'Two' });
  fail = true;
  await assert.rejects(service.addChatMessage('a', { id: '4' }), /Disk full/, 'failed save must keep the composer draft');
  await assert.rejects(service.setLoggedIn(false), /Disk full/, 'failed lock state must not look successful');
  fail = false;
  await service.addChatMessage('a', { id: '5' });
  assert.equal((await service.getChatMessages('a')).length, 3, 'failed queue entry must not block later writes');
  await service.getChatMessages('cloud:room'); online = false;
  assert.deepEqual((await service.getChatMessages('cloud:room')).map(item => item.id), ['cloud-one'], 'cloud history must survive offline reopening');
  fail = true; const delivered = await service.addChatMessage('cloud:room', { id: 'new' });
  assert.equal(delivered.length, 2, 'cache failure after cloud delivery must not invite duplicate sending'); fail = false;
  const sql = fs.readFileSync(path.resolve(__dirname, '../supabase/schema.sql'), 'utf8');
  assert.ok(!/^\$;$/m.test(sql), 'SQL functions need paired dollar delimiters');
  assert.equal((sql.match(/\$\$/g) || []).length % 2, 0);
  const posts = await service.createPost({ id: 'draft', title: 'Test' });
  assert.equal(posts[0].id, 'published-id', 'successful delivery stays visible when refresh is offline');
  const React = { createContext: () => ({}) };
  const { normalizePreferences } = load('src/context/PreferencesContext.tsx', { react: { ...React, default: React, __esModule: true }, 'react-native': {}, '@react-native-async-storage/async-storage': {}, '../i18n/strings': {} });
  assert.deepEqual(normalizePreferences({ language: 'bad', interfaceScale: 'bad', reduceMotion: 'yes' }), { language: 'ru', interfaceScale: 1, reduceMotion: false, textSize: 'standard' });
  assert.equal(normalizePreferences({ interfaceScale: Infinity }).interfaceScale, 1);
  assert.equal(normalizePreferences({ interfaceScale: 5 }).interfaceScale, 1.25);
  assert.equal(normalizePreferences({ textSize: 'large' }).interfaceScale, 1.12);
  let owner = 'user-a'; const uploads = []; const signed = [];
  const bucket = { upload: async (name, bytes, options) => { uploads.push({ name, options }); return { error: null }; }, createSignedUrl: async name => { signed.push(name); return { data: { signedUrl: 'https://files.example/new-url' }, error: null }; } };
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { avatar_path: 'user-a/avatar.jpg', cover_path: null }, error: null }), update: () => query, single: async () => ({ data: { id: owner, student_id: 100000 }, error: null }) };
  const fakeClient = { auth: { getSession: async () => ({ data: { session: { user: { id: owner } } } }) }, storage: { from: () => bucket }, from: () => query };
  const cloudApi = load('src/services/cloud.ts', { '@react-native-async-storage/async-storage': {}, 'react-native': { Platform: { OS: 'ios' }, AppState: { addEventListener: () => {} } }, '@supabase/supabase-js': { createClient: () => fakeClient }, 'expo-file-system': { File: class { async arrayBuffer() { return new ArrayBuffer(4); } } }, '../config/cloud': {} });
  await cloudApi.uploadMaterial({ uri: 'file:///avatar.jpg', type: 'image' });
  assert.equal(uploads[0].options.contentType, 'image/jpeg', 'profile photos need their correct content type');
  await cloudApi.uploadMaterial({ uri: 'file:///avatar.jpg', type: 'image' }); assert.equal(uploads.length, 1);
  owner = 'user-b'; await cloudApi.uploadMaterial({ uri: 'file:///avatar.jpg', type: 'image' });
  assert.equal(uploads.length, 2, 'upload cache must be isolated by account'); assert.ok(uploads[1].name.startsWith('user-b/'));
  const synced = await cloudApi.syncCloudProfile({ avatarUrl: 'https://files.example/expired', fullName: 'Name', group: 'Group' });
  assert.equal(synced.avatarUrl, 'https://files.example/new-url', 'startup must refresh expired profile photo links');
  let blobSize = 26 * 1024 * 1024;
  const oldFetch = global.fetch;
  global.fetch = async () => ({ ok: true, blob: async () => ({ size: blobSize }) });
  const { persistMaterial } = load('src/services/materials.ts', { 'react-native': { Platform: { OS: 'web' } }, 'expo-file-system': {}, 'expo-document-picker': {}, 'expo-image-picker': {}, 'expo-sharing': {}, 'expo-linking': {} });
  try { await assert.rejects(persistMaterial('blob:test'), /25/); } finally { global.fetch = oldFetch; }
  console.log('App audit OK: logout vs profile sync, concurrent room/note writes, save failures and queue recovery, offline post delivery, corrupt preferences, oversized web files.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
