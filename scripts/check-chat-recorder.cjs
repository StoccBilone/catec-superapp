const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function mountRecorder(permission, preparing, enablingAudio) {
  let released = false, recording = false, audioMode = false, nativeReads = 0, prepares = 0;
  const effects = [];
  let handle;
  const audio = {
    get isRecording() { nativeReads++; if (released) throw Error('Native shared object already released'); return recording; },
    prepareToRecordAsync: async () => { prepares++; if (released) throw Error('Prepare after release'); if (preparing) await preparing; },
    record: () => { if (released) throw Error('Record after release'); recording = true; },
    stop: async () => { if (released) throw Error('Stop after release'); recording = false; },
    uri: null,
  };
  class Value { setValue() {} interpolate() { return 0; } }
  const React = {
    __esModule: true,
    createElement: () => null,
    forwardRef: fn => fn,
    useRef: value => ({ current: value }),
    useState: value => [typeof value === 'function' ? value() : value, () => {}],
    useEffect: fn => { effects.push(fn); },
    useImperativeHandle: (_, factory) => { handle = factory(); },
  };
  React.default = React;
  const dependencies = {
    react: React,
    'react-native': { Platform: { OS: 'ios' }, StyleSheet: { create: value => value, flatten: value => value, absoluteFill: {} }, Animated: { Value }, AppState: { currentState: 'active' } },
    'expo-audio': { useAudioRecorder: () => { effects.push(() => () => { released = true; recording = false; }); return audio; }, RecordingPresets: { HIGH_QUALITY: {} }, AudioModule: { requestRecordingPermissionsAsync: () => permission || Promise.resolve({ granted: true }) }, setAudioModeAsync: async ({ allowsRecording }) => { if (allowsRecording && enablingAudio) await enablingAudio; audioMode = allowsRecording; } },
    'expo-camera': { useCameraPermissions: () => [null, async () => ({ granted: true })], useMicrophonePermissions: () => [null, async () => ({ granted: true })] },
    'lucide-react-native': {},
    './Typography': { Alert: { alert: () => {} } },
    './GlassModal': {}, './MaterialView': {}, '../services/materials': {},
    '../context/PreferencesContext': { usePreferences: () => ({ motionReduced: true }) },
    '../theme/themeContext': { useTheme: () => ({ colors: {} }) },
  };
  const filename = path.resolve(__dirname, '../src/components/ChatRecorder.tsx');
  const loaded = new Module(filename, module);
  loaded.require = name => { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`); return dependencies[name]; };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, filename);
  loaded.exports.ChatRecorder({ onSend: async () => {}, onActiveChange: () => {} }, null);
  const cleanups = effects.map(effect => effect()).filter(Boolean);
  return { handle, unmount: () => cleanups.forEach(cleanup => cleanup()), state: () => ({ released, recording, audioMode, nativeReads, prepares }) };
}
async function check() {
  const idle = mountRecorder();
  assert.doesNotThrow(() => idle.unmount(), 'leaving an idle chat must not read a released native recorder');
  assert.equal(idle.state().nativeReads, 0);
  const active = mountRecorder(); await active.handle.start('voice');
  assert.equal(active.state().recording, true);
  assert.doesNotThrow(() => active.unmount(), 'Expo releases the recorder before component cleanup');
  await Promise.resolve(); assert.equal(active.state().recording, false); assert.equal(active.state().audioMode, false);
  let grant;
  const pending = mountRecorder(new Promise(resolve => { grant = resolve; }));
  const starting = pending.handle.start('voice'); pending.unmount(); grant({ granted: true }); await starting;
  assert.equal(pending.state().prepares, 0, 'leaving during permission prompt must not prepare a released recorder');
  assert.equal(pending.state().audioMode, false);
  let prepared;
  const preparing = mountRecorder(null, new Promise(resolve => { prepared = resolve; }));
  const prepareStart = preparing.handle.start('voice');
  for (let i = 0; i < 5; i++) await Promise.resolve();
  assert.equal(preparing.state().prepares, 1);
  preparing.unmount(); prepared(); await prepareStart;
  assert.equal(preparing.state().audioMode, false);
  assert.equal(preparing.state().nativeReads, 0);
  let enabled;
  const enabling = mountRecorder(null, null, new Promise(resolve => { enabled = resolve; }));
  const enableStart = enabling.handle.start('voice');
  for (let i = 0; i < 5; i++) await Promise.resolve();
  enabling.unmount(); enabled(); await enableStart;
  assert.equal(enabling.state().prepares, 0);
  assert.equal(enabling.state().audioMode, false);
  console.log('Chat recorder OK: idle/recording exit; permission, audio mode and preparation completing after exit.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
