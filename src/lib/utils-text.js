export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function truncate(str, maxLen = 80) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function formatWPM(wpm) {
  return `${Math.round(wpm)} WPM`;
}

export function formatAccuracy(acc) {
  return `${Math.round(acc)}%`;
}

export const TYPING_SAMPLES = [
  "The quick brown fox jumps over the lazy dog.",
  "To be or not to be, that is the question.",
  "All that glitters is not gold.",
  "In the beginning was the Word, and the Word was with God.",
  "It was the best of times, it was the worst of times.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Two roads diverged in a wood, and I took the one less traveled by.",
];

export function getRandomTypingSample() {
  return TYPING_SAMPLES[Math.floor(Math.random() * TYPING_SAMPLES.length)];
}