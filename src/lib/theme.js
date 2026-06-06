import { PREFS_KEY } from './constants-storage';

export function applyThemeFromStorage() {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    const dark = prefs.themeDark !== false;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  } catch {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
}
