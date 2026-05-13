import { PREFS_KEY } from '../constants-storage';
import { S } from '../state';

export function applyTheme() {
  document.documentElement.classList.toggle('dark', !!S.prefs.themeDark);
  document.documentElement.classList.toggle('light', !S.prefs.themeDark);
}

export function applySettingsToUI(els) {
  if (els.themeToggle) els.themeToggle.checked = !!S.prefs.themeDark;
  if (els.hapticToggle) els.hapticToggle.checked = !!S.prefs.haptics;
  if (els.audioToggle) els.audioToggle.checked = !!S.prefs.audio;
  if (els.strictModeToggle) els.strictModeToggle.checked = !!S.prefs.strictMode;
  applyTheme();
}