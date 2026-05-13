import { loadFromStorage, saveToStorage } from '../state';
import { STORAGE_KEYS } from '../constants-storage';
import { getTodayISO } from '../utils-date';

export function loadPomodoroSessions() {
  return loadFromStorage(STORAGE_KEYS.POMODORO_SESSIONS, []);
}

export function getTodayPomodoros() {
  const today = getTodayISO();
  return loadPomodoroSessions().filter(s => s.date.startsWith(today));
}

export function getWeeklyWorkMinutes() {
  const sessions = loadPomodoroSessions();
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return sessions
      .filter(s => s.date.startsWith(dateStr) && s.type === 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration, 0);
  });
}

export function loadTypingResults() {
  return loadFromStorage(STORAGE_KEYS.TYPING_RESULTS, []);
}

export function getBestWPM() {
  const results = loadTypingResults();
  if (results.length === 0) return 0;
  return Math.max(...results.map(r => r.wpm));
}

export function getAverageWPM() {
  const results = loadTypingResults();
  if (results.length === 0) return 0;
  return Math.round(results.reduce((acc, r) => acc + r.wpm, 0) / results.length);
}