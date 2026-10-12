import { ThemeMode } from './themeContext';

export function authPalette(mode: ThemeMode) {
  return mode === 'light'
    ? { background: '#FFFFFF', wash: '#EAF4FF', surface: '#FFFFFF', input: '#F5F8FC', border: '#CDD9E8', text: '#182A40', secondary: '#52647B', accent: '#1878F3', action: '#1267D8', onAction: '#FFFFFF', selected: '#EAF4FF', danger: '#C6263D' }
    : { background: '#0A0A0A', wash: '#142536', surface: '#161817', input: '#1C2229', border: '#455463', text: '#F4F7FC', secondary: '#ABBCCD', accent: '#80B9FF', action: '#1267D8', onAction: '#FFFFFF', selected: '#142C46', danger: '#FF8A99' };
}

