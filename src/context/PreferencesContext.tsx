import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setActiveLocale } from '../i18n/strings';

export type Language = 'ru' | 'en' | 'kk';
interface Preferences { language: Language; textSize: 'standard' | 'large'; interfaceScale: number; reduceMotion: boolean; }
const defaults: Preferences = { language: 'ru', textSize: 'standard', interfaceScale: 1, reduceMotion: false };
export function normalizePreferences(stored: Partial<Preferences> = {}): Preferences {
  const rawScale = stored.interfaceScale ?? (stored.textSize === 'large' ? 1.12 : 1);
  return { language: ['ru', 'en', 'kk'].includes(stored.language || '') ? stored.language! : 'ru', textSize: stored.textSize === 'large' ? 'large' : 'standard', interfaceScale: typeof rawScale === 'number' && Number.isFinite(rawScale) ? Math.min(1.25, Math.max(.9, rawScale)) : 1, reduceMotion: stored.reduceMotion === true };
}
const Context = createContext({ ...defaults, motionReduced: false, update: (_value: Partial<Preferences>) => {} });
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState(defaults);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => { setActiveLocale(value.language); }, [value.language]);
  useEffect(() => {
    void AsyncStorage.getItem('@campus_preferences').then(raw => { if (raw) { const stored = JSON.parse(raw); setValue(normalizePreferences(stored || {})); } }).catch(() => {});
    void AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    return () => subscription.remove();
  }, []);
  const update = (next: Partial<Preferences>) => setValue(previous => {
    const updated = normalizePreferences({ ...previous, ...next });
    void AsyncStorage.setItem('@campus_preferences', JSON.stringify(updated)).catch(() => {});
    return updated;
  });
  return <Context.Provider value={{ ...value, motionReduced: value.reduceMotion || systemReduced, update }}>{children}</Context.Provider>;
}
export const usePreferences = () => useContext(Context);
