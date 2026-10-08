const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function mountRecorder(permission, preparing, enablingAudio, onSend = async () => {}, stoppingAudio) {
  let released = false, recording = false, audioMode = false, nativeReads = 0, prepares = 0;
  const effects = [];
  const updates = [];
  let handle;
  const audio = {
    get isRecording() { nativeReads++; if (released) throw Error('Native shared object already released'); return recording; },
    prepareToRecordAsync: async () => { prepares++; if (released) throw Error('Prepare after release'); if (preparing) await preparing; },
    record: () => { if (released) throw Error('Record after release'); recording = true; },
    stop: async () => { if (released) throw Error('Stop after release'); recording = false; if (stoppingAudio) await stoppingAudio; },
    get uri() { nativeReads++; if (released) throw Error('URI after release'); return 'file:///recording.m4a'; },
    getStatus: () => ({ metering: -20 }),
  };
  class Value { setValue() {} interpolate() { return 0; } }
  const React = {
    __esModule: true,
    createElement: () => null,
    forwardRef: fn => fn,
    useRef: value => ({ current: value }),
    useState: value => [typeof value === 'function' ? value() : value, value => updates.push(value)],
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
    './GlassModal': {}, './MaterialView': {}, './GlassSurface': {}, './GlassTool': {}, './VoiceWaveform': { compactWaveform: samples => samples }, 'expo-haptics': { impactAsync: async () => {}, ImpactFeedbackStyle: { Light: 'light' } }, '../services/materials': { persistMaterial: async uri => uri },
    '../context/PreferencesContext': { usePreferences: () => ({ motionReduced: true }) },
    '../theme/themeContext': { useTheme: () => ({ colors: {} }) },
  };
  const filename = path.resolve(__dirname, '../src/components/ChatRecorder.tsx');
  const loaded = new Module(filename, module);
  loaded.require = name => { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`); return dependencies[name]; };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, filename);
  loaded.exports.ChatRecorder({ onSend, onActiveChange: () => {} }, null);
  const cleanups = effects.map(effect => effect()).filter(Boolean);
  return { handle, updates, unmount: () => cleanups.forEach(cleanup => cleanup()), state: () => ({ released, recording, audioMode, nativeReads, prepares }) };
}
async function check() {
  const waveFile = path.resolve(__dirname, '../src/components/VoiceWaveform.tsx');
  const waveModule = new Module(waveFile, module); waveModule.require = () => ({});
  waveModule._compile(ts.transpileModule(fs.readFileSync(waveFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, waveFile);
  const compact = waveModule.exports.compactWaveform;
  assert.deepEqual(compact([]), []);
  assert.deepEqual(compact([NaN, -1, 2, .5], 2), [0, 1]);
  assert.equal(compact(Array(3000).fill(.25), 96).length, 96);
  assert.deepEqual(compact([0, .5, 1]), [0, .5, 1]);
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
  const realNow = Date.now;
  let time = realNow(); Date.now = () => time;
  const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
  try {
    const sent = [];
    const released = mountRecorder(null, null, null, async item => sent.push(item));
    await released.handle.start('voice'); time += 1000; released.handle.release(); await flush();
    assert.equal(sent.length, 1, 'release sends exactly once'); assert.equal(sent[0].type, 'voice');
    await released.handle.start('voice'); time += 1000; released.handle.cancel(); await flush();
    assert.equal(sent.length, 1, 'cancel never sends');
    await released.handle.start('voice'); released.handle.move(-80); time += 1000; released.handle.release(); await flush();
    assert.equal(released.state().recording, true, 'swipe up locks recording after finger release');
    released.handle.cancel(); await flush(); released.unmount();
    const failed = mountRecorder(null, null, null, async () => { throw Error('offline'); });
    await failed.handle.start('voice'); time += 1000; failed.handle.release(); await flush();
    assert.ok(failed.updates.some(value => value?.type === 'voice'), 'failed send preserves a playable draft'); failed.unmount();
    let stopped;
    const stopping = mountRecorder(null, null, null, async () => {}, new Promise(resolve => { stopped = resolve; }));
    await stopping.handle.start('voice'); time += 1000; stopping.handle.release(); stopping.unmount(); stopped(); await flush();
    assert.equal(stopping.state().audioMode, false, 'async stop completion after exit resets audio without reading released URI');
    assert.equal(stopping.state().nativeReads, 0, 'late stop must not read released URI');
    let permit;
    const early = mountRecorder(new Promise(resolve => { permit = resolve; }));
    const pendingStart = early.handle.start('voice'); early.handle.release(); permit({ granted: true }); await pendingStart;
    assert.equal(early.state().prepares, 0, 'release during permission cancels pending start'); early.unmount();
  } finally { Date.now = realNow; }
  console.log('Chat recorder OK: release sends once, swipe up locks, cancel never sends; idle/recording exit; permission, audio mode and preparation completing after exit.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
