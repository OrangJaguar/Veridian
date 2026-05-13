import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants-storage';
import { loadFromStorage, saveToStorage } from '../state';

export function loadSettings() {
  return loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
}

export function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
}

export function applyFontSize(size) {
  const map = { sm: '14px', md: '16px', lg: '18px' };
  document.documentElement.style.fontSize = map[size];
}

export function applyAllSettings(settings) {
  applyTheme(settings.theme);
  applyAccentColor(settings.accentColor);
  applyFontSize(settings.fontSize);
}

export const ACCENT_PRESETS = [
  { name: 'Indigo',  value: '#6366f1' },
  { name: 'Purple',  value: '#8b5cf6' },
  { name: 'Pink',    value: '#ec4899' },
  { name: 'Rose',    value: '#f43f5e' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Green',   value: '#22c55e' },
  { name: 'Cyan',    value: '#06b6d4' },
  { name: 'Blue',    value: '#3b82f6' },
];

export const FONT_SIZE_OPTIONS = [
  { label: 'Small',  value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large',  value: 'lg' },
];