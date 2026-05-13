import { STORAGE_KEYS } from './constants-storage';

export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[Axiom] Failed to save ${key}:`, err);
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function clearAllAxiomData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}